// api/create-checkout-session.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { title, price, section, size } = req.body || {};

    if (!title || !price) {
      return res.status(400).json({ error: "Missing title/price" });
    }

    const amount = Math.round(Number(price) * 100);
    if (!Number.isFinite(amount) || amount < 50) {
      return res.status(400).json({ error: "Invalid price" });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: title,
              metadata: {
                section: section || "",
                size: size || ""
              }
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/?canceled=1`,
      metadata: {
        size: size || "",
        section: section || ""
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Stripe error" });
  }
}
