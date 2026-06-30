import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { LangSwitcher } from "@/components/LangSwitcher";
import { getTranslations } from "next-intl/server";
import type { Profile } from "@/lib/firebase/collections";

export default async function StartupDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const snap = await adminDb!.collection("profiles").doc(session.uid).get();
  const profile = snap.data() as Profile | undefined;
  if (!profile || profile.role !== "startup") redirect(`/${locale}/login`);

  const t = await getTranslations("startup");
  const tNav = await getTranslations("nav");

  const name = profile.full_name ?? "Gründer";
  const isPro = profile.plan_tier === "pro" || profile.plan_tier === "scale";
  const isVisible = profile.investor_visible ?? false;

  const cards = [
    { href: `/${locale}/startup/plan`,       icon: "📄", title: t("card_plan"),       desc: t("card_plan_desc") },
    { href: `/${locale}/startup/pitchdeck`,  icon: "🎯", title: t("card_pitchdeck"),   desc: isPro ? t("card_pitchdeck_desc_pro") : t("card_pitchdeck_desc_free") },
    { href: `/${locale}/startup/visibility`, icon: isVisible ? "🟢" : "🔒", title: t("card_visibility"), desc: isVisible ? t("card_visibility_active") : isPro ? t("card_visibility_pro_off") : t("card_visibility_upgrade") },
    { href: `/${locale}/startup/roles`,      icon: "👥", title: t("card_roles"),       desc: t("card_roles_desc") },
    { href: `/${locale}/startup/profile`,    icon: "🏢", title: t("card_profile"),     desc: t("card_profile_desc") },
    { href: `/${locale}/startup/billing`,    icon: "💳", title: t("card_billing"),     desc: isPro ? t("card_billing_desc_pro", { tier: profile.plan_tier }) : t("card_billing_desc_free") },
  ];

  const steps = [t("step1"), t("step2"), t("step3"), t("step4")];

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-indigo-600">{tNav("brand")}</Link>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <NotificationBell />
            <Link href={`/${locale}/user/me`} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 hover:border-indigo-300 transition-colors">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium text-zinc-700">{name}</span>
            </Link>
            <form action="/api/auth/signout" method="post">
              <Button variant="ghost" size="sm" type="submit">{tNav("signout")}</Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-bold text-zinc-900">Hallo, {name} 👋</h1>
        <p className="mt-1 text-zinc-500">{t("dashboard_sub")}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
            >
              <span className="text-3xl">{c.icon}</span>
              <h2 className="mt-3 font-semibold text-zinc-900">{c.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{c.desc}</p>
            </Link>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
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
