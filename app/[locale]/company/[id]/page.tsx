"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { isInvestorPaid, planCaps } from "@/lib/entitlements";
import { useTaxonomy } from "@/lib/taxonomy";
import { REGIONS } from "@/lib/regions";
import { Navbar } from "@/components/layout/navbar";

/* ──────────────────────────────────────────────
   Slide + option definitions — mirrors
   app/[locale]/startup/pitchdeck/page.tsx so the
   public view renders the exact same fields/labels.
────────────────────────────────────────────── */
type FieldType = "select" | "multiselect";

interface SlideField {
  labelKey: string;
  type?: FieldType;
  options?: string;
}

interface Slide {
  id: string;
  icon: string;
  titleKey: string;
  fields: SlideField[];
}

const OPTIONS: Record<string, string[]> = {
  audience: ["consumer", "smb", "enterprise", "freelancer", "creator", "student", "developer", "healthcare", "hr", "founder", "public_sector", "other"],
  revenue_model: ["subscription", "transaction_fee", "freemium", "one_time", "marketplace_fee", "ads", "licensing", "usage_based", "service", "other"],
  price_point: ["free", "low", "mid", "high", "enterprise"],
  money_market: ["lt100k", "m100k_1m", "m1m_10m", "m10m_100m", "m100m_1b", "gt1b"],
  money_raise: ["lt50k", "r50k_250k", "r250k_1m", "r1m_3m", "r3m_10m", "gt10m"],
  moat: ["technology", "brand", "network_effect", "data", "cost", "speed", "community", "ip", "other"],
  roles: ["ceo", "cto", "cmo", "coo", "cfo", "product", "engineering", "design", "sales", "marketing", "ops", "other"],
  use_of_funds: ["product", "eng_team", "sales", "marketing", "operations", "international", "other"],
};

const SLIDES: Slide[] = [
  {
    id: "problem", icon: "🔥", titleKey: "slide_problem_title",
    fields: [
      { labelKey: "slide_problem_f1_label" },
      { labelKey: "slide_problem_f2_label", type: "multiselect", options: "audience" },
    ],
  },
  {
    id: "solution", icon: "💡", titleKey: "slide_solution_title",
    fields: [
      { labelKey: "slide_solution_f1_label" },
      { labelKey: "slide_solution_f2_label" },
    ],
  },
  {
    id: "model", icon: "💰", titleKey: "slide_model_title",
    fields: [
      { labelKey: "slide_model_f1_label", type: "select", options: "revenue_model" },
      { labelKey: "slide_model_f2_label", type: "select", options: "price_point" },
    ],
  },
  {
    id: "market", icon: "📊", titleKey: "slide_market_title",
    fields: [
      { labelKey: "slide_market_f1_label", type: "select", options: "money_market" },
      { labelKey: "slide_market_f2_label", type: "select", options: "money_market" },
    ],
  },
  {
    id: "traction", icon: "🚀", titleKey: "slide_traction_title",
    fields: [
      { labelKey: "slide_traction_f1_label" },
      { labelKey: "slide_traction_f2_label" },
    ],
  },
  {
    id: "competitors", icon: "⚔️", titleKey: "slide_competitors_title",
    fields: [
      { labelKey: "slide_competitors_f1_label" },
      { labelKey: "slide_competitors_f2_label", type: "multiselect", options: "moat" },
    ],
  },
  {
    id: "team", icon: "👥", titleKey: "slide_team_title",
    fields: [
      { labelKey: "slide_team_f1_label", type: "multiselect", options: "roles" },
      { labelKey: "slide_team_f2_label", type: "multiselect", options: "roles" },
    ],
  },
  {
    id: "ask", icon: "🎯", titleKey: "slide_ask_title",
    fields: [
      { labelKey: "slide_ask_f1_label", type: "select", options: "money_raise" },
      { labelKey: "slide_ask_f2_label", type: "multiselect", options: "use_of_funds" },
    ],
  },
];

/* ──────────────────────────────────────────────
   Data shapes (only the public-facing bits)
────────────────────────────────────────────── */
interface PublicProfile { full_name?: string; role?: string; avatar_url?: string; verified?: boolean; }
interface StartupDoc {
  name?: string; tagline?: string; description?: string;
  industry?: string; region?: string;
}
interface PitchDeckDoc {
  slides?: Record<string, Record<string, string | string[]>>;
  images?: Record<string, string>;
  isPublic?: boolean;
  slidePublic?: Record<string, boolean>;
}
interface BusinessPlanExternal { headline?: string; whatWeDo?: string; forWhom?: string; teaser?: string; }
interface BusinessPlanDoc { external?: BusinessPlanExternal; showExternal?: boolean; }

