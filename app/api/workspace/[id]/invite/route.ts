import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/firebase/session";
import type { WorkspaceMemberRole } from "@/lib/firebase/workspace";
import crypto from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: workspaceId } = await params;
  const { email, uid: invitedUid, role } = await req.json() as {
    email?: string;
    uid?: string;
    role: WorkspaceMemberRole;
  };

  if (!email && !invitedUid)
    return NextResponse.json({ error: "email or uid required" }, { status: 400 });

  // Verify inviter is owner or admin
  const memberSnap = await adminDb!
    .collection("workspaces").doc(workspaceId)
    .collection("members").doc(session.uid).get();
  if (!memberSnap.exists) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  const member = memberSnap.data()!;
  if (member.role !== "owner" && member.role !== "admin")
    return NextResponse.json({ error: "Only owners and admins can invite" }, { status: 403 });

  const wsSnap = await adminDb!.collection("workspaces").doc(workspaceId).get();
  const ws = wsSnap.data();
  if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const inviterProfile = await adminDb!.collection("profiles").doc(session.uid).get();
  const inviterName = inviterProfile.data()?.full_name ?? "Someone";

  const token = crypto.randomBytes(24).toString("hex");
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const ref = adminDb!.collection("workspaces").doc(workspaceId).collection("invites").doc();
  await ref.set({
    id: ref.id,
    workspaceId,
    workspaceName: ws.name,
    invitedBy: session.uid,
    invitedByName: inviterName,
    email: email ?? null,
    uid: invitedUid ?? null,
    role,
    token,
    status: "pending",
    expiresAt,
    createdAt: now,
  });

  // If invited by uid, store notification
  if (invitedUid) {
    await adminDb!.collection("notifications").add({
      uid: invitedUid,
      type: "workspace_invite",
      workspaceId,
      workspaceName: ws.name,
      inviteId: ref.id,
      invitedByName: inviterName,
      role,
      read: false,
      createdAt: now,
    });
  }

  const inviteLink = `${process.env.NEXTAUTH_URL ?? "https://dadori.com"}/invite/${token}`;
  return NextResponse.json({ inviteId: ref.id, inviteLink, token });
}
