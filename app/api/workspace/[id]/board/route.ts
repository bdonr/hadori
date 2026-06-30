import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/firebase/session";

// POST: create or update a task
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: workspaceId } = await params;
  const body = await req.json();
  const { action, task, taskId, columnId } = body;

  // Verify membership
  const memberSnap = await adminDb!
    .collection("workspaces").doc(workspaceId)
    .collection("members").doc(session.uid).get();
  if (!memberSnap.exists) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const member = memberSnap.data()!;
  if (member.role === "investor" || member.role === "guest")
    return NextResponse.json({ error: "No write access" }, { status: 403 });

  const now = new Date().toISOString();
  const tasksCol = adminDb!.collection("workspaces").doc(workspaceId).collection("tasks");

  if (action === "create") {
    const ref = tasksCol.doc();
    await ref.set({
      id: ref.id,
      workspaceId,
      columnId: task.columnId ?? "todo",
      title: task.title,
      description: task.description ?? "",
      assignedTo: task.assignedTo ?? null,
      assignedName: task.assignedName ?? null,
      dueDate: task.dueDate ?? null,
      priority: task.priority ?? "medium",
      order: task.order ?? 0,
      createdBy: session.uid,
      createdAt: now,
    });
    return NextResponse.json({ id: ref.id });
  }

  if (action === "move" && taskId && columnId) {
    await tasksCol.doc(taskId).update({ columnId, updatedAt: now });
    return NextResponse.json({ ok: true });
  }

  if (action === "update" && taskId) {
    await tasksCol.doc(taskId).update({ ...task, updatedAt: now });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete" && taskId) {
    await tasksCol.doc(taskId).delete();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
