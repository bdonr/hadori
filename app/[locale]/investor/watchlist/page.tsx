"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, getDoc, doc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { planCaps } from "@/lib/entitlements";
import { Navbar } from "@/components/layout/navbar";

type WatchlistItem = { id: string; name: string; icon: string; category: string; stage: string; regionFlag: string; tagline: string };

export default function WatchlistPage() {
  const t = useTranslations("investor_pages.watchlist");
  const params = useParams();
  const locale = (params?.locale as string) ?? "de";
  const [list, setList] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [capsList, setCapsList] = useState<string[] | undefined>(undefined);
  const [limitHit, setLimitHit] = useState(false);

  const caps = planCaps({ plan_tier: tier, capabilities: capsList });
  const maxWatchlist = caps.watchlistLimit; // free 5, angel 20, pro+ ∞
  const atLimit = list.length >= maxWatchlist;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setUid(user.uid);
      try {
        const profileSnap = await getDoc(doc(db, "profiles", user.uid));
        if (profileSnap.exists()) {
          setTier((profileSnap.data().plan_tier as string) ?? null);
          setCapsList(profileSnap.data().capabilities as string[] | undefined);
        }
      } catch {
        // Firebase not configured
      }
      try {
        const snap = await getDocs(collection(db, "investors", user.uid, "watchlist"));
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
      } catch {
        // Firebase not configured — leave list empty
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  async function remove(id: string) {
    setLimitHit(false);
    setList(prev => prev.filter(x => x.id !== id));
    if (uid) {
      try {
        await deleteDoc(doc(db, "investors", uid, "watchlist", id));
      } catch {
        // optimistic update already applied; silently ignore
      }
    }
  }

  async function track(item: WatchlistItem) {
    if (!uid) return;
    try {
      await setDoc(doc(db, "investors", uid, "portfolio", item.id), {
        name: item.name,
        icon: item.icon,
        category: item.category,
        stage: item.stage,
        status: "intro_sent",
        notes: "",
        added_at: serverTimestamp(),
      }, { merge: true });
    } catch {
      // ignore
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
            <p className="mt-3 font-semibold text-zinc-600">{t("empty_title")}</p>
            <p className="mt-1 text-sm">{t("empty_desc")}</p>
            <Link href={`/${locale}/investor/dealflow`} className="mt-3 inline-block text-sm text-emerald-600 hover:underline">{t("discover_deal_flow")}</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {list.map(item => (
              <div key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 text-xl overflow-hidden">
                  {item.icon.startsWith("http") ? <img src={item.icon} alt="" className="h-full w-full object-cover" /> : item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <Link href={`/${locale}/project/${item.id}`} className="font-bold text-zinc-900 hover:text-emerald-600 transition-colors">{item.name}</Link>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.regionFlag} · {item.category} · {item.stage}</p>
                  <p className="text-sm text-zinc-400 truncate mt-0.5">{item.tagline}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {caps.portfolioTracker && (
                    <button onClick={() => track(item)} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors">{t("track_in_portfolio")}</button>
                  )}
                  <Link href={`/${locale}/project/${item.id}`} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:border-emerald-300 transition-colors">{t("details")}</Link>
                  <button onClick={() => remove(item.id)} className="rounded-lg border border-zinc-100 px-3 py-1.5 text-xs text-zinc-400 hover:text-red-500 hover:border-red-200 transition-colors">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && list.length > 0 && (
          <p className="mt-4 text-center text-xs text-zinc-400">
            {list.length} / {Number.isFinite(maxWatchlist) ? maxWatchlist : "∞"}
          </p>
        )}
        {!loading && atLimit && Number.isFinite(maxWatchlist) && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-700">
            {t("free_limit")} · <Link href={`/${locale}/investor/billing`} className="font-bold hover:underline">{t("upgrade_angel")}</Link>
          </div>
        )}
      </main>
    </div>
  );
}
