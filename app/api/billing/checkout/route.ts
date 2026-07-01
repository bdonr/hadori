import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    return await handleCheckout(req);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[billing/checkout] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleCheckout(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId, currency, successUrl, cancelUrl } = await req.json();
  if (!priceId) return NextResponse.json({ error: "Missing priceId" }, { status: 400 });

  const stripe = getStripe();

  // Resolve the right price for the requested currency
  let resolvedPriceId = priceId;
  if (currency && currency !== "eur") {
    try {
      // Find the product this EUR price belongs to
      const eurPrice = await stripe.prices.retrieve(priceId);
      const productId = eurPrice.product as string;

      // Look for a price in the target currency for the same product
      const prices = await stripe.prices.list({
        product: productId,
        currency,
        active: true,
        limit: 1,
      });
      if (prices.data.length > 0) {
        resolvedPriceId = prices.data[0].id;
      }
    } catch {
      // Fall back to EUR price if lookup fails
    }
  }

  // Get or create Stripe customer
  const profileSnap = await adminDb!.collection("profiles").doc(session.uid).get();
  const profile = profileSnap.data();
  let customerId: string = profile?.stripe_customer_id ?? "";

  if (!customerId) {
    // Never pass a UID as email — Stripe rejects it. Omit if we don't have a
    // real address; Stripe Checkout collects it from the customer instead.
    const email: string | undefined =
      typeof profile?.email === "string" && profile.email.includes("@") ? profile.email : undefined;
    const customer = await stripe.customers.create({
      email,
      metadata: { uid: session.uid },
    });
    customerId = customer.id;
    await adminDb!.collection("profiles").doc(session.uid).update({
      stripe_customer_id: customerId,
    });
  }

  const origin = req.headers.get("origin") ?? "https://dadori.com";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: resolvedPriceId, quantity: 1 }],
    success_url: `${origin}${successUrl}`,
    cancel_url: `${origin}${cancelUrl}`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
