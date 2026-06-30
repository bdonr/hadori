import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/firebase/session";
import { DEFAULT_COLUMNS } from "@/lib/firebase/workspace";
import type { Workspace } from "@/lib/firebase/workspace";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, entityId, entityType } = await req.json();
  if (!name || !entityId || !entityType)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const profileSnap = await adminDb!.collection("profiles").doc(session.uid).get();
  const profile = profileSnap.data();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const now = new Date().toISOString();
  const ref = adminDb!.collection("workspaces").doc();

  const workspace: Workspace = {
    id: ref.id,
    ownerId: session.uid,
    entityId,
    entityType,
    name,
    planTier: profile.plan_tier ?? "free",
    columns: DEFAULT_COLUMNS,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(workspace);

  // Add owner as first member
  await ref.collection("members").doc(session.uid).set({
    uid: session.uid,
    workspaceId: ref.id,
    role: "owner",
    full_name: profile.full_name ?? "",
    joinedAt: now,
    invitedBy: session.uid,
  });

  return NextResponse.json({ id: ref.id });
}

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get workspaces where user is a member
  const memberSnaps = await adminDb!
    .collectionGroup("members")
    .where("uid", "==", session.uid)
    .get();

  const workspaceIds = memberSnaps.docs.map((d) => d.data().workspaceId as string);
  if (workspaceIds.length === 0) return NextResponse.json([]);

  const workspaces = await Promise.all(
    workspaceIds.map((id) => adminDb!.collection("workspaces").doc(id).get())
  );

  return NextResponse.json(
    workspaces.filter((s) => s.exists).map((s) => ({ id: s.id, ...s.data() }))
  );
}
