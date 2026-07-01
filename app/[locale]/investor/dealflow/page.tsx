"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, getDoc, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { isInvestorPaid, planCaps } from "@/lib/entitlements";
import { REGIONS } from "@/lib/regions";
import { FUNDING_STAGES, MRR_RANGES } from "@/lib/funding";
import { Navbar } from "@/components/layout/navbar";

type Deal = {
  id: string; name: string; icon: string; tagline: string; industry: string;
  teamSize: string; region: string; stage: string; mrrRange: string;
  updatedAt: string; isNew: boolean; seekingInvestors: boolean;
};

export default function DealFlowPage() {
  const t = useTranslations("investor_pages.dealflow");
  const params = useParams();
  const locale = (params?.locale as string) ?? "de";
  const [filter, setFilter] = useState("all");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);

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
        const snap = await getDocs(query(collection(db, "startups"), where("is_discoverable", "==", true)));
        const base = snap.docs.map(d => {
          const data = d.data();
          const updatedAt = (data.updated_at as string) ?? "";
          const isNew = updatedAt ? (Date.now() - new Date(updatedAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
          return {
            id: d.id,
            name: (data.name as string) ?? "",
            tagline: (data.tagline as string) ?? "",
            industry: (data.industry as string) ?? "",
            teamSize: (data.teamSize as string) ?? "",
            region: (data.region as string) ?? "",
            stage: (data.stage as string) ?? "",
            mrrRange: (data.mrrRange as string) ?? "",
            updatedAt,
            isNew,
            seekingInvestors: !!data.seekingInvestors,
          };
        });
        const withIcons = await Promise.all(base.map(async (b) => {
          let icon = "🚀";
          try {
            const pp = await getDoc(doc(db, "publicProfiles", b.id));
            if (pp.exists() && pp.data().avatar_url) icon = pp.data().avatar_url as string;
          } catch {
            // ignore
          }
          return { ...b, icon };
        }));
        withIcons.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setDeals(withIcons);
      } catch {
        // Firebase not configured / query failed
      }
      try {
        const wl = await getDocs(collection(db, "investors", user.uid, "watchlist"));
        setSaved(new Set(wl.docs.map(d => d.id)));
      } catch {
        // ignore
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const caps = planCaps(tier);
  const canSeeDeals = isInvestorPaid(tier);        // Angel+
  const canSeeDetails = caps.startupDetails;       // Angel+ (names)
  const canSeeFunding = caps.fundingData;          // Pro+ (MRR/stage)
  const maxWatchlist = caps.watchlistLimit;

  const newCount = deals.filter(d => d.isNew).length;
  const items = filter === "new" ? deals.filter(d => d.isNew) : deals;

  async function toggleSave(deal: Deal) {
    const isSaved = saved.has(deal.id);
    if (!isSaved && saved.size >= maxWatchlist) {
      setLimitHit(true);
      return;
    }
    setLimitHit(false);
    setSaved(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(deal.id); else next.add(deal.id);
      return next;
    });
    if (!uid) return;
    try {
      const ref = doc(db, "investors", uid, "watchlist", deal.id);
      if (isSaved) {
        await deleteDoc(ref);
      } else {
        const region = REGIONS.find(r => r.id === deal.region);
        await setDoc(ref, {
          name: deal.name,
          icon: deal.icon,
          category: deal.industry,
          stage: deal.stage,
          regionFlag: region?.flag ?? "🌐",
          tagline: deal.tagline,
          added_at: serverTimestamp(),
        }, { merge: true });
      }
    } catch {
      // optimistic update already applied
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {!canSeeDeals ? (
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
            <span className="text-4xl">🛰️</span>
            <p className="mt-3 font-semibold text-zinc-600">{t("empty_title")}</p>
            <p className="mt-1 text-sm">{t("empty_desc")}</p>
          </div>
        ) : (
          <>
            {/* Info bar */}
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 flex items-center gap-3">
              <span className="text-lg">📬</span>
              <p className="text-sm text-emerald-800">
                <strong>{t("new_startups", { n: newCount })}</strong> {t("this_week")}
              </p>
            </div>

            {/* Filters */}
            <div className="mb-5 flex gap-2">
              {[["all", t("filter_all")], ["new", t("filter_new")]].map(([id, label]) => (
                <button key={id} onClick={() => setFilter(id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === id ? "bg-emerald-600 text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300"}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              {items.map(deal => {
                const region = REGIONS.find(r => r.id === deal.region);
                const stage = FUNDING_STAGES.find(s => s.id === deal.stage);
                const mrrLabel = MRR_RANGES.find(m => m.id === deal.mrrRange)?.label ?? deal.mrrRange;
                return (
                  <div key={deal.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-2xl overflow-hidden">
                        {deal.icon.startsWith("http") ? <img src={deal.icon} alt="" className="h-full w-full object-cover" /> : deal.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-zinc-900">{canSeeDetails ? deal.name : t("stealth_project")}</span>
                              {deal.isNew && <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">{t("badge_new")}</span>}
                            </div>
                            <p className="text-sm text-zinc-500 mt-0.5">{deal.tagline}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => toggleSave(deal)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${saved.has(deal.id) ? "bg-amber-100 text-amber-700" : "border border-zinc-200 text-zinc-500 hover:border-amber-300"}`}>
                              {saved.has(deal.id) ? t("saved") : t("save")}
                            </button>
                            <Link href={`/${locale}/project/${deal.id}`}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors">
                              {t("details")}
                            </Link>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
                          {region && <><span>{region.flag} {region.label}</span><span>·</span></>}
                          {stage && <><span>{stage.emoji} {stage.label}</span><span>·</span></>}
                          <span>{canSeeFunding ? t("mrr_label", { mrr: mrrLabel }) : t("mrr_label", { mrr: "🔒" })}</span>
                          {deal.teamSize && <><span>·</span><span>👥 {deal.teamSize}</span></>}
                          {deal.industry && <><span>·</span><span>{deal.industry}</span></>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {limitHit && Number.isFinite(maxWatchlist) && (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-700">
                {t("watchlist_limit_hit")} · <Link href={`/${locale}/investor/billing`} className="font-bold hover:underline">{t("upgrade_now")}</Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
