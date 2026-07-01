"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
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

type Deal = {
  id: string; name: string; icon: string; category: string; stage: string;
  status: DealStatus; notes: string;
};

export default function PortfolioPage() {
  const t = useTranslations("investor_pages.portfolio");
  const params = useParams();
  const locale = (params?.locale as string) ?? "de";
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        if (snap.exists()) setTier((snap.data().plan_tier as string) ?? null);
      } catch {
        // Firebase not configured
      }
      try {
        const snap = await getDocs(collection(db, "investors", user.uid, "portfolio"));
        setDeals(snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name ?? "",
            icon: data.icon ?? "💡",
            category: data.category ?? "",
            stage: data.stage ?? "",
            status: (data.status as DealStatus) ?? "intro_sent",
            notes: data.notes ?? "",
          };
        }));
      } catch {
        // Firebase not configured — leave empty
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const canAccess = planCaps(tier).portfolioTracker; // Pro+

  async function updateStatus(id: string, status: DealStatus) {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    if (uid) {
      try { await updateDoc(doc(db, "investors", uid, "portfolio", id), { status }); } catch { /* ignore */ }
    }
  }
  async function saveNotes(id: string) {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, notes: notesDraft } : d));
    setEditingNotes(null);
    if (uid) {
      try { await updateDoc(doc(db, "investors", uid, "portfolio", id), { notes: notesDraft }); } catch { /* ignore */ }
    }
  }
  async function remove(id: string) {
    setDeals(prev => prev.filter(d => d.id !== id));
    if (uid) {
      try { await deleteDoc(doc(db, "investors", uid, "portfolio", id)); } catch { /* ignore */ }
    }
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
            <Link href={`/${locale}/investor/billing`} className="mt-4 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors">
              {t("upgrade_now")}
            </Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-24">
            <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : deals.length === 0 ? (
          <div className="py-20 text-center text-zinc-400">
            <span className="text-4xl">📊</span>
            <p className="mt-3 font-semibold text-zinc-600">{t("empty_title")}</p>
            <p className="mt-1 text-sm">{t("empty_desc")}</p>
            <Link href={`/${locale}/investor/watchlist`} className="mt-3 inline-block text-sm text-emerald-600 hover:underline">{t("go_to_watchlist")}</Link>
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
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 text-xl overflow-hidden">
                        {deal.icon.startsWith("http") ? <img src={deal.icon} alt="" className="h-full w-full object-cover" /> : deal.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/${locale}/project/${deal.id}`} className="font-bold text-zinc-900 hover:text-emerald-600 transition-colors">
                              {deal.name}
                            </Link>
                            <span className="text-xs text-zinc-400">{deal.category} · {deal.stage}</span>
                          </div>
                          <div className="flex items-center gap-2">
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
                            <button onClick={() => remove(deal.id)} className="text-xs text-zinc-400 hover:text-red-500 px-1">✕</button>
                          </div>
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
                      <span className="text-lg">{deal.icon.startsWith("http") ? "💡" : deal.icon}</span>
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
