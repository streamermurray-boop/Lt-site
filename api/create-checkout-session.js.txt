import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // ✅ Allow POST only
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  try {
    // Vercel automatically parses JSON if content-type is application/json
    const { title, amount, size } = req.body || {};

    if (!title || !amount) {
      return res.status(400).json({ error: "Missing title or amount" });
    }

    // amount should be in pence for GBP
    const unit_amount = Math.round(Number(amount) * 100);

    const origin =
      req.headers.origin ||
      `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: title,
              description: size ? `Size: ${size}` : undefined,
            },
            unit_amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
