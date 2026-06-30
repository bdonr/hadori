"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { LangSwitcher } from "@/components/LangSwitcher";
import { Navbar } from "@/components/layout/navbar";

type Investor = {
  id: string; name: string; firm: string; role: string; avatar: string;
  bio: string; focus: string[]; stages: string[]; checkSize: string;
  region: string; regionFlag: string;
  portfolio: { name: string; icon: string; stage: string }[];
  website?: string; openToIntros: boolean; dealsPerYear: string;
};

export default function InvestorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "investors", id));
        if (!cancelled) {
          if (snap.exists()) {
            const d = snap.data();
            setInvestor({
              id: snap.id,
              name: d.name ?? "",
              firm: d.firm ?? "",
              role: d.role ?? "",
              avatar: d.avatar ?? "💼",
              bio: d.bio ?? "",
              focus: d.focus ?? [],
              stages: d.stages ?? [],
              checkSize: d.checkSize ?? "",
              region: d.region ?? "",
              regionFlag: d.regionFlag ?? "🌐",
              portfolio: d.portfolio ?? [],
              website: d.website,
              openToIntros: d.openToIntros ?? false,
              dealsPerYear: d.dealsPerYear ?? "",
            });
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <Navbar />
        <div className="text-zinc-400 text-sm animate-pulse">Wird geladen…</div>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4">
        <span className="text-5xl">💼</span>
        <h1 className="text-xl font-bold text-zinc-900">Investor nicht gefunden</h1>
        <Link href="/en/explore" className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
          Zurück →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm mb-6">
          <div className="flex items-start gap-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-4xl border border-amber-100">{investor.avatar}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-zinc-900">{investor.name}</h1>
                <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-0.5 text-xs font-semibold text-amber-700">{investor.role}</span>
              </div>
              <p className="text-base font-semibold text-zinc-600 mt-0.5">{investor.firm}</p>
              <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-zinc-400">
                <span>{investor.regionFlag} {investor.region}</span>
                {investor.checkSize && <><span>·</span><span>{investor.checkSize}</span></>}
                {investor.dealsPerYear && <><span>·</span><span>{investor.dealsPerYear}</span></>}
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            {investor.openToIntros && (
              requested ? (
                <span className="rounded-xl bg-green-50 border border-green-200 px-6 py-3 text-sm font-semibold text-green-700">✓ Intro angefragt</span>
              ) : (
                <button onClick={() => setRequested(true)} className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-600 transition-colors">
                  🤝 Intro anfragen
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
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {investor.bio && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 font-bold text-zinc-900">Über {investor.name}</h2>
                <p className="text-sm leading-relaxed text-zinc-600">{investor.bio}</p>
              </div>
            )}
            {investor.portfolio.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-bold text-zinc-900">Portfolio</h2>
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
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-700">
              <strong>Hinweis:</strong> DADORI vermittelt Introductions. Keine Erfolgsgebühren, keine Transaktionsbeteiligung.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
