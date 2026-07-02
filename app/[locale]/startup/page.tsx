import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { getTranslations } from "next-intl/server";
import type { Profile } from "@/lib/firebase/collections";
import { WorkspaceCreateCard } from "@/components/workspace/WorkspaceCreateCard";
import { Navbar } from "@/components/layout/navbar";
import { isStartupPaid } from "@/lib/entitlements";
import Link from "next/link";

export default async function StartupDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const snap = await adminDb!.collection("profiles").doc(session.uid).get();
  const profile = snap.data() as Profile | undefined;
  if (!profile) redirect(`/${locale}/login`);

  const t = await getTranslations("startup");

  const name = profile.full_name ?? t("default_name");
  const isPro = isStartupPaid(profile);
  const isVisible = profile.investor_visible ?? false;

  let workspaceId: string | null = null;
  if (adminDb) {
    try {
      const wsSnap = await adminDb.collectionGroup("members").where("uid", "==", session.uid).limit(1).get();
      if (!wsSnap.empty) workspaceId = wsSnap.docs[0].ref.parent.parent!.id;
    } catch {
      // collectionGroup index may not exist yet — workspace section degrades gracefully
    }
  }

  // Pending incoming applicants: single where() on toUid, filter type/status here.
  let pendingApplicants = 0;
  if (adminDb) {
    try {
      const appsSnap = await adminDb.collection("applications").where("toUid", "==", session.uid).get();
      pendingApplicants = appsSnap.docs.filter(d => {
        const a = d.data();
        return a.status === "pending" && (a.type === "application" || a.type === "startup_request");
      }).length;
    } catch {
      // index/permission issue — badge simply hides
    }
  }

  const cards = [
    { href: `/${locale}/startup/overview`,   icon: "🗂️", title: t("card_overview"),   desc: t("card_overview_desc") },
    { href: `/${locale}/startup/plan`,       icon: "📄", title: t("card_plan"),       desc: t("card_plan_desc") },
    { href: `/${locale}/startup/pitchdeck`,  icon: "🎯", title: t("card_pitchdeck"),  desc: isPro ? t("card_pitchdeck_desc_pro") : t("card_pitchdeck_desc_free") },
    { href: `/${locale}/startup/visibility`, icon: isVisible ? "🟢" : "🔒", title: t("card_visibility"), desc: isVisible ? t("card_visibility_active") : isPro ? t("card_visibility_pro_off") : t("card_visibility_upgrade") },
    { href: `/${locale}/startup/roles`,      icon: "👥", title: t("card_roles"),      desc: t("card_roles_desc") },
    { href: `/${locale}/startup/applicants`, icon: "📥", title: t("applicants_link"), desc: t("applicants_link_desc"), badge: pendingApplicants },
    { href: `/${locale}/startup/profile`,    icon: "🏢", title: t("card_profile"),    desc: t("card_profile_desc") },
    { href: `/${locale}/startup/billing`,    icon: "💳", title: t("card_billing"),    desc: isPro ? t("card_billing_desc_pro", { tier: profile.plan_tier }) : t("card_billing_desc_free") },
  ];

  const steps = [t("step1"), t("step2"), t("step3"), t("step4")];

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-bold text-zinc-900">{t("greeting", { name })} 👋</h1>
        <p className="mt-1 text-zinc-500">{t("dashboard_sub")}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.href} href={c.href}
              className="relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
            >
              {"badge" in c && (c as { badge: number }).badge > 0 && (
                <span className="absolute right-4 top-4 flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-bold text-white">
                  {(c as { badge: number }).badge}
                </span>
              )}
              <span className="text-3xl">{c.icon}</span>
              <h2 className="mt-3 font-semibold text-zinc-900">{c.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{c.desc}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8">
          {workspaceId ? (
            <Link href={`/${locale}/workspace/${workspaceId}`}
              className="flex items-center gap-4 rounded-2xl border border-violet-200 bg-violet-50 p-6 hover:border-violet-400 transition-all"
            >
              <span className="text-3xl">🚀</span>
              <div>
                <h2 className="font-semibold text-violet-900">{t("workspace_open")}</h2>
                <p className="text-sm text-violet-600">{t("workspace_open_desc")}</p>
              </div>
              <span className="ml-auto text-violet-400">→</span>
            </Link>
          ) : (
            <WorkspaceCreateCard locale={locale} uid={session.uid} />
          )}
        </div>
        <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
          <h2 className="font-semibold text-indigo-900">{t("steps_title")}</h2>
          <ul className="mt-4 space-y-2 text-sm text-indigo-800">
            {steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-indigo-300 text-xs text-indigo-400">{i + 1}</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
