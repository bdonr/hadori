"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SKILL_CATEGORIES, getSkillLabel, ALL_SKILLS } from "@/lib/skills";

// ── Demo talent pool ────────────────────────────────────────────────────────
const DEMO_TALENT = [
  {
    id: "1",
    name: "Lisa M.",
    title: "CEO / Gründerin",
    bio: "Serielle Gründerin mit 2 Exits. Spezialisiert auf B2B SaaS und Fundraising bis Series A.",
    skills: ["business_strategy", "fundraising", "sales", "product_management", "operations", "pr"],
    experience: "expert",
    availability: "project_based",
    remote: true,
    avatar: "LM",
    color: "bg-violet-500",
  },
  {
    id: "2",
    name: "Jonas K.",
    title: "CTO / Full-Stack Dev",
    bio: "10 Jahre Tech-Erfahrung, zuletzt Lead Engineer bei einem FinTech Scale-Up. Aufbau von Teams und Architekturen.",
    skills: ["fullstack", "backend", "devops", "ai_ml", "product_management", "mobile_ios"],
    experience: "expert",
    availability: "part_time",
    remote: true,
    avatar: "JK",
    color: "bg-blue-500",
  },
  {
    id: "3",
    name: "Sara T.",
    title: "Video-Editor · Content Creator",
    bio: "Schneide YouTube und Reels für Gaming- und Tech-Creator. DaVinci Resolve & Premiere, 4+ Jahre.",
    skills: ["video_editing", "short_form", "long_form", "color_grading", "davinci", "premiere"],
    experience: "experienced",
    availability: "immediately",
    remote: true,
    avatar: "ST",
    color: "bg-pink-500",
  },
  {
    id: "4",
    name: "Max B.",
    title: "Growth Marketing · Paid Ads",
    bio: "Managed monatlich 6-stellige Ad-Budgets auf Meta & TikTok. E-Commerce und Creator-Brands.",
    skills: ["ads", "social_media", "analytics", "growth_hacking", "email_marketing", "content_strategy"],
    experience: "experienced",
    availability: "part_time",
    remote: true,
    avatar: "MB",
    color: "bg-orange-500",
  },
  {
    id: "5",
    name: "Noa F.",
    title: "Thumbnail & Brand Designer",
    bio: "Thumbnail-Design für Creator mit bis zu 2M Subs. Branding, Figma, Photoshop.",
    skills: ["thumbnail_design", "graphic_design", "logo_design", "figma", "photoshop", "brand_identity"],
    experience: "experienced",
    availability: "immediately",
    remote: true,
    avatar: "NF",
    color: "bg-teal-500",
  },
  {
    id: "6",
    name: "Tim W.",
    title: "Music Producer · Sound Designer",
    bio: "Produziere Intros, Background Music und komplette Soundtracks für YouTube & Podcasts.",
    skills: ["music_production", "sound_design", "jingle", "mixing", "mastering", "ableton"],
    experience: "experienced",
    availability: "project_based",
    remote: true,
    avatar: "TW",
    color: "bg-green-500",
  },
  {
    id: "7",
    name: "Anna R.",
    title: "CMO · Brand Strategin",
    bio: "Aufbau von Brand-Strategien für Startups und Creator-Brands. PR, Community, Influencer.",
    skills: ["content_strategy", "pr", "influencer_marketing", "community_building", "social_media", "brand_identity"],
    experience: "expert",
    availability: "part_time",
    remote: true,
    avatar: "AR",
    color: "bg-red-500",
  },
  {
    id: "8",
    name: "David L.",
    title: "Stream-Techniker · OBS-Experte",
    bio: "Setup, Overlay-Design und Automatisierung für Twitch & YouTube Live. Bot-Setup inklusive.",
    skills: ["streaming_setup", "obs", "overlay_design", "bot_setup", "stream_moderation", "clips_highlights"],
    experience: "intermediate",
    availability: "immediately",
    remote: true,
    avatar: "DL",
    color: "bg-indigo-500",
  },
];

const EXPERIENCE_LABEL: Record<string, string> = {
  beginner: "Einsteiger",
  intermediate: "Fortgeschritten",
  experienced: "Erfahren",
  expert: "Experte",
};

const AVAILABILITY_LABEL: Record<string, string> = {
  immediately: "Sofort verfügbar",
  part_time: "Nebenbei",
  project_based: "Projektbasiert",
  not_available: "Nicht verfügbar",
};

const AVAILABILITY_COLOR: Record<string, string> = {
  immediately: "bg-green-100 text-green-700",
  part_time: "bg-blue-100 text-blue-700",
  project_based: "bg-amber-100 text-amber-700",
  not_available: "bg-zinc-100 text-zinc-500",
};

// Quick-filter presets
const PRESETS = [
  { label: "CEO / Führung", skills: ["business_strategy", "fundraising", "operations", "sales"] },
  { label: "CTO / Tech", skills: ["fullstack", "backend", "devops", "ai_ml"] },
  { label: "CMO / Marketing", skills: ["content_strategy", "ads", "social_media", "pr"] },
  { label: "Video & Schnitt", skills: ["video_editing", "short_form", "long_form", "color_grading"] },
  { label: "Design", skills: ["thumbnail_design", "graphic_design", "ui_ux", "figma"] },
  { label: "Musik & Audio", skills: ["music_production", "sound_design", "mixing", "jingle"] },
  { label: "Streaming", skills: ["streaming_setup", "obs", "overlay_design", "clips_highlights"] },
  { label: "AI / ML", skills: ["ai_ml", "data_science", "automation"] },
];

