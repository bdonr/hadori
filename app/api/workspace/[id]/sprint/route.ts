import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/firebase/session";

// Sprint CRUD for a workspace. Members (except investor/guest) can manage sprints.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: workspaceId } = await params;
  const body = await req.json();
  const { action, sprint, sprintId } = body;

  const memberSnap = await adminDb!
    .collection("workspaces").doc(workspaceId)
    .collection("members").doc(session.uid).get();
  if (!memberSnap.exists) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  const member = memberSnap.data()!;
  if (member.role === "investor" || member.role === "guest")
    return NextResponse.json({ error: "No write access" }, { status: 403 });

  const now = new Date().toISOString();
  const sprintsCol = adminDb!.collection("workspaces").doc(workspaceId).collection("sprints");

  if (action === "create") {
    if (!sprint?.name || !sprint?.startDate || !sprint?.endDate)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const ref = sprintsCol.doc();
    await ref.set({
      id: ref.id,
      workspaceId,
      name: sprint.name,
      goal: sprint.goal ?? "",
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      status: sprint.status ?? "planned",
      createdBy: session.uid,
      createdAt: now,
    });
    return NextResponse.json({ id: ref.id });
  }

  if (action === "update" && sprintId) {
    await sprintsCol.doc(sprintId).update({ ...sprint, updatedAt: now });
    return NextResponse.json({ ok: true });
  }

  if (action === "setStatus" && sprintId && body.status) {
    await sprintsCol.doc(sprintId).update({ status: body.status, updatedAt: now });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete" && sprintId) {
    await sprintsCol.doc(sprintId).delete();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
