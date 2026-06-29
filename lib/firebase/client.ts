"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";

// Firebase App Hosting preparer injects FIREBASE_WEBAPP_CONFIG at build time.
// Note: NEXT_PUBLIC_* vars must be set in the App Hosting console for runtime.
const hosted = process.env.FIREBASE_WEBAPP_CONFIG
  ? JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG)
  : null;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? hosted?.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? hosted?.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? hosted?.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? hosted?.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? hosted?.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? hosted?.appId,
};

// Use a named app so we never accidentally reuse the Firebase App Hosting
// adapter's own default app (which has no apiKey).
const CLIENT_APP_NAME = "dadori-client";

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

// getAuth/getFirestore/getStorage are imported lazily inside the guard to prevent
// Turbopack from evaluating them during server-side module loading.
if (typeof window !== "undefined" && firebaseConfig.apiKey) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAuth } = require("firebase/auth") as typeof import("firebase/auth");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getFirestore } = require("firebase/firestore") as typeof import("firebase/firestore");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getStorage } = require("firebase/storage") as typeof import("firebase/storage");

  const apps = getApps();
  _app = apps.find((a) => a.name === CLIENT_APP_NAME)
    ?? initializeApp(firebaseConfig, CLIENT_APP_NAME);
  _auth = getAuth(_app);
  _db = getFirestore(_app);
  _storage = getStorage(_app);
}

export const auth = _auth!;
export const db = _db!;
export const storage = _storage!;
