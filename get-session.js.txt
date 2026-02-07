import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId) return res.status(400).json({ error: "Missing session_id" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return res.status(200).json({
      payment_status: session.payment_status,
      orderNumber: session.metadata?.orderNumber || "LT-UNKNOWN",
      title: session.metadata?.title || "",
      price_gbp: session.metadata?.price_gbp || "",
      supportEmail: process.env.SUPPORT_EMAIL || "support@example.com"
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to retrieve session" });
  }
}
