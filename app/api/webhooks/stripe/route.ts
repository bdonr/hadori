import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase/admin";
import Stripe from "stripe";
import type { PlanTier } from "@/lib/firebase/collections";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  async function updateTier(customerId: string, tier: PlanTier, subscriptionId?: string) {
    const snap = await adminDb!.collection("profiles")
      .where("stripe_customer_id", "==", customerId)
      .limit(1)
      .get();
    if (snap.empty) return;
    await snap.docs[0].ref.update({
      plan_tier: tier,
      ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
      updated_at: new Date().toISOString(),
    });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      const tier: PlanTier =
        priceId === process.env.STRIPE_PRICE_STARTUP_SCALE ? "scale" : "pro";
      await updateTier(sub.customer as string, tier, sub.id);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await updateTier(sub.customer as string, "free");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
