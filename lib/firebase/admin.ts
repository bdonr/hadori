import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// On Firebase App Hosting (Cloud Run), Application Default Credentials are
// available automatically — no explicit keys needed.
// Locally, set FIREBASE_PRIVATE_KEY in .env.local to enable real Firebase.
const hasExplicitCreds =
  !!process.env.FIREBASE_PRIVATE_KEY &&
  !process.env.FIREBASE_PRIVATE_KEY.includes("...");

const onFirebase = !!process.env.FIREBASE_CONFIG; // set by Firebase App Hosting at runtime

// DEV_MODE: no credentials at all — use mock data
export const DEV_MODE = !hasExplicitCreds && !onFirebase;

if (!DEV_MODE && getApps().length === 0) {
  if (hasExplicitCreds) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    // Firebase App Hosting: use ADC (no explicit keys required)
    initializeApp();
  }
}

export const adminAuth = DEV_MODE ? null : getAuth();
export const adminDb = DEV_MODE ? null : getFirestore();
