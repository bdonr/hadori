"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { isInvestorPaid, planCaps } from "@/lib/entitlements";
import { REGIONS, LANGUAGES } from "@/lib/regions";
import { Navbar } from "@/components/layout/navbar";
import { useTaxonomy } from "@/lib/taxonomy";

const CATEGORY_ICON: Record<string, string> = {
  creator: "🎬", music: "🎵", gaming: "🎮", app: "📱", ecommerce: "🛒",
  community: "💬", art: "🎨", education: "📚", events: "🎪", other: "💡",
};
const STAGE_EMOJI: Record<string, string> = {
  idea: "💡", pre_seed: "🌱", seed: "🌿", series_a: "📈",
};
const REGION_FLAG: Record<string, string> = {
  de: "🇩🇪", at: "🇦🇹", ch: "🇨🇭", us: "🇺🇸", worldwide: "🌍",
};
const EXPERIENCE_LABEL: Record<string, string> = {
  beginner: "Einsteiger", intermediate: "Fortgeschritten",
  experienced: "Erfahren", expert: "Experte", junior: "Junior",
};
const AVAIL_COLOR: Record<string, string> = {
  immediately:   "bg-green-50 border-green-200 text-green-700",
  part_time:     "bg-amber-50 border-amber-200 text-amber-700",
  project_based: "bg-amber-50 border-amber-200 text-amber-700",
  not_available: "bg-zinc-100 border-zinc-200 text-zinc-400",
  not_looking:   "bg-zinc-100 border-zinc-200 text-zinc-400",
};
const AVAIL_LABEL: Record<string, string> = {
  immediately:   "Sofort verfügbar",
  part_time:     "Nebenbei verfügbar",
  project_based: "Projektbasiert",
  not_available: "Nicht verfügbar",
  not_looking:   "Gerade nicht verfügbar",
};

type Project = {
  id: string; name: string; tagline: string; description: string;
  category: string; icon: string; stage: string; stageEmoji: string;
  mrr: string; teamSize: string; region: string; regionFlag: string;
  website?: string; foundedYear: number;
  founders: { name: string; role: string; avatar: string }[];
  neededSkills: string[];
  lookingFor: string[];
  investorVisible: boolean; fundingGoal?: string;
  type?: "project" | "startup";
  stealth?: boolean; stealthProblems?: string[]; stealthCategory?: string;
  ownerId?: string;
};

