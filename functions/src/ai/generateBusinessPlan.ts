import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

interface PlanRequest {
  startupId: string;
  planId: string;
  startupName: string;
  industry: string;
  description: string;
}

// Free tier: structured template, zero AI tokens
function generateTemplatePlan(name: string, industry: string, description: string) {
  return {
    exec_summary: `${name} ist ein Startup im Bereich ${industry}. ${description}\n\nDies ist eine Vorschau. Upgrade auf Pro für eine vollständige KI-Analyse mit echten Marktdaten, TAM/SAM/SOM und Wettbewerbsanalyse.`,
    market_analysis: {
      tam: "Verfügbar im Pro-Plan",
      sam: "Verfügbar im Pro-Plan",
      som: "Verfügbar im Pro-Plan",
      sources: [],
    },
    competitors: [],
    financials: {
      year1_revenue_projection: "Verfügbar im Pro-Plan",
      year2_revenue_projection: "Verfügbar im Pro-Plan",
      year3_revenue_projection: "Verfügbar im Pro-Plan",
      key_cost_drivers: [],
      break_even_estimate: "Verfügbar im Pro-Plan",
      notes: "Upgrade auf Pro für vollständige Finanzprojektion.",
    },
    all_sources: [],
  };
}

export const generateBusinessPlan = onCall(
  { secrets: ["ANTHROPIC_API_KEY"], timeoutSeconds: 300 },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Login required");

    const { startupId, planId, startupName, industry, description } =
      request.data as PlanRequest;

    const db = admin.firestore();
    const planRef = db.collection("startups").doc(startupId).collection("plans").doc(planId);

    // Verify ownership
    const startupSnap = await db.collection("startups").doc(startupId).get();
    if (!startupSnap.exists || startupSnap.data()?.owner_uid !== request.auth.uid) {
      throw new HttpsError("permission-denied", "Not your startup");
    }

    // Check plan tier — Free gets template, Pro/Scale get real AI
    const profileSnap = await db.collection("profiles").doc(request.auth.uid).get();
    const tier: string = profileSnap.data()?.plan_tier ?? "free";
    const isAiEnabled = tier === "pro" || tier === "scale";

    await planRef.update({ status: "generating", updated_at: new Date().toISOString() });

    let parsed: ReturnType<typeof generateTemplatePlan>;

    if (!isAiEnabled) {
      // Free: template only — zero API cost
      parsed = generateTemplatePlan(startupName, industry, description);
    } else {
      // Pro/Scale: full AI plan with cited sources
      const prompt = `You are a startup business plan analyst. Generate a structured business plan for:

Startup name: ${startupName}
Industry: ${industry}
Description: ${description}

CRITICAL RULES:
1. For ALL market size figures (TAM/SAM/SOM), you MUST cite a real, verifiable source (e.g. Statista, Grand View Research, IBISWorld, Eurostat, World Bank). If you cannot cite a real source, write "Data not available" — never invent numbers.
2. For competitors, only list companies that actually exist and are verifiable.
3. Every number in the financials section must be clearly labelled as a projection/estimate.

Return a JSON object with this exact structure:
{
  "exec_summary": "string (2-3 paragraphs)",
  "market_analysis": {
    "tam": "string with value and source",
    "sam": "string with value and source",
    "som": "string with value and source",
    "sources": [{"label": "string", "url": "string"}]
  },
  "competitors": [{"name": "string", "url": "string", "notes": "string"}],
  "financials": {
    "year1_revenue_projection": "string",
    "year2_revenue_projection": "string",
    "year3_revenue_projection": "string",
    "key_cost_drivers": ["string"],
    "break_even_estimate": "string",
    "notes": "All figures are projections only and not financial advice."
  },
  "all_sources": [{"label": "string", "url": "string"}]
}`;

      try {
        const message = await getAnthropic().messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        });

        const text = message.content[0].type === "text" ? message.content[0].text : "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON in response");
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        await planRef.update({ status: "failed", updated_at: new Date().toISOString() });
        throw new HttpsError("internal", "Plan generation failed");
      }
    }

    await planRef.update({
      status: "complete",
      is_ai_generated: isAiEnabled,
      exec_summary: parsed.exec_summary,
      market_analysis: parsed.market_analysis,
      competitors: parsed.competitors,
      financials: parsed.financials,
      all_sources: parsed.all_sources,
      updated_at: new Date().toISOString(),
    });

    return { success: true, ai_generated: isAiEnabled };
  }
);
