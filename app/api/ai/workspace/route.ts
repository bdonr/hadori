import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/firebase/session";
import { canUseAI } from "@/lib/firebase/workspace";
import { isStartupProPlus } from "@/lib/entitlements";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId, message } = await req.json();
  if (!workspaceId || !message)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Check membership
  const memberSnap = await adminDb!
    .collection("workspaces").doc(workspaceId)
    .collection("members").doc(session.uid).get();
  if (!memberSnap.exists) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // Check plan tier
  const profileSnap = await adminDb!.collection("profiles").doc(session.uid).get();
  const profile = profileSnap.data();
  if (!canUseAI(profile?.plan_tier ?? "free"))
    return NextResponse.json({ error: "AI assistant requires Pro or Scale plan" }, { status: 403 });

  // Check monthly limit for finite-AI plans (10 messages); top tier is unlimited
  if (!isStartupProPlus(profile)) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const countSnap = await adminDb!
      .collection("workspaces").doc(workspaceId)
      .collection("ailog")
      .where("uid", "==", session.uid)
      .where("role", "==", "user")
      .where("createdAt", ">=", monthStart.toISOString())
      .get();
    if (countSnap.size >= 10)
      return NextResponse.json({ error: "Monthly AI limit reached. Upgrade to Scale for unlimited." }, { status: 429 });
  }

  // Load workspace context
  const [wsSnap, tasksSnap, milestonesSnap, membersSnap] = await Promise.all([
    adminDb!.collection("workspaces").doc(workspaceId).get(),
    adminDb!.collection("workspaces").doc(workspaceId).collection("tasks").limit(50).get(),
    adminDb!.collection("workspaces").doc(workspaceId).collection("milestones").get(),
    adminDb!.collection("workspaces").doc(workspaceId).collection("members").get(),
  ]);

  const ws = wsSnap.data();
  const tasks = tasksSnap.docs.map((d) => d.data());
  const milestones = milestonesSnap.docs.map((d) => d.data());
  const memberCount = membersSnap.size;

  const taskSummary = tasks.reduce((acc: Record<string, number>, t: Record<string, unknown>) => {
    const col = String(t.columnId ?? "todo");
    acc[col] = (acc[col] ?? 0) + 1;
    return acc;
  }, {});

  const overdueMilestones = milestones.filter(
    (m: Record<string, unknown>) => m.status !== "completed" && new Date(String(m.dueDate)) < new Date()
  ).length;

  const systemPrompt = `You are the AI Co-Founder assistant for the DADORI workspace "${ws?.name}".

Current workspace context:
- Team members: ${memberCount}
- Tasks: ${JSON.stringify(taskSummary)} (by column)
- Milestones: ${milestones.length} total, ${overdueMilestones} overdue
- Upcoming milestones: ${milestones.filter((m: Record<string, unknown>) => m.status === "upcoming").map((m: Record<string, unknown>) => m.title).join(", ") || "none"}

You help the team with:
- Prioritizing tasks and identifying blockers
- Suggesting next steps based on current progress
- Drafting investor updates
- Recommending talent profiles to hire
- Warning about risks (overdue milestones, team gaps)

Be concise, actionable, and specific to their context. Respond in the same language the user writes in.`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    }),
  });

  if (!response.ok) return NextResponse.json({ error: "AI error" }, { status: 500 });
  const data = await response.json();
  const reply = data.content?.[0]?.text ?? "";

  // Log conversation
  const now = new Date().toISOString();
  const logCol = adminDb!.collection("workspaces").doc(workspaceId).collection("ailog");
  await Promise.all([
    logCol.add({ uid: session.uid, role: "user", content: message, createdAt: now }),
    logCol.add({ uid: "ai", role: "assistant", content: reply, createdAt: now }),
  ]);

  return NextResponse.json({ reply });
}
