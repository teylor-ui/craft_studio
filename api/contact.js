/**
 * NovaCraft Studio — Contact Form Handler
 * =========================================
 *
 * Handles contact form submissions from the website. Validates the
 * submission, applies basic spam checks, and responds with a
 * confirmation message.
 *
 * This endpoint serves as the public-facing contact API, while the
 * actual email delivery is handled by the form processing gateway.
 *
 * @module contact
 * @version 1.0.0
 */

export const config = {
  runtime: 'edge',
};

export default async function handleContact(req) {
  // Only accept POST for form submissions
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Method not allowed. Please use the contact form on our website."
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Allow": "POST"
        }
      }
    );
  }

  try {
    const body = await req.json();

    // Basic validation
    if (!body.name || !body.email || !body.message) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Please fill in all required fields (name, email, message)."
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Please provide a valid email address."
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Honeypot spam check — if the hidden field is filled, it's a bot
    if (body._hp_field) {
      // Silently accept to not tip off the bot
      return new Response(
        JSON.stringify({
          success: true,
          message: "Thank you! We'll get back to you within 24 hours."
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Return success (actual processing happens via the gateway)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Thank you for reaching out! Our team will review your message and get back to you within 24 hours.",
        reference: `NC-${Date.now().toString(36).toUpperCase()}`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Invalid request format. Please try submitting the form again."
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
