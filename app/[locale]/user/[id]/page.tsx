"use client";

import Link from "next/link";
import { useState, use, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LangSwitcher } from "@/components/LangSwitcher";
import { useTaxonomy } from "@/lib/taxonomy";
import { REGIONS, LANGUAGES } from "@/lib/regions";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import type { Profile } from "@/lib/firebase/collections";
import { Navbar } from "@/components/layout/navbar";

const AVAIL_META = {
  immediately:   { labelKey: "avail_immediately",   color: "bg-green-50 border-green-200 text-green-700" },
  part_time:     { labelKey: "avail_part_time",      color: "bg-amber-50 border-amber-200 text-amber-700" },
  project_based: { labelKey: "avail_project_based",  color: "bg-amber-50 border-amber-200 text-amber-700" },
  "1_month":     { labelKey: "avail_1_month",        color: "bg-amber-50 border-amber-200 text-amber-700" },
  "3_months":    { labelKey: "avail_3_months",       color: "bg-zinc-100 border-zinc-200 text-zinc-500" },
  not_available: { labelKey: "avail_not_available",  color: "bg-zinc-100 border-zinc-200 text-zinc-400" },
  not_looking:   { labelKey: "avail_not_looking",    color: "bg-zinc-100 border-zinc-200 text-zinc-400" },
} as const;

const EXPERIENCE_LABEL: Record<string, string> = {
  beginner:     "exp_beginner",
  intermediate: "exp_intermediate",
  experienced:  "exp_experienced",
  expert:       "exp_expert",
  junior:       "exp_junior",
};

interface TalentData {
  headline?: string;
  bio?: string;
  skills?: string[];
  experience?: string;
  availability?: string;
  remote?: boolean;
  regions?: string[];
  languages?: string[];
  portfolio_url?: string;
  publicFields?: Partial<PublicFields>;
}

type PublicFields = {
  skills: boolean;
  bio: boolean;
  experience: boolean;
  availability: boolean;
  regions: boolean;
  languages: boolean;
};

interface PortfolioItem {
  id: string;
  title: string;
  mediaType: string;
  url?: string;
}

