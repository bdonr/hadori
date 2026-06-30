import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { getTranslations } from "next-intl/server";
import type { Profile } from "@/lib/firebase/collections";
import { Navbar } from "@/components/layout/navbar";
import Link from "next/link";

export default async function TalentDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const snap = await adminDb!.collection("profiles").doc(session.uid).get();
  const profile = snap.data() as Profile | undefined;
  if (!profile || profile.role !== "talent") redirect(`/${locale}/login`);

  const t = await getTranslations("talent");

  const isPro = profile.plan_tier === "pro" || profile.plan_tier === "scale";
  const tier = profile.plan_tier ?? "free";
  const name = profile.full_name ?? "";

  const cards = [
    { href: `/${locale}/talent/skills`,       icon: "⚡", title: t("card_skills"),       desc: t("card_skills_desc"),       badge: null },
    { href: `/${locale}/talent/portfolio`,    icon: "🎨", title: t("card_portfolio"),    desc: isPro ? t("card_portfolio_desc_pro") : t("card_portfolio_desc_free"), badge: !isPro ? "1 / 1" : null },
    { href: `/${locale}/talent/jobs`,         icon: "🔍", title: t("card_jobs"),         desc: t("card_jobs_desc"),         badge: null },
    { href: `/${locale}/talent/applications`, icon: "📋", title: t("card_applications"), desc: t("card_applications_desc"), badge: null },
    { href: `/${locale}/talent/billing`,      icon: "💳", title: t("card_billing"),      desc: isPro ? `${tier.charAt(0).toUpperCase() + tier.slice(1)}` : "", badge: null },
  ];

  const steps = [
    { text: t("step1"), href: `/${locale}/talent/skills` },
    { text: t("step2"), href: `/${locale}/talent/portfolio` },
    { text: t("step3"), href: `/${locale}/talent/jobs` },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-bold text-zinc-900">{t("dashboard_title", { name })}</h1>
        <p className="mt-1 text-zinc-500">{t("dashboard_sub")}</p>

        {!isPro && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-indigo-900">{t("upsell_title")}</p>
              <p className="text-sm text-indigo-600">{t("upsell_desc")}</p>
            </div>
            <Link href={`/${locale}/talent/billing`} className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              {t("upsell_btn")}
            </Link>
          </div>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.href} href={c.href}
              className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
            >
              {c.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{c.badge}</span>
              )}
              <span className="text-3xl">{c.icon}</span>
              <h2 className="mt-3 font-semibold text-zinc-900 group-hover:text-indigo-700 transition-colors">{c.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{c.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-zinc-900">{t("steps_title")}</h2>
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-zinc-300 text-xs font-bold text-zinc-400">{i + 1}</span>
                <Link href={step.href} className="text-sm text-zinc-700 hover:text-indigo-600 hover:underline">{step.text}</Link>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}
