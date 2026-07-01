"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { REGIONS } from "@/lib/regions";
import { INVESTOR_FOCUS, CHECK_SIZES, DEALS_PER_YEAR } from "@/lib/funding";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { planCaps } from "@/lib/entitlements";
import { HelpTip } from "@/components/HelpTip";
import { Navbar } from "@/components/layout/navbar";
import { useTaxonomy } from "@/lib/taxonomy";

const ROLES = [
  { id: "angel", labelKey: "role_angel" },
  { id: "vc_partner", labelKey: "role_vc_partner" },
  { id: "vc_associate", labelKey: "role_vc_associate" },
  { id: "family_office", labelKey: "role_family_office" },
  { id: "corporate_vc", labelKey: "role_corporate_vc" },
  { id: "micro_vc", labelKey: "role_micro_vc" },
  { id: "lp", labelKey: "role_lp" },
];

const STAGE_PREFS = [
  { id: "idea",       labelKey: "stage_idea" },
  { id: "pre_seed",   labelKey: "stage_pre_seed" },
  { id: "seed",       labelKey: "stage_seed" },
  { id: "series_a",   labelKey: "stage_series_a" },
  { id: "series_b",   labelKey: "stage_series_b" },
  { id: "bootstrapped", labelKey: "stage_bootstrapped" },
];

export default function InvestorProfilePage() {
  const t = useTranslations("investor_pages.profile");
  const tax = useTaxonomy();
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "en";

  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [role, setRole] = useState("angel");
  const [bio, setBio] = useState("");
  const [focus, setFocus] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [checkSize, setCheckSize] = useState("");
  const [dealsPerYear, setDealsPerYear] = useState("");
  const [region, setRegion] = useState("de");
  const [openToIntros, setOpenToIntros] = useState(true);
  const [saved, setSaved] = useState(false);
  const [tier, setTier] = useState<string | null>(null);

  const caps = planCaps(tier);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      if (!name) setName(user.displayName ?? "");
      try {
        const profileSnap = await getDoc(doc(db, "profiles", user.uid));
        if (profileSnap.exists()) setTier((profileSnap.data().plan_tier as string) ?? null);
      } catch {
        // Firebase not configured
      }
      try {
        const snap = await getDoc(doc(db, "investors", user.uid));
        if (snap.exists()) {
          const d = snap.data() as Record<string, unknown>;
          if (typeof d.name === "string" && d.name) setName(d.name);
          if (typeof d.firm === "string") setFirm(d.firm);
          if (typeof d.role === "string") setRole(d.role);
          if (typeof d.bio === "string") setBio(d.bio);
          if (Array.isArray(d.focus)) setFocus(d.focus as string[]);
          if (Array.isArray(d.stages)) setStages(d.stages as string[]);
          if (typeof d.checkSize === "string") setCheckSize(d.checkSize);
          if (typeof d.dealsPerYear === "string") setDealsPerYear(d.dealsPerYear);
          if (typeof d.region === "string") setRegion(d.region);
          if (typeof d.openToIntros === "boolean") setOpenToIntros(d.openToIntros);
        }
      } catch {
        // Firebase not configured
      }
    });
    return () => unsub();
  }, []);

  function toggle<T extends string>(set: React.Dispatch<React.SetStateAction<T[]>>, id: T) {
    set(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (uid) {
      try {
        await setDoc(doc(db, "investors", uid), {
          name, firm, role, bio, focus, stages, checkSize, dealsPerYear, region, openToIntros,
          updated_at: serverTimestamp(),
        }, { merge: true });
      } catch {
        // Firebase not configured
      }
    }
    setSaved(true);
    setTimeout(() => router.push(`/${locale}/investor`), 800);
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <Navbar />

      <main className="mx-auto max-w-2xl px-6 py-8">
        <form onSubmit={handleSave} className="flex flex-col gap-5">

          {/* Basis */}
          <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4">
            <h2 className="font-semibold text-zinc-900">{t("about_you")}</h2>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">{t("name")}</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">{t("firm_fund")} <span className="text-zinc-400 font-normal">{t("optional")}</span></label>
              <input value={firm} onChange={e => setFirm(e.target.value)} placeholder={t("firm_placeholder")}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700">{t("role")}</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <button key={r.id} type="button" onClick={() => setRole(r.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${role === r.id ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-emerald-300"}`}>
                    {t(r.labelKey)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">{t("bio_thesis")} <span className="text-zinc-400 font-normal">{t("optional")}</span></label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                placeholder={t("bio_placeholder")}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 resize-none" />
            </div>
          </section>

          {/* Investment-Fokus */}
          <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4">
            <h2 className="font-semibold text-zinc-900">{t("investment_focus")}</h2>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700">{t("industries_categories")}</label>
              <div className="flex flex-wrap gap-2">
                {INVESTOR_FOCUS.map(f => (
                  <button key={f.id} type="button" onClick={() => toggle(setFocus, f.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${focus.includes(f.id) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-emerald-300"}`}>
                    {tax.focus(f.id)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700">{t("preferred_stages")}<HelpTip term="funding_stage" /></label>
              <div className="flex flex-wrap gap-2">
                {STAGE_PREFS.map(s => (
                  <button key={s.id} type="button" onClick={() => toggle(setStages, s.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${stages.includes(s.id) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-emerald-300"}`}>
                    {t(s.labelKey)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700">{t("typical_check_size")}<HelpTip term="check_size" /></label>
              <div className="flex flex-wrap gap-2">
                {CHECK_SIZES.map(c => (
                  <button key={c.id} type="button" onClick={() => setCheckSize(c.id === checkSize ? "" : c.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${checkSize === c.id ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-emerald-300"}`}>
                    {tax.checkSize(c.id)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">{t("deals_per_year")}</label>
              <select value={dealsPerYear} onChange={e => setDealsPerYear(e.target.value)}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 w-56">
                <option value="">{t("deals_per_year_placeholder")}</option>
                {DEALS_PER_YEAR.map((r) => <option key={r.id} value={r.id}>{tax.dealsPerYear(r.id)}</option>)}
              </select>
            </div>
          </section>

          {/* Region */}
          <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
            <h2 className="font-semibold text-zinc-900">{t("region")}</h2>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map(r => (
                <button key={r.id} type="button" onClick={() => setRegion(r.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors flex items-center gap-1.5 ${region === r.id ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-emerald-300"}`}>
                  <span>{r.flag}</span><span>{tax.region(r.id)}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Intros */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-zinc-900 flex items-center gap-2">
                  {t("open_to_intros")}
                  {caps.investorVerifiedBadge && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">✔ Verified</span>
                  )}
                </p>
                <p className="text-sm text-zinc-500 mt-0.5">{t("open_to_intros_desc")}</p>
              </div>
              <button type="button" onClick={() => setOpenToIntros(!openToIntros)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${openToIntros ? "bg-emerald-600" : "bg-zinc-200"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${openToIntros ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              {Number.isFinite(caps.introsPerMonth) ? caps.introsPerMonth : "∞"} intros / month
            </p>
          </section>

          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saved ? t("saved") : t("save_profile")}
          </Button>
        </form>
      </main>
    </div>
  );
}
