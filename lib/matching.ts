/**
 * Matching engine — shared logic for talent ↔ role and startup ↔ investor matching.
 * Runs client-side for instant UI feedback; mirrored in Cloud Functions for push triggers.
 */

export interface MatchEvent {
  id: string;
  type:
    | "role_posted"        // Startup posted a role matching talent's skills
    | "talent_online"      // Matching talent came online
    | "investor_viewed"    // Investor viewed a startup profile
    | "project_created"    // New startup/project that needs your skills
    | "mutual_interest"    // Both sides showed interest → HADORI Intro
    | "intro_sent";        // HADORI sent an intro between two parties
  score: number;           // 0–100 match score
  timestamp: string;       // ISO
  read: boolean;

  // Subjects
  fromName: string;
  fromType: "startup" | "talent" | "investor";
  fromIcon: string;

  // Context
  title: string;           // Short headline
  body: string;            // Detail
  matchedSkills?: string[];
  ctaLabel?: string;
  ctaHref?: string;
}

export function calcSkillMatch(roleSkills: string[], talentSkills: string[]): number {
  if (!roleSkills.length) return 0;
  const hits = roleSkills.filter(s => talentSkills.includes(s)).length;
  return Math.round((hits / roleSkills.length) * 100);
}

export function matchTemperature(score: number): {
  label: string;
  color: string;
  bg: string;
  emoji: string;
} {
  if (score >= 80) return { label: "Perfekt", color: "text-green-700", bg: "bg-green-100", emoji: "🔥" };
  if (score >= 60) return { label: "Sehr gut", color: "text-indigo-700", bg: "bg-indigo-100", emoji: "⚡" };
  if (score >= 40) return { label: "Gut", color: "text-amber-700", bg: "bg-amber-100", emoji: "✨" };
  return { label: "Möglich", color: "text-zinc-600", bg: "bg-zinc-100", emoji: "💡" };
}
