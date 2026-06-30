"use client";

import { useState } from "react";
import Link from "next/link";
import { INVESTOR_TIERS } from "@/lib/tiers";
import { STRIPE_PRICES } from "@/lib/stripe-prices";
import { useCurrency } from "@/hooks/useCurrency";
import { formatPrice } from "@/lib/currency";

const CURRENT: string = "investor_free";
const STRIPE_PRICE_IDS: Record<string, string> = {
  investor_basic:   STRIPE_PRICES.investor_angel,
  investor_pro:     STRIPE_PRICES.investor_pro,
  investor_premium: STRIPE_PRICES.investor_premium,
  investor_elite:   STRIPE_PRICES.investor_elite,
};

const ACCENT: Record<string, { ring: string; btn: string }> = {
  investor_free:    { ring: "", btn: "bg-zinc-900 text-white hover:bg-zinc-700" },
  investor_basic:   { ring: "ring-2 ring-emerald-300", btn: "bg-emerald-600 text-white hover:bg-emerald-700" },
  investor_pro:     { ring: "ring-2 ring-emerald-500", btn: "bg-emerald-700 text-white hover:bg-emerald-800" },
  investor_premium: { ring: "ring-2 ring-amber-400",   btn: "bg-amber-500 text-white hover:bg-amber-600" },
  investor_elite:   { ring: "ring-2 ring-violet-400",  btn: "bg-violet-700 text-white hover:bg-violet-800" },
};

