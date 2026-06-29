"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LivePulse } from "@/components/LivePulse";
import { matchTemperature } from "@/lib/matching";

const INTROS = [
  {
    id: "1",
    status: "pending",
    initiatedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    partyA: { name: "StreamerXY", type: "startup", icon: "🎮", desc: "Gaming-Creator · 80k Subs" },
    partyB: { name: "Sara T.", type: "talent", icon: "🎬", desc: "Video-Editorin · 4 Jahre Erfahrung" },
    score: 100,
    reason: "StreamerXY hat Sara's Profil 6 Minuten lang angeschaut. Sara hat die Rolle von StreamerXY als Favorit markiert. 4 Skills stimmen exakt überein.",
    matchedSkills: ["Video Editing / Schnitt", "Short-Form", "DaVinci Resolve", "Color Grading"],
    introMessage: "Hey Sara & StreamerXY — ich bin DADORI und habe euer gegenseitiges Interesse bemerkt. Ihr passt auf 100% zusammen. StreamerXY sucht genau das, was Sara macht. Sara ist sofort verfügbar. Ich würde euch gerne vorstellen — wollt ihr?",
  },
  {
    id: "2",
    status: "accepted",
    initiatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    partyA: { name: "BeatLab Records", type: "startup", icon: "🎵", desc: "Indie-Label · Musik-Startup" },
    partyB: { name: "Max B.", type: "talent", icon: "🎧", desc: "Music Video Editor · Remote" },
    score: 88,
    reason: "BeatLab suchte aktiv nach einem Music Video Editor. Max hat sich beworben. Beide sind seit 48h aktiv auf der Plattform.",
    matchedSkills: ["Video Editing / Schnitt", "Color Grading", "After Effects"],
    introMessage: "BeatLab & Max — ihr habt beide Ja gesagt. Ich verbinde euch jetzt direkt.",
  },
  {
    id: "3",
    status: "pending",
    initiatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    partyA: { name: "VC Berlin Fund", type: "investor", icon: "💼", desc: "Seed-Investor · B2B SaaS" },
    partyB: { name: "DADORI", type: "startup", icon: "🚀", desc: "SaaS-Startup · Pre-Seed" },
    score: 75,
    reason: "VC Berlin hat das DADORI-Profil zweimal besucht und 4 Minuten auf der Businessplan-Sektion verbracht. DADORI ist investordiscoverable.",
    matchedSkills: ["SaaS", "B2B", "Seed-Phase", "Tech"],
    introMessage: "VC Berlin & DADORI-Team — VC Berlin hat euer Profil intensiv angeschaut. Interesse scheint vorhanden. Ich würde gerne eine kurze Vorstellung machen — seid ihr offen?",
  },
];

const STATUS_STYLE = {
  pending: { label: "Wartet auf Bestätigung", color: "bg-amber-100 text-amber-700", icon: "⏳" },
  accepted: { label: "Intro bestätigt", color: "bg-green-100 text-green-700", icon: "✅" },
  declined: { label: "Abgelehnt", color: "bg-zinc-100 text-zinc-500", icon: "✕" },
};

export default function MatchesPage() {
  const [intros, setIntros] = useState(INTROS);
  const [activeTab, setActiveTab] = useState<"intros" | "pulse">("intros");
  const [onlineCount, setOnlineCount] = useState(12);

  useEffect(() => {
    const t = setInterval(() => {
      setOnlineCount(c => c + Math.floor(Math.random() * 3) - 1);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  function acceptIntro(id: string) {
    setIntros(prev => prev.map(i => i.id === id ? { ...i, status: "accepted" } : i));
  }
  function declineIntro(id: string) {
    setIntros(prev => prev.map(i => i.id === id ? { ...i, status: "declined" } : i));
  }

  const pendingCount = intros.filter(i => i.status === "pending").length;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/startup" className="text-sm text-zinc-400 hover:text-zinc-600">← Dashboard</Link>
            <h1 className="text-lg font-semibold text-zinc-900">Matches & Intros</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-semibold text-green-700">{onlineCount} gerade aktiv</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm w-fit">
          {[
            { id: "intros", label: `🤝 DADORI Intros${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
            { id: "pulse", label: "🔴 Live Pulse" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* INTROS TAB */}
        {activeTab === "intros" && (
          <div className="flex flex-col gap-5">
            {intros.map(intro => {
              const temp = matchTemperature(intro.score);
              const st = STATUS_STYLE[intro.status as keyof typeof STATUS_STYLE];
              const timeAgo = getTimeAgo(intro.initiatedAt);

              return (
                <div
                  key={intro.id}
                  className={`rounded-2xl border-2 bg-white p-6 shadow-sm transition-all ${
                    intro.status === "pending"
                      ? "border-indigo-200"
                      : intro.status === "accepted"
                      ? "border-green-200"
                      : "border-zinc-100 opacity-60"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-indigo-50 text-xl shadow-sm">
                          {intro.partyA.icon}
                        </span>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-indigo-50 text-xl shadow-sm">
                          {intro.partyB.icon}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">
                          {intro.partyA.name} <span className="text-zinc-400">↔</span> {intro.partyB.name}
                        </p>
                        <p className="text-xs text-zinc-500">{timeAgo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${temp.bg} ${temp.color}`}>
                        {temp.emoji} {intro.score}% Match
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.color}`}>
                        {st.icon} {st.label}
                      </span>
                    </div>
                  </div>

                  {/* DADORI message */}
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 mb-4">
                    <p className="text-xs font-bold text-indigo-400 mb-1">🤝 DADORI sagt</p>
                    <p className="text-sm text-indigo-900 leading-relaxed">{intro.introMessage}</p>
                  </div>

                  {/* Why matched */}
                  <p className="text-xs text-zinc-500 mb-3">
                    <span className="font-semibold text-zinc-700">Warum dieser Match: </span>
                    {intro.reason}
                  </p>

                  {/* Matched skills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {intro.matchedSkills.map(s => (
                      <span key={s} className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white">
                        ✓ {s}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  {intro.status === "pending" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => acceptIntro(intro.id)}
                        className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
                      >
                        ✓ Intro annehmen
                      </button>
                      <button
                        onClick={() => declineIntro(intro.id)}
                        className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 transition-colors"
                      >
                        Ablehnen
                      </button>
                    </div>
                  )}
                  {intro.status === "accepted" && (
                    <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-semibold text-green-800">
                      ✅ Intro bestätigt — beide Parteien wurden verbunden. Viel Erfolg!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PULSE TAB */}
        {activeTab === "pulse" && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <p className="text-sm font-semibold text-zinc-700">Echtzeit — Ereignisse die zu dir passen</p>
            </div>
            <LivePulse />
          </div>
        )}
      </main>
    </div>
  );
}

function getTimeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "Gerade eben";
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Minuten`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Stunden`;
  return `vor ${Math.floor(diff / 86400)} Tagen`;
}
