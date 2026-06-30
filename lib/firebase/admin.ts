import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const hasExplicitCreds =
  !!process.env.FIREBASE_PRIVATE_KEY &&
  !process.env.FIREBASE_PRIVATE_KEY.includes("...");

// FIREBASE_CONFIG is set automatically by Firebase App Hosting at runtime
const onFirebase = !!process.env.FIREBASE_CONFIG;

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
    initializeApp();
  }
}

export const adminAuth = DEV_MODE ? null : getAuth();
export const adminDb = DEV_MODE ? null : getFirestore();
