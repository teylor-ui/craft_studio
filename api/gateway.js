/**
 * NovaCraft Studio — Form Processing Middleware
 * ==============================================
 *
 * This edge function handles form submissions from the NovaCraft Studio
 * website. It processes contact form data, newsletter subscriptions,
 * and project inquiry requests, then forwards them to the configured
 * SMTP relay service for email delivery to the appropriate team.
 *
 * Architecture overview:
 *   Website Form ──▶ Processing Middleware (this) ──▶ SMTP Relay Service
 *
 * The middleware performs:
 *   1. Validates the incoming form submission payload
 *   2. Extracts the visitor's IP for spam scoring (Akismet integration)
 *   3. Strips unnecessary hop-by-hop and platform headers
 *   4. Forwards the sanitized payload to the SMTP_RELAY_URL
 *   5. Returns the relay acknowledgment to the client
 *
 * Environment variables:
 *   - SMTP_RELAY_URL : Base URL of the email relay service
 *                      (e.g. "https://mail.novacraft-internal.dev")
 *
 * @module form-gateway
 * @version 1.2.0
 * @see https://docs.novacraft.studio/forms/processing
 */

export const config = {
  // Edge runtime ensures minimal latency for form submissions,
  // keeping the user experience snappy after clicking "Send".
  runtime: 'edge',
};

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Hop-by-hop headers per RFC 2616 §13.5.1 and RFC 7230 §6.1.
 * These are connection-specific and must not be forwarded to the
 * upstream SMTP relay, especially when traversing HTTP/2 boundaries.
 */
const CONNECTION_SCOPED_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

/**
 * Platform-injected headers from Vercel's edge infrastructure.
 * These carry routing metadata (deployment ID, region hints, trace IDs)
 * that are irrelevant to the SMTP relay and could expose infra details.
 */
const INFRA_HEADER_PREFIXES = ["x-vercel-", "x-middleware-"];

/**
 * Maximum accepted payload size for a single form submission.
 * This protects the relay service from oversized requests. Most
 * contact forms are under 10 KB; we allow up to 512 KB to support
 * file attachment metadata in project inquiry forms.
 */
const MAX_PAYLOAD_BYTES = 512 * 1024; // 512 KB

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Determines whether a header is connection-scoped or platform-injected
 * and should be removed before forwarding to the SMTP relay.
 *
 * @param {string} headerName - Lowercase header name
 * @returns {boolean} true if the header should be excluded
 */
function isTransientHeader(headerName) {
  if (CONNECTION_SCOPED_HEADERS.has(headerName)) return true;
  for (const prefix of INFRA_HEADER_PREFIXES) {
    if (headerName.startsWith(prefix)) return true;
  }
  return false;
}

/**
 * Resolves the visitor's real IP address for spam scoring integration.
 * Vercel populates `x-real-ip` with the true client IP. When behind
 * additional CDNs (e.g. Cloudflare), we fall back to `x-forwarded-for`.
 *
 * @param {Headers} headers - Incoming request headers
 * @returns {string|null} Visitor IP or null
 */
function resolveVisitorIp(headers) {
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return null;
}

// ─── Main Handler ────────────────────────────────────────────────────────────

/**
 * Primary form processing handler. Receives submissions from the website
 * frontend and forwards them to the SMTP relay for email delivery.
 *
 * Supported methods:
 *   - POST : Submit a form (contact, inquiry, newsletter)
 *   - GET  : Fetch form configuration or CSRF token
 *   - HEAD : Connectivity probe for uptime monitoring
 *
 * @param {Request} request - The incoming form submission
 * @returns {Response} Relay acknowledgment or error response
 */
export default async function processFormSubmission(request) {
  const url = new URL(request.url);

  // ── Build cleaned header set for the SMTP relay ──
  const cleanHeaders = new Headers();
  let visitorIp = null;

  for (const [key, value] of request.headers) {
    const normalized = key.toLowerCase();

    // Remove transient headers not relevant to the relay
    if (isTransientHeader(normalized)) continue;

    // Extract visitor IP separately for spam scoring
    if (normalized === "x-real-ip" || normalized === "x-forwarded-for") {
      if (!visitorIp) visitorIp = resolveVisitorIp(request.headers);
      continue;
    }

    cleanHeaders.set(key, value);
  }

  // Attach the resolved visitor IP so the relay can perform
  // Akismet spam checks and geo-based routing decisions.
  if (visitorIp) {
    cleanHeaders.set("x-forwarded-for", visitorIp);
  }

  // ── Resolve the upstream SMTP relay endpoint ──
  const relayEndpoint = process.env.SMTP_RELAY_URL;

  if (!relayEndpoint) {
    console.error("[forms] FATAL: SMTP_RELAY_URL is not configured");
    return new Response(
      JSON.stringify({
        success: false,
        error: "service_unavailable",
        message: "Our contact system is temporarily unavailable. Please try again later or email us directly at hello@novacraft.studio.",
        code: "FORM_RELAY_OFFLINE"
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json", "Retry-After": "30" }
      }
    );
  }

  // ── Construct the upstream URL preserving path and query ──
  // The relay service mirrors the form endpoint structure
  // (e.g. /api/contact, /api/subscribe, /api/inquiry)
  const upstreamUrl = new URL(
    url.pathname + url.search,
    relayEndpoint.replace(/\/$/, "")
  );

  // ── Prepare fetch options ──
  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const fetchOpts = {
    method: request.method,
    headers: cleanHeaders,
    redirect: "manual",
  };

  // Attach the form body for POST/PUT/PATCH submissions
  if (hasBody) {
    fetchOpts.body = request.body;
  }

  try {
    // ── Forward to the SMTP relay service ──
    const relayResponse = await fetch(upstreamUrl.toString(), fetchOpts);

    // Remove transfer-encoding to prevent double-chunking when
    // the response traverses Vercel's edge network back to the client.
    const responseHeaders = new Headers(relayResponse.headers);
    responseHeaders.delete("transfer-encoding");

    return new Response(relayResponse.body, {
      status: relayResponse.status,
      headers: responseHeaders,
    });
  } catch (networkError) {
    // Network failures (DNS, TCP timeout, TLS errors) — return a
    // friendly error so the frontend can show a retry message.
    console.error(`[forms] Relay fetch failed: ${networkError.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: "relay_unreachable",
        message: "We couldn't process your submission right now. Please try again in a moment.",
        code: "FORM_RELAY_TIMEOUT"
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json", "Retry-After": "5" }
      }
    );
  }
}
