"use client";

import Link from "next/link";
import { useState, use, useEffect } from "react";
import { useParams } from "next/navigation";
import { LangSwitcher } from "@/components/LangSwitcher";
import { getSkillLabel } from "@/lib/skills";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import type { Profile, TalentProfile } from "@/lib/firebase/collections";

// ── Availability ─────────────────────────────────────────────────────────────

const AVAIL_META = {
  immediately:  { label: "Sofort verfügbar",       color: "bg-green-50 border-green-200 text-green-700" },
  part_time:    { label: "Nebenbei verfügbar",      color: "bg-amber-50 border-amber-200 text-amber-700" },
  "1_month":    { label: "Ab nächstem Monat",       color: "bg-amber-50 border-amber-200 text-amber-700" },
  "3_months":   { label: "Ab in 3 Monaten",         color: "bg-zinc-100 border-zinc-200 text-zinc-500" },
  not_looking:  { label: "Gerade nicht verfügbar",  color: "bg-zinc-100 border-zinc-200 text-zinc-400" },
} as const;

const LANG_LABEL: Record<string, string> = {
  de: "🇩🇪 Deutsch", en: "🇬🇧 Englisch", fr: "🇫🇷 Français",
  ja: "🇯🇵 日本語", zh: "🇨🇳 中文", ru: "🇷🇺 Русский", ko: "🇰🇷 한국어",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const routeParams = useParams();
  const locale = (routeParams.locale as string) ?? "en";

  const [authUid, setAuthUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [talent, setTalent] = useState<TalentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacted, setContacted] = useState(false);

  // Resolve who we're viewing
  // "me" → current auth user; otherwise treat id as a uid
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
        setProfile(profileSnap.exists() ? profileSnap.data() as Profile : null);
        setTalent(talentSnap.exists() ? talentSnap.data() as TalentProfile : null);
      } catch {
        // Firebase not configured / offline — handled by empty state below
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const isOwnProfile = id === "me" || (authUid !== null && id === authUid);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  // ── Not found / not logged in for "me" ───────────────────────────────────
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
  const headline = talent?.headline ?? "";
  const bio = talent?.bio ?? "";
  const skills = talent?.skills ?? [];
  const avail = talent?.availability
    ? AVAIL_META[talent.availability as keyof typeof AVAIL_META]
    : null;

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
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-3xl">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-zinc-900">{displayName}</h1>
                {avail && (
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${avail.color}`}>
                    {avail.label}
                  </span>
                )}
                {isOwnProfile && (
                  <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    Du
                  </span>
                )}
              </div>
              {headline && <p className="mt-1 text-sm font-medium text-zinc-500">{headline}</p>}
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
                <p className="text-sm text-zinc-400">Noch keine Bio — <Link href={`/${locale}/talent/skills`} className="text-indigo-600 hover:underline">jetzt hinzufügen →</Link></p>
              </div>
            ) : null}

            {/* Skills */}
            {skills.length > 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-bold text-zinc-900">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span key={s} className={`rounded-full px-3 py-1 text-xs font-semibold ${i === 0 ? "bg-indigo-600 text-white" : "bg-indigo-50 border border-indigo-200 text-indigo-700"}`}>
                      {getSkillLabel(s)}
                    </span>
                  ))}
                </div>
              </div>
            ) : isOwnProfile ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6">
                <p className="text-sm text-zinc-400">Noch keine Skills — <Link href={`/${locale}/talent/skills`} className="text-indigo-600 hover:underline">Skills hinzufügen →</Link></p>
              </div>
            ) : null}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {isOwnProfile ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Dein Profil</p>
                <p className="text-sm text-zinc-600 mb-3">Skills, Region oder Bio aktualisieren.</p>
                <Link href={`/${locale}/talent/skills`}
                  className="block w-full rounded-lg bg-indigo-600 py-2 text-center text-xs font-bold text-white hover:bg-indigo-700 transition-colors">
                  Profil bearbeiten →
                </Link>
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
