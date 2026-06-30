import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { LangSwitcher } from "@/components/LangSwitcher";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import type { Profile } from "@/lib/firebase/collections";

export default async function InvestorDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const snap = await adminDb!.collection("profiles").doc(session.uid).get();
  const profile = snap.data() as Profile | undefined;
  if (!profile || profile.role !== "investor") redirect(`/${locale}/login`);

  const tNav = await getTranslations("nav");

  const cards = [
    { href: `/${locale}/investor/dealflow`,  icon: "📬", title: "Deal Flow",          desc: "New Startups & Stealth Projects", tier: "Angel+" },
    { href: `/${locale}/investor/discover`,  icon: "🔭", title: "Discover Startups",  desc: "Filter by stage, MRR, focus",    tier: null },
    { href: `/${locale}/investor/portfolio`, icon: "📊", title: "Portfolio Tracker",  desc: "Track deals & notes",            tier: "Pro+" },
    { href: `/${locale}/investor/watchlist`, icon: "⭐", title: "Watchlist",          desc: "Saved startups at a glance",     tier: null },
    { href: `/${locale}/investor/profile`,   icon: "💼", title: "My Profile",         desc: "Investment focus & check size",  tier: null },
    { href: `/${locale}/investor/billing`,   icon: "💳", title: "Subscription",       desc: "Scout → Angel → Pro → Lead → Elite", tier: null },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href={`/${locale}`} className="text-xl font-extrabold text-indigo-600">{tNav("brand")}</Link>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <Link href={`/${locale}/user/me`} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 hover:border-emerald-300 transition-colors">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {(profile.full_name ?? "?").charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium text-zinc-700">{profile.full_name}</span>
            </Link>
            <form action="/api/auth/signout" method="post">
              <Button variant="ghost" size="sm" type="submit">{tNav("signout")}</Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-bold text-zinc-900">Hello, {profile.full_name} 💼</h1>
        <p className="mt-1 text-zinc-500">Discover DADORI-validated startups.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{c.icon}</span>
                {c.tier && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{c.tier}</span>}
              </div>
              <h2 className="mt-3 font-semibold text-zinc-900">{c.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{c.desc}</p>
            </Link>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-800">
          <strong>Legal notice:</strong> DADORI exclusively facilitates introductions between founders and investors. No success fees, no transaction participation.
        </div>
      </main>
    </div>
  );
}
