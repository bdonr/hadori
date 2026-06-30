import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { LangSwitcher } from "@/components/LangSwitcher";
import type { Profile } from "@/lib/firebase/collections";

export default async function InvestorDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const snap = await adminDb!.collection("profiles").doc(session.uid).get();
  const profile = snap.data() as Profile | undefined;
  if (!profile || profile.role !== "investor") redirect(`/${locale}/login`);

  const cards = [
    { href: `/${locale}/investor/dealflow`,  icon: "📬", title: "Deal Flow",          desc: "Neue Startups & Stealth-Projekte",      tier: "Angel+" },
    { href: `/${locale}/investor/discover`,  icon: "🔭", title: "Startups entdecken", desc: "Filtern nach Stage, MRR, Fokus",        tier: null },
    { href: `/${locale}/investor/portfolio`, icon: "📊", title: "Portfolio-Tracker",  desc: "Deals verfolgen & Notizen",             tier: "Pro+" },
    { href: `/${locale}/investor/watchlist`, icon: "⭐", title: "Watchlist",          desc: "Gemerkte Startups auf einen Blick",     tier: null },
    { href: `/${locale}/investor/profile`,   icon: "💼", title: "Mein Profil",        desc: "Investment-Fokus & Check-Size",         tier: null },
    { href: `/${locale}/investor/billing`,   icon: "💳", title: "Abo & Tier",         desc: "Scout → Angel → Pro → Lead → Elite",   tier: null },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-indigo-600">DADORI</Link>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <span className="text-sm text-zinc-500">Investor · {profile.plan_tier}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-bold text-zinc-900">Hallo, {profile.full_name} 💼</h1>
        <p className="mt-1 text-zinc-500">Entdecke DADORI-validierte Startups.</p>
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
          <strong>Rechtlicher Hinweis:</strong> DADORI vermittelt ausschliesslich Introductions zwischen Gründern und Investoren. Keine Erfolgsgebühren, keine Transaktionsbeteiligung.
        </div>
      </main>
    </div>
  );
}
