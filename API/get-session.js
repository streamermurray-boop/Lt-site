const Stripe = require("stripe");

module.exports = async (req, res) => {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return res.status(500).send("Missing STRIPE_SECRET_KEY");

    const stripe = new Stripe(secret);

    const sessionId = req.query.session_id;
    if (!sessionId) return res.status(400).send("Missing session_id");

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // order number based on session id (stable)
    const orderNumber = "LT-" + String(session.id).slice(-10).toUpperCase();

    return res.status(200).json({
      paid: session.payment_status === "paid",
      orderNumber,
    });
  } catch (err) {
    return res.status(500).send(err?.message || "Server error");
  }
};
