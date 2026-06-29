"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { INVESTOR_FOCUS, CHECK_SIZES } from "@/lib/funding";

const DEMO_INVESTORS = [
  {
    id: "vc-berlin", name: "Thomas B.", firm: "VC Berlin Fund", avatar: "💼",
    role: "General Partner", focus: ["saas", "marketplace", "deep_tech"],
    stages: ["pre_seed", "seed"], checkSize: "pre_seed",
    region: "de", regionFlag: "🇩🇪", dealsPerYear: "4–6",
    bio: "Ex-Rocket Internet. 30+ B2B SaaS Investments in DACH & CEE.",
    openToIntros: true,
  },
  {
    id: "angel-marie", name: "Marie S.", firm: "Independent Angel", avatar: "👼",
    role: "Angel Investor", focus: ["consumer", "creator", "edtech"],
    stages: ["idea", "pre_revenue", "pre_seed"], checkSize: "angel",
    region: "at", regionFlag: "🇦🇹", dealsPerYear: "6–10",
    bio: "Exited founder (EdTech). Hilft aktiv bei Product, GTM & Fundraising.",
    openToIntros: true,
  },
  {
    id: "klimaventures", name: "KlimaVentures", firm: "KlimaVentures GmbH", avatar: "🌍",
    role: "Venture Fund", focus: ["climate", "deep_tech"],
    stages: ["seed", "series_a"], checkSize: "seed",
    region: "de", regionFlag: "🇩🇪", dealsPerYear: "3–5",
    bio: "Impact-first Fonds für Climate Tech und nachhaltige Technologien.",
    openToIntros: true,
  },
  {
    id: "health-capital", name: "Sarah M.", firm: "Health Capital Partners", avatar: "🏥",
    role: "Partner", focus: ["health", "deep_tech"],
    stages: ["seed", "series_a"], checkSize: "seed",
    region: "ch", regionFlag: "🇨🇭", dealsPerYear: "4–6",
    bio: "MD + MBA. Investiert in Digital Health, MedTech und AI-driven diagnostics.",
    openToIntros: false,
  },
  {
    id: "creator-fund", name: "CreatorFund Berlin", firm: "CreatorFund", avatar: "🎨",
    role: "Micro-VC", focus: ["creator", "consumer", "marketplace"],
    stages: ["idea", "pre_seed", "seed"], checkSize: "angel",
    region: "de", regionFlag: "🇩🇪", dealsPerYear: "10–15",
    bio: "Dedicated fund für Creator Economy, Social Commerce & Content-Startups.",
    openToIntros: true,
  },
  {
    id: "eastvc", name: "East Ventures EU", firm: "East Ventures", avatar: "🌏",
    role: "Regional Fund", focus: ["saas", "fintech", "marketplace"],
    stages: ["seed", "series_a", "series_b_plus"], checkSize: "series_a",
    region: "eu", regionFlag: "🇪🇺", dealsPerYear: "8–12",
    bio: "Pan-European fund mit Fokus auf scalable tech aus DACH, Nordics & CEE.",
    openToIntros: true,
  },
];

const STAGE_LABELS: Record<string, string> = {
  idea: "Idee 💡", pre_revenue: "Pre-Revenue 🚀", revenue: "Revenue 💰",
  pre_seed: "Pre-Seed 🌱", seed: "Seed 🌿", series_a: "Series A 📈",
  series_b_plus: "Series B+ 🏦", bootstrapped: "Bootstrapped 💪",
};

