/**
 * NovaCraft Studio — Newsletter Subscription Handler
 * ====================================================
 *
 * Processes newsletter subscription requests from the website footer
 * and various CTA sections. Returns a confirmation response to the
 * client-side subscription widget.
 *
 * @module subscribe
 * @version 1.0.0
 */

export const config = {
  runtime: 'edge',
};

export default async function handleSubscription(req) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Please use the subscription form on our website."
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

    if (!body.email) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Please enter your email address."
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

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

    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome aboard! You'll receive our next creative digest in your inbox.",
        subscriber_id: `sub_${Date.now().toString(36)}`
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
        message: "Something went wrong. Please try again."
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
