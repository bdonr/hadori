"use client";

import Link from "next/link";
import { LangSwitcher } from "@/components/LangSwitcher";
import { TALENT_TIERS, PROJECT_TIERS, INVESTOR_TIERS } from "@/lib/tiers";
import { Navbar } from "@/components/layout/navbar";

const TRACK_META = [
  {
    key: "talent",
    label: "👤 Talent",
    desc: "Du hast Skills und suchst Projekte, Startups oder Co-Gründer.",
    tiers: TALENT_TIERS,
    href: (id: string) => `/en/signup?tier=${id}`,
    accent: "indigo",
  },
  {
    key: "project",
    label: "🎯 Projekt & Startup",
    desc: "Du baust etwas — von YouTube-Kanal bis VC-funded Startup.",
    tiers: PROJECT_TIERS,
    href: (id: string) => `/en/signup?tier=${id}`,
    accent: "amber",
  },
  {
    key: "investor",
    label: "💼 Investor",
    desc: "Du investierst oder willst den richtigen Deal Flow finden.",
    tiers: INVESTOR_TIERS,
    href: (id: string) => `/en/signup?tier=${id}`,
    accent: "emerald",
  },
] as const;

const ACCENT = {
  indigo:  { header: "bg-indigo-50 border-indigo-200 text-indigo-900", highlight: "ring-2 ring-indigo-400", btn: "bg-indigo-600 hover:bg-indigo-700 text-white", btnSecondary: "border border-indigo-200 text-indigo-700 hover:bg-indigo-50" },
  amber:   { header: "bg-amber-50 border-amber-200 text-amber-900",   highlight: "ring-2 ring-amber-400",  btn: "bg-amber-500 hover:bg-amber-600 text-white",   btnSecondary: "border border-amber-200 text-amber-700 hover:bg-amber-50" },
  emerald: { header: "bg-emerald-50 border-emerald-200 text-emerald-900", highlight: "ring-2 ring-emerald-400", btn: "bg-emerald-600 hover:bg-emerald-700 text-white", btnSecondary: "border border-emerald-200 text-emerald-700 hover:bg-emerald-50" },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-extrabold text-zinc-900">Einfache Preise. Kein Bullshit.</h1>
          <p className="mt-3 text-lg text-zinc-500">Drei Tracks — starte wo du stehst. Upgrade wenn du bereit bist.</p>
        </div>

        {TRACK_META.map(track => {
          const a = ACCENT[track.accent];
          return (
            <section key={track.key} className="mb-16">
              {/* Track header */}
              <div className={`rounded-2xl border px-6 py-4 mb-5 ${a.header}`}>
                <h2 className="text-lg font-extrabold">{track.label}</h2>
                <p className="text-sm opacity-70 mt-0.5">{track.desc}</p>
              </div>

              {/* Tier cards */}
              <div className={`grid gap-5 ${"sm:grid-cols-3"}`}>
                {(track.tiers as readonly typeof track.tiers[number][]).map(tier => (
                  <div
                    key={tier.id}
                    className={`relative rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm flex flex-col ${tier.highlight ? a.highlight : ""}`}
                  >
                    {tier.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className={`rounded-full px-4 py-1 text-xs font-bold text-white shadow ${track.accent === "indigo" ? "bg-indigo-600" : track.accent === "amber" ? "bg-amber-500" : "bg-emerald-600"}`}>
                          Beliebt ⭐
                        </span>
                      </div>
                    )}

                    <div className="mb-5">
                      <span className="text-3xl">{tier.emoji}</span>
                      <h3 className="mt-2 text-xl font-extrabold text-zinc-900">{tier.name}</h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        {tier.price === 0 ? (
                          <span className="text-2xl font-black text-zinc-900">Gratis</span>
                        ) : (
                          <>
                            <span className="text-2xl font-black text-zinc-900">{tier.price} €</span>
                            <span className="text-sm text-zinc-400">/ Monat</span>
                          </>
                        )}
                      </div>
                    </div>

                    <ul className="flex flex-col gap-2 mb-7 flex-1">
                      {tier.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm text-zinc-600">
                          <span className="mt-0.5 text-green-500 shrink-0">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={track.href(tier.id)}
                      className={`block w-full rounded-xl py-2.5 text-center text-sm font-bold transition-colors ${tier.highlight ? a.btn : `bg-white ${a.btnSecondary}`}`}
                    >
                      {tier.cta}
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Upgrade path */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm mb-12">
          <h2 className="text-center font-bold text-zinc-900 text-lg mb-8">Dein Weg auf DADORI</h2>
          <div className="flex flex-col gap-6">
            {[
              { track: "Talent", steps: ["👤 Free", "⭐ Plus 5€", "🏆 Pro 20€"], color: "indigo" },
              { track: "Projekt / Startup", steps: ["🎯 Projekt 2€", "🚀 Startup 10€", "🦄 Startup Pro 25€"], color: "amber" },
              { track: "Investor", steps: ["💼 Investor Free", "🏦 Investor Pro 49€"], color: "emerald" },
            ].map(({ track, steps, color }) => (
              <div key={track} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 w-36 shrink-0">{track}</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {steps.map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        color === "indigo" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                        color === "amber"  ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                             "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>{step}</span>
                      {i < steps.length - 1 && <span className="text-zinc-300 text-sm">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-zinc-400">
            Jeder Upgrade behält dein Profil, deine Matches und deine History.
          </p>
        </section>

        {/* FAQ */}
        <section className="grid gap-4 sm:grid-cols-2">
          {[
            { q: "Kann ich jederzeit kündigen?", a: "Ja — monatlich kündbar, keine Mindestlaufzeit, sofort aktiv." },
            { q: "Was ist Stealth-Modus?", a: "Dein Projekt ist anonym sichtbar — nur Kategorie & Problem-Bereich, kein Name. Investoren können trotzdem Interesse bekunden." },
            { q: "Upgrade Projekt → Startup?", a: "Ein Klick — dein Profil wird vollständig übernommen, du zahlst nur die Differenz." },
            { q: "Investoren: warum Free?", a: "Wir wollen Investoren auf der Plattform, nicht davon fernhalten. Pro lohnt sich für aktiven Deal Flow." },
            { q: "Was kostet DADORI Intro?", a: "Die Intro selbst ist kostenlos — du brauchst nur den passenden Tier (Startup oder Investor Pro)." },
            { q: "Gibt es Jahrespläne?", a: "Kommt bald — mit ~20% Rabatt gegenüber monatlicher Zahlung." },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="font-semibold text-zinc-900 text-sm">{q}</p>
              <p className="mt-1 text-sm text-zinc-500">{a}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
