/**
 * SINGLE source of truth for tier → feature gating.
 * Never scatter `if (tier === ...)` checks across the codebase — import from here.
 */

export type Tier = "free" | "starter" | "pro" | "scale";
export type Role = "startup" | "talent" | "investor";

export interface Entitlements {
  // Business plan
  businessPlansPerMonth: number;
  aiMarketAnalysis: boolean;
  exportPdf: boolean;
  // Pitch deck
  pitchDeckSlides: number; // 3 = free (Problem/Solution/Model), 8 = pro (full deck)
  pitchDeckAi: boolean;    // AI-generated content per slide
  // Portfolio
  portfolioItems: number;  // 1 = free, 10 = pro, Infinity = scale
  // Talent / roles
  activeJobPostings: number;
  applicantsVisible: number; // max applicants per role
  // Investor
  investorDiscoverable: boolean; // startup visible to investors
  dataRoom: boolean;
  // General
  prioritySupport: boolean;
}

const STARTUP: Record<Tier, Entitlements> = {
  free: {
    businessPlansPerMonth: 1,
    aiMarketAnalysis: false,
    exportPdf: false,
    pitchDeckSlides: 3,
    pitchDeckAi: false,
    portfolioItems: 1,
    activeJobPostings: 1,
    applicantsVisible: 3,
    investorDiscoverable: false,
    dataRoom: false,
    prioritySupport: false,
  },
  starter: {
    businessPlansPerMonth: 1,
    aiMarketAnalysis: false,
    exportPdf: false,
    pitchDeckSlides: 3,
    pitchDeckAi: false,
    portfolioItems: 1,
    activeJobPostings: 1,
    applicantsVisible: 3,
    investorDiscoverable: false,
    dataRoom: false,
    prioritySupport: false,
  },
  pro: {
    businessPlansPerMonth: 5,
    aiMarketAnalysis: true,
    exportPdf: true,
    pitchDeckSlides: 8,
    pitchDeckAi: true,
    portfolioItems: 10,
    activeJobPostings: 5,
    applicantsVisible: 20,
    investorDiscoverable: true,
    dataRoom: true,
    prioritySupport: false,
  },
  scale: {
    businessPlansPerMonth: Infinity,
    aiMarketAnalysis: true,
    exportPdf: true,
    pitchDeckSlides: 8,
    pitchDeckAi: true,
    portfolioItems: Infinity,
    activeJobPostings: Infinity,
    applicantsVisible: Infinity,
    investorDiscoverable: true,
    dataRoom: true,
    prioritySupport: true,
  },
};

const TALENT: Record<Tier, Entitlements> = {
  free: {
    businessPlansPerMonth: 0,
    aiMarketAnalysis: false,
    exportPdf: false,
    pitchDeckSlides: 0,
    pitchDeckAi: false,
    portfolioItems: 1,
    activeJobPostings: 0,
    applicantsVisible: 0,
    investorDiscoverable: false,
    dataRoom: false,
    prioritySupport: false,
  },
  starter: {
    businessPlansPerMonth: 0,
    aiMarketAnalysis: false,
    exportPdf: false,
    pitchDeckSlides: 0,
    pitchDeckAi: false,
    portfolioItems: 3,
    activeJobPostings: 0,
    applicantsVisible: 0,
    investorDiscoverable: false,
    dataRoom: false,
    prioritySupport: false,
  },
  pro: {
    businessPlansPerMonth: 0,
    aiMarketAnalysis: false,
    exportPdf: false,
    pitchDeckSlides: 0,
    pitchDeckAi: false,
    portfolioItems: 10,
    activeJobPostings: 0,
    applicantsVisible: 0,
    investorDiscoverable: false,
    dataRoom: false,
    prioritySupport: true,
  },
  scale: {
    businessPlansPerMonth: 0,
    aiMarketAnalysis: false,
    exportPdf: false,
    pitchDeckSlides: 0,
    pitchDeckAi: false,
    portfolioItems: Infinity,
    activeJobPostings: 0,
    applicantsVisible: 0,
    investorDiscoverable: false,
    dataRoom: false,
    prioritySupport: true,
  },
};

