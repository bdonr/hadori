"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SkillPicker } from "@/components/SkillPicker";
import { REGIONS } from "@/lib/regions";
import { FUNDING_STAGES, MRR_RANGES } from "@/lib/funding";

const IS_PRO = false;

const TEAM_SIZES = ["1", "2–5", "6–15", "16–50", "50+"];

const CATEGORIES = [
  "SaaS",
  "Creator / Streaming",
  "E-Commerce",
  "Fintech",
  "Health / MedTech",
  "Deep Tech / AI",
  "Marketplace",
  "EdTech",
  "Climate / Greentech",
  "Musik / Entertainment",
  "Gaming",
  "Sonstiges",
];

export default function StartupProfilePage() {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [neededSkills, setNeededSkills] = useState<string[]>([]);
  const [region, setRegion] = useState("de");
  const [stage, setStage] = useState("");
  const [mrrRange, setMrrRange] = useState("");
  const [fundingGoal, setFundingGoal] = useState("");
  const [seekingInvestors, setSeekingInvestors] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <Link
          href="/startup"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 mb-4"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Startup-Profil bearbeiten</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 flex flex-col gap-5">
        {/* Section 1: Dein Startup */}
        <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-semibold text-zinc-800">Dein Startup</h2>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. HADORI"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Tagline</label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Ein Satz was ihr macht"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was macht ihr? Für wen? Was ist der Unterschied?"
              rows={4}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Website</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
              type="url"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700">Kategorie</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat === category ? "" : cat)}
                  className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                    category === cat
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Team & Suche */}
        <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-semibold text-zinc-800">Team & Suche</h2>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700">Teamgröße</label>
            <div className="flex flex-wrap gap-2">
              {TEAM_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setTeamSize(size === teamSize ? "" : size)}
                  className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                    teamSize === size
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <SkillPicker
            label="Welche Skills sucht ihr noch?"
            selected={neededSkills}
            onChange={setNeededSkills}
            max={10}
          />
        </section>

        {/* Section 3: Region */}
        <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-semibold text-zinc-800">Region</h2>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRegion(r.id)}
                className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors flex items-center gap-1.5 ${
                  region === r.id
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400"
                }`}
              >
                <span>{r.flag}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Section 4: Funding & Traction (PRO GATE) */}
        <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-semibold text-zinc-800">Funding & Traction</h2>

          <div className="relative">
            {/* Content — blurred when not PRO */}
            <div
              className={`flex flex-col gap-4 ${
                !IS_PRO ? "blur-sm pointer-events-none select-none" : ""
              }`}
            >
              {/* Funding stage cards */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">Funding-Stage</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {FUNDING_STAGES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStage(s.id === stage ? "" : s.id)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        stage === s.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-zinc-200 bg-white hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{s.emoji}</span>
                        <div>
                          <div className="text-sm font-semibold text-zinc-900">{s.label}</div>
                          <div className="text-xs text-zinc-500">{s.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* MRR range */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">Aktueller MRR</label>
                <div className="flex flex-wrap gap-2">
                  {MRR_RANGES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMrrRange(m.id === mrrRange ? "" : m.id)}
                      className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                        mrrRange === m.id
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Funding goal */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">Funding-Ziel</label>
                <input
                  value={fundingGoal}
                  onChange={(e) => setFundingGoal(e.target.value)}
                  placeholder="z.B. €500k Seed-Runde · Verwenden für: Product-Team & Go-to-Market"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Seeking investors checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seekingInvestors}
                  onChange={(e) => setSeekingInvestors(e.target.checked)}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-zinc-700">Suche ich aktiv Investoren?</span>
              </label>
            </div>

            {/* Pro gate overlay */}
            {!IS_PRO && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/60 backdrop-blur-[2px]">
                <span className="text-3xl">🔒</span>
                <p className="text-sm font-semibold text-zinc-800 text-center">
                  Funding-Details sind ein Pro-Feature
                </p>
                <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Link href="/startup/billing">Ab Pro freischalten — 10 €/Mo</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
          >
            {saved ? "Gespeichert ✓" : "Speichern"}
          </Button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">Änderungen gespeichert!</span>
          )}
        </div>
      </div>
    </div>
  );
}
