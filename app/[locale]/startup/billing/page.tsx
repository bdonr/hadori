"use client";

import { useState } from "react";
import Link from "next/link";
import { PROJECT_TIERS } from "@/lib/tiers";
import { STRIPE_PRICES } from "@/lib/stripe-prices";
import { useCurrency } from "@/hooks/useCurrency";
import { usePlanTier } from "@/hooks/usePlanTier";
import { formatPrice } from "@/lib/currency";
import { Navbar } from "@/components/layout/navbar";
import { useTranslations } from "next-intl";
const STRIPE_PRICE_IDS: Record<string, string> = {
  project:     STRIPE_PRICES.project,
  startup:     STRIPE_PRICES.startup,
  startup_pro: STRIPE_PRICES.startup_pro,
};

const ACCENT: Record<string, { ring: string; btn: string }> = {
  project:     { ring: "",                       btn: "bg-indigo-600 text-white hover:bg-indigo-700" },
  startup:     { ring: "ring-2 ring-amber-400",  btn: "bg-amber-500 text-white hover:bg-amber-600" },
  startup_pro: { ring: "ring-2 ring-violet-400", btn: "bg-violet-600 text-white hover:bg-violet-700" },
};

export default function StartupBillingPage() {
  const t = useTranslations("startup_pages.billing");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currency = useCurrency();
  const CURRENT = usePlanTier("project");

  async function handleUpgrade(tierId: string) {
    const priceId = STRIPE_PRICE_IDS[tierId];
    if (!priceId) {
      setError(t("not_bookable"));
      return;
    }
    setLoading(tierId);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, currency, successUrl: "/startup/billing?upgraded=1", cancelUrl: "/startup/billing" }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else throw new Error("Keine Checkout-URL");
    } catch {
      setError(t("payment_failed"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold text-zinc-900">{t("heading")}</h2>
          <p className="mt-2 text-zinc-500">
            {t("current_label")} <strong>{PROJECT_TIERS.find(t => t.id === CURRENT)?.name ?? t("fallback_tier_name")}</strong>
          </p>
        </div>

        {/* Upgrade path hint */}
        <div className="mb-8 flex items-center justify-center gap-3 text-sm text-zinc-400 flex-wrap">
          {PROJECT_TIERS.map((t, i) => (
            <span key={t.id} className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${t.id === CURRENT ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-zinc-200 text-zinc-500"}`}>
                {t.emoji} {t.name} · {formatPrice(t.price, currency)}
              </span>
              {i < PROJECT_TIERS.length - 1 && <span className="text-zinc-200">→</span>}
            </span>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {PROJECT_TIERS.map(tier => {
            const a = ACCENT[tier.id];
            const isCurrent = tier.id === CURRENT;
            // Rank by position in PROJECT_TIERS (project < startup < startup_pro).
            const rank = (id: string) => PROJECT_TIERS.findIndex(x => x.id === id);
            const isDowngrade = rank(tier.id) < rank(CURRENT);
            return (
              <div key={tier.id} className={`relative rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm flex flex-col ${a.ring}`}>
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-amber-500 px-4 py-1 text-xs font-bold text-white shadow">{t("popular")}</span>
                  </div>
                )}
                <span className="text-3xl">{tier.emoji}</span>
                <h3 className="mt-2 text-xl font-extrabold text-zinc-900">{tier.name}</h3>
                <div className="mt-1 flex items-baseline gap-1 mb-5">
                  <span className="text-2xl font-black text-zinc-900">{formatPrice(tier.price, currency)}</span>
                  <span className="text-sm text-zinc-400">{t("per_month_short")}</span>
                </div>
                <ul className="flex-1 flex flex-col gap-2 mb-7">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-600">
                      <span className="mt-0.5 text-green-500 shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="rounded-xl bg-zinc-100 py-2.5 text-center text-sm font-semibold text-zinc-500">{t("current_plan")}</div>
                ) : isDowngrade ? (
                  <div className="rounded-xl bg-zinc-50 border border-zinc-200 py-2.5 text-center text-sm text-zinc-400">{t("downgrade")}</div>
                ) : (
                  <button onClick={() => handleUpgrade(tier.id)} disabled={!!loading}
                    className={`rounded-xl py-2.5 text-sm font-bold transition-colors disabled:opacity-50 ${a.btn}`}>
                    {loading === tier.id ? t("starting") : tier.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        {/* Feature comparison */}
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-zinc-900 mb-4">{t("whats_included")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left py-2 text-zinc-500 font-medium">{t("col_feature")}</th>
                  {PROJECT_TIERS.map(t => <th key={t.id} className="py-2 text-center font-semibold text-zinc-700">{t.emoji} {t.name}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {[
                  [t("feat_public_profile"),        "✓", "✓", "✓"],
                  [t("feat_stealth_mode"),          "✓", "✓", "✓"],
                  [t("feat_find_talent"),           "✓", "✓", "✓"],
                  [t("feat_found_by_investors"),    "✓", "✓", "✓"],
                  [t("feat_funding_mrr"),           "–", "✓", "✓"],
                  [t("feat_ai_businessplan"),       "–", "✓", "✓"],
                  [t("feat_discover_investors"),    "–", "✓", "✓"],
                  [t("feat_dadori_intro"),          "–", "✓", "✓"],
                  [t("feat_verified_badge"),        "–", "–", "✓"],
                  [t("feat_featured_placement"),    "–", "–", "✓"],
                  [t("feat_data_room"),             "–", "–", "✓"],
                  [t("feat_unlimited_intros"),      "–", "–", "✓"],
                ].map(([feat, ...vals]) => (
                  <tr key={feat}>
                    <td className="py-2 text-zinc-600">{feat}</td>
                    {vals.map((v, i) => (
                      <td key={i} className={`py-2 text-center ${v === "–" ? "text-zinc-300" : "text-zinc-800 font-medium"}`}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">{t("footer_note")}</p>
      </main>
    </div>
  );
}
