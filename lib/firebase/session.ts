import { cookies } from "next/headers";
import { adminAuth, DEV_MODE } from "./admin";

export async function getServerSession(): Promise<{ uid: string } | null> {
  if (DEV_MODE) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value;
  if (!token) return null;
  try {
    return await adminAuth!.verifyIdToken(token);
  } catch {
    return null;
  }
}
