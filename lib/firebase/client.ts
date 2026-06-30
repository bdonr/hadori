"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Firebase App Hosting bakes FIREBASE_WEBAPP_CONFIG into NEXT_PUBLIC_* vars
// via next.config.ts at build time — no manual env setup needed.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const CLIENT_APP_NAME = "dadori-client";

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

if (typeof window !== "undefined" && firebaseConfig.apiKey) {
  _app =
    getApps().find((a) => a.name === CLIENT_APP_NAME) ??
    initializeApp(firebaseConfig, CLIENT_APP_NAME);
  _auth = getAuth(_app);
  _db = getFirestore(_app);
  _storage = getStorage(_app);
}

export const auth = _auth!;
export const db = _db!;
export const storage = _storage!;
