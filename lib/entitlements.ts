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
export function isStartupPaid(planTier?: string | null): boolean {
  return !!planTier && ["startup", "startup_pro", "pro", "scale"].includes(planTier);
}

// Top startup plan: verified badge, data room, featured placement.
export function isStartupProPlus(planTier?: string | null): boolean {
  return !!planTier && ["startup_pro", "scale"].includes(planTier);
}

// Paid talent plan (Plus or Pro).
export function isTalentPaid(planTier?: string | null): boolean {
  return !!planTier && ["plus", "pro", "scale"].includes(planTier);
}

// Paid investor plan (Angel and above).
export function isInvestorPaid(planTier?: string | null): boolean {
  return !!planTier && planTier.startsWith("investor_") && planTier !== "investor_free";
}
