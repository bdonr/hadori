import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { NotificationBell } from "@/components/NotificationBell";
import { LangSwitcher } from "@/components/LangSwitcher";
import { getTranslations } from "next-intl/server";
import type { Profile } from "@/lib/firebase/collections";

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

  const cards = [
    { href: `/${locale}/talent/skills`,       icon: "⚡", title: "Meine Skills",      desc: "Skills, Erfahrung & Verfügbarkeit", badge: null },
    { href: `/${locale}/talent/portfolio`,    icon: "🎨", title: "Portfolio",         desc: isPro ? "Bis zu 10 Werke zeigen" : "1 Werk kostenlos · Pro für 10", badge: !isPro ? "1 / 1" : null },
    { href: `/${locale}/talent/jobs`,         icon: "🔍", title: "Stellen & Projekte", desc: "Passende Rollen bei Startups & Creatorn", badge: null },
    { href: `/${locale}/talent/applications`, icon: "📋", title: "Meine Bewerbungen", desc: "Status deiner Anfragen", badge: null },
    { href: `/${locale}/talent/billing`,      icon: "💳", title: "Abo verwalten",     desc: isPro ? `Aktuell: ${tier.charAt(0).toUpperCase() + tier.slice(1)}` : "Upgrade für Priority-Matching", badge: null },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-indigo-600">DADORI</Link>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <NotificationBell />
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isPro ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-500"}`}>
              {tier.toUpperCase()}
            </span>
            <span className="text-sm text-zinc-500">{profile.full_name}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-bold text-zinc-900">Hey, {profile.full_name} 👋</h1>
        <p className="mt-1 text-zinc-500">Zeig was du kannst — und finde Projekte die zu dir passen.</p>

        {!isPro && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-indigo-900">Du bist im Free-Plan</p>
              <p className="text-sm text-indigo-600">Starter ab 2 €/Mo · Pro ab 10 €/Mo · Scale ab 49 €/Mo — monatlich kündbar</p>
            </div>
            <Link href={`/${locale}/talent/billing`} className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              Auf Pro upgraden
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
          <h2 className="mb-4 font-semibold text-zinc-900">Erste Schritte</h2>
          <ol className="space-y-3">
            {[
              { text: "Skills & Verfügbarkeit eintragen", href: `/${locale}/talent/skills` },
              { text: "Ersten Portfolio-Eintrag hinzufügen", href: `/${locale}/talent/portfolio` },
              { text: "Offene Rollen & Projekte durchstöbern", href: `/${locale}/talent/jobs` },
            ].map((step, i) => (
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
