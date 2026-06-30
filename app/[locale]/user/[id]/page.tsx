"use client";

import Link from "next/link";
import { useState, use, useEffect } from "react";
import { useParams } from "next/navigation";
import { LangSwitcher } from "@/components/LangSwitcher";
import { getSkillLabel } from "@/lib/skills";
import { REGIONS, LANGUAGES } from "@/lib/regions";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import type { Profile } from "@/lib/firebase/collections";

const AVAIL_META = {
  immediately:   { label: "Sofort verfügbar",      color: "bg-green-50 border-green-200 text-green-700" },
  part_time:     { label: "Nebenbei verfügbar",     color: "bg-amber-50 border-amber-200 text-amber-700" },
  project_based: { label: "Projektbasiert",         color: "bg-amber-50 border-amber-200 text-amber-700" },
  "1_month":     { label: "Ab nächstem Monat",      color: "bg-amber-50 border-amber-200 text-amber-700" },
  "3_months":    { label: "Ab in 3 Monaten",        color: "bg-zinc-100 border-zinc-200 text-zinc-500" },
  not_available: { label: "Nicht verfügbar",        color: "bg-zinc-100 border-zinc-200 text-zinc-400" },
  not_looking:   { label: "Gerade nicht verfügbar", color: "bg-zinc-100 border-zinc-200 text-zinc-400" },
} as const;