export default function CompanyPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const routeParams = useParams();
  const locale = (routeParams.locale as string) ?? "en";
  const t = useTranslations("company");
  // Pitch-deck slide titles + option labels live in the pitchdeck namespace.
  const tp = useTranslations("startup_pages.pitchdeck");
  const tax = useTaxonomy();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [startup, setStartup] = useState<StartupDoc | null>(null);
  const [deck, setDeck] = useState<PitchDeckDoc | null>(null);
  const [plan, setPlan] = useState<BusinessPlanDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [myTier, setMyTier] = useState<string | null>(null);
  const [myName, setMyName] = useState("");
  const [requested, setRequested] = useState(false);
  const [introsThisMonth, setIntrosThisMonth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Each read is wrapped independently so one failure (e.g. a rule
      // denies pitchdecks) never blanks out the rest of the page.
      const [prof, st, pd, bp] = await Promise.all([
        getDoc(doc(db, "publicProfiles", id)).catch(() => null),
        getDoc(doc(db, "startups", id)).catch(() => null),
        getDoc(doc(db, "pitchdecks", id)).catch(() => null),
        getDoc(doc(db, "businessplans", id)).catch(() => null),
      ]);
      if (cancelled) return;
      if (prof?.exists()) setProfile(prof.data() as PublicProfile);
      if (st?.exists()) setStartup(st.data() as StartupDoc);
      if (pd?.exists()) setDeck(pd.data() as PitchDeckDoc);
      if (bp?.exists()) setPlan(bp.data() as BusinessPlanDoc);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUid(user?.uid ?? null);
      if (!user) return;
      try {
        const myProfileSnap = await getDoc(doc(db, "profiles", user.uid));
        if (myProfileSnap.exists()) {
          setMyRole((myProfileSnap.data().role as string) ?? null);
          setMyTier((myProfileSnap.data().plan_tier as string) ?? null);
        }
        const myPubSnap = await getDoc(doc(db, "publicProfiles", user.uid));
        if (myPubSnap.exists()) setMyName((myPubSnap.data().full_name as string) ?? "");

        const reqSnap = await getDocs(
          query(collection(db, "applications"), where("fromUid", "==", user.uid))
        );
        const myReqs = reqSnap.docs
          .map(d => d.data() as Record<string, unknown>)
          .filter(d => d.type === "startup_request");
        if (myReqs.some(d => d.toUid === id)) setRequested(true);
        const now = new Date();
        setIntrosThisMonth(myReqs.filter(d => {
          const ts = d.created_at as { toDate?: () => Date } | null | undefined;
          if (!ts?.toDate) return true;
          const created = ts.toDate();
          return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
        }).length);
      } catch { /* ignore */ }
    });
    return () => unsub();
  }, [id]);

  const isInvestorViewer = myRole === "investor";
  const canRequestIntro = isInvestorPaid(myTier);
  const introCap = planCaps(myTier).introsPerMonth;
  const atIntroLimit = introsThisMonth >= introCap;

  async function requestIntro() {
    if (!authUid || !canRequestIntro || atIntroLimit || requested || authUid === id) return;
    setRequested(true);
    setIntrosThisMonth(prev => prev + 1);
    try {
      await addDoc(collection(db, "applications"), {
        fromUid: authUid,
        toUid: id,
        type: "startup_request",
        fromName: myName,
        toName: (startup?.name || profile?.full_name || ""),
        subjectTitle: startup?.name || "",
        status: "pending",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    } catch { /* keep optimistic state */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="flex items-center justify-center py-40">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      </div>
    );
  }

  const region = startup?.region ? REGIONS.find((r) => r.id === startup.region) : undefined;

  // Which pitch-deck slides did the founder actually release?
  const releasedSlides =
    deck?.isPublic === true
      ? SLIDES.filter((s) => deck.slidePublic?.[s.id] === true)
      : [];

  const showPlanTeaser =
    plan?.showExternal === true &&
    !!plan.external &&
    !!(plan.external.headline || plan.external.whatWeDo || plan.external.forWhom || plan.external.teaser);

  const hasStartup = !!startup;
  const hasAnythingPublic = hasStartup || showPlanTeaser || releasedSlides.length > 0;

  /* Render a single stored value (text or select/multiselect ids → labels). */
  function renderFieldValue(field: SlideField, raw: string | string[] | undefined) {
    if (raw == null || (Array.isArray(raw) && raw.length === 0) || raw === "") return null;

    if (field.options && OPTIONS[field.options]) {
      const set = field.options;
      const known = new Set(OPTIONS[set]);
      const ids = Array.isArray(raw) ? raw : [raw];
      return (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {ids.map((v) => (
            <span key={v} className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {known.has(v) ? tp(`opt_${set}_${v}`) : v}
            </span>
          ))}
        </div>
      );
    }

    // Free text (or array without a known option set → join)
    const text = Array.isArray(raw) ? raw.join(", ") : raw;
    return <p className="mt-0.5 text-sm leading-relaxed text-zinc-600 whitespace-pre-line">{text}</p>;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">

        {/* Header */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-zinc-900">
              {startup?.name || t("untitled")}
            </h1>
            {profile?.verified === true && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                ✔ {t("verified_badge")}
              </span>
            )}
            {startup?.industry && (
              <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-0.5 text-xs font-semibold text-indigo-700">
                {tax.focus(startup.industry)}
              </span>
            )}
            {region && (
              <span className="rounded-full bg-zinc-50 border border-zinc-200 px-3 py-0.5 text-xs font-medium text-zinc-500">
                {region.flag} {tax.region(region.id)}
              </span>
            )}
          </div>
          {startup?.tagline && <p className="mt-1 text-base text-zinc-600">{startup.tagline}</p>}
          {profile?.full_name && (
            <div className="mt-4 flex items-center gap-3">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.full_name} className="h-9 w-9 rounded-full object-cover border border-zinc-100" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-sm font-bold text-indigo-600">
                  {profile.full_name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="text-sm">
                <span className="text-zinc-400">{t("founded_by")} </span>
                <span className="font-semibold text-zinc-800">{profile.full_name}</span>
                {profile.role && <span className="text-zinc-400"> · {profile.role}</span>}
              </div>
            </div>
          )}
          {isInvestorViewer && authUid !== id && (
            <div className="mt-5">
              {requested ? (
                <span className="inline-block rounded-xl bg-green-50 border border-green-200 px-6 py-3 text-sm font-semibold text-green-700">{t("intro_requested")}</span>
              ) : !canRequestIntro ? (
                <div className="flex flex-col gap-1">
                  <button disabled className="w-fit rounded-xl bg-zinc-200 px-6 py-3 text-sm font-bold text-zinc-400 cursor-not-allowed">
                    {t("request_intro")}
                  </button>
                  <Link href={`/${locale}/investor/billing`} className="text-xs font-semibold text-emerald-600 hover:underline">
                    {t("intro_requires_paid")}
                  </Link>
                </div>
              ) : (
                <button onClick={requestIntro} disabled={atIntroLimit}
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {atIntroLimit ? t("intro_limit_reached") : t("request_intro")}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Empty state */}
        {!hasAnythingPublic && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
            <span className="text-4xl">🌱</span>
            <h2 className="mt-3 text-lg font-bold text-zinc-900">{t("empty_title")}</h2>
            <p className="mt-1 text-sm text-zinc-500">{t("empty_desc")}</p>
            <Link href={`/${locale}/explore`} className="mt-5 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
              {t("explore_cta")}
            </Link>
          </div>
        )}

        {/* Description */}
        {startup?.description && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-bold text-zinc-900">{t("about_heading")}</h2>
            <p className="text-sm leading-relaxed text-zinc-600 whitespace-pre-line">{startup.description}</p>
          </div>
        )}

        {/* Business plan teaser */}
        {showPlanTeaser && plan?.external && (
          <div className="mt-6 rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">{t("plan_teaser_label")}</p>
            {plan.external.headline && (
              <h2 className="mt-1 text-xl font-extrabold text-zinc-900">{plan.external.headline}</h2>
            )}
            {plan.external.whatWeDo && <TeaserField label={t("plan_whatWeDo")} value={plan.external.whatWeDo} />}
            {plan.external.forWhom && <TeaserField label={t("plan_forWhom")} value={plan.external.forWhom} />}
            {plan.external.teaser && <TeaserField label={t("plan_teaser")} value={plan.external.teaser} />}
          </div>
        )}

        {/* Pitch deck — released slides only */}
        {releasedSlides.length > 0 && (
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-bold text-zinc-900">{t("pitchdeck_heading")}</h2>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {releasedSlides.map((slide) => {
                const slideValues = deck?.slides?.[slide.id] ?? {};
                const image = deck?.images?.[slide.id];
                return (
                  <div key={slide.id} className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-2xl">{slide.icon}</span>
                      <h3 className="font-bold text-zinc-900">{tp(slide.titleKey)}</h3>
                    </div>
                    {image && (
                      <div className="mb-3 overflow-hidden rounded-xl border border-zinc-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt="" className="h-40 w-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-col gap-3">
                      {slide.fields.map((f) => {
                        const rendered = renderFieldValue(f, slideValues[f.labelKey]);
                        if (!rendered) return null;
                        return (
                          <div key={f.labelKey}>
                            <p className="text-xs font-medium text-zinc-500">{tp(f.labelKey)}</p>
                            {rendered}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TeaserField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-0.5 text-sm leading-relaxed text-zinc-600 whitespace-pre-line">{value}</p>
    </div>
  );
}
