/**
 * Server-side session helper.
 * Reads the __session cookie (Firebase ID token), verifies it with Admin SDK,
 * and returns the decoded token. Call from Server Components and Route Handlers.
 */

import { cookies } from "next/headers";
import { adminAuth, DEV_MODE } from "./admin";
import type { Profile } from "./collections";

// Mock free-tier startup profile for local dev (no Firebase credentials needed)
export const DEV_PROFILE: Profile = {
  uid: "dev-uid-123",
  role: "startup",
  full_name: "Max Mustermann",
  plan_tier: "free",
  investor_visible: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export async function getServerSession() {
  if (DEV_MODE) return { uid: DEV_PROFILE.uid } as { uid: string };
  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value;
  if (!token) return null;
  try {
    return await adminAuth!.verifyIdToken(token);
  } catch {
    return null;
  }
}
