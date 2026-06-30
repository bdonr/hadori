import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/firebase/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: workspaceId } = await params;
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  // Find invite by token
  const inviteSnap = await adminDb!
    .collection("workspaces").doc(workspaceId)
    .collection("invites")
    .where("token", "==", token)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (inviteSnap.empty) return NextResponse.json({ error: "Invite not found or expired" }, { status: 404 });

  const invite = inviteSnap.docs[0].data();
  if (new Date(invite.expiresAt) < new Date())
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });

  const profileSnap = await adminDb!.collection("profiles").doc(session.uid).get();
  const profile = profileSnap.data();
  const now = new Date().toISOString();

  // Add as member
  await adminDb!
    .collection("workspaces").doc(workspaceId)
    .collection("members").doc(session.uid).set({
      uid: session.uid,
      workspaceId,
      role: invite.role,
      full_name: profile?.full_name ?? "",
      joinedAt: now,
      invitedBy: invite.invitedBy,
    });

  // Mark invite as accepted
  await inviteSnap.docs[0].ref.update({ status: "accepted" });

  return NextResponse.json({ ok: true, role: invite.role });
}