type CreatorData = {
  uid: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  skills?: string[];
  experience?: string;
  availability?: string;
  remote?: boolean;
  regions?: string[];
  languages?: string[];
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const routeParams = useParams();
  const locale = (routeParams.locale as string) ?? "en";
  const t = useTranslations("misc_pages.project_detail");
  const tax = useTaxonomy();

  const [project, setProject] = useState<Project | null>(null);
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [interested, setInterested] = useState(false);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [myTier, setMyTier] = useState<string | null>(null);
  const [myCaps, setMyCaps] = useState<string[] | undefined>(undefined);
  const [myName, setMyName] = useState("");
  const [introsThisMonth, setIntrosThisMonth] = useState(0);
  const [requestedToUids, setRequestedToUids] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "projects", id));
        if (!cancelled) {
          if (snap.exists()) {
            const d = snap.data();
            const p: Project = {
              id: snap.id,
              name: d.name ?? "",
              tagline: d.tagline ?? "",
              description: d.description ?? "",
              category: d.category ?? "",
              icon: CATEGORY_ICON[d.category] ?? "💡",
              stage: d.stage ?? "",
              stageEmoji: STAGE_EMOJI[d.stage] ?? "🚀",
              mrr: d.mrr ?? "",
              teamSize: d.teamSize ?? "",
              region: d.region ?? "",
              regionFlag: REGION_FLAG[d.region] ?? "🌐",
              foundedYear: d.foundedYear ?? new Date().getFullYear(),
              founders: d.founders ?? [],
              neededSkills: d.skills ?? [],
              lookingFor: d.lookingFor ?? [],
              investorVisible: d.investorVisible ?? false,
              fundingGoal: d.fundingGoal,
              type: d.type ?? "project",
              stealth: d.stealth ?? false,
              stealthProblems: d.stealthProblems ?? [],
              stealthCategory: d.category ?? "",
              ownerId: d.ownerId ?? null,
            };
            setProject(p);

            // Load creator profile
            if (d.ownerId) {
              try {
                const [profileSnap, talentSnap] = await Promise.all([
                  getDoc(doc(db, "publicProfiles", d.ownerId)).catch(() => null),
                  getDoc(doc(db, "talent", d.ownerId)).catch(() => null),
                ]);
                if (profileSnap?.exists()) {
                  const pr = profileSnap.data();
                  const ta = talentSnap?.exists() ? talentSnap.data() : {};
                  setCreator({
                    uid: d.ownerId,
                    full_name: pr.full_name ?? "Unbekannt",
                    avatar_url: pr.avatar_url,
                    bio: ta.bio,
                    skills: ta.skills ?? [],
                    experience: ta.experience,
                    availability: ta.availability,
                    remote: ta.remote,
                    regions: ta.regions ?? [],
                    languages: ta.languages ?? [],
                  });
                }
              } catch {
                // creator profile not accessible — silently skip
              }
            }
          } else {
            setNotFound(true);
          }
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
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
          setMyCaps(myProfileSnap.data().capabilities as string[] | undefined);
        }
        const myPubSnap = await getDoc(doc(db, "publicProfiles", user.uid));
        if (myPubSnap.exists()) setMyName((myPubSnap.data().full_name as string) ?? "");

        const reqSnap = await getDocs(
          query(collection(db, "applications"), where("fromUid", "==", user.uid))
        );
        const myReqs = reqSnap.docs
          .map(d => d.data() as Record<string, unknown>)
          .filter(d => d.type === "startup_request");
        setRequestedToUids(myReqs.map(d => d.toUid as string));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <Navbar />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4">
        <span className="text-5xl">🔍</span>
        <h1 className="text-xl font-bold text-zinc-900">{t("not_found_title")}</h1>
        <p className="text-sm text-zinc-500">{t("not_found_desc")}</p>
        <Link href={`/${locale}/explore`} className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
          {t("all_projects")}
        </Link>
      </div>
    );
  }

  if (project.stealth) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-2xl px-6 py-16 text-center">
          <span className="text-5xl">🥷</span>
          <h1 className="mt-4 text-2xl font-extrabold text-zinc-900">{t("stealth_project")}</h1>
          <p className="mt-3 text-zinc-500 text-lg">{t("stealth_project_desc")}</p>
          <div className="mt-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-left">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="rounded-full bg-indigo-600 text-white px-3 py-1 text-sm font-semibold">{tax.focus(project.stealthCategory)}</span>
              {project.stealthProblems?.map(p => (
                <span key={p} className="rounded-full bg-white border border-indigo-200 text-indigo-700 px-3 py-1 text-sm">{p}</span>
              ))}
            </div>
          </div>
          <div className="mt-6">
            {interested ? (
              <span className="rounded-xl bg-green-50 border border-green-200 px-6 py-3 text-sm font-semibold text-green-700">✓ {t("interest_shown")}</span>
            ) : (
              <button onClick={() => setInterested(true)} className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
                {t("show_interest_arrow")}
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  const isOwner = !!authUid && !!project.ownerId && authUid === project.ownerId;
  const isInvestorViewer = myRole === "investor";
  const myHolder = { plan_tier: myTier, capabilities: myCaps };
  const canRequestIntro = isInvestorPaid(myHolder);
  const introCap = planCaps(myHolder).introsPerMonth;
  const atIntroLimit = introsThisMonth >= introCap;
  const alreadyRequested = interested || (!!project.ownerId && requestedToUids.includes(project.ownerId));
  const showIntroButton = isInvestorViewer && !isOwner && !!project.ownerId;

  async function requestIntro() {
    if (!authUid || !project?.ownerId || !canRequestIntro || atIntroLimit || alreadyRequested) return;
    const message = (typeof window !== "undefined" ? window.prompt(t("message_prompt")) : "") ?? "";
    setInterested(true);
    setIntrosThisMonth(prev => prev + 1);
    try {
      await addDoc(collection(db, "applications"), {
        fromUid: authUid,
        toUid: project.ownerId,
        type: "startup_request",
        fromName: myName,
        toName: (project.founders[0]?.name ?? project.name ?? ""),
        subjectTitle: project.name || "",
        message: message.trim(),
        status: "pending",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    } catch { /* keep optimistic state */ }
  }

  return (
    <div className="min-h-screen bg-zinc-50">

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Hero */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm mb-6">
          <div className="flex items-start gap-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-4xl border border-indigo-100">{project.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-zinc-900">{project.name}</h1>
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-0.5 text-xs font-semibold text-indigo-700">{tax.focus(project.category)}</span>
                <span className="rounded-full bg-zinc-50 border border-zinc-200 px-3 py-0.5 text-xs font-medium text-zinc-500">
                  {project.regionFlag} {tax.region(project.region)}
                </span>
              </div>
              <p className="mt-1 text-base text-zinc-600">{project.tagline}</p>
              <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-zinc-400">
                {project.foundedYear && <span>{t("founded", { year: project.foundedYear })}</span>}
                {project.teamSize && <><span>·</span><span>👥 {t("team", { size: project.teamSize })}</span></>}
                {project.stage && <><span>·</span><span>{project.stageEmoji} {tax.stage(project.stage)}</span></>}
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3 flex-wrap">
            {showIntroButton && (
              alreadyRequested ? (
                <span className="rounded-xl bg-green-50 border border-green-200 px-6 py-3 text-sm font-semibold text-green-700">✓ {t("request_sent")}</span>
              ) : !canRequestIntro ? (
                <div className="flex flex-col gap-1">
                  <button disabled className="rounded-xl bg-zinc-200 px-6 py-3 text-sm font-bold text-zinc-400 cursor-not-allowed">
                    {t("show_interest")}
                  </button>
                  <Link href={`/${locale}/investor/billing`} className="text-xs font-semibold text-indigo-600 hover:underline">
                    {t("intro_requires_paid")}
                  </Link>
                </div>
              ) : (
                <button onClick={requestIntro} disabled={atIntroLimit} className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {atIntroLimit ? t("intro_limit_reached") : t("show_interest")}
                </button>
              )
            )}
            {project.website && (
              <a href={project.website} target="_blank" rel="noopener noreferrer"
                className="rounded-xl border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-600 hover:border-indigo-300 transition-colors">
                🌐 Website
              </a>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Beschreibung */}
            {project.description && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 font-bold text-zinc-900">{t("about_project")}</h2>
                <p className="text-sm leading-relaxed text-zinc-600">{project.description}</p>
              </div>
            )}

            {/* Gesuchte Rollen */}
            {project.lookingFor.length > 0 && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
                <h2 className="mb-3 font-bold text-indigo-900">{t("we_are_looking")}</h2>
                <div className="flex flex-col gap-2 mb-4">
                  {project.lookingFor.map(role => (
                    <div key={role} className="flex items-center gap-2">
                      <span className="text-indigo-400">→</span>
                      <span className="text-sm font-semibold text-indigo-800">{role}</span>
                    </div>
                  ))}
                </div>
                {project.neededSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {project.neededSkills.map(id => (
                      <span key={id} className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white">
                        {tax.skill(id)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Ersteller-Profil */}
            {creator && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-bold text-zinc-900">{t("creator")}</h2>
                <div className="flex items-start gap-4">
                  {creator.avatar_url ? (
                    <img src={creator.avatar_url} alt={creator.full_name}
                      className="h-12 w-12 shrink-0 rounded-xl object-cover border border-zinc-100" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-xl font-bold text-indigo-600">
                      {creator.full_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-zinc-900">{creator.full_name}</p>
                      {creator.availability && AVAIL_LABEL[creator.availability] && (
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${AVAIL_COLOR[creator.availability] ?? "bg-zinc-100 border-zinc-200 text-zinc-500"}`}>
                          {AVAIL_LABEL[creator.availability]}
                        </span>
                      )}
                      {creator.remote && (
                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">🌍 {t("remote")}</span>
                      )}
                    </div>
                    {creator.experience && EXPERIENCE_LABEL[creator.experience] && (
                      <p className="mt-0.5 text-xs text-zinc-500">{EXPERIENCE_LABEL[creator.experience]}</p>
                    )}
                    {creator.bio && (
                      <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{creator.bio}</p>
                    )}
                    {(creator.skills ?? []).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(creator.skills ?? []).slice(0, 6).map(s => (
                          <span key={s} className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                            {tax.skill(s)}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Sprachen & Regionen */}
                    {((creator.languages ?? []).length > 0 || (creator.regions ?? []).length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(creator.languages ?? []).map(lId => {
                          const l = LANGUAGES.find(x => x.id === lId);
                          return l ? (
                            <span key={lId} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">{tax.language(l.id)}</span>
                          ) : null;
                        })}
                        {(creator.regions ?? []).map(rId => {
                          const r = REGIONS.find(x => x.id === rId);
                          return r ? (
                            <span key={rId} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">{r.flag} {tax.region(r.id)}</span>
                          ) : null;
                        })}
                      </div>
                    )}
                    <Link href={`/${locale}/user/${creator.uid}`}
                      className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline">
                      {t("view_full_profile")}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Co-Founder / Team */}
            {project.founders.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-bold text-zinc-900">{t("team_heading")}</h2>
                <div className="flex flex-col gap-3">
                  {project.founders.map(f => (
                    <div key={f.name} className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-xl">{f.avatar}</span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{f.name}</p>
                        <p className="text-xs text-zinc-500">{f.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {project.stage && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">{t("phase")}</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{project.stageEmoji}</span>
                  <span className="font-bold text-zinc-900">{tax.stage(project.stage)}</span>
                </div>
                {project.fundingGoal && (
                  <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
                    <p className="text-xs font-semibold text-green-700">🎯 {t("fundraising_goal")}</p>
                    <p className="text-sm font-bold text-green-900 mt-0.5">{tax.fundingRange(project.fundingGoal)}</p>
                  </div>
                )}
              </div>
            )}
            {project.investorVisible && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">{t("investor_status")}</p>
                <p className="text-sm font-semibold text-amber-900">🟢 {t("open_for_investors")}</p>
                <Link href={`/${locale}/signup`} className="mt-3 block w-full rounded-lg bg-amber-500 py-2 text-center text-xs font-bold text-white hover:bg-amber-600 transition-colors">
                  {t("contact_as_investor")}
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
          {t("discover_on_dadori")}{" "}
          <Link href={`/${locale}/explore`} className="text-indigo-600 hover:underline">{t("all_projects_startups")}</Link>
        </p>
      </main>
    </div>
  );
}
