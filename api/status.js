/**
 * NovaCraft Studio — Service Status Endpoint
 * ============================================
 *
 * Lightweight health probe for uptime monitoring (UptimeRobot, Pingdom)
 * and automated deployment verification. Returns service status in a
 * format compatible with common monitoring dashboards.
 *
 * @module status
 * @version 1.0.0
 */

export const config = {
  runtime: 'edge',
};

/**
 * Returns the current operational status of the website services.
 *
 * @param {Request} req
 * @returns {Response} JSON status report
 */
export default async function serviceStatus(req) {
  const smtpConfigured = !!process.env.SMTP_RELAY_URL;

  const overallStatus = smtpConfigured ? "operational" : "degraded";
  const httpCode = smtpConfigured ? 200 : 503;

  const report = {
    status: overallStatus,
    version: "1.2.0",
    service: "NovaCraft Studio",
    timestamp: new Date().toISOString(),
    components: {
      website: {
        status: "operational",
        description: "Main website and portfolio",
      },
      contactForms: {
        status: smtpConfigured ? "operational" : "offline",
        description: "Contact form and inquiry processing",
      },
      newsletter: {
        status: smtpConfigured ? "operational" : "offline",
        description: "Newsletter subscription service",
      }
    }
  };

  return new Response(JSON.stringify(report, null, 2), {
    status: httpCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
    }
  });
}
