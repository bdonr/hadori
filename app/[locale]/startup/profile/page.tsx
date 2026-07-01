"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { SkillPicker } from "@/components/SkillPicker";
import { REGIONS } from "@/lib/regions";
import { FUNDING_STAGES, MRR_RANGES } from "@/lib/funding";
import { Navbar } from "@/components/layout/navbar";
import { useTranslations } from "next-intl";

const TEAM_SIZES = ["1", "2–5", "6–15", "16–50", "50+"];

const CATEGORIES = [
  "SaaS","Creator / Streaming","E-Commerce","Fintech","Health / MedTech",
  "Deep Tech / AI","Marketplace","EdTech","Climate / Greentech",
  "Musik / Entertainment","Gaming","Sonstiges",
];

export default function StartupProfilePage() {
  const t = useTranslations("startup_pages.profile");
  const [uid, setUid] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      setUid(user.uid);

      try {
        // Load existing data
        const snap = await getDoc(doc(db, "startups", user.uid));
        if (snap.exists()) {
          const d = snap.data() as Record<string, unknown>;
          if (d.name) setName(d.name as string);
          if (d.tagline) setTagline(d.tagline as string);
          if (d.description) setDescription(d.description as string);
          if (d.website) setWebsite(d.website as string);
          if (d.industry) setCategory(d.industry as string);
          if (d.teamSize) setTeamSize(d.teamSize as string);
          if (d.neededSkills) setNeededSkills(d.neededSkills as string[]);
          if (d.region) setRegion(d.region as string);
          if (d.stage) setStage(d.stage as string);
          if (d.mrrRange) setMrrRange(d.mrrRange as string);
          if (d.fundingGoal) setFundingGoal(d.fundingGoal as string);
          if (d.seekingInvestors) setSeekingInvestors(d.seekingInvestors as boolean);
        }

        // Check tier
        const profileSnap = await getDoc(doc(db, "profiles", user.uid));
        const tier = profileSnap.data()?.plan_tier ?? "free";
        setIsPro(tier === "startup" || tier === "startup_pro" || tier === "scale");
      } catch {
        // Read failed — still let the user fill in and save their profile
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  async function handleSave() {
    if (!uid || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, "startups", uid), {
        id: uid,
        owner_uid: uid,
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        website: website.trim(),
        industry: category,
        teamSize,
        neededSkills,
        region,
        stage,
        mrrRange: isPro ? mrrRange : "",
        fundingGoal: isPro ? fundingGoal.trim() : "",
        seekingInvestors: isPro ? seekingInvestors : false,
        is_discoverable: false,
        updated_at: now,
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("save_error"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="flex items-center justify-center pt-32 text-zinc-400">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <Link href="/startup" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 mb-4">
          {t("back_dashboard")}
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">{t("page_title")}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 flex flex-col gap-5">
        {/* Section 1 */}
        <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-semibold text-zinc-800">{t("section_startup")}</h2>

          <div className="flex flex-col gap-1">
            <label htmlFor="sp-name" className="text-sm font-medium text-zinc-700">{t("name")}</label>
            <input id="sp-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={t("name_placeholder")}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="sp-tagline" className="text-sm font-medium text-zinc-700">{t("tagline")}</label>
            <input id="sp-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)}
              placeholder={t("tagline_placeholder")}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="sp-desc" className="text-sm font-medium text-zinc-700">{t("description")}</label>
            <textarea id="sp-desc" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={t("description_placeholder")} rows={4}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="sp-web" className="text-sm font-medium text-zinc-700">{t("website")}</label>
            <input id="sp-web" value={website} onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://" type="url"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700">{t("category")}</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => setCategory(cat === category ? "" : cat)}
                  className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                    category === cat ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Team */}
        <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-semibold text-zinc-800">{t("section_team")}</h2>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700">{t("team_size")}</label>
            <div className="flex flex-wrap gap-2">
              {TEAM_SIZES.map((size) => (
                <button key={size} type="button" onClick={() => setTeamSize(size === teamSize ? "" : size)}
                  className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                    teamSize === size ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400"
                  }`}>
                  {size}
                </button>
              ))}
            </div>
          </div>
          <SkillPicker label={t("skills_label")} selected={neededSkills} onChange={setNeededSkills} max={10} />
        </section>

        {/* Section 3: Region */}
        <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-semibold text-zinc-800">{t("section_region")}</h2>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button key={r.id} type="button" onClick={() => setRegion(r.id)}
                className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors flex items-center gap-1.5 ${
                  region === r.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400"
                }`}>
                <span>{r.flag}</span><span>{r.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Section 4: Funding (PRO) */}
        <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-semibold text-zinc-800">{t("section_funding")}</h2>
          <div className="relative">
            <div className={`flex flex-col gap-4 ${!isPro ? "blur-sm pointer-events-none select-none" : ""}`}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">{t("funding_stage")}</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {FUNDING_STAGES.map((s) => (
                    <button key={s.id} type="button" onClick={() => setStage(s.id === stage ? "" : s.id)}
                      className={`rounded-xl border p-3 text-left transition-colors ${stage === s.id ? "border-indigo-500 bg-indigo-50" : "border-zinc-200 bg-white hover:border-indigo-300"}`}>
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
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">{t("current_mrr")}</label>
                <div className="flex flex-wrap gap-2">
                  {MRR_RANGES.map((m) => (
                    <button key={m.id} type="button" onClick={() => setMrrRange(m.id === mrrRange ? "" : m.id)}
                      className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${mrrRange === m.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400"}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="sp-funding" className="text-sm font-medium text-zinc-700">{t("funding_goal")}</label>
                <input id="sp-funding" value={fundingGoal} onChange={(e) => setFundingGoal(e.target.value)}
                  placeholder={t("funding_goal_placeholder")}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={seekingInvestors} onChange={(e) => setSeekingInvestors(e.target.checked)}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-zinc-700">{t("seeking_investors")}</span>
              </label>
            </div>
            {!isPro && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/60 backdrop-blur-[2px]">
                <span className="text-3xl">🔒</span>
                <p className="text-sm font-semibold text-zinc-800 text-center">{t("funding_pro_note")}</p>
                <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Link href="/startup/billing">{t("unlock_pro_cta")}</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Save */}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={!name.trim() || saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">
            {saving ? t("saving") : saved ? t("saved") : t("save")}
          </Button>
          {saved && <span className="text-sm text-green-600 font-medium">{t("changes_saved")}</span>}
        </div>
      </div>
    </div>
  );
}
