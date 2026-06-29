"use client";

import Link from "next/link";
import { useState } from "react";
import { LangSwitcher } from "@/components/LangSwitcher";

const DEMO_INVESTORS: Record<string, {
  id: string; name: string; firm: string; role: string; avatar: string;
  bio: string; focus: string[]; stages: string[]; checkSize: string;
  region: string; regionFlag: string; portfolio: { name: string; icon: string; stage: string }[];
  linkedIn?: string; website?: string; openToIntros: boolean; dealsPerYear: string;
}> = {
  "vc-berlin": {
    id: "vc-berlin", name: "Thomas B.", firm: "VC Berlin Fund", role: "General Partner",
    avatar: "💼", bio: "Serial founder turned investor. Invested in 30+ B2B SaaS companies across DACH & CEE. Ex-Rocket Internet. Looking for pre-seed to seed stage SaaS with strong founding teams.",
    focus: ["B2B SaaS", "Marketplace", "Deep Tech / AI"],
    stages: ["Pre-Seed 🌱", "Seed 🌿"],
    checkSize: "€100k – €500k (Pre-Seed)",
    region: "Deutschland", regionFlag: "🇩🇪",
    portfolio: [
      { name: "PayFlow", icon: "💳", stage: "Seed" },
      { name: "LogiHub", icon: "📦", stage: "Series A" },
      { name: "TalentOS", icon: "👥", stage: "Seed" },
    ],
    website: "https://vcberlin.fund", openToIntros: true, dealsPerYear: "4–6 Deals / Jahr",
  },
  "angel-marie": {
    id: "angel-marie", name: "Marie S.", firm: "Independent Angel", role: "Angel Investor",
    avatar: "👼", bio: "Operator angel. Exited founder (EdTech, 2021). Now investing in consumer & creator economy companies where I can add hands-on value — product, GTM, fundraising.",
    focus: ["Consumer", "Creator Economy", "EdTech"],
    stages: ["Idee 💡", "Pre-Revenue 🚀", "Pre-Seed 🌱"],
    checkSize: "€10k – €100k (Angel)",
    region: "Österreich", regionFlag: "🇦🇹",
    portfolio: [
      { name: "CreatorKit", icon: "🎨", stage: "Pre-Seed" },
      { name: "LearnLoop", icon: "📚", stage: "Seed" },
    ],
    openToIntros: true, dealsPerYear: "6–10 Deals / Jahr",
  },
};

export default function InvestorProfilePage({ params }: { params: { id: string } }) {
  const investor = DEMO_INVESTORS[params.id] ?? DEMO_INVESTORS["vc-berlin"];
  const [requested, setRequested] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-indigo-600">DADORI</Link>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <Link href="/en/login" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              Mitmachen
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Hero */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm mb-6">
          <div className="flex items-start gap-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-4xl border border-amber-100">
              {investor.avatar}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-zinc-900">{investor.name}</h1>
                <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-0.5 text-xs font-semibold text-amber-700">
                  {investor.role}
                </span>
              </div>
              <p className="text-base font-semibold text-zinc-600 mt-0.5">{investor.firm}</p>
              <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-zinc-400">
                <span>{investor.regionFlag} {investor.region}</span>
                <span>·</span>
                <span>{investor.checkSize}</span>
                <span>·</span>
                <span>{investor.dealsPerYear}</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 flex gap-3">
            {investor.openToIntros && (
              requested ? (
                <span className="rounded-xl bg-green-50 border border-green-200 px-6 py-3 text-sm font-semibold text-green-700">
                  ✓ DADORI Intro angefragt
                </span>
              ) : (
                <button
                  onClick={() => setRequested(true)}
                  className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-600 transition-colors"
                >
                  🤝 DADORI Intro anfragen
                </button>
              )
            )}
            {investor.website && (
              <a href={investor.website} target="_blank" rel="noopener noreferrer"
                className="rounded-xl border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-600 hover:border-zinc-300 transition-colors">
                🌐 Website
              </a>
            )}
          </div>

          {investor.openToIntros && (
            <p className="mt-3 text-xs text-zinc-400">
              ⚡ Offen für Intros — DADORI leitet deine Anfrage weiter wenn ihr zusammenpasst
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Bio */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 font-bold text-zinc-900">Über {investor.name}</h2>
              <p className="text-sm leading-relaxed text-zinc-600">{investor.bio}</p>
            </div>

            {/* Portfolio */}
            {investor.portfolio.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-bold text-zinc-900">Portfolio (Auswahl)</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {investor.portfolio.map(p => (
                    <div key={p.name} className="rounded-xl border border-zinc-200 px-4 py-3 flex items-center gap-2">
                      <span className="text-xl">{p.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{p.name}</p>
                        <p className="text-xs text-zinc-400">{p.stage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Investment focus */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Investitionsfokus</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {investor.focus.map(f => (
                  <span key={f} className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    {f}
                  </span>
                ))}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Phasen</p>
              <div className="flex flex-wrap gap-1.5">
                {investor.stages.map(s => (
                  <span key={s} className="rounded-full bg-zinc-50 border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Check size */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Check-Size</p>
              <p className="text-sm font-bold text-zinc-900">{investor.checkSize}</p>
              <p className="mt-1 text-xs text-zinc-400">{investor.dealsPerYear}</p>
            </div>

            {/* Note */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-700">
              <strong>Hinweis:</strong> DADORI vermittelt Introductions. Keine Erfolgsgebühren, keine Transaktionsbeteiligung.
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-400">
          Alle Investoren entdecken:{" "}
          <Link href="/en/startup/discover" className="text-indigo-600 hover:underline">Investor-Suche →</Link>
        </p>
      </main>
    </div>
  );
}
