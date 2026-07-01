import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/firebase/session";
import { isStartupPaid } from "@/lib/entitlements";
import { callTool, TOKEN_BUDGET } from "@/lib/ai/anthropic";

// Turns the params + the 5 answers into TWO versions of the plan:
//  - external: a teaser that sketches WHAT is being done WITHOUT revealing the
//    core idea / secret sauce (safe to show publicly to investors/talent).
//  - internal: the full, honest plan incl. core idea, differentiation and an
//    (unverified, AI-drafted) competitor & uniqueness analysis to validate.
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileSnap = await adminDb!.collection("profiles").doc(session.uid).get();
  if (!isStartupPaid(profileSnap.data()?.plan_tier))
    return NextResponse.json({ error: "AI business plan requires a paid Startup plan" }, { status: 403 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const { params, qa } = await req.json();
  const qaText = Array.isArray(qa)
    ? qa.map((x: { q: string; a: string }, i: number) => `Q${i + 1}: ${x.q}\nA${i + 1}: ${x.a}`).join("\n\n")
    : "";
  const ctx = [
    params?.name ? `Name: ${params.name}` : "",
    params?.category ? `Category: ${params.category}` : "",
    Array.isArray(params?.problems) && params.problems.length ? `Problems: ${params.problems.join(", ")}` : "",
    Array.isArray(params?.targets) && params.targets.length ? `Targets: ${params.targets.join(", ")}` : "",
    params?.bizModel ? `Business model: ${params.bizModel}` : "",
    params?.description ? `Notes: ${params.description}` : "",
    "", "Interview:", qaText,
  ].filter(Boolean).join("\n");

  const result = await callTool<{
    external: { headline: string; whatWeDo: string; forWhom: string; teaser: string };
    internal: {
      coreIdea: string; differentiation: string; problem: string; solution: string;
      businessModel: string; competitors: { name: string; note: string }[];
      uniqueness: string; risks: string; nextSteps: string[];
    };
  }>({
    apiKey,
    maxTokens: TOKEN_BUDGET.plan,
    system: `You write a startup's business plan in TWO versions. Be concise (this is token-budgeted).
EXTERNAL = a public teaser: sketch WHAT the startup does and for whom at a high level to spark interest, but DO NOT reveal the core idea, the "how", or the secret sauce. No numbers you cannot back up.
INTERNAL = the full honest plan for the founder: core idea, what differentiates them, problem, solution, business model, a short competitor list (names or archetypes) with a note each, why they are unique, key risks, and 3-5 concrete next steps.
For competitors/market: do NOT invent specific market-size figures or fake statistics — describe the competitive landscape qualitatively and flag it as to-be-validated. Write in the same language as the answers; if unclear, German.`,
    user: ctx,
    toolName: "write_plan",
    description: "Write both plan versions.",
    schema: {
      type: "object",
      properties: {
        external: {
          type: "object",
          properties: {
            headline: { type: "string" }, whatWeDo: { type: "string" },
            forWhom: { type: "string" }, teaser: { type: "string" },
          },
          required: ["headline", "whatWeDo", "forWhom", "teaser"],
        },
        internal: {
          type: "object",
          properties: {
            coreIdea: { type: "string" }, differentiation: { type: "string" },
            problem: { type: "string" }, solution: { type: "string" }, businessModel: { type: "string" },
            competitors: { type: "array", items: { type: "object", properties: { name: { type: "string" }, note: { type: "string" } }, required: ["name", "note"] } },
            uniqueness: { type: "string" }, risks: { type: "string" },
            nextSteps: { type: "array", items: { type: "string" } },
          },
          required: ["coreIdea", "differentiation", "problem", "solution", "businessModel", "uniqueness", "nextSteps"],
        },
      },
      required: ["external", "internal"],
    },
  });

  if (!result?.external || !result?.internal)
    return NextResponse.json({ error: "AI error" }, { status: 500 });

  const now = new Date().toISOString();
  await adminDb!.collection("businessplans").doc(session.uid).set({
    uid: session.uid,
    params: params ?? {},
    qa: qa ?? [],
    external: result.external,
    internal: result.internal,
    marketVerified: false, // real Google Trends / social data needs paid providers (TODO)
    updatedAt: now,
  }, { merge: true });

  return NextResponse.json({ external: result.external, internal: result.internal });
}
