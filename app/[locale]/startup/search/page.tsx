"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSkillLabel } from "@/lib/skills";
import { REGIONS, LANGUAGES } from "@/lib/regions";
import { db } from "@/lib/firebase/client";
import { collection, getDocs, query } from "firebase/firestore";
import { Navbar } from "@/components/layout/navbar";
import { useTranslations } from "next-intl";

type Talent = {
  id: string;
  name: string;
  bio: string;
  skills: string[];
  experience: string;
  availability: string;
  remote: boolean;
  regions: string[];
  languages: string[];
};

const EXPERIENCE_LABEL: Record<string, string> = {
  beginner: "exp_beginner", intermediate: "exp_intermediate",
  experienced: "exp_experienced", expert: "exp_expert", junior: "exp_junior",
};
const AVAILABILITY_LABEL: Record<string, string> = {
  immediately: "avail_immediately", part_time: "avail_part_time",
  project_based: "avail_project_based", not_available: "avail_not_available",
};
const AVAIL_DOT: Record<string, string> = {
  immediately: "bg-green-400",
  part_time: "bg-amber-400",
  project_based: "bg-amber-400",
  not_available: "bg-zinc-300",
};

export default function TalentSearchPage() {
  const t = useTranslations("startup_pages.search");
  const { locale } = useParams<{ locale: string }>();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [langFilter, setLangFilter] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "talent")));
        if (!cancelled) {
          setTalents(snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name ?? "",
              bio: data.bio ?? "",
              skills: data.skills ?? [],
              experience: data.experience ?? "",
              availability: data.availability ?? "",
              remote: data.remote ?? false,
              regions: data.regions ?? [],
              languages: data.languages ?? [],
            };
          }));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function toggleLang(id: string) {
    setLangFilter(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  }

  const results = useMemo(() => {
    let list = talents;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.bio.toLowerCase().includes(q) ||
        t.skills.some(s => getSkillLabel(s).toLowerCase().includes(q))
      );
    }
    if (remoteOnly) list = list.filter(t => t.remote);
    if (langFilter.length > 0) list = list.filter(t => langFilter.some(l => t.languages.includes(l)));
    return list;
  }, [talents, search, remoteOnly, langFilter]);

  // Only show languages that actually appear in the talent pool
  const availableLangs = useMemo(() => {
    const ids = new Set(talents.flatMap(t => t.languages));
    return LANGUAGES.filter(l => ids.has(l.id));
  }, [talents]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Filter-Bar */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t("search_placeholder")}
            className="flex-1 min-w-[200px] rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
          <button
            onClick={() => setRemoteOnly(!remoteOnly)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${remoteOnly ? "bg-indigo-600 text-white" : "border border-zinc-200 bg-white text-zinc-500 hover:border-indigo-300"}`}
          >
            {t("remote_filter")}
          </button>
        </div>

        {/* Sprach-Filter */}
        {availableLangs.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {availableLangs.map(l => (
              <button key={l.id} onClick={() => toggleLang(l.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  langFilter.includes(l.id)
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : results.length === 0 ? (
          <div className="mt-16 text-center">
            <span className="text-5xl">🎯</span>
            <p className="mt-4 text-lg font-semibold text-zinc-700">
              {talents.length === 0 ? t("empty_no_talents") : t("empty_no_results")}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              {talents.length === 0
                ? t("empty_no_talents_desc")
                : t("empty_no_results_desc")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {results.map(talent => {
              const initials = talent.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
              const talentRegions = talent.regions
                .map(id => REGIONS.find(r => r.id === id))
                .filter(Boolean) as typeof REGIONS;
              const talentLangs = talent.languages
                .map(id => LANGUAGES.find(l => l.id === id))
                .filter(Boolean) as typeof LANGUAGES;

              return (
                <Link key={talent.id} href={`/${locale}/user/${talent.id}`}
                  className="block rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">
                      {initials}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-zinc-900">{talent.name}</p>
                        {talent.availability && AVAILABILITY_LABEL[talent.availability] && (
                          <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <span className={`h-1.5 w-1.5 rounded-full ${AVAIL_DOT[talent.availability] ?? "bg-zinc-300"}`} />
                            {t(AVAILABILITY_LABEL[talent.availability])}
                          </span>
                        )}
                        {talent.remote && (
                          <span className="text-xs text-zinc-400">{t("remote_badge")}</span>
                        )}
                      </div>
                      {talent.experience && EXPERIENCE_LABEL[talent.experience] && (
                        <p className="mt-0.5 text-xs text-zinc-500">{t(EXPERIENCE_LABEL[talent.experience])}</p>
                      )}
                      {talent.bio && (
                        <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{talent.bio}</p>
                      )}

                      {/* Skills */}
                      {talent.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {talent.skills.slice(0, 6).map(s => (
                            <span key={s} className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                              {getSkillLabel(s)}
                            </span>
                          ))}
                          {talent.skills.length > 6 && (
                            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500">+{talent.skills.length - 6}</span>
                          )}
                        </div>
                      )}

                      {/* Sprachen + Regionen */}
                      {(talentLangs.length > 0 || talentRegions.length > 0) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {talentLangs.map(l => (
                            <span key={l.id} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500">{l.label}</span>
                          ))}
                          {talentRegions.map(r => (
                            <span key={r.id} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500">{r.flag} {r.label}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-indigo-600 font-semibold mt-1">{t("profile_link")}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
