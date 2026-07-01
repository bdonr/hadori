export interface FundingStage { id: string; label: string; desc: string; emoji: string; }
export interface MrrRange { id: string; label: string; }
export interface InvestorFocus { id: string; label: string; }
export interface CheckSize { id: string; label: string; }

export const FUNDING_STAGES: FundingStage[] = [
  { id: "idea",         label: "Idee / Concept",      desc: "Noch kein Produkt",                   emoji: "💡" },
  { id: "pre_revenue",  label: "Pre-Revenue",         desc: "Produkt live, kein Umsatz",            emoji: "🚀" },
  { id: "revenue",      label: "Revenue-generating",  desc: "Erster Umsatz / MRR > 0",             emoji: "💰" },
  { id: "pre_seed",     label: "Pre-Seed",            desc: "Erste Finanzierung gesucht (< €500k)", emoji: "🌱" },
  { id: "seed",         label: "Seed",                desc: "€500k – €2M",                         emoji: "🌿" },
  { id: "series_a",     label: "Series A",            desc: "€2M – €15M",                          emoji: "📈" },
  { id: "series_b_plus",label: "Series B+",           desc: "€15M+",                               emoji: "🏦" },
  { id: "bootstrapped", label: "Bootstrapped",        desc: "Kein externes Kapital geplant",        emoji: "💪" },
];

export const MRR_RANGES: MrrRange[] = [
  { id: "none",     label: "Kein Umsatz" },
  { id: "lt_1k",   label: "< €1k / Monat" },
  { id: "1k_10k",  label: "€1k – €10k / Monat" },
  { id: "10k_50k", label: "€10k – €50k / Monat" },
  { id: "50k_plus",label: "> €50k / Monat" },
];

export const INVESTOR_FOCUS: InvestorFocus[] = [
  { id: "saas",      label: "B2B SaaS" },
  { id: "consumer",  label: "Consumer" },
  { id: "deep_tech", label: "Deep Tech / AI" },
  { id: "fintech",   label: "Fintech" },
  { id: "health",    label: "Health / MedTech" },
  { id: "creator",   label: "Creator Economy" },
  { id: "climate",   label: "Climate / Greentech" },
  { id: "marketplace",label: "Marketplace" },
  { id: "edtech",    label: "EdTech" },
  { id: "ecommerce", label: "E-Commerce" },
];

export const CHECK_SIZES: CheckSize[] = [
  { id: "angel",    label: "€10k – €100k (Angel)" },
  { id: "pre_seed", label: "€100k – €500k (Pre-Seed)" },
  { id: "seed",     label: "€500k – €2M (Seed)" },
  { id: "series_a", label: "€2M – €10M (Series A)" },
  { id: "series_b", label: "€10M+ (Series B+)" },
];

// Funding amount sought — a range, never free text (rule #6: amounts are pickers).
export const FUNDING_RANGES: MrrRange[] = [
  { id: "none",      label: "Suche keine Finanzierung" },
  { id: "lt_50k",    label: "< €50k" },
  { id: "50k_250k",  label: "€50k – €250k" },
  { id: "250k_1m",   label: "€250k – €1M" },
  { id: "1m_3m",     label: "€1M – €3M" },
  { id: "3m_10m",    label: "€3M – €10M" },
  { id: "gt_10m",    label: "> €10M" },
];

// Deals per year (investor) — a range, never a free-text number.
export const DEALS_PER_YEAR: MrrRange[] = [
  { id: "0",       label: "0 (noch keine)" },
  { id: "1_2",     label: "1–2" },
  { id: "3_5",     label: "3–5" },
  { id: "6_10",    label: "6–10" },
  { id: "11_25",   label: "11–25" },
  { id: "25_plus", label: "25+" },
];

export function getFundingRangeLabel(id: string): string {
  return FUNDING_RANGES.find(r => r.id === id)?.label ?? id;
}

export function getFundingStage(id: string): FundingStage | undefined {
  return FUNDING_STAGES.find(s => s.id === id);
}
export function getInvestorFocus(id: string): InvestorFocus | undefined {
  return INVESTOR_FOCUS.find(f => f.id === id);
}
