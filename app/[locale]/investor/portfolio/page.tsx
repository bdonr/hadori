"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { planCaps } from "@/lib/entitlements";
import { Navbar } from "@/components/layout/navbar";

type DealStatus = "intro_sent" | "in_talk" | "due_diligence" | "invested" | "passed";

const STATUS_META: Record<DealStatus, { labelKey: string; color: string; dot: string }> = {
  intro_sent:     { labelKey: "status_intro_sent",    color: "bg-blue-50 text-blue-700 border-blue-200",    dot: "bg-blue-400" },
  in_talk:        { labelKey: "status_in_talk",       color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  due_diligence:  { labelKey: "status_due_diligence", color: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  invested:       { labelKey: "status_invested",      color: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  passed:         { labelKey: "status_passed",        color: "bg-zinc-100 text-zinc-500 border-zinc-200",   dot: "bg-zinc-300" },
};

const INITIAL_DEALS: {
  id: string; name: string; icon: string; category: string; stage: string;
  checkSize?: string; status: DealStatus; addedDate: string; notes: string;
}[] = [
  { id: "dadori",   name: "DADORI",    icon: "🚀", category: "B2B SaaS",    stage: "Pre-Seed", checkSize: "€100k",  status: "in_talk",       addedDate: "2026-06-10", notes: "Spannende Plattform, starker Founder" },
  { id: "klimaapp", name: "KlimaApp",  icon: "🌍", category: "Climate Tech", stage: "Seed",     checkSize: "€250k",  status: "due_diligence", addedDate: "2026-06-05", notes: "MRR wächst 20% MoM. Warteraum angefragt." },
  { id: "beatlab",  name: "BeatLab",   icon: "🎵", category: "Music",        stage: "Pre-Seed", checkSize: undefined, status: "passed",        addedDate: "2026-05-20", notes: "Markt zu klein für unsere Ticket-Size." },
  { id: "edupilot", name: "EduPilot",  icon: "📚", category: "EdTech",       stage: "Pre-Revenue", checkSize: "€75k", status: "intro_sent",  addedDate: "2026-06-28", notes: "" },
];

export default function PortfolioPage() {
  const t = useTranslations("investor_pages.portfolio");
  const [deals, setDeals] = useState(INITIAL_DEALS);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        if (snap.exists()) setTier((snap.data().plan_tier as string) ?? null);
      } catch {
        // Firebase not configured
      }
    });
    return () => unsub();
  }, []);

  const canAccess = planCaps(tier).portfolioTracker; // Pro+

  function updateStatus(id: string, status: DealStatus) {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  }
  function saveNotes(id: string) {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, notes: notesDraft } : d));
    setEditingNotes(null);
  }

  const byStatus = (s: DealStatus) => deals.filter(d => d.status === s);
  const invested = byStatus("invested");
  const active = deals.filter(d => d.status !== "passed" && d.status !== "invested");

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {!canAccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
            <span className="text-4xl">🔒</span>
            <h2 className="mt-4 text-xl font-bold text-zinc-900">{t("gate_title")}</h2>
            <p className="mt-2 text-sm text-zinc-500">{t("gate_subtitle")}</p>
            <Link href="/investor/billing" className="mt-4 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors">
              {t("upgrade_now")}
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: t("stat_active_deals"),   value: active.length,                        color: "text-indigo-600" },
                { label: t("stat_invested"),        value: invested.length,                      color: "text-green-600" },
                { label: t("stat_due_diligence"),   value: byStatus("due_diligence").length,      color: "text-amber-600" },
                { label: t("stat_total_seen"),      value: deals.length,                         color: "text-zinc-700" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm text-center">
                  <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  <p className="mt-1 text-xs text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Pipeline */}
            <h2 className="font-bold text-zinc-900 mb-4">{t("deal_pipeline")}</h2>
            <div className="flex flex-col gap-4 mb-10">
              {deals.filter(d => d.status !== "passed").map(deal => {
                const sm = STATUS_META[deal.status];
                return (
                  <div key={deal.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 text-xl">
                        {deal.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/en/project/${deal.id}`} className="font-bold text-zinc-900 hover:text-emerald-600 transition-colors">
                              {deal.name}
                            </Link>
                            <span className="text-xs text-zinc-400">{deal.category} · {deal.stage}</span>
                            {deal.checkSize && (
                              <span className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-semibold text-green-700">
                                {deal.checkSize}
                              </span>
                            )}
                          </div>
                          {/* Status picker */}
                          <select
                            value={deal.status}
                            onChange={e => updateStatus(deal.id, e.target.value as DealStatus)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold outline-none cursor-pointer ${sm.color}`}
                          >
                            {(Object.keys(STATUS_META) as DealStatus[]).map(s => (
                              <option key={s} value={s}>{t(STATUS_META[s].labelKey)}</option>
                            ))}
                          </select>
                        </div>

                        {/* Notes */}
                        <div className="mt-2">
                          {editingNotes === deal.id ? (
                            <div className="flex gap-2 mt-1">
                              <input
                                value={notesDraft} onChange={e => setNotesDraft(e.target.value)}
                                className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs outline-none focus:border-emerald-400"
                                placeholder={t("note_placeholder")}
                                autoFocus
                              />
                              <button onClick={() => saveNotes(deal.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">{t("save")}</button>
                              <button onClick={() => setEditingNotes(null)} className="text-xs text-zinc-400 px-2">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingNotes(deal.id); setNotesDraft(deal.notes); }}
                              className="text-xs text-zinc-400 hover:text-zinc-600 mt-1"
                            >
                              {deal.notes ? `📝 ${deal.notes}` : t("add_note")}
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-[10px] text-zinc-300">{t("added", { date: deal.addedDate })}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Passed deals */}
            {byStatus("passed").length > 0 && (
              <>
                <h2 className="font-bold text-zinc-400 mb-3 text-sm">{t("rejected", { n: byStatus("passed").length })}</h2>
                <div className="flex flex-col gap-2">
                  {byStatus("passed").map(deal => (
                    <div key={deal.id} className="rounded-xl border border-zinc-100 bg-zinc-50 px-5 py-3 flex items-center gap-3 opacity-60">
                      <span className="text-lg">{deal.icon}</span>
                      <span className="text-sm text-zinc-500">{deal.name}</span>
                      <span className="text-xs text-zinc-400">· {deal.notes}</span>
                      <button onClick={() => updateStatus(deal.id, "intro_sent")} className="ml-auto text-xs text-zinc-400 hover:text-zinc-600">
                        {t("reactivate")}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
