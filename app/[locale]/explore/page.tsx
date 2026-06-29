"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LangSwitcher } from "@/components/LangSwitcher";
import { db } from "@/lib/firebase/client";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const DEMO_PROJECTS = [
  {
    id: "dadori", name: "DADORI", tagline: "Die Plattform die Startups, Talente und Investoren verbindet.",
    category: "B2B SaaS", icon: "🚀", stage: "Pre-Seed", stageEmoji: "🌱",
    mrr: null, teamSize: "2–5", region: "de", regionFlag: "🇩🇪",
    skills: ["fullstack", "ai_ml", "marketing"],
    lookingFor: ["CTO", "Marketing Lead"], investorVisible: true,
  },
  {
    id: "streamerxy", name: "StreamerXY", tagline: "Gaming-Creator mit 80k Subs sucht Editor.",
    category: "Creator / Streaming", icon: "🎮", stage: "Revenue", stageEmoji: "💰",
    mrr: "€1k–€10k", teamSize: "1", region: "de", regionFlag: "🇩🇪",
    skills: ["video_editing", "short_form", "davinci"],
    lookingFor: ["Video-Cutter"], investorVisible: false,
  },
  {
    id: "beatlab", name: "BeatLab Records", tagline: "Indie-Label für die nächste Generation.",
    category: "Musik / Entertainment", icon: "🎵", stage: "Pre-Seed", stageEmoji: "🌱",
    mrr: "< €1k", teamSize: "2–5", region: "at", regionFlag: "🇦🇹",
    skills: ["video_editing", "social_media", "after_effects"],
    lookingFor: ["Video Editor", "Social Media Manager"], investorVisible: true,
  },
  {
    id: "klimaapp", name: "KlimaApp", tagline: "CO₂-Tracking für den Alltag. Für alle.",
    category: "Climate Tech", icon: "🌍", stage: "Seed", stageEmoji: "🌿",
    mrr: "€5k–€20k", teamSize: "5–10", region: "de", regionFlag: "🇩🇪",
    skills: ["mobile", "ux_design", "data_science"],
    lookingFor: ["UX Designer", "iOS Dev"], investorVisible: true,
  },
  {
    id: "edupilot", name: "EduPilot", tagline: "KI-Tutor für Schüler in DACH.",
    category: "EdTech", icon: "📚", stage: "Pre-Revenue", stageEmoji: "🚀",
    mrr: null, teamSize: "2–5", region: "ch", regionFlag: "🇨🇭",
    skills: ["fullstack", "ai_ml", "ux_design"],
    lookingFor: ["Full-Stack Dev", "Product Designer"], investorVisible: false,
  },
  {
    id: "fitstreak", name: "FitStreak", tagline: "Habit-App für Sport-Nerds.",
    category: "Health / Fitness", icon: "💪", stage: "Seed", stageEmoji: "🌿",
    mrr: "€2k–€8k", teamSize: "2–5", region: "de", regionFlag: "🇩🇪",
    skills: ["mobile", "motion_design", "marketing"],
    lookingFor: ["Motion Designer", "Growth"], investorVisible: true,
  },
];

function deriveCategoryIcon(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("creator") || c.includes("youtube") || c.includes("streaming")) return "🎬";
  if (c.includes("music") || c.includes("musik") || c.includes("entertainment")) return "🎵";
  if (c.includes("gaming") || c.includes("game")) return "🎮";
  if (c.includes("community")) return "💬";
  if (c.includes("app") || c.includes("mobile")) return "📱";
  if (c.includes("ecommerce") || c.includes("e-commerce") || c.includes("shop")) return "🛒";
  if (c.includes("art") || c.includes("design")) return "🎨";
  if (c.includes("education") || c.includes("edtech") || c.includes("edu")) return "📚";
  if (c.includes("event")) return "🎪";
  return "💡";
}

function deriveRegionFlag(region: string): string {
  const r = region.toLowerCase();
  if (r === "de") return "🇩🇪";
  if (r === "at") return "🇦🇹";
  if (r === "ch") return "🇨🇭";
  if (r === "us") return "🇺🇸";
  if (r === "worldwide") return "🌍";
  if (r === "uk") return "🇬🇧";
  return "🌐";
}

function deriveStageEmoji(stage: string): string {
  const s = stage.toLowerCase();
  if (s.includes("pre-revenue") || s.includes("pre revenue")) return "🚀";
  if (s.includes("pre-seed") || s.includes("pre seed")) return "🌱";
  if (s.includes("seed")) return "🌿";
  if (s.includes("revenue")) return "💰";
  if (s.includes("series")) return "📈";
  return "🌱";
}

type Project = {
  id: string; name: string; tagline: string; category: string; icon: string;
  stage: string; stageEmoji: string; mrr: string | null; teamSize: string;
  region: string; regionFlag: string; skills: string[]; lookingFor: string[];
  investorVisible: boolean;
};

const CATEGORIES = ["Alle", "B2B SaaS", "Creator / Streaming", "Musik / Entertainment", "Climate Tech", "EdTech", "Health / Fitness"];
const STAGES = ["Alle", "Pre-Revenue", "Pre-Seed", "Seed", "Revenue"];

