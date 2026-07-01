"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LangSwitcher } from "@/components/LangSwitcher";
import { db } from "@/lib/firebase/client";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Navbar } from "@/components/layout/navbar";
import { useTranslations } from "next-intl";

function deriveCategoryIcon(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("creator") || c.includes("youtube") || c.includes("streaming")) return "🎬";
  if (c.includes("music") || c.includes("musik") || c.includes("entertainment")) return "🎵";
  if (c.includes("gaming") || c.includes("game")) return "🎮";
  if (c.includes("app") || c.includes("mobile")) return "📱";
  if (c.includes("ecommerce") || c.includes("shop")) return "🛒";
  if (c.includes("education") || c.includes("edtech")) return "📚";
  return "💡";
}

function deriveRegionFlag(region: string): string {
  const map: Record<string, string> = { de: "🇩🇪", at: "🇦🇹", ch: "🇨🇭", us: "🇺🇸", uk: "🇬🇧" };
  return map[region.toLowerCase()] ?? "🌐";
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

const SKILL_LABELS: Record<string, string> = {
  fullstack: "Full-Stack", ai_ml: "AI/ML", marketing: "Marketing",
  video_editing: "Video Editing", short_form: "Short-Form", davinci: "DaVinci Resolve",
  social_media: "Social Media", after_effects: "After Effects", mobile: "Mobile Dev",
  ux_design: "UX Design", data_science: "Data Science", motion_design: "Motion Design",
};

export default function ExplorePage() {
  const t = useTranslations("explore");
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [investorOnly, setInvestorOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "projects"), orderBy("created_at", "desc")));
        if (cancelled) return;
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
        if (!cancelled) setProjects(fetched);
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
        p.category.toLowerCase().includes(q)
      );
    }
    if (investorOnly) list = list.filter(p => p.investorVisible);
    return list;
  }, [projects, search, investorOnly]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900">{t("heading")}</h1>
          <p className="mt-2 text-zinc-500">{t("subheading")}</p>
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
            <div className="mb-4 flex gap-3">
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t("search_placeholder")}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
              <button
                onClick={() => setInvestorOnly(!investorOnly)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${investorOnly ? "bg-amber-500 text-white" : "border border-zinc-200 bg-white text-zinc-500 hover:border-amber-300"}`}
              >
                {t("filter_investable")}
              </button>
            </div>

            {results.length === 0 ? (
              <div className="mt-16 text-center">
                <span className="text-5xl">🚀</span>
                <p className="mt-4 text-lg font-semibold text-zinc-700">{t("empty_title")}</p>
                <p className="mt-2 text-sm text-zinc-400">{t("empty_desc")}</p>
                <Link href={`/${locale}/signup`} className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
                  {t("empty_cta")}
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map(project => (
                  <Link key={project.id} href={`/${locale}/project/${project.id}`}
                    className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-2xl">
                        {project.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors truncate">{project.name}</h3>
                          {project.investorVisible && (
                            <span className="shrink-0 rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">💰</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 truncate">{project.category}</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-600 line-clamp-2 mb-3">{project.tagline}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
                      <span>{project.regionFlag}</span>
                      <span>·</span>
                      <span>{project.stageEmoji} {project.stage}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {project.skills.slice(0, 3).map(s => (
                        <span key={s} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                          {SKILL_LABELS[s] ?? s}
                        </span>
                      ))}
                    </div>
                    {project.lookingFor.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
                        {t("looking_for_label")} <span className="font-semibold text-zinc-700">{project.lookingFor.join(", ")}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-12 rounded-2xl border border-indigo-100 bg-indigo-50 p-8 text-center">
          <h2 className="text-xl font-extrabold text-indigo-900">{t("talent_cta_title")}</h2>
          <p className="mt-2 text-sm text-indigo-700">{t("talent_cta_desc")}</p>
          <Link href={`/${locale}/signup`} className="mt-4 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
            {t("talent_cta_button")}
          </Link>
        </div>
      </main>
    </div>
  );
}