export default function TalentSearchPage() {
  const [query, setQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [filterExp, setFilterExp] = useState("");
  const [filterAvail, setFilterAvail] = useState("");
  const [showSkillFilter, setShowSkillFilter] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");

  // Apply preset
  function applyPreset(skills: string[]) {
    setSelectedSkills(skills);
    setSkillSearch("");
  }

  function toggleSkill(id: string) {
    setSelectedSkills(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  // Filter talent
  const results = useMemo(() => {
    return DEMO_TALENT.filter(t => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.bio.toLowerCase().includes(q) ||
        t.skills.some(s => getSkillLabel(s).toLowerCase().includes(q));

      const matchesSkills =
        selectedSkills.length === 0 ||
        selectedSkills.some(s => t.skills.includes(s));

      const matchesExp = !filterExp || t.experience === filterExp;
      const matchesAvail = !filterAvail || t.availability === filterAvail;

      return matchesQuery && matchesSkills && matchesExp && matchesAvail;
    });
  }, [query, selectedSkills, filterExp, filterAvail]);

  const filteredSkillCategories = useMemo(() => {
    const q = skillSearch.toLowerCase();
    if (!q) return SKILL_CATEGORIES;
    return SKILL_CATEGORIES.map(cat => ({
      ...cat,
      skills: cat.skills.filter(s => s.label.toLowerCase().includes(q)),
    })).filter(cat => cat.skills.length > 0);
  }, [skillSearch]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Link href="/startup" className="text-sm text-zinc-400 hover:text-zinc-600">← Dashboard</Link>
          <h1 className="text-lg font-semibold text-zinc-900">Talent finden</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex gap-8">

          {/* ── Left: Filters ── */}
          <aside className="w-72 shrink-0">

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Name, Rolle oder Skill …"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>

            {/* Presets */}
            <div className="mb-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Schnellfilter</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map(p => {
                  const active = p.skills.every(s => selectedSkills.includes(s));
                  return (
                    <button
                      key={p.label}
                      onClick={() => active ? setSelectedSkills([]) : applyPreset(p.skills)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "bg-indigo-600 text-white"
                          : "border border-zinc-200 text-zinc-600 hover:border-indigo-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skill filter */}
            <div className="mb-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <button
                onClick={() => setShowSkillFilter(v => !v)}
                className="flex w-full items-center justify-between"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Skills</p>
                <span className="text-xs text-zinc-400">{showSkillFilter ? "▲" : "▼"}</span>
              </button>

              {selectedSkills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedSkills.map(id => (
                    <button
                      key={id}
                      onClick={() => toggleSkill(id)}
                      className="flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs text-white"
                    >
                      {getSkillLabel(id)} <span className="opacity-70">✕</span>
                    </button>
                  ))}
                </div>
              )}

              {showSkillFilter && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={e => setSkillSearch(e.target.value)}
                    placeholder="Skill suchen …"
                    className="mb-2 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-400"
                  />
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                    {filteredSkillCategories.map(cat => (
                      <div key={cat.id}>
                        <p className="mb-1 text-xs font-semibold text-zinc-500">{cat.icon} {cat.label}</p>
                        <div className="flex flex-wrap gap-1">
                          {cat.skills.map(s => (
                            <button
                              key={s.id}
                              onClick={() => toggleSkill(s.id)}
                              className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                                selectedSkills.includes(s.id)
                                  ? "bg-indigo-600 text-white"
                                  : "border border-zinc-200 text-zinc-600 hover:border-indigo-300"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="mb-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Erfahrung</p>
              <div className="flex flex-col gap-1">
                {Object.entries(EXPERIENCE_LABEL).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setFilterExp(filterExp === id ? "" : id)}
                    className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      filterExp === id
                        ? "bg-indigo-50 font-medium text-indigo-700"
                        : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Verfügbarkeit</p>
              <div className="flex flex-col gap-1">
                {Object.entries(AVAILABILITY_LABEL).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setFilterAvail(filterAvail === id ? "" : id)}
                    className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      filterAvail === id
                        ? "bg-indigo-50 font-medium text-indigo-700"
                        : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Right: Results ── */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                <span className="font-semibold text-zinc-900">{results.length}</span> Talente gefunden
              </p>
              {(selectedSkills.length > 0 || filterExp || filterAvail || query) && (
                <button
                  onClick={() => { setSelectedSkills([]); setFilterExp(""); setFilterAvail(""); setQuery(""); }}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <div className="py-20 text-center text-zinc-400">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold text-zinc-600">Keine Treffer</p>
                <p className="mt-1 text-sm">Andere Suchbegriffe oder Filter versuchen.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {results.map(talent => (
                  <TalentCard key={talent.id} talent={talent} highlightSkills={selectedSkills} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function TalentCard({
  talent,
  highlightSkills,
}: {
  talent: typeof DEMO_TALENT[0];
  highlightSkills: string[];
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${talent.color} text-sm font-bold text-white`}>
          {talent.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-zinc-900">{talent.name}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${AVAILABILITY_COLOR[talent.availability]}`}>
              {AVAILABILITY_LABEL[talent.availability]}
            </span>
          </div>
          <p className="text-xs text-zinc-500">{talent.title}</p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-600 line-clamp-2">{talent.bio}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {talent.skills.slice(0, 6).map(id => (
          <span
            key={id}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              highlightSkills.includes(id)
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {getSkillLabel(id)}
          </span>
        ))}
        {talent.skills.length > 6 && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-400">
            +{talent.skills.length - 6}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          {EXPERIENCE_LABEL[talent.experience]} · {talent.remote ? "Remote" : "Vor Ort"}
        </span>
        <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">
          Kontakt aufnehmen
        </button>
      </div>
    </div>
  );
}
