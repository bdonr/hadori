"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// ── Picker data ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "saas", label: "B2B SaaS", emoji: "💻" },
  { id: "marketplace", label: "Marketplace", emoji: "🛒" },
  { id: "ecommerce", label: "E-Commerce", emoji: "📦" },
  { id: "fintech", label: "Fintech", emoji: "💳" },
  { id: "health", label: "Health / MedTech", emoji: "🏥" },
  { id: "edtech", label: "EdTech", emoji: "📚" },
  { id: "climate", label: "Climate Tech", emoji: "🌍" },
  { id: "creator", label: "Creator / Media", emoji: "🎬" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "ai", label: "AI / Deep Tech", emoji: "🤖" },
  { id: "logistics", label: "Logistik", emoji: "🚚" },
  { id: "other", label: "Sonstiges", emoji: "💡" },
];

const PROBLEM_AREAS = [
  { id: "efficiency", label: "Zu langsame Prozesse" },
  { id: "cost", label: "Zu hohe Kosten" },
  { id: "access", label: "Fehlender Zugang / Reichweite" },
  { id: "information", label: "Informationsasymmetrie" },
  { id: "coordination", label: "Koordinationsprobleme" },
  { id: "trust", label: "Fehlendes Vertrauen" },
  { id: "quality", label: "Schlechte Qualität / Auswahl" },
  { id: "compliance", label: "Regulatorische Hürden" },
  { id: "engagement", label: "Niedrige Nutzerbindung" },
  { id: "other", label: "Anderes Problem" },
];

const TARGET_GROUPS = [
  { id: "smb", label: "KMU (10–500 MA)" },
  { id: "enterprise", label: "Enterprise (500+ MA)" },
  { id: "freelancer", label: "Freelancer / Solo" },
  { id: "consumer", label: "Endverbraucher (B2C)" },
  { id: "creator", label: "Creator / Influencer" },
  { id: "student", label: "Studenten / Azubis" },
  { id: "hr", label: "HR-Manager" },
  { id: "founder", label: "Gründer / Startups" },
  { id: "dev", label: "Entwickler / IT-Teams" },
  { id: "health_pro", label: "Gesundheitsberufe" },
];

