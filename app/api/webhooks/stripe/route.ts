export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase/admin";
import { tierForPriceId } from "@/lib/plan-map";
import { isStartupProPlus } from "@/lib/entitlements";
import Stripe from "stripe";

// Find the user's profile by their Stripe customer id, falling back to a uid
// stored in metadata (and back-filling the customer id for next time).
async function findProfileRef(customerId: string, uid?: string) {
  const snap = await adminDb!
    .collection("profiles")
    .where("stripe_customer_id", "==", customerId)
    .limit(1)
    .get();
  if (!snap.empty) return snap.docs[0].ref;

  if (uid) {
    const doc = await adminDb!.collection("profiles").doc(uid).get();
    if (doc.exists) {
      await doc.ref.update({ stripe_customer_id: customerId });
      return doc.ref;
    }
  }
  return null;
}

async function setTier(customerId: string, tier: string, uid?: string, subscriptionId?: string) {
  if (!tier) return;
  const ref = await findProfileRef(customerId, uid);
  if (!ref) return;
  await ref.update({
    plan_tier: tier,
    ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
    updated_at: new Date().toISOString(),
  });
  // Stamp PUBLIC flags derived from the tier so other users can see
  // verified badge / featured placement (plan_tier itself is owner-only).
  // The profile ref's id IS the uid.
  const proPlus = isStartupProPlus(tier);
  try {
    await adminDb!.collection("publicProfiles").doc(ref.id).set({ verified: proPlus }, { merge: true });
    await adminDb!.collection("startups").doc(ref.id).set({ featured: proPlus }, { merge: true });
  } catch {}
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  // Verify the event. Preferred path: Stripe signature (constructEvent).
  // Fallback: if the signing secret is unavailable/mismatched in this
  // environment, re-fetch the event from Stripe by id using our secret key —
  // only events that genuinely exist in our Stripe account can be retrieved,
  // which authenticates the payload without the signing secret.
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (sigErr) {
    try {
      const parsed = JSON.parse(body) as { id?: string };
      if (!parsed.id) throw new Error("no event id");
      event = await stripe.events.retrieve(parsed.id);
      console.warn("[stripe webhook] signature failed, verified via API re-fetch:", parsed.id);
    } catch {
      const message = sigErr instanceof Error ? sigErr.message : "Invalid signature";
      console.error("[stripe webhook] verification failed:", message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const uid = s.metadata?.uid;
        let tier = s.metadata?.plan_tier ?? "";
        // Fallback: derive the tier from the subscription's price.
        if (!tier && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(s.subscription as string);
          tier = tierForPriceId(sub.items.data[0]?.price.id) ?? "";
        }
        await setTier(s.customer as string, tier, uid, s.subscription as string | undefined);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const tier = sub.metadata?.plan_tier || tierForPriceId(sub.items.data[0]?.price.id) || "";
        await setTier(sub.customer as string, tier, sub.metadata?.uid, sub.id);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        // Don't blindly downgrade to free — the customer may still have another
        // active subscription (e.g. after an upgrade left a redundant one).
        // Recompute the tier from whatever active subscription remains.
        const remaining = await stripe.subscriptions.list({
          customer: sub.customer as string,
          status: "active",
          limit: 1,
        });
        const active = remaining.data.find((s) => s.id !== sub.id);
        const tier = active
          ? (active.metadata?.plan_tier || tierForPriceId(active.items.data[0]?.price.id) || "free")
          : "free";
        await setTier(sub.customer as string, tier, sub.metadata?.uid, active?.id);
        break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "handler error";
    console.error("[stripe webhook] handler error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// webhook secret rotated to v2 202607010241
