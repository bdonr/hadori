import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// DEV_MODE: no real credentials configured — use mock data for local preview
export const DEV_MODE =
  !process.env.FIREBASE_PRIVATE_KEY ||
  process.env.FIREBASE_PRIVATE_KEY.includes("...");

if (!DEV_MODE && getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = DEV_MODE ? null : getAuth();
export const adminDb = DEV_MODE ? null : getFirestore();
