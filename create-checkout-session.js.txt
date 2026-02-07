import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function randomOrderNumber() {
  // LT- + 6 hex characters, e.g. LT-83F2A1
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `LT-${hex}`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

    const { title, price_gbp } = req.body || {};
    const price = Number(price_gbp);

    if (!title || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: "Missing/invalid title or price" });
    }

    const siteUrl = process.env.SITE_URL;
    const orderNumber = randomOrderNumber();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?canceled=1`,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(price * 100),
            product_data: { name: String(title) }
          },
          quantity: 1
        }
      ],
      metadata: {
        orderNumber,
        title: String(title),
        price_gbp: String(price.toFixed(2))
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