const INVESTOR: Record<Tier, Entitlements> = {
  free: {
    businessPlansPerMonth: 0,
    aiMarketAnalysis: false,
    exportPdf: false,
    pitchDeckSlides: 0,
    pitchDeckAi: false,
    portfolioItems: 0,
    activeJobPostings: 0,
    applicantsVisible: 0,
    investorDiscoverable: false,
    dataRoom: false,
    prioritySupport: false,
  },
  starter: {
    businessPlansPerMonth: 0,
    aiMarketAnalysis: false,
    exportPdf: false,
    pitchDeckSlides: 0,
    pitchDeckAi: false,
    portfolioItems: 0,
    activeJobPostings: 0,
    applicantsVisible: 0,
    investorDiscoverable: false,
    dataRoom: false,
    prioritySupport: false,
  },
  pro: {
    businessPlansPerMonth: 0,
    aiMarketAnalysis: false,
    exportPdf: false,
    pitchDeckSlides: 0,
    pitchDeckAi: false,
    portfolioItems: 0,
    activeJobPostings: 0,
    applicantsVisible: 0,
    investorDiscoverable: false,
    dataRoom: false,
    prioritySupport: true,
  },
  scale: {
    businessPlansPerMonth: 0,
    aiMarketAnalysis: false,
    exportPdf: false,
    pitchDeckSlides: 0,
    pitchDeckAi: false,
    portfolioItems: 0,
    activeJobPostings: 0,
    applicantsVisible: 0,
    investorDiscoverable: false,
    dataRoom: false,
    prioritySupport: true,
  },
};

export function getEntitlements(role: Role, tier: Tier): Entitlements {
  if (role === "startup") return STARTUP[tier];
  if (role === "talent") return TALENT[tier];
  return INVESTOR[tier];
}

