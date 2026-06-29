import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Validates a startup and sets is_discoverable = true when score >= 60.
// Score formula: plan complete (+40) + roles posted (+20) + profile filled (+40).
export const validateStartup = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required");

  const { startupId } = request.data as { startupId: string };
  const db = admin.firestore();

  const startupRef = db.collection("startups").doc(startupId);
  const snap = await startupRef.get();

  if (!snap.exists || snap.data()?.owner_uid !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Not your startup");
  }

  const startup = snap.data()!;
  let score = 0;

  // +40: at least one complete business plan
  const plansSnap = await startupRef.collection("plans")
    .where("status", "==", "complete")
    .limit(1)
    .get();
  if (!plansSnap.empty) score += 40;

  // +20: at least one open job role
  const rolesSnap = await startupRef.collection("roles")
    .where("is_open", "==", true)
    .limit(1)
    .get();
  if (!rolesSnap.empty) score += 20;

  // +40: profile fields filled (name, tagline, industry, stage)
  const profileFields = ["name", "tagline", "industry", "stage"];
  const filledFields = profileFields.filter((f) => startup[f] && String(startup[f]).trim() !== "");
  score += Math.round((filledFields.length / profileFields.length) * 40);

  const isDiscoverable = score >= 60;

  await startupRef.update({
    validation_score: score,
    is_discoverable: isDiscoverable,
    updated_at: new Date().toISOString(),
  });

  return { score, is_discoverable: isDiscoverable };
});
