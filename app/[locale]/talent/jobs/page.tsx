"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSkillLabel } from "@/lib/skills";
import { REGIONS, getRegion, regionMatches } from "@/lib/regions";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Demo open roles from startups & creators
const OPEN_ROLES = [
  {
    id: "1",
    projectName: "StreamerXY",
    projectType: "Content Creator",
    projectIcon: "🎮",
    title: "Video-Cutter gesucht",
    description: "Gaming-Creator mit 80k Subs sucht jemanden der Raw-Footage zu 10–15 min YouTube-Videos schneidet. Reels und Shorts wären ein Plus.",
    skills: ["video_editing", "short_form", "long_form", "davinci"],
    compensation: ["revenue_share", "cash"],
    commitment: "Freelance / Projekt",
    remote: true,
    region: "de",
    language: "de",
    postedAt: "2026-06-27",
  },
  {
    id: "2",
    projectName: "DADORI",
    projectType: "SaaS Startup",
    projectIcon: "🚀",
    title: "CTO / Full-Stack Developer",
    description: "Wir bauen eine dreiseitige Startup-Plattform und suchen einen technischen Co-Founder der die Architektur mit uns aufbaut.",
    skills: ["fullstack", "backend", "devops", "ai_ml"],
    compensation: ["equity"],
    commitment: "Co-Founder (Vollzeit)",
    remote: true,
    region: "dach",
    language: "de",
    postedAt: "2026-06-25",
  },
  {
    id: "3",
    projectName: "PodcastKing",
    projectType: "Content Creator",
    projectIcon: "🎙️",
    title: "Thumbnail-Designer & Cutter",
    description: "Wöchentlicher Podcast mit 40k Hörern sucht jemanden für Thumbnail-Design und kurze Teaser-Videos für Instagram & TikTok.",
    skills: ["thumbnail_design", "short_form", "graphic_design", "video_editing"],
    compensation: ["cash"],
    commitment: "Teilzeit (< 20h/Woche)",
    remote: true,
    region: "worldwide",
    language: "de",
    postedAt: "2026-06-24",
  },
  {
    id: "4",
    projectName: "BeatLab Records",
    projectType: "Musik-Startup",
    projectIcon: "🎵",
    title: "Music Video Editor",
    description: "Indie-Label sucht Editor für offizielle Music Videos und Social-Content. Erfahrung mit Color Grading und After Effects von Vorteil.",
    skills: ["video_editing", "color_grading", "after_effects", "short_form"],
    compensation: ["cash"],
    commitment: "Freelance / Projekt",
    remote: true,
    region: "at",
    language: "de",
    postedAt: "2026-06-23",
  },
  {
    id: "5",
    projectName: "EcoFashion GmbH",
    projectType: "E-Commerce Startup",
    projectIcon: "🌿",
    title: "CMO / Head of Marketing",
    description: "Nachhaltige Fashion-Brand sucht Marketing-Lead für Paid Ads, Influencer-Kooperationen und Content-Strategie.",
    skills: ["ads", "social_media", "influencer_marketing", "content_strategy"],
    compensation: ["cash", "equity"],
    commitment: "Vollzeit",
    remote: false,
    region: "de",
    language: "de",
    postedAt: "2026-06-22",
  },
  {
    id: "6",
    projectName: "TwitchCrew",
    projectType: "Streaming-Community",
    projectIcon: "📡",
    title: "Stream-Techniker & Overlay-Designer",
    description: "Wachsende Twitch-Community sucht jemanden der unsere Streams technisch betreut und schicke Overlays & Alerts baut.",
    skills: ["streaming_setup", "obs", "overlay_design", "graphic_design"],
    compensation: ["revenue_share"],
    commitment: "Teilzeit (< 20h/Woche)",
    remote: true,
    region: "worldwide",
    language: "en",
    postedAt: "2026-06-20",
  },
  {
    id: "7",
    projectName: "LongFormStudio",
    projectType: "Content Creator",
    projectIcon: "🎬",
    title: "Dokumentarfilm-Cutter",
    description: "Wir produzieren 30–60 min Dokumentationen über Tech und Gesellschaft für YouTube. Suchen einen erfahrenen Editor mit Gefühl für Storytelling.",
    skills: ["long_form", "video_editing", "color_grading", "premiere"],
    compensation: ["cash"],
    commitment: "Freelance / Projekt",
    remote: true,
    region: "dach",
    language: "de",
    postedAt: "2026-06-18",
  },
  {
    id: "8",
    projectName: "AI Startup X",
    projectType: "DeepTech Startup",
    projectIcon: "🤖",
    title: "AI Engineer / ML Specialist",
    description: "Wir entwickeln KI-Tools für den Bildungsbereich und suchen einen ML-Engineer der unser Kern-Modell mit aufbaut.",
    skills: ["ai_ml", "python", "data_science", "backend"],
    compensation: ["equity", "cash"],
    commitment: "Vollzeit",
    remote: true,
    region: "us",
    language: "en",
    postedAt: "2026-06-15",
  },
];

