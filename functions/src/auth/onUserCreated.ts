import { beforeUserCreated, AuthBlockingEvent } from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";

export const onUserCreated = beforeUserCreated(async (event: AuthBlockingEvent) => {
  const user = event.data;
  if (!user) return;

  const db = admin.firestore();
  const now = new Date().toISOString();

  const existing = await db.collection("profiles").doc(user.uid).get();
  if (existing.exists) return;

  await db.collection("profiles").doc(user.uid).set({
    uid: user.uid,
    role: "startup",
    full_name: user.displayName ?? "",
    avatar_url: user.photoURL ?? null,
    plan_tier: "free",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    created_at: now,
    updated_at: now,
  });
});
