"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { Navbar } from "@/components/layout/navbar";

const CURRENT_TIER = "investor_pro";
const TIER_ORDER = ["investor_free", "investor_basic", "investor_pro", "investor_premium", "investor_elite"];
function tierAtLeast(r: string) { return TIER_ORDER.indexOf(CURRENT_TIER) >= TIER_ORDER.indexOf(r); }
const MAX_WATCHLIST = tierAtLeast("investor_basic") ? (tierAtLeast("investor_pro") ? Infinity : 20) : 5;

const INITIAL: { id: string; name: string; icon: string; category: string; stage: string; regionFlag: string; tagline: string }[] = [
  { id: "dadori",   name: "DADORI",   icon: "🚀", category: "B2B SaaS",    stage: "Pre-Seed", regionFlag: "🇩🇪", tagline: "Dreiseitige Incubator-Plattform." },
  { id: "klimaapp", name: "KlimaApp", icon: "🌍", category: "Climate Tech", stage: "Seed",     regionFlag: "🇩🇪", tagline: "CO₂-Tracking für den Alltag." },
  { id: "fitstreak",name: "FitStreak",icon: "💪", category: "Health",       stage: "Seed",     regionFlag: "🇩🇪", tagline: "Habit-App für Sport-Nerds." },
];

type WatchlistItem = { id: string; name: string; icon: string; category: string; stage: string; regionFlag: string; tagline: string };

export default function WatchlistPage() {
  const t = useTranslations("investor_pages.watchlist");
  const [list, setList] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setList(INITIAL);
        setLoading(false);
        return;
      }
      setUid(user.uid);
      try {
        const snap = await getDocs(collection(db, "investors", user.uid, "watchlist"));
        if (snap.empty) {
          setList(INITIAL);
        } else {
          setList(snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name ?? "",
              icon: data.icon ?? "💡",
              category: data.category ?? "",
              stage: data.stage ?? "",
              regionFlag: data.regionFlag ?? "🌐",
              tagline: data.tagline ?? "",
            };
          }));
        }
      } catch {
        setList(INITIAL);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  async function remove(id: string) {
    setList(prev => prev.filter(x => x.id !== id));
    if (uid) {
      try {
        await deleteDoc(doc(db, "investors", uid, "watchlist", id));
      } catch {
        // optimistic update already applied; silently ignore
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-24">
            <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : list.length === 0 ? (
          <div className="py-20 text-center text-zinc-400">
            <span className="text-4xl">⭐</span>
            <p className="mt-3 font-semibold">{t("empty_title")}</p>
            <Link href="/investor/dealflow" className="mt-3 inline-block text-sm text-emerald-600 hover:underline">{t("discover_deal_flow")}</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {list.map(item => (
              <div key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 text-xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <Link href={`/en/project/${item.id}`} className="font-bold text-zinc-900 hover:text-emerald-600 transition-colors">{item.name}</Link>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.regionFlag} · {item.category} · {item.stage}</p>
                  <p className="text-sm text-zinc-400 truncate mt-0.5">{item.tagline}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/en/project/${item.id}`} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:border-emerald-300 transition-colors">{t("details")}</Link>
                  <button onClick={() => remove(item.id)} className="rounded-lg border border-zinc-100 px-3 py-1.5 text-xs text-zinc-400 hover:text-red-500 hover:border-red-200 transition-colors">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!tierAtLeast("investor_basic") && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-700">
            {t("free_limit")} · <Link href="/investor/billing" className="font-bold hover:underline">{t("upgrade_angel")}</Link>
          </div>
        )}
      </main>
    </div>
  );
}