export function can(role: Role, tier: Tier, feature: keyof Entitlements): boolean {
  const e = getEntitlements(role, tier);
  const val = e[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val > 0;
  return false;
}

// ---------------------------------------------------------------------------
// Boolean gates keyed by the REAL plan_tier ids stored on profiles
// (from lib/tiers.ts). Use these in pages/routes instead of inline
// `plan_tier === "pro"` checks. Legacy "pro"/"scale" accepted for old data.
// ---------------------------------------------------------------------------

// Paid startup plan: unlocks funding details, full pitch deck, investor
// visibility, workspace AI co-founder.
// Each of these accepts EITHER a single tier string (legacy) OR a capability
// holder ({plan_tier, capabilities}). When given a holder, it returns true if
// ANY held capability qualifies — so a multi-capability account is evaluated
// correctly.
export function isStartupPaid(x?: string | null | CapabilityHolder): boolean {
  if (x && typeof x === "object") return getCapabilities(x).some((t) => isStartupPaid(t));
  return !!x && ["startup", "startup_pro", "pro", "scale"].includes(x);
}

// Top startup plan: verified badge, data room, featured placement.
export function isStartupProPlus(x?: string | null | CapabilityHolder): boolean {
  if (x && typeof x === "object") return getCapabilities(x).some((t) => isStartupProPlus(t));
  return !!x && ["startup_pro", "scale"].includes(x);
}

// Paid talent plan (Plus or Pro).
export function isTalentPaid(x?: string | null | CapabilityHolder): boolean {
  if (x && typeof x === "object") return getCapabilities(x).some((t) => isTalentPaid(t));
  return !!x && ["plus", "pro", "scale"].includes(x);
}

// Paid investor plan (Angel and above).
export function isInvestorPaid(x?: string | null | CapabilityHolder): boolean {
  if (x && typeof x === "object") return getCapabilities(x).some((t) => isInvestorPaid(t));
  return !!x && x.startsWith("investor_") && x !== "investor_free";
}

// ---------------------------------------------------------------------------
// n:m capabilities — an account can hold several paid capabilities at once
// (e.g. a startup founder who also invests). `capabilities` is the source of
// truth; when empty we fall back to the legacy single `plan_tier` so existing
// paying users keep their access unchanged.
// ---------------------------------------------------------------------------
export interface CapabilityHolder { plan_tier?: string | null; capabilities?: string[] | null }

export const STARTUP_FAMILY = ["project", "startup", "startup_pro", "pro", "scale"];
export const TALENT_FAMILY = ["plus", "pro", "scale"];
export const INVESTOR_FAMILY = ["investor_basic", "investor_pro", "investor_premium", "investor_elite"];

export function getCapabilities(p?: CapabilityHolder | null): string[] {
  if (!p) return [];
  if (p.capabilities && p.capabilities.length) return p.capabilities;
  return p.plan_tier && p.plan_tier !== "free" ? [p.plan_tier] : [];
}

export function hasCapability(p: CapabilityHolder | null | undefined, cap: string): boolean {
  return getCapabilities(p).includes(cap);
}

// Can this account create projects/startups? True if it holds any paid
// startup-family capability (project 2€ and up).
export function canCreate(p?: CapabilityHolder | null): boolean {
  return getCapabilities(p).some((c) => STARTUP_FAMILY.includes(c));
}

// Merge the PlanCaps of every held capability (booleans OR-ed, numbers max-ed)
// so a multi-capability account gets the union of its perks.
export function resolveCaps(p?: CapabilityHolder | null): PlanCaps {
  const caps = getCapabilities(p);
  if (!caps.length) return planCaps("free");
  return caps.reduce<PlanCaps>((acc, c) => {
    const pc = planCaps(c);
    const merged = { ...acc } as Record<string, unknown>;
    for (const [k, v] of Object.entries(pc)) {
      if (typeof v === "boolean") merged[k] = (merged[k] as boolean) || v;
      else if (typeof v === "number") merged[k] = Math.max((merged[k] as number) ?? 0, v);
      else merged[k] = v;
    }
    return merged as unknown as PlanCaps;
  }, planCaps("free"));
}

// ---------------------------------------------------------------------------
// Per-tier capability matrix — the promised perks for every purchasable tier,
// mirroring lib/tiers.ts. This is the SINGLE source of truth for what a
// purchase unlocks. Read plan_tier from the profile and pass it here.
// ---------------------------------------------------------------------------

export interface PlanCaps {
  // --- Startup / creator ---
  fundingDetails: boolean;          // funding stage & MRR fields (startup+)
  aiBusinessPlan: boolean;          // KI business plan generator (startup+)
  fullPitchDeck: boolean;           // 8-slide deck vs 3 (startup+)
  discoverInvestors: boolean;       // browse & request investors (startup+)
  dadoriIntro: boolean;             // curated intros (startup+)
  investorVisibility: boolean;      // be discoverable/toggle visibility (startup+)
  verifiedBadge: boolean;           // incubator-verified (startup_pro)
  featuredInvestorDiscovery: boolean; // featured placement (startup_pro)
  dataRoom: boolean;                // data room for investors (startup_pro)
  unlimitedStartupIntros: boolean;  // unlimited intros (startup_pro)
  activeJobPostings: number;        // open roles (project/startup: limited, pro: more)
  workspaceAi: boolean;             // AI co-founder in workspace (startup+)

  // --- Talent ---
  applicationsPerMonth: number;     // free 3, plus 20, pro ∞
  searchPriority: boolean;          // plus+
  directMessages: boolean;          // plus+
  activelyLookingBadge: boolean;    // plus+
  featuredProfile: boolean;         // pro
  profileAnalytics: boolean;        // pro
  matchScore: boolean;              // pro
  portfolioItems: number;           // free 1, plus 10, pro ∞

  // --- Investor ---
  introsPerMonth: number;           // scout 0, angel 3, pro 10, premium 25, elite ∞
  startupDetails: boolean;          // angel+
  watchlistLimit: number;           // free 5, angel 20, pro+ ∞
  weeklyDigest: boolean;            // angel+
  advancedFilters: boolean;         // pro+
  stealthProjects: boolean;         // pro+
  portfolioTracker: boolean;        // pro+
  fundingData: boolean;             // pro+ (MRR/stage on startups)
  investorVerifiedBadge: boolean;   // premium+
  featuredInSearch: boolean;        // premium+
  investorDataRoom: boolean;        // premium+
  earlyAccess: boolean;             // premium+ (72h)
  analystReport: boolean;           // premium+
  dealFlowManager: boolean;         // elite
  apiAccess: boolean;               // elite

  // --- General ---
  prioritySupport: boolean;
}

const NONE: PlanCaps = {
  fundingDetails: false, aiBusinessPlan: false, fullPitchDeck: false,
  discoverInvestors: false, dadoriIntro: false, investorVisibility: false,
  verifiedBadge: false, featuredInvestorDiscovery: false, dataRoom: false,
  unlimitedStartupIntros: false, activeJobPostings: 1, workspaceAi: false,
  applicationsPerMonth: 3, searchPriority: false, directMessages: false,
  activelyLookingBadge: false, featuredProfile: false, profileAnalytics: false,
  matchScore: false, portfolioItems: 1,
  introsPerMonth: 0, startupDetails: false, watchlistLimit: 5, weeklyDigest: false,
  advancedFilters: false, stealthProjects: false, portfolioTracker: false,
  fundingData: false, investorVerifiedBadge: false, featuredInSearch: false,
  investorDataRoom: false, earlyAccess: false, analystReport: false,
  dealFlowManager: false, apiAccess: false, prioritySupport: false,
};

export function planCaps(planTier?: string | null | CapabilityHolder): PlanCaps {
  // A holder ({plan_tier, capabilities}) resolves to the merged caps of all held
  // capabilities; a plain string keeps the single-tier lookup below.
  if (planTier && typeof planTier === "object") return resolveCaps(planTier);
  const t = planTier ?? "free";
  switch (t) {
    // ---- Startup / creator ----
    case "project":
      return { ...NONE, activeJobPostings: 1 };
    case "startup":
      return { ...NONE, fundingDetails: true, aiBusinessPlan: true, fullPitchDeck: true,
        discoverInvestors: true, dadoriIntro: true, investorVisibility: true,
        activeJobPostings: 5, workspaceAi: true };
    case "startup_pro":
    case "scale": // legacy
      return { ...NONE, fundingDetails: true, aiBusinessPlan: true, fullPitchDeck: true,
        discoverInvestors: true, dadoriIntro: true, investorVisibility: true,
        verifiedBadge: true, featuredInvestorDiscovery: true, dataRoom: true,
        unlimitedStartupIntros: true, activeJobPostings: Infinity, workspaceAi: true,
        prioritySupport: true };

    // ---- Talent ----
    case "plus":
      return { ...NONE, applicationsPerMonth: 20, searchPriority: true,
        directMessages: true, activelyLookingBadge: true, portfolioItems: 10 };
    case "pro": // talent pro (also legacy startup "pro" — handled as talent here;
                // startup pages should use isStartupPaid/planCaps with real ids)
      return { ...NONE, applicationsPerMonth: Infinity, searchPriority: true,
        directMessages: true, activelyLookingBadge: true, featuredProfile: true,
        profileAnalytics: true, matchScore: true, portfolioItems: Infinity,
        prioritySupport: true };

    // ---- Investor ----
    case "investor_basic":
      return { ...NONE, introsPerMonth: 3, startupDetails: true, watchlistLimit: 20,
        weeklyDigest: true };
    case "investor_pro":
      return { ...NONE, introsPerMonth: 10, startupDetails: true, watchlistLimit: Infinity,
        weeklyDigest: true, advancedFilters: true, stealthProjects: true,
        portfolioTracker: true, fundingData: true };
    case "investor_premium":
      return { ...NONE, introsPerMonth: 25, startupDetails: true, watchlistLimit: Infinity,
        weeklyDigest: true, advancedFilters: true, stealthProjects: true,
        portfolioTracker: true, fundingData: true, investorVerifiedBadge: true,
        featuredInSearch: true, investorDataRoom: true, earlyAccess: true,
        analystReport: true };
    case "investor_elite":
      return { ...NONE, introsPerMonth: Infinity, startupDetails: true, watchlistLimit: Infinity,
        weeklyDigest: true, advancedFilters: true, stealthProjects: true,
        portfolioTracker: true, fundingData: true, investorVerifiedBadge: true,
        featuredInSearch: true, investorDataRoom: true, earlyAccess: true,
        analystReport: true, dealFlowManager: true, apiAccess: true,
        prioritySupport: true };

    default: // free / project / investor_free / unknown
      return NONE;
  }
}
