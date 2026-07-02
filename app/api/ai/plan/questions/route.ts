import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/firebase/session";
import { isStartupPaid } from "@/lib/entitlements";
import { callTool, TOKEN_BUDGET, languageName } from "@/lib/ai/anthropic";

// Given the input-mask params, the AI asks exactly 5 sharp questions to flesh
// out the business plan. One of them MUST probe the core idea + differentiation.
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileSnap = await adminDb!.collection("profiles").doc(session.uid).get();
  if (!isStartupPaid(profileSnap.data()))
    return NextResponse.json({ error: "AI business plan requires a paid Startup plan" }, { status: 403 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const { params, locale } = await req.json();
  const lang = languageName(locale);
  const ctx = [
    params?.name ? `Name: ${params.name}` : "",
    params?.category ? `Category: ${params.category}` : "",
    Array.isArray(params?.problems) && params.problems.length ? `Problems: ${params.problems.join(", ")}` : "",
    Array.isArray(params?.targets) && params.targets.length ? `Target groups: ${params.targets.join(", ")}` : "",
    params?.bizModel ? `Business model: ${params.bizModel}` : "",
    params?.description ? `Notes: ${params.description}` : "",
  ].filter(Boolean).join("\n");

  const result = await callTool<{ questions: string[] }>({
    apiKey,
    maxTokens: TOKEN_BUDGET.questions,
    system: `You interview a founder to build their business plan. Ask EXACTLY 5 short, specific questions (one sentence each). Exactly ONE question must ask for the core idea AND what makes them different from existing companies/competitors. The others should cover: the concrete problem & who pays, the solution/product, the business/revenue model, and traction or go-to-market. Be concise. Write ALL questions in ${lang}.`,
    user: ctx || "A new startup with no details yet.",
    toolName: "ask_questions",
    description: "Return exactly 5 interview questions.",
    schema: {
      type: "object",
      properties: { questions: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 5 } },
      required: ["questions"],
    },
  });

  const questions = (result?.questions ?? []).slice(0, 5);
  if (questions.length < 3) return NextResponse.json({ error: "AI error" }, { status: 500 });
  return NextResponse.json({ questions });
}
