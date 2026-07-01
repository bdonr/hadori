import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/firebase/session";
import { INVESTOR_FOCUS } from "@/lib/funding";
import { isStartupPaid } from "@/lib/entitlements";

// Returns investors that fit the logged-in startup, ranked by a match score.
// Runs server-side (Admin SDK) because investor profiles are private by rule;
// only investors who opted into intros are exposed, and only a summary.
export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminDb) return NextResponse.json({ matches: [] });

  // Gate: discovering & requesting investors is a startup+ feature.
  const callerSnap = await adminDb.collection("profiles").doc(session.uid).get();
  const callerTier = (callerSnap.data()?.plan_tier as string) ?? "free";
  if (!isStartupPaid(callerTier)) return NextResponse.json({ matches: [], locked: true });

  const startupSnap = await adminDb.collection("startups").doc(session.uid).get();
  const s = startupSnap.data() ?? {};
  const startupStage = (s.stage as string) ?? "";
  const startupRegion = (s.region as string) ?? "";
  const industry = ((s.industry as string) ?? "").toLowerCase();

  // Loose industry → investor-focus tokens (label overlap).
  const industryTokens = new Set(
    industry.split(/[\s/&,-]+/).filter((w: string) => w.length > 2)
  );
  const focusMatchesIndustry = (focusIds: string[]) =>
    focusIds.some((id) => {
      const label = (INVESTOR_FOCUS.find((f) => f.id === id)?.label ?? id).toLowerCase();
      return [...industryTokens].some((tok) => label.includes(tok) || tok.includes(label));
    });

  let investorsSnap;
  try {
    investorsSnap = await adminDb.collection("investors").where("openToIntros", "==", true).get();
  } catch {
    investorsSnap = await adminDb.collection("investors").get();
  }

  const matches = investorsSnap.docs
    .map((doc) => {
      const d = doc.data();
      if (d.openToIntros === false) return null;
      const focus: string[] = Array.isArray(d.focus) ? d.focus : [];
      const stages: string[] = Array.isArray(d.stages) ? d.stages : [];
      const region = (d.region as string) ?? "";

      let score = 20; // baseline: open to intros
      const reasons: string[] = [];
      if (startupStage && stages.includes(startupStage)) { score += 30; reasons.push("stage"); }
      if (region && (region === startupRegion || region === "worldwide")) { score += 35; reasons.push("region"); }
      if (industryTokens.size && focusMatchesIndustry(focus)) { score += 15; reasons.push("focus"); }

      return {
        uid: doc.id,
        name: (d.name as string) ?? "",
        firm: (d.firm as string) ?? "",
        role: (d.role as string) ?? "",
        region,
        focus,
        stages,
        checkSize: (d.checkSize as string) ?? "",
        score: Math.min(score, 100),
        reasons,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null && !!m.name)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  return NextResponse.json({ matches, startup: { stage: startupStage, region: startupRegion, industry: s.industry ?? "" } });
}