export default function InvestorBillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currency = useCurrency();

  async function handleUpgrade(tierId: string) {
    if (tierId === "investor_elite") {
      window.location.href = "mailto:hello@dadori.com?subject=Elite-Zugang Anfrage";
      return;
    }
    const priceId = STRIPE_PRICE_IDS[tierId];
    if (!priceId) return;
    setLoading(tierId);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, currency, successUrl: "/investor", cancelUrl: "/investor/billing" }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else throw new Error("Keine Checkout-URL");
    } catch {
      setError("Zahlung konnte nicht gestartet werden.");
    } finally {
      setLoading(null);
    }
  }

  const tierOrder = ["investor_free", "investor_basic", "investor_pro", "investor_premium", "investor_elite"];
  const currentIdx = tierOrder.indexOf(CURRENT);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Link href="/investor" className="text-sm text-zinc-400 hover:text-zinc-600">← Dashboard</Link>
          <h1 className="text-lg font-semibold text-zinc-900">Investor-Plan</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold text-zinc-900">Dein Investor-Plan</h2>
          <p className="mt-2 text-zinc-500">
            Aktuell: <strong>{INVESTOR_TIERS.find(t => t.id === CURRENT)?.name ?? "Scout"}</strong>
          </p>
        </div>

        {/* Tier progression */}
        <div className="mb-8 flex items-center justify-center gap-2 flex-wrap text-xs">
          {INVESTOR_TIERS.map((t, i) => (
            <span key={t.id} className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 font-semibold border ${t.id === CURRENT ? "bg-emerald-600 text-white border-emerald-600" : "bg-white border-zinc-200 text-zinc-500"}`}>
                {t.emoji} {t.name} · {formatPrice(t.price, currency)}
              </span>
              {i < INVESTOR_TIERS.length - 1 && <span className="text-zinc-300">→</span>}
            </span>
          ))}
        </div>

        {/* Cards — 2 rows: 3 + 2 */}
        <div className="grid gap-5 sm:grid-cols-3 mb-5">
          {INVESTOR_TIERS.slice(0, 3).map(tier => {
            const a = ACCENT[tier.id];
            const isCurrent = tier.id === CURRENT;
            const isDowngrade = tierOrder.indexOf(tier.id) < currentIdx;
            return (
              <div key={tier.id} className={`relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col ${a.ring}`}>
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-bold text-white shadow">Beliebt ⭐</span>
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{tier.emoji}</span>
                  {"introsPerMonth" in tier && (tier.introsPerMonth as number) > 0 && (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {tier.introsPerMonth === -1 ? "∞" : tier.introsPerMonth} Intros/Mo
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-zinc-900">{tier.name}</h3>
                <div className="mt-1 flex items-baseline gap-1 mb-4">
                  {tier.price === 0
                    ? <span className="text-xl font-black text-zinc-900">Gratis</span>
                    : <><span className="text-xl font-black text-zinc-900">{formatPrice(tier.price, currency)}</span><span className="text-xs text-zinc-400">/ Mo</span></>}
                </div>
                <ul className="flex-1 flex flex-col gap-1.5 mb-5">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-zinc-600">
                      <span className="mt-0.5 text-green-500 shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="rounded-xl bg-zinc-100 py-2 text-center text-sm font-semibold text-zinc-500">Aktuell</div>
                ) : isDowngrade ? (
                  <div className="rounded-xl bg-zinc-50 border border-zinc-200 py-2 text-center text-xs text-zinc-400">Downgrade</div>
                ) : (
                  <button onClick={() => handleUpgrade(tier.id)} disabled={!!loading}
                    className={`rounded-xl py-2 text-sm font-bold transition-colors disabled:opacity-50 ${a.btn}`}>
                    {loading === tier.id ? "…" : tier.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {INVESTOR_TIERS.slice(3).map(tier => {
            const a = ACCENT[tier.id];
            const isCurrent = tier.id === CURRENT;
            const isDowngrade = tierOrder.indexOf(tier.id) < currentIdx;
            return (
              <div key={tier.id} className={`relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col ${a.ring}`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{tier.emoji}</span>
                  {"introsPerMonth" in tier && (
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {(tier as { introsPerMonth: number }).introsPerMonth === -1 ? "∞ Intros" : `${(tier as { introsPerMonth: number }).introsPerMonth} Intros/Mo`}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-zinc-900">{tier.name}</h3>
                <div className="mt-1 flex items-baseline gap-1 mb-4">
                  <span className="text-xl font-black text-zinc-900">{formatPrice(tier.price, currency)}</span>
                  <span className="text-xs text-zinc-400">/ Mo</span>
                </div>
                <ul className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5 mb-5">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-zinc-600">
                      <span className="mt-0.5 text-green-500 shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="rounded-xl bg-zinc-100 py-2 text-center text-sm font-semibold text-zinc-500">Aktuell</div>
                ) : isDowngrade ? (
                  <div className="rounded-xl bg-zinc-50 border border-zinc-200 py-2 text-center text-xs text-zinc-400">Downgrade</div>
                ) : (
                  <button onClick={() => handleUpgrade(tier.id)} disabled={!!loading}
                    className={`rounded-xl py-2 text-sm font-bold transition-colors disabled:opacity-50 ${a.btn}`}>
                    {loading === tier.id ? "…" : tier.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        {/* Intro quota comparison */}
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-zinc-900 mb-4">Feature-Vergleich</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left py-2 text-zinc-500 font-medium pr-4">Feature</th>
                  {INVESTOR_TIERS.map(t => <th key={t.id} className="py-2 text-center font-semibold text-zinc-700 px-2">{t.emoji}<br/>{t.name}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {[
                  ["Investor-Profil",         "✓","✓","✓","✓","✓"],
                  ["Startups entdecken",       "✓","✓","✓","✓","✓"],
                  ["Deal Flow Feed",           "–","✓","✓","✓","✓"],
                  ["Watchlist",               "5","20","∞","∞","∞"],
                  ["DADORI Intros / Mo",       "–","3","10","25","∞"],
                  ["Stealth-Projekte",         "–","–","✓","✓","✓"],
                  ["Portfolio-Tracker",        "–","–","✓","✓","✓"],
                  ["Verified Badge",           "–","–","–","✓","✓"],
                  ["Frühzugang (72h)",         "–","–","–","✓","✓"],
                  ["Analyst-Report",           "–","–","–","✓","✓"],
                  ["Datenraum-Zugang",         "–","–","–","✓","✓"],
                  ["API / Webhook",            "–","–","–","–","✓"],
                  ["Co-Investor Netzwerk",     "–","–","–","–","✓"],
                  ["Deal Flow Manager",        "–","–","–","–","✓"],
                ].map(([feat, ...vals]) => (
                  <tr key={feat}>
                    <td className="py-2 text-zinc-600 pr-4">{feat}</td>
                    {vals.map((v, i) => (
                      <td key={i} className={`py-2 text-center px-2 ${v === "–" ? "text-zinc-200" : "text-zinc-800 font-medium"}`}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Monatlich kündbar · Zahlung über Stripe · Elite-Zugang per E-Mail anfragen
        </p>
      </main>
    </div>
  );
}
