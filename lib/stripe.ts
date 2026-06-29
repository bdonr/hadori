import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PLANS = {
  startup_pro: process.env.STRIPE_PRICE_STARTUP_PRO!,
  startup_scale: process.env.STRIPE_PRICE_STARTUP_SCALE!,
  talent_pro: process.env.STRIPE_PRICE_TALENT_PRO!,
  investor_pro: process.env.STRIPE_PRICE_INVESTOR_PRO!,
} as const;

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    // Raw card data never touches our server — Stripe Checkout handles it.
  });
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
