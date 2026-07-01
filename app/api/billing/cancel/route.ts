import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { getStripe } from "@/lib/stripe";

// Cancels the user's active subscription (downgrade to the free tier).
// The customer.subscription.deleted webhook then writes plan_tier = "free".
// Immediate cancellation keeps the app state and Stripe in sync without a
// pending "cancel at period end" limbo the UI would have to reflect.
export async function POST() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!adminDb) return NextResponse.json({ error: "Not configured" }, { status: 500 });

    const profileSnap = await adminDb.collection("profiles").doc(session.uid).get();
    const customerId = profileSnap.data()?.stripe_customer_id as string | undefined;
    if (!customerId) return NextResponse.json({ error: "no_subscription" }, { status: 400 });

    const stripe = getStripe();
    const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    const sub = subs.data[0];
    if (!sub) return NextResponse.json({ error: "no_subscription" }, { status: 400 });

    await stripe.subscriptions.cancel(sub.id);
    // Best-effort immediate reflect; the webhook is the source of truth.
    await adminDb.collection("profiles").doc(session.uid).update({ plan_tier: "free" });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancel failed";
    console.error("[billing/cancel] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
