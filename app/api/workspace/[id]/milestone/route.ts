import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/firebase/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const snaps = await adminDb!
    .collection("workspaces").doc(id)
    .collection("milestones")
    .orderBy("dueDate")
    .get();

  return NextResponse.json(snaps.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: workspaceId } = await params;

  const memberSnap = await adminDb!
    .collection("workspaces").doc(workspaceId)
    .collection("members").doc(session.uid).get();
  if (!memberSnap.exists) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  const m = memberSnap.data()!;
  if (m.role === "investor" || m.role === "guest")
    return NextResponse.json({ error: "No write access" }, { status: 403 });

  const body = await req.json();
  const { action, milestone, milestoneId } = body;
  const now = new Date().toISOString();
  const col = adminDb!.collection("workspaces").doc(workspaceId).collection("milestones");

  if (action === "create") {
    const ref = col.doc();
    await ref.set({ id: ref.id, workspaceId, createdAt: now, status: "upcoming", ...milestone });
    return NextResponse.json({ id: ref.id });
  }
  if (action === "update" && milestoneId) {
    await col.doc(milestoneId).update({ ...milestone, updatedAt: now });
    return NextResponse.json({ ok: true });
  }
  if (action === "delete" && milestoneId) {
    await col.doc(milestoneId).delete();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
