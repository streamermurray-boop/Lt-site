const Stripe = require("stripe");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method not allowed");
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.SITE_URL;
    if (!secret) return res.status(500).send("Missing STRIPE_SECRET_KEY");
    if (!siteUrl) return res.status(500).send("Missing SITE_URL");

    const stripe = new Stripe(secret);

    const { title, price, image } = req.body || {};
    if (!title || typeof price !== "number") {
      return res.status(400).send("Missing title/price");
    }

    const unitAmount = Math.round(price * 100); // GBP -> pence

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: unitAmount,
            product_data: {
              name: title,
              images: image ? [image] : [],
            },
          },
        },
      ],
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).send(err?.message || "Server error");
  }
};