const BUSINESS_MODELS = [
  { id: "saas_sub", label: "SaaS-Abo", emoji: "🔄" },
  { id: "transaction", label: "Transaktionsgebühr", emoji: "💸" },
  { id: "freemium", label: "Freemium + Upgrade", emoji: "🆓" },
  { id: "marketplace_fee", label: "Marketplace-Fee", emoji: "🏪" },
  { id: "license", label: "Lizenz (einmalig)", emoji: "📄" },
  { id: "ads", label: "Werbung / Ads", emoji: "📢" },
  { id: "data", label: "Daten / Insights", emoji: "📊" },
  { id: "service", label: "Service / Agency", emoji: "🤝" },
  { id: "hardware", label: "Hardware + Software", emoji: "🔧" },
  { id: "other", label: "Anderes Modell", emoji: "💡" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function Chips<T extends { id: string; label: string; emoji?: string }>({
  items, selected, onToggle, multi = false,
}: {
  items: T[];
  selected: string | string[];
  onToggle: (id: string) => void;
  multi?: boolean;
}) {
  const isActive = (id: string) =>
    Array.isArray(selected) ? selected.includes(id) : selected === id;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onToggle(item.id)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors flex items-center gap-1.5 ${
            isActive(item.id)
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400"
          }`}
        >
          {item.emoji && <span>{item.emoji}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const [step, setStep] = useState<"form" | "result">("form");

  // Picker state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [bizModel, setBizModel] = useState("");
  const [description, setDescription] = useState("");

  function toggleMulti(set: React.Dispatch<React.SetStateAction<string[]>>, id: string) {
    set(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const canSubmit = name.trim() && category && problems.length > 0 && targets.length > 0 && bizModel;

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStep("result");
  }

  const selectedCategory = CATEGORIES.find(c => c.id === category);
  const selectedBizModel = BUSINESS_MODELS.find(b => b.id === bizModel);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <Link href="/startup" className="text-sm text-zinc-400 hover:text-zinc-600">← Dashboard</Link>
          <h1 className="text-lg font-semibold text-zinc-900">Businessplan erstellen</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">

        {step === "form" && (
          <form onSubmit={handleGenerate} className="flex flex-col gap-6">

            {/* Name */}
            <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
              <h2 className="font-semibold text-zinc-900">Startup-Name</h2>
              <input
                required value={name} onChange={e => setName(e.target.value)}
                placeholder="z.B. HADORI"
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </section>

            {/* Kategorie */}
            <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
              <h2 className="font-semibold text-zinc-900">Kategorie</h2>
              <p className="text-xs text-zinc-400">In welchem Bereich ist euer Startup?</p>
              <Chips items={CATEGORIES} selected={category} onToggle={id => setCategory(id === category ? "" : id)} />
            </section>

            {/* Problem */}
            <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
              <h2 className="font-semibold text-zinc-900">🔥 Das Problem</h2>
              <p className="text-xs text-zinc-400">Welche Schmerzpunkte löst ihr? (Mehrfachauswahl)</p>
              <Chips multi items={PROBLEM_AREAS} selected={problems} onToggle={id => toggleMulti(setProblems, id)} />
            </section>

            {/* Zielgruppe */}
            <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
              <h2 className="font-semibold text-zinc-900">👥 Zielgruppe</h2>
              <p className="text-xs text-zinc-400">Für wen ist euer Produkt? (Mehrfachauswahl)</p>
              <Chips multi items={TARGET_GROUPS} selected={targets} onToggle={id => toggleMulti(setTargets, id)} />
            </section>

            {/* Geschäftsmodell */}
            <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
              <h2 className="font-semibold text-zinc-900">💰 Geschäftsmodell</h2>
              <p className="text-xs text-zinc-400">Wie verdient ihr Geld?</p>
              <Chips items={BUSINESS_MODELS} selected={bizModel} onToggle={id => setBizModel(id === bizModel ? "" : id)} />
            </section>

            {/* Beschreibung — einziges Freitext-Feld */}
            <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
              <h2 className="font-semibold text-zinc-900">💡 Kurzbeschreibung <span className="text-zinc-400 font-normal text-sm">(optional)</span></h2>
              <p className="text-xs text-zinc-400">Was macht euch besonders? Was die Picker nicht abdecken.</p>
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Optional: Euer USP, eine besondere Technologie, oder was euch von Wettbewerbern unterscheidet …"
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
              />
            </section>

            {/* Summary + CTA */}
            {canSubmit && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-indigo-900">{name}</p>
                  <p className="text-sm text-indigo-700 mt-0.5">
                    {selectedCategory?.emoji} {selectedCategory?.label} ·{" "}
                    {problems.length} Problem{problems.length > 1 ? "e" : ""} ·{" "}
                    {targets.length} Zielgruppe{targets.length > 1 ? "n" : ""} ·{" "}
                    {selectedBizModel?.emoji} {selectedBizModel?.label}
                  </p>
                </div>
              </div>
            )}

            <Button type="submit" size="lg" disabled={!canSubmit} className="disabled:opacity-40">
              Businessplan generieren →
            </Button>
            {!canSubmit && (
              <p className="text-xs text-zinc-400 text-center">
                Bitte Kategorie, mindestens ein Problem, eine Zielgruppe und ein Geschäftsmodell auswählen.
              </p>
            )}
          </form>
        )}

        {step === "result" && (
          <div className="flex flex-col gap-6">
            {/* Preview / locked result */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-zinc-900 mb-1">Executive Summary</h2>
              <p className="text-sm text-zinc-500 mb-6">KI-generiert auf Basis deiner Angaben</p>
              <div className="space-y-3 text-sm leading-relaxed text-zinc-700">
                <p>
                  <strong>{name}</strong> ist ein{" "}
                  {selectedCategory?.label}-Startup das{" "}
                  {problems.map(p => PROBLEM_AREAS.find(x => x.id === p)?.label).filter(Boolean).join(", ").toLowerCase()}{" "}
                  für{" "}
                  {targets.map(t => TARGET_GROUPS.find(x => x.id === t)?.label).filter(Boolean).join(", ")}{" "}
                  löst.
                </p>
                <p>
                  Das Geschäftsmodell basiert auf{" "}
                  {selectedBizModel?.label.toLowerCase()}.
                  {description ? ` ${description}` : ""}
                </p>
              </div>
            </div>

            {/* Locked sections */}
            {[
              { title: "📊 Marktanalyse (TAM / SAM / SOM)", hint: "Echte Marktdaten mit Quellenangaben" },
              { title: "⚔️ Wettbewerbsanalyse", hint: "Direkte & indirekte Konkurrenten" },
              { title: "💰 Finanzprojektion 3 Jahre", hint: "Revenue, Kosten, Break-Even" },
            ].map(s => (
              <div key={s.title} className="relative rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm overflow-hidden">
                <div className="blur-sm select-none pointer-events-none">
                  <h2 className="text-lg font-bold text-zinc-900 mb-3">{s.title}</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {["???", "???", "???"].map((v, i) => (
                      <div key={i} className="rounded-xl bg-indigo-50 p-4 text-center">
                        <p className="text-xs text-indigo-400 uppercase font-semibold">Wert {i + 1}</p>
                        <p className="mt-1 text-2xl font-black text-indigo-200">€{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-sm">
                  <span className="text-3xl">🔒</span>
                  <p className="font-bold text-zinc-900">{s.title}</p>
                  <p className="text-sm text-zinc-500">{s.hint}</p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/startup/billing">Pro freischalten — 10 €/Mo</Link>
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("form")}>Neu erstellen</Button>
              <Button asChild><Link href="/startup">Dashboard</Link></Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