export default function DiscoverInvestorsPage() {
  const [focusFilter, setFocusFilter] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState("");
  const [checkFilter, setCheckFilter] = useState("");
  const [search, setSearch] = useState("");
  const [requested, setRequested] = useState<Set<string>>(new Set());

  function toggleFocus(id: string) {
    setFocusFilter(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }

  const results = useMemo(() => {
    let list = DEMO_INVESTORS;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.firm.toLowerCase().includes(q) ||
        i.bio.toLowerCase().includes(q)
      );
    }
    if (focusFilter.length > 0) {
      list = list.filter(i => focusFilter.some(f => i.focus.includes(f)));
    }
    if (stageFilter) {
      list = list.filter(i => i.stages.includes(stageFilter));
    }
    if (checkFilter) {
      list = list.filter(i => i.checkSize === checkFilter);
    }
    return list;
  }, [search, focusFilter, stageFilter, checkFilter]);

  function requestIntro(id: string) {
    setRequested(prev => new Set([...prev, id]));
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href="/startup" className="text-sm text-zinc-400 hover:text-zinc-600">← Dashboard</Link>
          <h1 className="text-lg font-semibold text-zinc-900">Investoren entdecken</h1>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 ml-auto">
            Pro
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">

        {/* Info banner */}
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-amber-900">DADORI Intro — wie es funktioniert</p>
            <p className="text-sm text-amber-700">Du siehst Investoren die zu eurer Phase & Kategorie passen. Anfrage senden → DADORI prüft den Match → beide Seiten stimmen zu → Intro.</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Investor, Firma oder Fokus suchen …"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3">
          {/* Focus */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Fokus</p>
            <div className="flex flex-wrap gap-1.5">
              {INVESTOR_FOCUS.map(f => (
                <button key={f.id} onClick={() => toggleFocus(f.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    focusFilter.includes(f.id)
                      ? "bg-indigo-600 text-white"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              {focusFilter.length > 0 && (
                <button onClick={() => setFocusFilter([])} className="text-xs text-zinc-400 hover:text-zinc-600 px-2">
                  ✕ Reset
                </button>
              )}
            </div>
          </div>

          {/* Stage + Check Size */}
          <div className="flex gap-6 flex-wrap">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Eure Phase</p>
              <div className="flex flex-wrap gap-1.5">
                {["idea","pre_revenue","pre_seed","seed","series_a","series_b_plus"].map(s => (
                  <button key={s} onClick={() => setStageFilter(stageFilter === s ? "" : s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      stageFilter === s
                        ? "bg-indigo-600 text-white"
                        : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300"
                    }`}
                  >
                    {STAGE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Check-Size</p>
              <div className="flex flex-wrap gap-1.5">
                {CHECK_SIZES.map(c => (
                  <button key={c.id} onClick={() => setCheckFilter(checkFilter === c.id ? "" : c.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      checkFilter === c.id
                        ? "bg-indigo-600 text-white"
                        : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mb-4 text-sm text-zinc-500">
          <span className="font-semibold text-zinc-900">{results.length}</span> Investoren gefunden
        </p>

        {/* Results */}
        <div className="flex flex-col gap-4">
          {results.map(investor => (
            <div key={investor.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-2xl">
                  {investor.avatar}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/en/investor/${investor.id}`}
                          className="font-bold text-zinc-900 hover:text-indigo-600 transition-colors"
                        >
                          {investor.name}
                        </Link>
                        <span className="text-sm text-zinc-500">{investor.firm}</span>
                        <span className="rounded-full bg-zinc-50 border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500">
                          {investor.regionFlag} {investor.role}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">{investor.bio}</p>
                    </div>
                    <div className="shrink-0">
                      {requested.has(investor.id) ? (
                        <span className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-xs font-semibold text-green-700">
                          ✓ Intro angefragt
                        </span>
                      ) : investor.openToIntros ? (
                        <button
                          onClick={() => requestIntro(investor.id)}
                          className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
                        >
                          🤝 Intro anfragen
                        </button>
                      ) : (
                        <span className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-2 text-xs text-zinc-400">
                          Nicht verfügbar
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {investor.focus.map(fid => {
                      const f = INVESTOR_FOCUS.find(x => x.id === fid);
                      return f ? (
                        <span key={fid} className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
                          {f.label}
                        </span>
                      ) : null;
                    })}
                    {investor.stages.map(s => (
                      <span key={s} className="rounded-full bg-zinc-50 border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500">
                        {STAGE_LABELS[s]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
