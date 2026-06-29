"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBusinessPlan = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const anthropic = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
exports.generateBusinessPlan = (0, https_1.onCall)({ secrets: ["ANTHROPIC_API_KEY"], timeoutSeconds: 300 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const { startupId, planId, startupName, industry, description } = request.data;
    const db = admin.firestore();
    const planRef = db.collection("startups").doc(startupId).collection("plans").doc(planId);
    // Verify caller owns the startup
    const startupSnap = await db.collection("startups").doc(startupId).get();
    if (!startupSnap.exists || startupSnap.data()?.owner_uid !== request.auth.uid) {
        throw new https_1.HttpsError("permission-denied", "Not your startup");
    }
    await planRef.update({ status: "generating", updated_at: new Date().toISOString() });
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
        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            messages: [{ role: "user", content: prompt }],
        });
        const text = message.content[0].type === "text" ? message.content[0].text : "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch)
            throw new Error("No JSON in response");
        const parsed = JSON.parse(jsonMatch[0]);
        await planRef.update({
            status: "complete",
            exec_summary: parsed.exec_summary,
            market_analysis: parsed.market_analysis,
            competitors: parsed.competitors,
            financials: parsed.financials,
            all_sources: parsed.all_sources,
            updated_at: new Date().toISOString(),
        });
        return { success: true };
    }
    catch (err) {
        await planRef.update({ status: "failed", updated_at: new Date().toISOString() });
        throw new https_1.HttpsError("internal", "Plan generation failed");
    }
});
//# sourceMappingURL=generateBusinessPlan.js.map