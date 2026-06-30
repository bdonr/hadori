"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { INVESTOR_FOCUS, CHECK_SIZES } from "@/lib/funding";

export default function DiscoverInvestorsPage() {
  const { locale } = useParams<{ locale: string }>();
  const [focusFilter, setFocusFilter] = useState<string[]>([]);

  function toggleFocus(id: string) {
    setFocusFilter(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href={`/${locale}/startup`} className="text-sm text-zinc-400 hover:text-zinc-600">← Dashboard</Link>
          <h1 className="text-lg font-semibold text-zinc-900">Investoren entdecken</h1>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 ml-auto">Pro</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-amber-900">DADORI Intro — wie es funktioniert</p>
            <p className="text-sm text-amber-700">Investoren werden hier erscheinen sobald sie sich registrieren. Anfrage senden → DADORI prüft den Match → beide Seiten stimmen zu → Intro.</p>
          </div>
        </div>

        {/* Fokus-Filter */}
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Fokus</p>
          <div className="flex flex-wrap gap-1.5">
            {INVESTOR_FOCUS.map(f => (
              <button key={f.id} onClick={() => toggleFocus(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  focusFilter.includes(f.id) ? "bg-indigo-600 text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <span className="text-5xl">🔭</span>
          <p className="mt-4 text-lg font-semibold text-zinc-700">Noch keine Investoren registriert</p>
          <p className="mt-2 text-sm text-zinc-400">Investoren erscheinen hier sobald sie ein DADORI-Profil erstellen.</p>
        </div>
      </main>
    </div>
  );
}
