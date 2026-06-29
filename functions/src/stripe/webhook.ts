import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";

// Lazy init — Stripe must not be instantiated at module load time (no secret available then)
let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}

type PlanTier = "free" | "pro" | "scale";

async function updateProfileTier(
  customerId: string,
  tier: PlanTier,
  subscriptionId?: string
) {
  const db = admin.firestore();

  // Primary: look up by stripe_customer_id stored on profile
  let snap = await db
    .collection("profiles")
    .where("stripe_customer_id", "==", customerId)
    .limit(1)
    .get();

  // Fallback: use firebase_uid from Stripe Customer metadata
  if (snap.empty) {
    const customer = await getStripe().customers.retrieve(customerId);
    const uid = (customer as Stripe.Customer).metadata?.firebase_uid;
    if (!uid) return;
    const docSnap = await db.collection("profiles").doc(uid).get();
    if (!docSnap.exists) return;
    snap = { docs: [docSnap], empty: false } as unknown as typeof snap;
    // Back-fill the customer ID so future lookups are fast
    await docSnap.ref.update({ stripe_customer_id: customerId });
  }

  await snap.docs[0].ref.update({
    plan_tier: tier,
    ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
    updated_at: new Date().toISOString(),
  });
}

export const stripeWebhook = onRequest(
  { secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] },
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = getStripe().webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch {
      res.status(400).send("Invalid signature");
      return;
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price.id;
        const tier: PlanTier =
          priceId === process.env.STRIPE_PRICE_STARTUP_SCALE ? "scale" : "pro";
        await updateProfileTier(sub.customer as string, tier, sub.id);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await updateProfileTier(sub.customer as string, "free");
        break;
      }
    }

    res.json({ received: true });
  }
);