const COMP_LABEL: Record<string, string> = {
  revenue_share: "Revenue Share",
  equity: "Equity",
  cash: "Gehalt",
  exposure: "Exposure",
};

function matchScore(roleSkills: string[], mySkills: string[]): number {
  if (roleSkills.length === 0) return 0;
  return Math.round(
    (roleSkills.filter(s => mySkills.includes(s)).length / roleSkills.length) * 100
  );
}

const FILTER_OPTIONS = [
  { id: "all", label: "Alle" },
  { id: "match", label: "Beste Matches" },
  { id: "remote", label: "Remote" },
  { id: "freelance", label: "Freelance" },
  { id: "equity", label: "Equity" },
];

// MY preferred regions — in production: load from Firestore talent profile
const MY_REGIONS = ["dach", "de", "at", "ch", "worldwide"];

// Fallback if not logged in or Firebase unavailable
const FALLBACK_SKILLS: string[] = [];

export default function TalentJobsPage() {
  const params = useParams();
  const locale = (params.locale as string) ?? "en";
  const [mySkills, setMySkills] = useState<string[]>(FALLBACK_SKILLS);
  const [myRegions, setMyRegions] = useState<string[]>(["dach", "de", "at", "ch", "worldwide"]);
  const [filter, setFilter] = useState("match");
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "talent", user.uid));
        if (snap.exists()) {
          const d = snap.data() as Record<string, unknown>;
          if (Array.isArray(d.skills) && (d.skills as string[]).length > 0) setMySkills(d.skills as string[]);
          if (Array.isArray(d.regions) && (d.regions as string[]).length > 0) setMyRegions(d.regions as string[]);
        }
      } catch { /* ignore */ }
    });
    return () => unsub();
  }, []);

  const results = useMemo(() => {
    let list = OPEN_ROLES.map(r => ({ ...r, match: matchScore(r.skills, mySkills) }));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.projectName.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.skills.some(s => getSkillLabel(s).toLowerCase().includes(q))
      );
    }

    // Region filter
    if (regionFilter === "my_regions") {
      list = list.filter(r => regionMatches(myRegions, r.region));
    } else if (regionFilter !== "all") {
      list = list.filter(r => regionMatches([regionFilter], r.region));
    }

    if (filter === "match") list = list.filter(r => r.match > 0).sort((a, b) => b.match - a.match);
    if (filter === "remote") list = list.filter(r => r.remote);
    if (filter === "freelance") list = list.filter(r => r.commitment === "Freelance / Projekt");
    if (filter === "equity") list = list.filter(r => r.compensation.includes("equity"));
    if (filter === "all") list = list.sort((a, b) => b.match - a.match);

    return list;
  }, [filter, search, regionFilter, mySkills, myRegions]);

  const topMatch = results.length > 0 ? results[0].match : 0;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Link href="/talent" className="text-sm text-zinc-400 hover:text-zinc-600">← Dashboard</Link>
          <h1 className="text-lg font-semibold text-zinc-900">Stellen & Projekte</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">

        {/* Skill context bar */}
        <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Deine Skills</span>
          {mySkills.length === 0 ? (
            <span className="text-xs text-indigo-400 italic">Noch keine Skills — jetzt hinzufügen</span>
          ) : mySkills.map(id => (
            <span key={id} className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white">
              {getSkillLabel(id)}
            </span>
          ))}
          <Link href="/talent/skills" className="ml-auto text-xs text-indigo-500 hover:underline shrink-0">
            Bearbeiten →
          </Link>
        </div>

        {/* Search + Filter */}
        <div className="mb-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rolle, Projekt oder Skill suchen …"
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
          <div className="flex gap-1.5 flex-wrap">
            {FILTER_OPTIONS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.id
                    ? "bg-indigo-600 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Region filter */}
        <div className="mb-5 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Region:</span>
          {[
            { id: "all", flag: "🌍", label: "Alle" },
            { id: "my_regions", flag: "⭐", label: "Meine Regionen" },
            ...REGIONS.filter(r => r.id !== "worldwide" && r.id !== "eu").map(r => ({
              id: r.id, flag: r.flag, label: r.label,
            })),
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setRegionFilter(r.id)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                regionFilter === r.id
                  ? "bg-indigo-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300"
              }`}
            >
              <span>{r.flag}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        {/* Result count */}
        <p className="mb-4 text-sm text-zinc-500">
          <span className="font-semibold text-zinc-900">{results.length}</span> Rollen gefunden
          {filter === "match" && topMatch > 0 && (
            <span className="ml-2 text-indigo-600">· Bester Match: {topMatch} %</span>
          )}
        </p>

        {/* Role cards */}
        {results.length === 0 ? (
          <div className="py-20 text-center text-zinc-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-zinc-600">Keine Treffer</p>
            <p className="mt-1 text-sm">Andere Suchbegriffe oder Filter versuchen.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {results.map(role => (
              <RoleCard key={role.id} role={role} mySkills={mySkills} locale={locale} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function RoleCard({ role, mySkills, locale }: { role: typeof OPEN_ROLES[0] & { match: number }; mySkills: string[]; locale: string }) {
  const [applied, setApplied] = useState(false);

  const matchColor =
    role.match >= 75 ? "bg-green-100 text-green-700" :
    role.match >= 40 ? "bg-amber-100 text-amber-700" :
    role.match > 0   ? "bg-zinc-100 text-zinc-500" :
                       "bg-zinc-100 text-zinc-400";

  return (
    <div className={`rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md ${
      role.match >= 75 ? "border-green-200" : role.match >= 40 ? "border-amber-100" : "border-zinc-200"
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href={`/${locale}/project/${role.id}`} className="text-2xl hover:scale-110 transition-transform shrink-0">
            {role.projectIcon}
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/${locale}/project/${role.id}`} className="font-bold text-zinc-900 hover:text-indigo-600 transition-colors">
                {role.title}
              </Link>
              {role.match > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${matchColor}`}>
                  {role.match} % Match
                </span>
              )}
            </div>
            <Link href={`/${locale}/project/${role.id}`} className="text-xs text-zinc-500 mt-0.5 hover:text-indigo-500 transition-colors">
              {role.projectIcon} {role.projectName} · {role.projectType}
            </Link>
          </div>
        </div>
        <span className="text-xs text-zinc-300 shrink-0">{role.postedAt}</span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{role.description}</p>

      {/* Skills — highlight matches */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {role.skills.map(id => {
          const isMatch = mySkills.includes(id);
          return (
            <span
              key={id}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isMatch ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {isMatch && "✓ "}{getSkillLabel(id)}
            </span>
          );
        })}
      </div>

      {/* Meta + CTA */}
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-zinc-400">{role.commitment}</span>
        {role.remote && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">Remote</span>}
        {(() => {
          const reg = getRegion(role.region);
          return reg ? (
            <span className="rounded-full bg-zinc-50 border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500">
              {reg.flag} {reg.label}
            </span>
          ) : null;
        })()}
        {role.compensation.map(c => (
          <span key={c} className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500">
            {COMP_LABEL[c] ?? c}
          </span>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/${locale}/project/${role.id}`}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
            Details →
          </Link>
          {applied ? (
            <span className="rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              ✓ Angefragt
            </span>
          ) : (
            <button
              onClick={() => setApplied(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Interesse bekunden
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
