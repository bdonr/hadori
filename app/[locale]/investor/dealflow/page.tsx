"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/layout/navbar";

const TIER_GATE = "investor_basic"; // angel+

const DEAL_FLOW: {
  id: string; name: string; icon: string; category: string; stage: string; stageEmoji: string;
  region: string; regionFlag: string; mrr: string; teamSize: string; tagline: string;
  addedDaysAgo: number; isNew: boolean; isStealth: boolean; stealthProblems?: string[];
}[] = [
  { id: "dadori", name: "DADORI", icon: "🚀", category: "B2B SaaS", stage: "Pre-Seed", stageEmoji: "🌱", region: "DE", regionFlag: "🇩🇪", mrr: "€0", teamSize: "2–5", tagline: "Dreiseitige Incubator-Plattform für Startups, Talente & Investoren.", addedDaysAgo: 1, isNew: true, isStealth: false },
  { id: "klimaapp", name: "KlimaApp", icon: "🌍", category: "Climate Tech", stage: "Seed", stageEmoji: "🌿", region: "DE", regionFlag: "🇩🇪", mrr: "€5k", teamSize: "5–10", tagline: "CO₂-Tracking für den Alltag.", addedDaysAgo: 3, isNew: true, isStealth: false },
  { id: "edupilot", name: "EduPilot", icon: "📚", category: "EdTech", stage: "Pre-Revenue", stageEmoji: "🚀", region: "CH", regionFlag: "🇨🇭", mrr: "€0", teamSize: "2–5", tagline: "KI-Tutor für Schüler in DACH.", addedDaysAgo: 5, isNew: false, isStealth: false },
  { id: "stealth-1", name: "???", icon: "🥷", category: "Fintech", stage: "Seed", stageEmoji: "🌿", region: "DE", regionFlag: "🇩🇪", mrr: "€12k", teamSize: "6–15", tagline: "", addedDaysAgo: 2, isNew: true, isStealth: true, stealthProblems: ["Zu hohe Kosten", "Compliance"] },
  { id: "fitstreak", name: "FitStreak", icon: "💪", category: "Health", stage: "Seed", stageEmoji: "🌿", region: "DE", regionFlag: "🇩🇪", mrr: "€3k", teamSize: "2–5", tagline: "Habit-App für Sport-Nerds.", addedDaysAgo: 7, isNew: false, isStealth: false },
  { id: "stealth-2", name: "???", icon: "🥷", category: "Deep Tech / AI", stage: "Pre-Seed", stageEmoji: "🌱", region: "AT", regionFlag: "🇦🇹", mrr: "€0", teamSize: "2–5", tagline: "", addedDaysAgo: 1, isNew: true, isStealth: true, stealthProblems: ["Informationsasymmetrie", "Effizienz"] },
];

const CURRENT_TIER = "investor_pro";
const TIER_ORDER = ["investor_free", "investor_basic", "investor_pro", "investor_premium", "investor_elite"];
function tierAtLeast(required: string) {
  return TIER_ORDER.indexOf(CURRENT_TIER) >= TIER_ORDER.indexOf(required);
}

export default function DealFlowPage() {
  const t = useTranslations("investor_pages.dealflow");
  const [filter, setFilter] = useState("all");
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const canSeeDeals = tierAtLeast(TIER_GATE);

  const items = filter === "new" ? DEAL_FLOW.filter(d => d.isNew)
    : filter === "stealth" ? DEAL_FLOW.filter(d => d.isStealth)
    : DEAL_FLOW;

  function toggleSave(id: string) {
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {!canSeeDeals ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
            <span className="text-4xl">🔒</span>
            <h2 className="mt-4 text-xl font-bold text-zinc-900">{t("gate_title")}</h2>
            <p className="mt-2 text-sm text-zinc-500">{t("gate_subtitle")}</p>
            <Link href="/investor/billing" className="mt-4 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors">
              {t("upgrade_now")}
            </Link>
          </div>
        ) : (
          <>
            {/* Info bar */}
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 flex items-center gap-3">
              <span className="text-lg">📬</span>
              <p className="text-sm text-emerald-800">
                <strong>{t("new_startups", { n: DEAL_FLOW.filter(d => d.isNew).length })}</strong> {t("this_week")} ·
                {tierAtLeast("investor_pro") ? ` ${t("incl_stealth", { n: DEAL_FLOW.filter(d => d.isStealth).length })}` : ` ${t("stealth_from_pro")}`}
              </p>
            </div>

            {/* Filters */}
            <div className="mb-5 flex gap-2">
              {[["all", t("filter_all")], ["new", t("filter_new")], ["stealth", t("filter_stealth")]].map(([id, label]) => (
                <button key={id} onClick={() => setFilter(id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === id ? "bg-emerald-600 text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300"}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              {items.map(deal => {
                const isStealthLocked = deal.isStealth && !tierAtLeast("investor_pro");
                return (
                  <div key={deal.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-2xl">
                        {deal.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-zinc-900">{deal.isStealth ? t("stealth_project") : deal.name}</span>
                              {deal.isNew && <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">{t("badge_new")}</span>}
                              {deal.isStealth && <span className="rounded-full bg-zinc-100 text-zinc-500 px-2 py-0.5 text-[10px] font-semibold">{t("badge_stealth")}</span>}
                              <span className="text-xs text-zinc-400">{t("days_ago", { n: deal.addedDaysAgo })}</span>
                            </div>
                            {isStealthLocked ? (
                              <p className="text-sm text-zinc-400 mt-0.5">{t("problem_area")} <strong>{deal.stealthProblems?.join(", ")}</strong> {t("details_from_pro")}</p>
                            ) : deal.isStealth ? (
                              <p className="text-sm text-zinc-500 mt-0.5">{t("solves")} <strong>{deal.stealthProblems?.join(" & ")}</strong> {t("in_area")} <strong>{deal.category}</strong></p>
                            ) : (
                              <p className="text-sm text-zinc-500 mt-0.5">{deal.tagline}</p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => toggleSave(deal.id)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${saved.has(deal.id) ? "bg-amber-100 text-amber-700" : "border border-zinc-200 text-zinc-500 hover:border-amber-300"}`}>
                              {saved.has(deal.id) ? t("saved") : t("save")}
                            </button>
                            <Link href={`/en/project/${deal.id}`}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors">
                              {t("details")}
                            </Link>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
                          <span>{deal.regionFlag} {deal.region}</span>
                          <span>·</span>
                          <span>{deal.stageEmoji} {deal.stage}</span>
                          <span>·</span>
                          <span>{t("mrr_label", { mrr: deal.mrr })}</span>
                          <span>·</span>
                          <span>👥 {deal.teamSize}</span>
                          <span>·</span>
                          <span>{deal.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
