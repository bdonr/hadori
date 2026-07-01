import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/firebase/session";
import { canUseAI } from "@/lib/firebase/workspace";

// AI: turn a startup's plan/context into a sprint-organised Kanban board plus
// role suggestions. Writes sprints + tasks into the workspace so they appear
// live on the board. Returns the suggested roles for the team.
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId, goal, horizonWeeks } = await req.json();
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });

  const memberSnap = await adminDb!
    .collection("workspaces").doc(workspaceId)
    .collection("members").doc(session.uid).get();
  if (!memberSnap.exists) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const profileSnap = await adminDb!.collection("profiles").doc(session.uid).get();
  const profile = profileSnap.data();
  if (!canUseAI(profile?.plan_tier ?? "free"))
    return NextResponse.json({ error: "AI planning requires a paid plan" }, { status: 403 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  // Gather context: startup profile + workspace.
  const [startupSnap, wsSnap] = await Promise.all([
    adminDb!.collection("startups").doc(session.uid).get(),
    adminDb!.collection("workspaces").doc(workspaceId).get(),
  ]);
  const s = startupSnap.data() ?? {};
  const ws = wsSnap.data() ?? {};
  const horizon = Math.min(Math.max(Number(horizonWeeks) || 8, 2), 26);

  const context = [
    `Startup: ${s.name ?? ws.name ?? "unnamed"}`,
    s.tagline ? `Tagline: ${s.tagline}` : "",
    s.description ? `Description: ${s.description}` : "",
    s.industry ? `Industry: ${s.industry}` : "",
    s.stage ? `Funding stage: ${s.stage}` : "",
    s.teamSize ? `Current team size: ${s.teamSize}` : "",
    Array.isArray(s.neededSkills) && s.neededSkills.length ? `Skills sought: ${s.neededSkills.join(", ")}` : "",
    goal ? `Primary goal for this planning horizon: ${goal}` : "",
    `Planning horizon: ${horizon} weeks.`,
  ].filter(Boolean).join("\n");

  const system = `You are a startup operating partner. Given a startup's context, produce a concrete, execution-ready plan: split the ${horizon}-week horizon into 2–4 sequential sprints, fill each sprint with specific, actionable tasks, and recommend the key roles the founder needs to hire. Tasks must be concrete deliverables (not vague). Order sprints so earlier work unblocks later work. Respond in the same language as the startup's description; if unclear, use German.`;

  const tool = {
    name: "create_plan",
    description: "Create the sprint plan, tasks and role recommendations for the startup.",
    input_schema: {
      type: "object",
      properties: {
        sprints: {
          type: "array", description: "2 to 4 sequential sprints covering the horizon.",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              goal: { type: "string", description: "One-line sprint goal." },
              weeks: { type: "number", description: "Duration in weeks (1-6)." },
            },
            required: ["name", "goal", "weeks"],
          },
        },
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              sprintIndex: { type: "number", description: "0-based index into sprints[]." },
              priority: { type: "string", enum: ["low", "medium", "high"] },
              labels: { type: "array", items: { type: "string" } },
            },
            required: ["title", "sprintIndex", "priority"],
          },
        },
        roles: {
          type: "array", description: "Key roles/hires the founder needs.",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              why: { type: "string", description: "Why this role, one line." },
              skills: { type: "array", items: { type: "string" } },
            },
            required: ["title", "why"],
          },
        },
      },
      required: ["sprints", "tasks", "roles"],
    },
  };

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system,
      tools: [tool],
      tool_choice: { type: "tool", name: "create_plan" },
      messages: [{ role: "user", content: context }],
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text().catch(() => "");
    console.error("[plan-to-board] AI error:", aiRes.status, errText.slice(0, 200));
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }
  const data = await aiRes.json();
  const toolUse = (data.content ?? []).find((c: { type: string }) => c.type === "tool_use");
  const plan = toolUse?.input as {
    sprints?: { name: string; goal: string; weeks: number }[];
    tasks?: { title: string; sprintIndex: number; priority: string; labels?: string[] }[];
    roles?: { title: string; why: string; skills?: string[] }[];
  } | undefined;

  if (!plan?.sprints?.length) return NextResponse.json({ error: "AI returned no plan" }, { status: 500 });

  // Persist sprints (sequential dates from today) then tasks linked to them.
  const now = new Date();
  const nowIso = now.toISOString();
  const sprintsCol = adminDb!.collection("workspaces").doc(workspaceId).collection("sprints");
  const tasksCol = adminDb!.collection("workspaces").doc(workspaceId).collection("tasks");

  const sprintIds: string[] = [];
  let cursor = new Date(now);
  for (let i = 0; i < plan.sprints.length; i++) {
    const sp = plan.sprints[i];
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(end.getDate() + Math.max(1, Math.round(sp.weeks || 2)) * 7);
    const ref = sprintsCol.doc();
    sprintIds.push(ref.id);
    await ref.set({
      id: ref.id, workspaceId, name: sp.name, goal: sp.goal ?? "",
      startDate: start.toISOString(), endDate: end.toISOString(),
      status: i === 0 ? "active" : "planned",
      createdBy: session.uid, createdAt: nowIso, aiGenerated: true,
    });
    cursor = end;
  }

  let created = 0;
  for (const task of plan.tasks ?? []) {
    const idx = Math.max(0, Math.min(Number(task.sprintIndex) || 0, sprintIds.length - 1));
    const ref = tasksCol.doc();
    await ref.set({
      id: ref.id, workspaceId, columnId: "todo", title: task.title,
      description: "", assignedTo: null, assignedName: null, dueDate: null,
      priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
      labels: Array.isArray(task.labels) ? task.labels.slice(0, 4) : [],
      sprintId: sprintIds[idx], order: created, createdBy: "ai", createdAt: nowIso, aiGenerated: true,
    });
    created++;
  }

  return NextResponse.json({
    sprintsCreated: sprintIds.length,
    tasksCreated: created,
    roles: plan.roles ?? [],
  });
}
