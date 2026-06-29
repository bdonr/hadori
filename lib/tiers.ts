export type TalentTier   = "free" | "plus" | "pro";
export type ProjectTier  = "project" | "startup" | "startup_pro";
export type InvestorTier = "investor_free" | "investor_basic" | "investor_pro" | "investor_premium" | "investor_elite";

export const TALENT_TIERS = [
  {
    id: "free" as TalentTier,
    name: "Free",
    price: 0,
    emoji: "👤",
    features: [
      "Talent-Profil erstellen",
      "Skills & Region angeben",
      "Projekte & Startups entdecken",
      "Auf offene Rollen bewerben",
    ],
    cta: "Kostenlos starten",
    highlight: false,
  },
  {
    id: "plus" as TalentTier,
    name: "Plus",
    price: 5,
    emoji: "⭐",
    features: [
      "Alles aus Free +",
      "Priorität in Suchergebnissen",
      "Direktnachrichten an Startups",
      "Profilbadge \"Aktiv suchend\"",
      "Bis zu 20 Bewerbungen / Mo",
    ],
    cta: "Plus freischalten",
    highlight: false,
  },
  {
    id: "pro" as TalentTier,
    name: "Pro",
    price: 20,
    emoji: "🏆",
    features: [
      "Alles aus Plus +",
      "Featured Profil (Top Placement)",
      "Profil-Analytics & Views",
      "DADORI Match Score sichtbar",
      "Unbegrenzte Bewerbungen",
      "Priority Support",
    ],
    cta: "Pro werden",
    highlight: true,
  },
] as const;

export const PROJECT_TIERS = [
  {
    id: "project" as ProjectTier,
    name: "Projekt",
    price: 2,
    emoji: "🎯",
    features: [
      "Öffentliches Projekt-Profil",
      "Stealth-Modus (anonym pitchen)",
      "Talent finden & kontaktieren",
      "Von Investoren entdeckt werden",
      "Upgrade zu Startup jederzeit",
    ],
    cta: "Projekt erstellen",
    highlight: false,
  },
  {
    id: "startup" as ProjectTier,
    name: "Startup",
    price: 10,
    emoji: "🚀",
    features: [
      "Alles aus Projekt +",
      "Funding Stage & MRR sichtbar",
      "KI-Businessplan Generator",
      "Investoren entdecken & anfragen",
      "DADORI Intro (kuratiert)",
    ],
    cta: "Zu Startup upgraden",
    highlight: true,
  },
  {
    id: "startup_pro" as ProjectTier,
    name: "Startup Pro",
    price: 25,
    emoji: "🦄",
    features: [
      "Alles aus Startup +",
      "Incubator-verifiziert Badge",
      "Featured in Investor-Discovery",
      "Datenraum für Investoren",
      "Unbegrenzte DADORI Intros",
      "Priority Support",
    ],
    cta: "Pro Startup werden",
    highlight: false,
  },
] as const;

export const INVESTOR_TIERS = [
  {
    id: "investor_free" as InvestorTier,
    name: "Scout",
    price: 0,
    emoji: "🔭",
    introsPerMonth: 0,
    features: [
      "Öffentliches Investor-Profil",
      "Öffentliche Startups & Projekte entdecken",
      "Startups können dich finden & anfragen",
      "Eigenen Investment-Fokus hinterlegen",
    ],
    cta: "Kostenlos starten",
    highlight: false,
  },
  {
    id: "investor_basic" as InvestorTier,
    name: "Angel",
    price: 19,
    emoji: "👼",
    introsPerMonth: 3,
    features: [
      "Alles aus Scout +",
      "3 DADORI Intros / Monat",
      "Startup-Details & Gründerprofile sehen",
      "Watchlist (bis 20 Startups speichern)",
      "Wöchentlicher Deal Flow Digest (E-Mail)",
    ],
    cta: "Angel werden",
    highlight: false,
  },
  {
    id: "investor_pro" as InvestorTier,
    name: "Investor Pro",
    price: 49,
    emoji: "💼",
    introsPerMonth: 10,
    features: [
      "Alles aus Angel +",
      "10 DADORI Intros / Monat",
      "Erweiterte Filter (Stage, MRR, Region, Kategorie)",
      "Stealth-Projekte entdecken",
      "Portfolio-Tracker (aktive Deals verfolgen)",
      "Funding-Stage & MRR-Daten sehen",
    ],
    cta: "Pro werden",
    highlight: true,
  },
  {
    id: "investor_premium" as InvestorTier,
    name: "Lead Investor",
    price: 99,
    emoji: "🏦",
    introsPerMonth: 25,
    features: [
      "Alles aus Pro +",
      "25 DADORI Intros / Monat",
      "Verifizierter Investor-Badge",
      "Featured in Startup-Suche (Top Placement)",
      "Datenraum-Zugang (nach Freigabe)",
      "Frühzugang zu neuen Startups (72h Vorsprung)",
      "Monatlicher DADORI Analyst-Report",
    ],
    cta: "Lead Investor werden",
    highlight: false,
  },
  {
    id: "investor_elite" as InvestorTier,
    name: "VC / Elite",
    price: 199,
    emoji: "🦁",
    introsPerMonth: -1, // unlimited
    features: [
      "Alles aus Lead Investor +",
      "Unbegrenzte DADORI Intros",
      "Dedizierter Deal Flow Manager",
      "API-Zugang (Webhooks für neue Startups)",
      "Co-Investor Netzwerk (andere VCs auf DADORI)",
      "White-Label Datenraum",
      "Quartals-Briefing mit DADORI-Team",
      "Priority Support (< 2h Antwortzeit)",
    ],
    cta: "Elite-Zugang anfragen",
    highlight: false,
  },
] as const;

export function canTalentAccess(tier: TalentTier, required: TalentTier): boolean {
  const order: TalentTier[] = ["free", "plus", "pro"];
  return order.indexOf(tier) >= order.indexOf(required);
}

export function canProjectAccess(tier: ProjectTier, required: ProjectTier): boolean {
  const order: ProjectTier[] = ["project", "startup", "startup_pro"];
  return order.indexOf(tier) >= order.indexOf(required);
}
