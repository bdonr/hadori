import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { getTranslations } from "next-intl/server";
import type { Profile } from "@/lib/firebase/collections";
import { Navbar } from "@/components/layout/navbar";
import { planCaps } from "@/lib/entitlements";
import Link from "next/link";

export default async function InvestorDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const snap = await adminDb!.collection("profiles").doc(session.uid).get();
  const profile = snap.data() as Profile | undefined;
  if (!profile || profile.role !== "investor") redirect(`/${locale}/login`);

  const t = await getTranslations("investor");
  const td = await getTranslations("investor_pages.dashboard");

  const caps = planCaps(profile.plan_tier);

  const cards = [
    { href: `/${locale}/investor/dealflow`,  icon: "📬", title: td("card_dealflow"),   desc: td("card_dealflow_desc"),   tier: "Angel+", locked: !caps.startupDetails },
    { href: `/${locale}/investor/requests`,  icon: "🤝", title: t("requests_link"),    desc: t("requests_link_desc"),    tier: null,     locked: false },
    { href: `/${locale}/investor/discover`,  icon: "🔭", title: td("card_discover"),   desc: td("card_discover_desc"),   tier: null,     locked: false },
    { href: `/${locale}/investor/portfolio`, icon: "📊", title: td("card_portfolio"),  desc: td("card_portfolio_desc"),  tier: "Pro+",   locked: !caps.portfolioTracker },
    { href: `/${locale}/investor/watchlist`, icon: "⭐", title: td("card_watchlist"),  desc: td("card_watchlist_desc"),  tier: null,     locked: false },
    { href: `/${locale}/investor/profile`,   icon: "💼", title: td("card_profile"),    desc: td("card_profile_desc"),    tier: null,     locked: false },
    { href: `/${locale}/investor/billing`,   icon: "💳", title: td("card_billing"),    desc: td("card_billing_desc"),    tier: null,     locked: false },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-bold text-zinc-900">{td("greeting", { name: profile.full_name })} 💼</h1>
        <p className="mt-1 text-zinc-500">{td("subtitle")}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.href} href={c.href}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{c.icon}</span>
                {c.tier && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.locked ? "bg-zinc-100 text-zinc-500" : "bg-emerald-100 text-emerald-700"}`}>
                    {c.locked ? `🔒 ${c.tier}` : c.tier}
                  </span>
                )}
              </div>
              <h2 className="mt-3 font-semibold text-zinc-900">{c.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{c.desc}</p>
            </Link>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-800">
          <strong>{td("legal_label")}</strong> {td("legal_text")}
        </div>
      </main>
    </div>
  );
}
