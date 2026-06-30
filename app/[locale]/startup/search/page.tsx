"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SKILL_CATEGORIES, getSkillLabel, ALL_SKILLS } from "@/lib/skills";
import { db } from "@/lib/firebase/client";
import { collection, getDocs, query } from "firebase/firestore";

type Talent = {
  id: string; name: string; title: string; bio: string;
  skills: string[]; experience: string; availability: string;
  remote: boolean; avatar: string; color: string;
};

const EXPERIENCE_LABEL: Record<string, string> = {
  junior: "Junior", experienced: "Erfahren", expert: "Expert / Senior",
};
const AVAILABILITY_LABEL: Record<string, string> = {
  immediately: "Sofort verfügbar", part_time: "Teilzeit", project_based: "Projektbasiert",
};

export default function TalentSearchPage() {
  const { locale } = useParams<{ locale: string }>();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "talents")));
        if (!cancelled) {
          const fetched: Talent[] = snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name ?? "",
              title: data.title ?? "",
              bio: data.bio ?? "",
              skills: data.skills ?? [],
              experience: data.experience ?? "",
              availability: data.availability ?? "",
              remote: data.remote ?? false,
              avatar: data.avatar ?? data.name?.slice(0, 2).toUpperCase() ?? "?",
              color: data.color ?? "bg-zinc-400",
            };
          });
          setTalents(fetched);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function toggleSkill(id: string) {
    setSkillFilter(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  const results = useMemo(() => {
    let list = talents;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.bio.toLowerCase().includes(q));
    }
    if (skillFilter.length > 0) list = list.filter(t => skillFilter.some(s => t.skills.includes(s)));
    if (remoteOnly) list = list.filter(t => t.remote);
    return list;
  }, [talents, search, skillFilter, remoteOnly]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href={`/${locale}/startup`} className="text-sm text-zinc-400 hover:text-zinc-600">← Dashboard</Link>
          <h1 className="text-lg font-semibold text-zinc-900">Talent-Suche</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-4 flex gap-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Name, Rolle oder Skills …"
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
          <button onClick={() => setRemoteOnly(!remoteOnly)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${remoteOnly ? "bg-indigo-600 text-white" : "border border-zinc-200 bg-white text-zinc-500 hover:border-indigo-300"}`}
          >
            🌍 Remote
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-16 text-center">
            <span className="text-5xl">🎯</span>
            <p className="mt-4 text-lg font-semibold text-zinc-700">Noch keine Talente registriert</p>
            <p className="mt-2 text-sm text-zinc-400">Talente erscheinen hier sobald sie sich auf DADORI registrieren.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {results.map(talent => (
              <div key={talent.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold ${talent.color}`}>
                    {talent.avatar}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-900">{talent.name}</p>
                    <p className="text-sm text-zinc-500">{talent.title}</p>
                    <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{talent.bio}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {talent.skills.slice(0, 5).map(s => (
                        <span key={s} className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                          {getSkillLabel(s)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-zinc-400">
                      {talent.experience && <span>{EXPERIENCE_LABEL[talent.experience] ?? talent.experience}</span>}
                      {talent.availability && <><span>·</span><span>{AVAILABILITY_LABEL[talent.availability] ?? talent.availability}</span></>}
                      {talent.remote && <><span>·</span><span>🌍 Remote</span></>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
