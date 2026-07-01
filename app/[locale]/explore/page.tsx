"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, getDoc, doc, query, orderBy, where } from "firebase/firestore";
import { Navbar } from "@/components/layout/navbar";
import { SkillPicker } from "@/components/SkillPicker";
import { useTranslations } from "next-intl";
import { useTaxonomy } from "@/lib/taxonomy";

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

type SearchType = "projects" | "startups" | "talent";

type Project = {
  id: string; name: string; tagline: string; category: string; icon: string;
  stage: string; stageEmoji: string; region: string; regionFlag: string;
  skills: string[]; lookingFor: string[]; investorVisible: boolean;
};

type Startup = {
  id: string; name: string; tagline: string; skills: string[];
};

type TalentItem = {
  id: string; name: string; bio: string; skills: string[];
};

export default function ExplorePage() {
  const t = useTranslations("explore");
  const tax = useTaxonomy();
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";

  const [type, setType] = useState<SearchType>("projects");
  const [skills, setSkills] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [talent, setTalent] = useState<TalentItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => { setLoggedIn(!!u); setAuthReady(true); }), []);

  // projects + startups: load once (public collections)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [projSnap, startupSnap] = await Promise.all([
          getDocs(query(collection(db, "projects"), orderBy("created_at", "desc"))),
          getDocs(query(collection(db, "startups"), where("is_discoverable", "==", true))),
        ]);
        if (cancelled) return;
        setProjects(projSnap.docs.map(d => {
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
            region,
            regionFlag: data.regionFlag ?? deriveRegionFlag(region),
            skills: data.skills ?? data.neededSkills ?? [],
            lookingFor: data.lookingFor ?? [],
            investorVisible: data.investorVisible ?? false,
          };
        }));
        setStartups(startupSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name ?? "",
            tagline: data.tagline ?? "",
            skills: data.neededSkills ?? [],
          };
        }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // talent: requires auth to read — only load once logged in
  useEffect(() => {
    if (!loggedIn) { setTalent([]); return; }
    let cancelled = false;
    (async () => {
      const snap = await getDocs(query(collection(db, "talent")));
      if (cancelled) return;
      const items = await Promise.all(snap.docs.map(async d => {
        const data = d.data();
        let name = "";
        try {
          const pp = await getDoc(doc(db, "publicProfiles", d.id));
          if (pp.exists()) name = (pp.data().full_name as string) ?? "";
        } catch { /* ignore */ }
        return {
          id: d.id,
          name: name || t("talent_neutral_name"),
          bio: data.bio ?? "",
          skills: data.skills ?? [],
        };
      }));
      if (!cancelled) setTalent(items);
    })();
    return () => { cancelled = true; };
  }, [loggedIn, t]);

  function skillMatch(itemSkills: string[]): number {
    return skills.filter(s => itemSkills.includes(s)).length;
  }

  const nameQ = search.toLowerCase().trim();

  const filteredProjects = useMemo(() => {
    let list = projects.map(p => ({ ...p, match: skillMatch(p.skills) }));
    if (skills.length > 0) list = list.filter(p => p.match > 0);
    if (nameQ) list = list.filter(p => p.name.toLowerCase().includes(nameQ) || p.tagline.toLowerCase().includes(nameQ));
    list.sort((a, b) => b.match - a.match);
    return list;
  }, [projects, skills, nameQ]);

  const filteredStartups = useMemo(() => {
    let list = startups.map(s => ({ ...s, match: skillMatch(s.skills) }));
    if (skills.length > 0) list = list.filter(s => s.match > 0);
    if (nameQ) list = list.filter(s => s.name.toLowerCase().includes(nameQ) || s.tagline.toLowerCase().includes(nameQ));
    list.sort((a, b) => b.match - a.match);
    return list;
  }, [startups, skills, nameQ]);

  const filteredTalent = useMemo(() => {
    let list = talent.map(tt => ({ ...tt, match: skillMatch(tt.skills) }));
    if (skills.length > 0) list = list.filter(tt => tt.match > 0);
    if (nameQ) list = list.filter(tt => tt.name.toLowerCase().includes(nameQ) || tt.bio.toLowerCase().includes(nameQ));
    list.sort((a, b) => b.match - a.match);
    return list;
  }, [talent, skills, nameQ]);

  const TYPES: { id: SearchType; label: string }[] = [
    { id: "projects", label: t("type_projects") },
    { id: "startups", label: t("type_startups") },
    { id: "talent", label: t("type_talent") },
  ];

  function SkillChips({ ids }: { ids: string[] }) {
    if (ids.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {[...ids].sort((a, b) => Number(skills.includes(b)) - Number(skills.includes(a))).slice(0, 3).map(s => {
          const hit = skills.includes(s);
          return (
            <span key={s} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${hit ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-600"}`}>
              {hit && "✓ "}{tax.skill(s)}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900">{t("heading")}</h1>
          <p className="mt-2 text-zinc-500">{t("subheading")}</p>
        </div>

        {/* Type segmented control */}
        <div className="mb-4 inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
          {TYPES.map(tp => (
            <button
              key={tp.id}
              onClick={() => setType(tp.id)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${type === tp.id ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-indigo-600"}`}
            >
              {tp.label}
            </button>
          ))}
        </div>

        {/* Skill multi-select */}
        <div className="mb-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <SkillPicker label={t("search_by_skills")} selected={skills} onChange={setSkills} />
        </div>

        {/* Name text search */}
        <div className="mb-6">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t("search_placeholder")}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : type === "talent" && authReady && !loggedIn ? (
          <div className="mt-16 text-center">
            <span className="text-5xl">🔒</span>
            <p className="mt-4 text-lg font-semibold text-zinc-700">{t("talent_requires_login")}</p>
            <Link href={`/${locale}/login`} className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
              {t("talent_cta_button")}
            </Link>
          </div>
        ) : type === "projects" ? (
          filteredProjects.length === 0 ? (
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
              {filteredProjects.map(project => (
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
                  <SkillChips ids={project.skills} />
                  {project.lookingFor.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
                      {t("looking_for_label")} <span className="font-semibold text-zinc-700">{project.lookingFor.join(", ")}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )
        ) : type === "startups" ? (
          filteredStartups.length === 0 ? (
            <div className="mt-16 text-center">
              <span className="text-5xl">🏢</span>
              <p className="mt-4 text-lg font-semibold text-zinc-700">{t("empty_startups")}</p>
              <p className="mt-2 text-sm text-zinc-400">{t("empty_desc")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStartups.map(startup => (
                <Link key={startup.id} href={`/${locale}/company/${startup.id}`}
                  className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  <h3 className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors truncate mb-1">{startup.name}</h3>
                  <p className="text-sm text-zinc-600 line-clamp-2 mb-3">{startup.tagline}</p>
                  <SkillChips ids={startup.skills} />
                </Link>
              ))}
            </div>
          )
        ) : (
          filteredTalent.length === 0 ? (
            <div className="mt-16 text-center">
              <span className="text-5xl">🎯</span>
              <p className="mt-4 text-lg font-semibold text-zinc-700">{t("empty_talent")}</p>
              <p className="mt-2 text-sm text-zinc-400">{t("empty_desc")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTalent.map(person => {
                const initials = person.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
                return (
                  <Link key={person.id} href={`/${locale}/user/${person.id}`}
                    className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">
                        {initials}
                      </span>
                      <h3 className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors truncate min-w-0 mt-1">{person.name}</h3>
                    </div>
                    {person.bio && <p className="text-sm text-zinc-600 line-clamp-2 mb-3">{person.bio}</p>}
                    <SkillChips ids={person.skills} />
                  </Link>
                );
              })}
            </div>
          )
        )}

        {!loggedIn && (
          <div className="mt-12 rounded-2xl border border-indigo-100 bg-indigo-50 p-8 text-center">
            <h2 className="text-xl font-extrabold text-indigo-900">{t("talent_cta_title")}</h2>
            <p className="mt-2 text-sm text-indigo-700">{t("talent_cta_desc")}</p>
            <Link href={`/${locale}/signup`} className="mt-4 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
              {t("talent_cta_button")}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