const MEDIA_ICON: Record<string, string> = {
  video: "🎬", image: "🖼️", audio: "🎵", link: "🔗", pdf: "📄",
};

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const routeParams = useParams();
  const locale = (routeParams.locale as string) ?? "en";
  const t = useTranslations("misc_pages.user_detail");
  const tax = useTaxonomy();

  const [authUid, setAuthUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [talent, setTalent] = useState<TalentData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacted, setContacted] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUid(user?.uid ?? null);
      const targetUid = id === "me" ? user?.uid : id;
      if (!targetUid) { setLoading(false); return; }

      try {
        // Read the PUBLIC profile (name/role) — the private profiles doc is
        // owner-only. Reads are independent so one failure never blanks the page.
        const [profileSnap, talentSnap] = await Promise.all([
          getDoc(doc(db, "publicProfiles", targetUid)).catch(() => null),
          getDoc(doc(db, "talent", targetUid)).catch(() => null),
        ]);
        const p = profileSnap?.exists() ? profileSnap.data() as Profile : null;
        const t = talentSnap?.exists() ? talentSnap.data() as TalentData : null;
        setProfile(p);
        setTalent(t);

        // Load portfolio items (public)
        if (p) {
          try {
            const pSnap = await getDocs(collection(db, "portfolios", targetUid, "items"));
            setPortfolio(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioItem)));
          } catch {
            // portfolio not found or no permission — silently skip
          }
        }
      } catch {
        // Firebase offline / not configured
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const isOwnProfile = id === "me" || (authUid !== null && id === authUid);

  // Per-field visibility. Owner sees everything. A totally-absent publicFields
  // object means a legacy profile → show skills+bio only. Otherwise a field is
  // shown only when explicitly marked public.
  const hasPublicFields = !!talent && talent.publicFields != null;
  function canShow(field: keyof PublicFields): boolean {
    if (isOwnProfile) return true;
    if (!hasPublicFields) return field === "skills" || field === "bio";
    return talent?.publicFields?.[field] === true;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <Navbar />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4 px-6">
        <span className="text-5xl">👤</span>
        {id === "me" && !authUid ? (
          <>
            <h1 className="text-xl font-bold text-zinc-900">{t("not_logged_in")}</h1>
            <Link href={`/${locale}/login`} className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
              {t("login_now")}
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-zinc-900">{t("profile_not_found")}</h1>
            <Link href={`/${locale}/explore`} className="text-sm text-indigo-600 hover:underline">← Explore</Link>
          </>
        )}
      </div>
    );
  }

  const displayName = profile.full_name || t("unknown");
  const bio = canShow("bio") ? (talent?.bio ?? "") : "";
  const skills = canShow("skills") ? (talent?.skills ?? []) : [];
  const showExperience = canShow("experience");
  const avail = canShow("availability") && talent?.availability
    ? AVAIL_META[talent.availability as keyof typeof AVAIL_META]
    : null;
  const regions = (canShow("regions") ? (talent?.regions ?? []) : [])
    .map(id => REGIONS.find(r => r.id === id))
    .filter(Boolean) as typeof REGIONS;
  const languages = (canShow("languages") ? (talent?.languages ?? []) : [])
    .map(id => LANGUAGES.find(l => l.id === id))
    .filter(Boolean) as typeof LANGUAGES;

  return (
    <div className="min-h-screen bg-zinc-50">

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Hero */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm mb-6">
          <div className="flex items-start gap-5">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName}
                className="h-16 w-16 shrink-0 rounded-2xl object-cover border border-zinc-100" />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-3xl font-bold text-indigo-600">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-zinc-900">{displayName}</h1>
                {isOwnProfile && (
                  <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{t("you")}</span>
                )}
              </div>
              {talent?.headline && (
                <p className="mt-1 text-sm font-medium text-zinc-500">{talent.headline}</p>
              )}
              {/* Status pills */}
              <div className="mt-2 flex flex-wrap gap-2">
                {avail && (
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${avail.color}`}>
                    {t(avail.labelKey)}
                  </span>
                )}
                {talent?.remote && (
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    🌍 {t("remote")}
                  </span>
                )}
                {showExperience && talent?.experience && EXPERIENCE_LABEL[talent.experience] && (
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    {t(EXPERIENCE_LABEL[talent.experience])}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 flex-wrap">
            {isOwnProfile ? (
              <Link href={`/${locale}/talent/skills`}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
                ✏️ {t("edit_profile")}
              </Link>
            ) : (
              !contacted ? (
                <button onClick={() => setContacted(true)}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
                  {t("request_contact")}
                </button>
              ) : (
                <span className="rounded-xl bg-green-50 border border-green-200 px-6 py-3 text-sm font-semibold text-green-700">
                  ✓ {t("request_sent")}
                </span>
              )
            )}
            <button onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="rounded-xl border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-600 hover:border-indigo-300 transition-colors">
              🔗 {t("share_profile")}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Bio */}
            {bio ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 font-bold text-zinc-900">{t("about_name", { name: displayName })}</h2>
                <p className="text-sm leading-relaxed text-zinc-600">{bio}</p>
              </div>
            ) : isOwnProfile ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6">
                <p className="text-sm text-zinc-400">
                  {t("no_bio_yet")}{" "}
                  <Link href={`/${locale}/talent/skills`} className="text-indigo-600 hover:underline">{t("add_now")}</Link>
                </p>
              </div>
            ) : null}

            {/* Skills */}
            {skills.length > 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-bold text-zinc-900">{t("skills")}</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span key={s} className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      i === 0 ? "bg-indigo-600 text-white" : "bg-indigo-50 border border-indigo-200 text-indigo-700"
                    }`}>
                      {tax.skill(s)}
                    </span>
                  ))}
                </div>
              </div>
            ) : isOwnProfile ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6">
                <p className="text-sm text-zinc-400">
                  {t("no_skills_yet")}{" "}
                  <Link href={`/${locale}/talent/skills`} className="text-indigo-600 hover:underline">{t("add_skills")}</Link>
                </p>
              </div>
            ) : null}

            {/* Sprachen & Region */}
            {(languages.length > 0 || regions.length > 0) && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-bold text-zinc-900">{t("languages_region")}</h2>
                {languages.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">{t("working_languages")}</p>
                    <div className="flex flex-wrap gap-2">
                      {languages.map(l => (
                        <span key={l.id} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-700">
                          {tax.language(l.id)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {regions.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">{t("regions")}</p>
                    <div className="flex flex-wrap gap-2">
                      {regions.map(r => (
                        <span key={r.id} className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-700">
                          <span>{r.flag}</span>
                          <span>{tax.region(r.id)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Portfolio-Vorschau */}
            {portfolio.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-zinc-900">{t("portfolio")}</h2>
                  {isOwnProfile && (
                    <Link href={`/${locale}/talent/portfolio`} className="text-xs text-indigo-600 hover:underline">{t("edit_all")}</Link>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {portfolio.slice(0, 4).map(item => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                      <span className="text-xl">{MEDIA_ICON[item.mediaType] ?? "📁"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-800">{item.title}</p>
                      </div>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 text-xs text-indigo-600 hover:underline">→</a>
                      )}
                    </div>
                  ))}
                </div>
                {portfolio.length > 4 && (
                  <p className="mt-3 text-xs text-zinc-400 text-center">{t("more_works", { count: portfolio.length - 4 })}</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Details-Card */}
            {talent && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">{t("details")}</p>
                <dl className="flex flex-col gap-2 text-sm">
                  {avail && (
                    <div className="flex items-center justify-between">
                      <dt className="text-zinc-500">{t("availability")}</dt>
                      <dd className="font-medium text-zinc-800">{t(avail.labelKey)}</dd>
                    </div>
                  )}
                  {showExperience && talent.experience && EXPERIENCE_LABEL[talent.experience] && (
                    <div className="flex items-center justify-between">
                      <dt className="text-zinc-500">{t("experience")}</dt>
                      <dd className="font-medium text-zinc-800">{t(EXPERIENCE_LABEL[talent.experience])}</dd>
                    </div>
                  )}
                  {talent.remote !== undefined && (
                    <div className="flex items-center justify-between">
                      <dt className="text-zinc-500">{t("remote")}</dt>
                      <dd className="font-medium text-zinc-800">{talent.remote ? t("yes") : t("no")}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {isOwnProfile ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{t("your_profile")}</p>
                <p className="text-sm text-zinc-600 mb-3">{t("your_profile_desc")}</p>
                <Link href={`/${locale}/talent/skills`}
                  className="block w-full rounded-lg bg-indigo-600 py-2 text-center text-xs font-bold text-white hover:bg-indigo-700 transition-colors">
                  {t("edit_profile_arrow")}
                </Link>
                {portfolio.length === 0 && (
                  <Link href={`/${locale}/talent/portfolio`}
                    className="mt-2 block w-full rounded-lg border border-indigo-200 py-2 text-center text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
                    {t("add_portfolio")}
                  </Link>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">{t("are_you_talent")}</p>
                <p className="text-sm text-indigo-700 mb-3">{t("are_you_talent_desc")}</p>
                <Link href={`/${locale}/signup`}
                  className="block w-full rounded-lg bg-indigo-600 py-2 text-center text-xs font-bold text-white hover:bg-indigo-700 transition-colors">
                  {t("create_profile")}
                </Link>
              </div>
            )}

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">{t("share")}</p>
              <button onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="w-full rounded-lg border border-zinc-200 py-2 text-xs font-semibold text-zinc-600 hover:border-indigo-300 transition-colors">
                🔗 {t("copy_link")}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-400">
          {t("discover_startups_projects")}{" "}
          <Link href={`/${locale}/explore`} className="text-indigo-600 hover:underline">Explore →</Link>
        </p>
      </main>
    </div>
  );
}
