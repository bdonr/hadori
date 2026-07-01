"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { Navbar } from "@/components/layout/navbar";
import { useTranslations } from "next-intl";
import { isStartupPaid } from "@/lib/entitlements";
import { REGIONS } from "@/lib/regions";
import { useTaxonomy } from "@/lib/taxonomy";

type View = "internal" | "external";

interface StartupDoc {
  name?: string; tagline?: string; description?: string; website?: string;
  industry?: string; teamSize?: string; neededSkills?: string[]; region?: string;
  stage?: string; mrrRange?: string; fundingGoal?: string; seekingInvestors?: boolean;
  is_discoverable?: boolean;
}

export default function StartupOverviewPage() {
  const t = useTranslations("startup_pages.overview");
  const tax = useTaxonomy();
  const { locale } = useParams<{ locale: string }>();
  const [view, setView] = useState<View>("internal");
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [startup, setStartup] = useState<StartupDoc | null>(null);
  const [tier, setTier] = useState("free");
  const [hasDeck, setHasDeck] = useState(false);
  const [deckPublic, setDeckPublic] = useState(false);
  const [planPublic, setPlanPublic] = useState(false);
  const [plan, setPlan] = useState<{ external?: { headline?: string; teaser?: string }; internal?: { coreIdea?: string } } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      setUid(user.uid);
      // Read each doc independently — one denied/failed read must never blank
      // out the others (a missing rule on one collection used to hide all).
      const safe = async <R,>(fn: () => Promise<R>): Promise<R | null> => {
        try { return await fn(); } catch { return null; }
      };
      const [s, p, d, bp] = await Promise.all([
        safe(() => getDoc(doc(db, "startups", user.uid))),
        safe(() => getDoc(doc(db, "profiles", user.uid))),
        safe(() => getDoc(doc(db, "pitchdecks", user.uid))),
        safe(() => getDoc(doc(db, "businessplans", user.uid))),
      ]);
      if (s?.exists()) setStartup(s.data() as StartupDoc);
      setTier((p?.data()?.plan_tier as string) ?? "free");
      setHasDeck(!!d?.exists());
      if (d?.exists()) setDeckPublic(d.data()?.isPublic === true);
      if (bp?.exists()) { setPlan(bp.data() as typeof plan); setPlanPublic(bp.data()?.showExternal === true); }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const paid = isStartupPaid(tier);
  const regionLabel = REGIONS.find((r) => r.id === startup?.region);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50"><Navbar />
        <div className="flex items-center justify-center pt-32 text-zinc-400">…</div>
      </div>
    );
  }

  // What the external audience actually sees (respects funding privacy / stealth).
  const external = view === "external";
  const showFunding = paid && startup?.is_discoverable;

  const profileComplete = !!(startup?.name && startup?.tagline && startup?.description);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex flex-col gap-1">
          <Link href={`/${locale}/startup`} className="text-sm text-zinc-500 hover:text-zinc-800">← {t("back")}</Link>
          <h1 className="text-2xl font-bold text-zinc-900">{t("title")}</h1>
          <p className="text-sm text-zinc-500">{t("subtitle")}</p>
        </div>

        {/* Internal / External toggle */}
        <div className="mt-6 inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
          <button onClick={() => setView("internal")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${!external ? "bg-indigo-600 text-white" : "text-zinc-600 hover:bg-zinc-50"}`}>
            🔒 {t("view_internal")}
          </button>
          <button onClick={() => setView("external")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${external ? "bg-indigo-600 text-white" : "text-zinc-600 hover:bg-zinc-50"}`}>
            🌍 {t("view_external")}
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-400">{external ? t("external_hint") : t("internal_hint")}</p>
        {external && uid && (
          <Link href={`/${locale}/company/${uid}`} target="_blank"
            className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            {t("view_public_page")}
          </Link>
        )}

        {/* Profile card */}
        <section className={`mt-5 rounded-2xl border bg-white p-6 shadow-sm ${external ? "border-emerald-200" : "border-zinc-200"}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900">{t("profile")}</h2>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${profileComplete ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {profileComplete ? t("complete") : t("incomplete")}
                </span>
              </div>
            </div>
            <Link href={`/${locale}/startup/profile`} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              {t("edit")}
            </Link>
          </div>

          {!startup?.name ? (
            <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-6 text-center">
              <p className="text-sm text-zinc-500">{t("not_created")}</p>
              <Link href={`/${locale}/startup/profile`} className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">{t("create_cta")}</Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xl font-extrabold text-zinc-900">{startup.name}</p>
                {startup.tagline && <p className="text-zinc-600">{startup.tagline}</p>}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {startup.industry && <Chip>{tax.focus(startup.industry)}</Chip>}
                {regionLabel && <Chip>{regionLabel.flag} {tax.region(regionLabel.id)}</Chip>}
                {startup.teamSize && <Chip>{t("team")}: {startup.teamSize}</Chip>}
              </div>
              {startup.description && <p className="text-sm leading-relaxed text-zinc-600">{startup.description}</p>}
              {startup.neededSkills && startup.neededSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {startup.neededSkills.map((s) => <span key={s} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-600">{tax.skill(s)}</span>)}
                </div>
              )}

              {/* Funding block — differs internal vs external */}
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">{t("funding")}</p>
                {external ? (
                  showFunding ? (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {startup.stage && <Chip>{tax.stage(startup.stage)}</Chip>}
                      {startup.mrrRange && <Chip>MRR: {tax.mrr(startup.mrrRange)}</Chip>}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400">🔒 {t("funding_hidden")}</p>
                  )
                ) : (
                  <div className="space-y-1 text-sm text-zinc-600">
                    <p>{t("stage")}: <strong>{startup.stage ? tax.stage(startup.stage) : "—"}</strong></p>
                    <p>MRR: <strong>{startup.mrrRange ? tax.mrr(startup.mrrRange) : "—"}</strong></p>
                    <p>{t("funding_goal")}: <strong>{startup.fundingGoal ? tax.fundingRange(startup.fundingGoal) : "—"}</strong></p>
                    <p>{t("seeking_investors")}: <strong>{startup.seekingInvestors ? t("yes") : t("no")}</strong></p>
                    {!paid && <p className="text-xs text-amber-600">{t("funding_pro_only")}</p>}
                  </div>
                )}
              </div>

              {external && (
                <p className="text-xs text-zinc-400">
                  {startup.is_discoverable ? t("visible_note") : t("hidden_note")}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Pitchdeck + Business plan tiles */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <DocTile
            emoji="🎯" title={t("pitchdeck")}
            href={external && deckPublic && uid ? `/${locale}/company/${uid}` : `/${locale}/startup/pitchdeck`}
            status={external ? (deckPublic ? t("public_status") : t("private_status")) : (hasDeck ? t("complete") : t("not_created"))}
            ok={external ? deckPublic : hasDeck}
            desc={external ? t("pitchdeck_external") : t("pitchdeck_internal")}
            cta={external ? (deckPublic ? t("view_public") : t("release_in_editor")) : (hasDeck ? t("open") : t("create_cta"))}
          />
          <DocTile
            emoji="📄" title={t("businessplan")}
            href={external && planPublic && uid ? `/${locale}/company/${uid}` : `/${locale}/startup/plan`}
            status={external ? (planPublic ? t("public_status") : t("private_status")) : (plan ? t("complete") : t("not_saved_yet"))}
            ok={external ? planPublic : !!plan}
            desc={
              plan
                ? (external
                    ? (plan.external?.teaser || plan.external?.headline || t("plan_external"))
                    : (plan.internal?.coreIdea || t("plan_internal")))
                : (external ? t("plan_external") : t("plan_internal"))
            }
            cta={external ? (planPublic ? t("view_public") : t("release_in_editor")) : (plan ? t("open") : t("create_cta"))}
          />
        </div>

        {/* AI teaser (Phase B) */}
        <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-semibold text-violet-900">{t("ai_title")}</p>
              <p className="mt-0.5 text-sm text-violet-700">{t("ai_desc")}</p>
              <span className="mt-2 inline-block rounded-full bg-violet-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-800">{t("coming_soon")}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-zinc-600">{children}</span>;
}

function DocTile({ emoji, title, href, status, ok, desc, cta }: {
  emoji: string; title: string; href: string; status: string; ok: boolean; desc: string; cta: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-3xl">{emoji}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ok ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{status}</span>
      </div>
      <h3 className="mt-3 font-bold text-zinc-900">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-zinc-500">{desc}</p>
      <Link href={href} className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700">{cta}</Link>
    </div>
  );
}
