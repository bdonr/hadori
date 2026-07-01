"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSkillLabel } from "@/lib/skills";
import { REGIONS, getRegion, regionMatches } from "@/lib/regions";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { Navbar } from "@/components/layout/navbar";

const COMP_LABEL_KEY: Record<string, string> = {
  revenue_share: "comp_revenue_share",
  equity: "comp_equity",
  cash: "comp_cash",
  exposure: "comp_exposure",
};

interface Role {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  description: string;
  compensation: string[];
  commitment: string;
  remote: boolean;
  skills: string[];
  region: string;
  language: string;
  created_at: unknown;
  posterName?: string;
}

function matchScore(roleSkills: string[], mySkills: string[]): number {
  if (roleSkills.length === 0) return 0;
  return Math.round(
    (roleSkills.filter(s => mySkills.includes(s)).length / roleSkills.length) * 100
  );
}

const FILTER_OPTIONS = [
  { id: "all", labelKey: "filter_all" },
  { id: "match", labelKey: "filter_best_matches" },
  { id: "remote", labelKey: "filter_remote" },
  { id: "freelance", labelKey: "filter_freelance" },
  { id: "equity", labelKey: "filter_equity" },
];

export default function TalentJobsPage() {
  const t = useTranslations("talent_pages.jobs");
  const params = useParams();
  const locale = (params.locale as string) ?? "en";
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [myRegions, setMyRegions] = useState<string[]>(["dach", "de", "at", "ch", "worldwide"]);
  const [filter, setFilter] = useState("match");
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user skills & roles from Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, "talent", user.uid));
          if (snap.exists()) {
            const d = snap.data() as Record<string, unknown>;
            if (Array.isArray(d.skills) && (d.skills as string[]).length > 0)
              setMySkills(d.skills as string[]);
            if (Array.isArray(d.regions) && (d.regions as string[]).length > 0)
              setMyRegions(d.regions as string[]);
          }
        } catch { /* ignore */ }
      }

      // Load roles (regardless of auth state)
      try {
        const rolesSnap = await getDocs(
          query(collection(db, "roles"), orderBy("created_at", "desc"))
        );

        // Collect unique ownerIds
        const ownerIds = [...new Set(rolesSnap.docs.map(d => d.data().ownerId as string).filter(Boolean))];

        // Batch-load profiles
        const profileMap: Record<string, string> = {};
        await Promise.all(
          ownerIds.map(async (ownerId) => {
            try {
              const profileSnap = await getDoc(doc(db, "profiles", ownerId));
              if (profileSnap.exists()) {
                const name = profileSnap.data().name as string | undefined;
                if (name) profileMap[ownerId] = name;
              }
            } catch { /* ignore */ }
          })
        );

        const loaded: Role[] = rolesSnap.docs.map(d => ({
          id: d.id,
          ownerId: d.data().ownerId ?? "",
          title: d.data().title ?? "",
          category: d.data().category ?? "",
          description: d.data().description ?? "",
          compensation: Array.isArray(d.data().compensation) ? d.data().compensation : [],
          commitment: d.data().commitment ?? "",
          remote: Boolean(d.data().remote),
          skills: Array.isArray(d.data().skills) ? d.data().skills : [],
          region: d.data().region ?? "",
          language: d.data().language ?? "",
          created_at: d.data().created_at,
          posterName: profileMap[d.data().ownerId] ?? undefined,
        }));

        setRoles(loaded);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const results = useMemo(() => {
    let list = roles.map(r => ({ ...r, match: matchScore(r.skills, mySkills) }));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.posterName ?? "").toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.skills.some(s => getSkillLabel(s).toLowerCase().includes(q))
      );
    }

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
  }, [filter, search, regionFilter, mySkills, myRegions, roles]);

  const topMatch = results.length > 0 ? results[0].match : 0;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-8">

        {/* Skill context bar */}
        <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">{t("your_skills")}</span>
          {mySkills.length === 0 ? (
            <span className="text-xs text-indigo-400 italic">{t("no_skills_yet")}</span>
          ) : mySkills.map(id => (
            <span key={id} className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white">
              {getSkillLabel(id)}
            </span>
          ))}
          <Link href={`/${locale}/talent/skills`} className="ml-auto text-xs text-indigo-500 hover:underline shrink-0">
            {t("edit")}
          </Link>
        </div>

        {/* Search + Filter */}
        <div className="mb-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("search_placeholder")}
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
                {t(f.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Region filter */}
        <div className="mb-5 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{t("region_label")}</span>
          {[
            { id: "all", flag: "🌍", label: t("region_all") },
            { id: "my_regions", flag: "⭐", label: t("region_mine") },
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
        {!loading && (
          <p className="mb-4 text-sm text-zinc-500">
            <span className="font-semibold text-zinc-900">{results.length}</span> {t("roles_found")}
            {filter === "match" && topMatch > 0 && (
              <span className="ml-2 text-indigo-600">{t("best_match", { n: topMatch })}</span>
            )}
          </p>
        )}

        {/* Role cards */}
        {loading ? (
          <div className="py-20 text-center text-zinc-400">
            <p className="text-sm">{t("loading")}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 text-center text-zinc-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-zinc-600">
              {roles.length === 0 ? t("empty_no_roles") : t("empty_no_hits")}
            </p>
            <p className="mt-1 text-sm">
              {roles.length === 0
                ? t("empty_no_roles_hint")
                : t("empty_no_hits_hint")}
            </p>
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

function RoleCard({
  role,
  mySkills,
  locale,
}: {
  role: Role & { match: number };
  mySkills: string[];
  locale: string;
}) {
  const t = useTranslations("talent_pages.jobs");
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
          <Link href={`/${locale}/user/${role.ownerId}`} className="text-2xl hover:scale-110 transition-transform shrink-0">
            🚀
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-zinc-900">{role.title}</span>
              {role.match > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${matchColor}`}>
                  {t("match_badge", { n: role.match })}
                </span>
              )}
            </div>
            {role.posterName && (
              <Link
                href={`/${locale}/user/${role.ownerId}`}
                className="text-xs text-zinc-500 mt-0.5 hover:text-indigo-500 transition-colors"
              >
                {role.posterName}
                {role.category ? ` · ${role.category}` : ""}
              </Link>
            )}
          </div>
        </div>
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
        {role.remote && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">{t("remote")}</span>}
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
            {COMP_LABEL_KEY[c] ? t(COMP_LABEL_KEY[c]) : c}
          </span>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Link
            href={`/${locale}/user/${role.ownerId}`}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            {t("details")}
          </Link>
          {applied ? (
            <span className="rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              {t("requested")}
            </span>
          ) : (
            <button
              onClick={() => setApplied(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              {t("express_interest")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