const EXPERIENCE_LABEL: Record<string, string> = {
  beginner:     "Einsteiger (< 1 J.)",
  intermediate: "Fortgeschritten (1–3 J.)",
  experienced:  "Erfahren (3–5 J.)",
  expert:       "Experte (5+ J.)",
  junior:       "Junior",
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
}

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
        const [profileSnap, talentSnap] = await Promise.all([
          getDoc(doc(db, "profiles", targetUid)),
          getDoc(doc(db, "talent", targetUid)),
        ]);
        const p = profileSnap.exists() ? profileSnap.data() as Profile : null;
        const t = talentSnap.exists() ? talentSnap.data() as TalentData : null;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
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
            <h1 className="text-xl font-bold text-zinc-900">Du bist nicht eingeloggt</h1>
            <Link href={`/${locale}/login`} className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
              Jetzt einloggen →
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-zinc-900">Profil nicht gefunden</h1>
            <Link href={`/${locale}/explore`} className="text-sm text-indigo-600 hover:underline">← Explore</Link>
          </>
        )}
      </div>
    );
  }

  const displayName = profile.full_name || "Unbekannt";
  const bio = talent?.bio ?? "";
  const skills = talent?.skills ?? [];
  const avail = talent?.availability
    ? AVAIL_META[talent.availability as keyof typeof AVAIL_META]
    : null;
  const regions = (talent?.regions ?? [])
    .map(id => REGIONS.find(r => r.id === id))
    .filter(Boolean) as typeof REGIONS;
  const languages = (talent?.languages ?? [])
    .map(id => LANGUAGES.find(l => l.id === id))
    .filter(Boolean) as typeof LANGUAGES;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-indigo-600">DADORI</Link>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            {isOwnProfile ? (
              <Link href={`/${locale}/talent`} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-indigo-300 transition-colors">
                Dashboard
              </Link>
            ) : (
              <Link href={`/${locale}/login`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                Mitmachen
              </Link>
            )}
          </div>
        </div>
      </header>

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
                  <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">Du</span>
                )}
              </div>
              {talent?.headline && (
                <p className="mt-1 text-sm font-medium text-zinc-500">{talent.headline}</p>
              )}
              {/* Status pills */}
              <div className="mt-2 flex flex-wrap gap-2">
                {avail && (
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${avail.color}`}>
                    {avail.label}
                  </span>
                )}
                {talent?.remote && (
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    🌍 Remote
                  </span>
                )}
                {talent?.experience && EXPERIENCE_LABEL[talent.experience] && (
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    {EXPERIENCE_LABEL[talent.experience]}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 flex-wrap">
            {isOwnProfile ? (
              <Link href={`/${locale}/talent/skills`}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
                ✏️ Profil bearbeiten
              </Link>
            ) : (
              !contacted ? (
                <button onClick={() => setContacted(true)}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
                  Kontakt anfragen
                </button>
              ) : (
                <span className="rounded-xl bg-green-50 border border-green-200 px-6 py-3 text-sm font-semibold text-green-700">
                  ✓ Anfrage gesendet
                </span>
              )
            )}
            <button onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="rounded-xl border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-600 hover:border-indigo-300 transition-colors">
              🔗 Profil teilen
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Bio */}
            {bio ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 font-bold text-zinc-900">Über {displayName}</h2>
                <p className="text-sm leading-relaxed text-zinc-600">{bio}</p>
              </div>
            ) : isOwnProfile ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6">
                <p className="text-sm text-zinc-400">
                  Noch keine Bio —{" "}
                  <Link href={`/${locale}/talent/skills`} className="text-indigo-600 hover:underline">jetzt hinzufügen →</Link>
                </p>
              </div>
            ) : null}

            {/* Skills */}
            {skills.length > 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-bold text-zinc-900">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span key={s} className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      i === 0 ? "bg-indigo-600 text-white" : "bg-indigo-50 border border-indigo-200 text-indigo-700"
                    }`}>
                      {getSkillLabel(s)}
                    </span>
                  ))}
                </div>
              </div>
            ) : isOwnProfile ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6">
                <p className="text-sm text-zinc-400">
                  Noch keine Skills —{" "}
                  <Link href={`/${locale}/talent/skills`} className="text-indigo-600 hover:underline">Skills hinzufügen →</Link>
                </p>
              </div>
            ) : null}

            {/* Sprachen & Region */}
            {(languages.length > 0 || regions.length > 0) && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-bold text-zinc-900">Sprachen & Region</h2>
                {languages.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Arbeitssprachen</p>
                    <div className="flex flex-wrap gap-2">
                      {languages.map(l => (
                        <span key={l.id} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-700">
                          {l.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {regions.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Regionen</p>
                    <div className="flex flex-wrap gap-2">
                      {regions.map(r => (
                        <span key={r.id} className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-700">
                          <span>{r.flag}</span>
                          <span>{r.label}</span>
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
                  <h2 className="font-bold text-zinc-900">Portfolio</h2>
                  {isOwnProfile && (
                    <Link href={`/${locale}/talent/portfolio`} className="text-xs text-indigo-600 hover:underline">Alle bearbeiten →</Link>
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
                  <p className="mt-3 text-xs text-zinc-400 text-center">+{portfolio.length - 4} weitere Werke</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Details-Card */}
            {talent && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Details</p>
                <dl className="flex flex-col gap-2 text-sm">
                  {avail && (
                    <div className="flex items-center justify-between">
                      <dt className="text-zinc-500">Verfügbarkeit</dt>
                      <dd className="font-medium text-zinc-800">{avail.label}</dd>
                    </div>
                  )}
                  {talent.experience && EXPERIENCE_LABEL[talent.experience] && (
                    <div className="flex items-center justify-between">
                      <dt className="text-zinc-500">Erfahrung</dt>
                      <dd className="font-medium text-zinc-800">{EXPERIENCE_LABEL[talent.experience]}</dd>
                    </div>
                  )}
                  {talent.remote !== undefined && (
                    <div className="flex items-center justify-between">
                      <dt className="text-zinc-500">Remote</dt>
                      <dd className="font-medium text-zinc-800">{talent.remote ? "Ja" : "Nein"}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {isOwnProfile ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Dein Profil</p>
                <p className="text-sm text-zinc-600 mb-3">Skills, Region oder Bio aktualisieren.</p>
                <Link href={`/${locale}/talent/skills`}
                  className="block w-full rounded-lg bg-indigo-600 py-2 text-center text-xs font-bold text-white hover:bg-indigo-700 transition-colors">
                  Profil bearbeiten →
                </Link>
                {portfolio.length === 0 && (
                  <Link href={`/${locale}/talent/portfolio`}
                    className="mt-2 block w-full rounded-lg border border-indigo-200 py-2 text-center text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
                    Portfolio hinzufügen →
                  </Link>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Du bist Talent?</p>
                <p className="text-sm text-indigo-700 mb-3">Erstell dein eigenes Profil und werde von Startups gefunden.</p>
                <Link href={`/${locale}/signup`}
                  className="block w-full rounded-lg bg-indigo-600 py-2 text-center text-xs font-bold text-white hover:bg-indigo-700 transition-colors">
                  Profil erstellen →
                </Link>
              </div>
            )}

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Teilen</p>
              <button onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="w-full rounded-lg border border-zinc-200 py-2 text-xs font-semibold text-zinc-600 hover:border-indigo-300 transition-colors">
                🔗 Link kopieren
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-400">
          Startups & Projekte entdecken:{" "}
          <Link href={`/${locale}/explore`} className="text-indigo-600 hover:underline">Explore →</Link>
        </p>
      </main>
    </div>
  );
}
