"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getSkillLabel } from "@/lib/skills";
import { LangSwitcher } from "@/components/LangSwitcher";

const CATEGORY_ICON: Record<string, string> = {
  creator: "🎬", music: "🎵", gaming: "🎮", app: "📱", ecommerce: "🛒",
};
const STAGE_EMOJI: Record<string, string> = {
  idea: "💡", pre_seed: "🌱", seed: "🌿", series_a: "📈",
};
const REGION_FLAG: Record<string, string> = {
  de: "🇩🇪", at: "🇦🇹", ch: "🇨🇭", us: "🇺🇸", worldwide: "🌍",
};

type Project = {
  id: string; name: string; tagline: string; description: string;
  category: string; icon: string; stage: string; stageEmoji: string;
  mrr: string; teamSize: string; region: string; regionFlag: string;
  website?: string; foundedYear: number;
  founders: { name: string; role: string; avatar: string }[];
  neededSkills: string[];
  lookingFor: string[];
  investorVisible: boolean; fundingGoal?: string;
  type?: "project" | "startup";
  stealth?: boolean; stealthProblems?: string[]; stealthCategory?: string;
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [interested, setInterested] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "projects", id));
        if (!cancelled) {
          if (snap.exists()) {
            const d = snap.data();
            setProject({
              id: snap.id,
              name: d.name ?? "",
              tagline: d.tagline ?? "",
              description: d.description ?? "",
              category: d.category ?? "",
              icon: CATEGORY_ICON[d.category] ?? "💡",
              stage: d.stage ?? "",
              stageEmoji: STAGE_EMOJI[d.stage] ?? "🚀",
              mrr: d.mrr ?? "",
              teamSize: d.teamSize ?? "",
              region: d.region ?? "",
              regionFlag: REGION_FLAG[d.region] ?? "🌐",
              foundedYear: d.foundedYear ?? new Date().getFullYear(),
              founders: d.founders ?? [],
              neededSkills: d.skills ?? [],
              lookingFor: d.lookingFor ?? [],
              investorVisible: d.investorVisible ?? false,
              fundingGoal: d.fundingGoal,
              type: d.type ?? "project",
              stealth: d.stealth ?? false,
              stealthProblems: d.stealthProblems ?? [],
              stealthCategory: d.category ?? "",
            });
          } else {
            setNotFound(true);
          }
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-400 text-sm animate-pulse">Projekt wird geladen…</div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4">
        <span className="text-5xl">🔍</span>
        <h1 className="text-xl font-bold text-zinc-900">Projekt nicht gefunden</h1>
        <p className="text-sm text-zinc-500">Dieses Projekt existiert nicht oder wurde entfernt.</p>
        <Link href="/en/explore" className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
          Alle Projekte →
        </Link>
      </div>
    );
  }

  if (project.stealth) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <header className="border-b border-zinc-200 bg-white px-6 py-4 sticky top-0 z-10">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <Link href="/" className="text-xl font-extrabold text-indigo-600">DADORI</Link>
            <div className="flex items-center gap-3">
              <LangSwitcher />
              <Link href="/en/login" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Mitmachen</Link>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-6 py-16 text-center">
          <span className="text-5xl">🥷</span>
          <h1 className="mt-4 text-2xl font-extrabold text-zinc-900">Stealth-Projekt</h1>
          <p className="mt-3 text-zinc-500 text-lg">Dieses Projekt ist im Stealth-Modus.</p>
          <div className="mt-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-left">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="rounded-full bg-indigo-600 text-white px-3 py-1 text-sm font-semibold">{project.stealthCategory}</span>
              {project.stealthProblems?.map(p => (
                <span key={p} className="rounded-full bg-white border border-indigo-200 text-indigo-700 px-3 py-1 text-sm">{p}</span>
              ))}
            </div>
          </div>
          <div className="mt-6">
            {interested ? (
              <span className="rounded-xl bg-green-50 border border-green-200 px-6 py-3 text-sm font-semibold text-green-700">✓ Interesse bekundet</span>
            ) : (
              <button onClick={() => setInterested(true)} className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
                Interesse bekunden →
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-indigo-600">DADORI</Link>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <Link href="/en/login" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Mitmachen</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm mb-6">
          <div className="flex items-start gap-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-4xl border border-indigo-100">{project.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-zinc-900">{project.name}</h1>
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-0.5 text-xs font-semibold text-indigo-700">{project.category}</span>
                <span className="rounded-full bg-zinc-50 border border-zinc-200 px-3 py-0.5 text-xs font-medium text-zinc-500">{project.regionFlag} {project.region}</span>
              </div>
              <p className="mt-1 text-base text-zinc-600">{project.tagline}</p>
              <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-zinc-400">
                <span>Gegründet {project.foundedYear}</span>
                {project.teamSize && <><span>·</span><span>👥 Team: {project.teamSize}</span></>}
                <span>·</span>
                <span>{project.stageEmoji} {project.stage}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3 flex-wrap">
            {interested ? (
              <span className="rounded-xl bg-green-50 border border-green-200 px-6 py-3 text-sm font-semibold text-green-700">✓ Anfrage gesendet</span>
            ) : (
              <button onClick={() => setInterested(true)} className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
                Interesse bekunden
              </button>
            )}
            {project.website && (
              <a href={project.website} target="_blank" rel="noopener noreferrer"
                className="rounded-xl border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-600 hover:border-indigo-300 transition-colors">
                🌐 Website
              </a>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {project.description && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 font-bold text-zinc-900">Über das Projekt</h2>
                <p className="text-sm leading-relaxed text-zinc-600">{project.description}</p>
              </div>
            )}
            {project.founders.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-bold text-zinc-900">Team</h2>
                <div className="flex flex-col gap-3">
                  {project.founders.map(f => (
                    <div key={f.name} className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-xl">{f.avatar}</span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{f.name}</p>
                        <p className="text-xs text-zinc-500">{f.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {project.lookingFor.length > 0 && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
                <h2 className="mb-3 font-bold text-indigo-900">Wir suchen</h2>
                <div className="flex flex-col gap-2 mb-4">
                  {project.lookingFor.map(role => (
                    <div key={role} className="flex items-center gap-2">
                      <span className="text-indigo-400">→</span>
                      <span className="text-sm font-semibold text-indigo-800">{role}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {project.neededSkills.map(id => (
                    <span key={id} className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white">{getSkillLabel(id)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Phase</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{project.stageEmoji}</span>
                <span className="font-bold text-zinc-900">{project.stage}</span>
              </div>
              {project.fundingGoal && (
                <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
                  <p className="text-xs font-semibold text-green-700">🎯 Fundraising-Ziel</p>
                  <p className="text-sm font-bold text-green-900 mt-0.5">{project.fundingGoal}</p>
                </div>
              )}
            </div>
            {project.investorVisible && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Investor-Status</p>
                <p className="text-sm font-semibold text-amber-900">🟢 Offen für Investoren</p>
                <Link href="/en/signup" className="mt-3 block w-full rounded-lg bg-amber-500 py-2 text-center text-xs font-bold text-white hover:bg-amber-600 transition-colors">
                  Als Investor Kontakt aufnehmen
                </Link>
              </div>
            )}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Teilen</p>
              <button onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="w-full rounded-lg border border-zinc-200 py-2 text-xs font-semibold text-zinc-600 hover:border-indigo-300 transition-colors">
                🔗 Link kopieren
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-400">
          Auf DADORI entdecken:{" "}
          <Link href="/en/explore" className="text-indigo-600 hover:underline">Alle Projekte & Startups →</Link>
        </p>
      </main>
    </div>
  );
}