const SKILL_LABELS: Record<string, string> = {
  fullstack: "Full-Stack", ai_ml: "AI/ML", marketing: "Marketing",
  video_editing: "Video Editing", short_form: "Short-Form", davinci: "DaVinci Resolve",
  social_media: "Social Media", after_effects: "After Effects", mobile: "Mobile Dev",
  ux_design: "UX Design", data_science: "Data Science", motion_design: "Motion Design",
};

export default function ExplorePage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";

  const [projects, setProjects] = useState<Project[]>(DEMO_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Alle");
  const [stage, setStage] = useState("Alle");
  const [investorOnly, setInvestorOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "projects"), orderBy("created_at", "desc")));
        if (cancelled) return;
        if (snap.empty) {
          setProjects(DEMO_PROJECTS);
        } else {
          const fetched: Project[] = snap.docs.map(d => {
            const data = d.data();
            const region = data.region ?? "";
            const cat = data.category ?? "";
            const stg = data.stage ?? "";
            return {
              id: d.id,
              name: data.name ?? "",
              tagline: data.tagline ?? "",
              category: cat,
              icon: data.icon ?? deriveCategoryIcon(cat),
              stage: stg,
              stageEmoji: data.stageEmoji ?? deriveStageEmoji(stg),
              mrr: data.mrr ?? null,
              teamSize: data.teamSize ?? "",
              region,
              regionFlag: data.regionFlag ?? deriveRegionFlag(region),
              skills: data.skills ?? [],
              lookingFor: data.lookingFor ?? [],
              investorVisible: data.investorVisible ?? false,
            };
          });
          setProjects(fetched);
        }
      } catch {
        if (!cancelled) setProjects(DEMO_PROJECTS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const results = useMemo(() => {
    let list = projects;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.lookingFor.some(r => r.toLowerCase().includes(q))
      );
    }
    if (category !== "Alle") list = list.filter(p => p.category === category);
    if (stage !== "Alle") list = list.filter(p => p.stage === stage);
    if (investorOnly) list = list.filter(p => p.investorVisible);
    return list;
  }, [projects, search, category, stage, investorOnly]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-indigo-600">DADORI</Link>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <Link href={`/${locale}/login`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              Mitmachen
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900">Projekte & Startups entdecken</h1>
          <p className="mt-2 text-zinc-500">Finde Startups, Creator-Projekte und Teams die auf Talente warten.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="mb-4">
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Startup-Name, Kategorie oder gesuchte Skills …"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col gap-3">
              {/* Category */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      category === c
                        ? "bg-indigo-600 text-white"
                        : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Stage + investor toggle */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map(s => (
                    <button key={s} onClick={() => setStage(s)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        stage === s
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setInvestorOnly(!investorOnly)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    investorOnly
                      ? "bg-amber-500 text-white"
                      : "border border-zinc-200 bg-white text-zinc-500 hover:border-amber-300"
                  }`}
                >
                  💰 Nur investierbar
                </button>
              </div>
            </div>

            <p className="mb-4 text-sm text-zinc-500">
              <span className="font-semibold text-zinc-900">{results.length}</span> Projekte gefunden
            </p>

            {/* Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map(project => (
                <Link
                  key={project.id}
                  href={`/${locale}/project/${project.id}`}
                  className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-2xl">
                      {project.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors truncate">
                          {project.name}
                        </h3>
                        {project.investorVisible && (
                          <span className="shrink-0 rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                            💰
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 truncate">{project.category}</p>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 line-clamp-2 mb-3">{project.tagline}</p>

                  {/* Meta */}
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3 flex-wrap">
                    <span>{project.regionFlag}</span>
                    <span>·</span>
                    <span>{project.stageEmoji} {project.stage}</span>
                    {project.mrr && (
                      <>
                        <span>·</span>
                        <span>💰 {project.mrr}</span>
                      </>
                    )}
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1">
                    {project.skills.slice(0, 3).map(s => (
                      <span key={s} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                        {SKILL_LABELS[s] ?? s}
                      </span>
                    ))}
                  </div>

                  {/* Looking for */}
                  <div className="mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
                    Sucht: <span className="font-semibold text-zinc-700">{project.lookingFor.join(", ")}</span>
                  </div>
                </Link>
              ))}
            </div>

            {results.length === 0 && (
              <div className="mt-12 text-center">
                <span className="text-4xl">🔍</span>
                <p className="mt-3 font-semibold text-zinc-600">Keine Projekte gefunden</p>
                <p className="text-sm text-zinc-400">Versuch andere Filter oder weniger spezifische Begriffe.</p>
              </div>
            )}
          </>
        )}

        <div className="mt-12 rounded-2xl border border-indigo-100 bg-indigo-50 p-8 text-center">
          <h2 className="text-xl font-extrabold text-indigo-900">Du bist Talent?</h2>
          <p className="mt-2 text-sm text-indigo-700">Erstell dein DADORI-Profil und lass Startups zu dir kommen.</p>
          <Link
            href={`/${locale}/signup`}
            className="mt-4 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
          >
            Kostenlos registrieren →
          </Link>
        </div>
      </main>
    </div>
  );
}
