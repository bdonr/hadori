"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { useTranslations } from "next-intl";

// ── Picker data ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "saas", labelKey: "cat_saas", emoji: "💻" },
  { id: "marketplace", labelKey: "cat_marketplace", emoji: "🛒" },
  { id: "ecommerce", labelKey: "cat_ecommerce", emoji: "📦" },
  { id: "fintech", labelKey: "cat_fintech", emoji: "💳" },
  { id: "health", labelKey: "cat_health", emoji: "🏥" },
  { id: "edtech", labelKey: "cat_edtech", emoji: "📚" },
  { id: "climate", labelKey: "cat_climate", emoji: "🌍" },
  { id: "creator", labelKey: "cat_creator", emoji: "🎬" },
  { id: "gaming", labelKey: "cat_gaming", emoji: "🎮" },
  { id: "ai", labelKey: "cat_ai", emoji: "🤖" },
  { id: "logistics", labelKey: "cat_logistics", emoji: "🚚" },
  { id: "other", labelKey: "cat_other", emoji: "💡" },
];

const PROBLEM_AREAS = [
  { id: "efficiency", labelKey: "prob_efficiency" },
  { id: "cost", labelKey: "prob_cost" },
  { id: "access", labelKey: "prob_access" },
  { id: "information", labelKey: "prob_information" },
  { id: "coordination", labelKey: "prob_coordination" },
  { id: "trust", labelKey: "prob_trust" },
  { id: "quality", labelKey: "prob_quality" },
  { id: "compliance", labelKey: "prob_compliance" },
  { id: "engagement", labelKey: "prob_engagement" },
  { id: "other", labelKey: "prob_other" },
];

const TARGET_GROUPS = [
  { id: "smb", labelKey: "target_smb" },
  { id: "enterprise", labelKey: "target_enterprise" },
  { id: "freelancer", labelKey: "target_freelancer" },
  { id: "consumer", labelKey: "target_consumer" },
  { id: "creator", labelKey: "target_creator" },
  { id: "student", labelKey: "target_student" },
  { id: "hr", labelKey: "target_hr" },
  { id: "founder", labelKey: "target_founder" },
  { id: "dev", labelKey: "target_dev" },
  { id: "health_pro", labelKey: "target_health_pro" },
];

const BUSINESS_MODELS = [
  { id: "saas_sub", labelKey: "biz_saas_sub", emoji: "🔄" },
  { id: "transaction", labelKey: "biz_transaction", emoji: "💸" },
  { id: "freemium", labelKey: "biz_freemium", emoji: "🆓" },
  { id: "marketplace_fee", labelKey: "biz_marketplace_fee", emoji: "🏪" },
  { id: "license", labelKey: "biz_license", emoji: "📄" },
  { id: "ads", labelKey: "biz_ads", emoji: "📢" },
  { id: "data", labelKey: "biz_data", emoji: "📊" },
  { id: "service", labelKey: "biz_service", emoji: "🤝" },
  { id: "hardware", labelKey: "biz_hardware", emoji: "🔧" },
  { id: "other", labelKey: "biz_other", emoji: "💡" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function Chips<T extends { id: string; labelKey: string; emoji?: string }>({
  items, selected, onToggle, multi = false, t,
}: {
  items: T[];
  selected: string | string[];
  onToggle: (id: string) => void;
  multi?: boolean;
  t: (key: string) => string;
}) {
  const isActive = (id: string) =>
    Array.isArray(selected) ? selected.includes(id) : selected === id;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onToggle(item.id)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors flex items-center gap-1.5 ${
            isActive(item.id)
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400"
          }`}
        >
          {item.emoji && <span>{item.emoji}</span>}
          {t(item.labelKey)}
        </button>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const t = useTranslations("startup_pages.plan");
  const [step, setStep] = useState<"form" | "result">("form");

  // Picker state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [bizModel, setBizModel] = useState("");
  const [description, setDescription] = useState("");

  function toggleMulti(set: React.Dispatch<React.SetStateAction<string[]>>, id: string) {
    set(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const canSubmit = name.trim() && category && problems.length > 0 && targets.length > 0 && bizModel;

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStep("result");
  }

  const selectedCategory = CATEGORIES.find(c => c.id === category);
  const selectedBizModel = BUSINESS_MODELS.find(b => b.id === bizModel);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 py-10">

        {step === "form" && (
          <form onSubmit={handleGenerate} className="flex flex-col gap-6">

            {/* Name */}
            <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
              <h2 className="font-semibold text-zinc-900">{t("startup_name")}</h2>
              <input
                required value={name} onChange={e => setName(e.target.value)}
                placeholder={t("startup_name_placeholder")}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </section>

            {/* Kategorie */}
            <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
              <h2 className="font-semibold text-zinc-900">{t("category")}</h2>
              <p className="text-xs text-zinc-400">{t("category_hint")}</p>
              <Chips items={CATEGORIES} selected={category} onToggle={id => setCategory(id === category ? "" : id)} t={t} />
            </section>

            {/* Problem */}
            <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
              <h2 className="font-semibold text-zinc-900">{t("problem_heading")}</h2>
              <p className="text-xs text-zinc-400">{t("problem_hint")}</p>
              <Chips multi items={PROBLEM_AREAS} selected={problems} onToggle={id => toggleMulti(setProblems, id)} t={t} />
            </section>

            {/* Zielgruppe */}
            <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
              <h2 className="font-semibold text-zinc-900">{t("target_heading")}</h2>
              <p className="text-xs text-zinc-400">{t("target_hint")}</p>
              <Chips multi items={TARGET_GROUPS} selected={targets} onToggle={id => toggleMulti(setTargets, id)} t={t} />
            </section>

            {/* Geschäftsmodell */}
            <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
              <h2 className="font-semibold text-zinc-900">{t("biz_heading")}</h2>
              <p className="text-xs text-zinc-400">{t("biz_hint")}</p>
              <Chips items={BUSINESS_MODELS} selected={bizModel} onToggle={id => setBizModel(id === bizModel ? "" : id)} t={t} />
            </section>

            {/* Beschreibung — einziges Freitext-Feld */}
            <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
              <h2 className="font-semibold text-zinc-900">{t("desc_heading")} <span className="text-zinc-400 font-normal text-sm">{t("optional")}</span></h2>
              <p className="text-xs text-zinc-400">{t("desc_hint")}</p>
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder={t("desc_placeholder")}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
              />
            </section>

            {/* Summary + CTA */}
            {canSubmit && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-indigo-900">{name}</p>
                  <p className="text-sm text-indigo-700 mt-0.5">
                    {selectedCategory?.emoji} {selectedCategory ? t(selectedCategory.labelKey) : ""} ·{" "}
                    {t("summary_problems", { count: problems.length })} ·{" "}
                    {t("summary_targets", { count: targets.length })} ·{" "}
                    {selectedBizModel?.emoji} {selectedBizModel ? t(selectedBizModel.labelKey) : ""}
                  </p>
                </div>
              </div>
            )}

            <Button type="submit" size="lg" disabled={!canSubmit} className="disabled:opacity-40">
              {t("generate_cta")}
            </Button>
            {!canSubmit && (
              <p className="text-xs text-zinc-400 text-center">
                {t("generate_hint")}
              </p>
            )}
          </form>
        )}

        {step === "result" && (
          <div className="flex flex-col gap-6">
            {/* Preview / locked result */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-zinc-900 mb-1">{t("exec_summary")}</h2>
              <p className="text-sm text-zinc-500 mb-6">{t("ai_generated")}</p>
              <div className="space-y-3 text-sm leading-relaxed text-zinc-700">
                <p>
                  {t.rich("summary_sentence1", {
                    strong: (chunks) => <strong>{chunks}</strong>,
                    name,
                    category: selectedCategory ? t(selectedCategory.labelKey) : "",
                    problems: problems.map(p => { const it = PROBLEM_AREAS.find(x => x.id === p); return it ? t(it.labelKey) : null; }).filter(Boolean).join(", ").toLowerCase(),
                    targets: targets.map(tg => { const it = TARGET_GROUPS.find(x => x.id === tg); return it ? t(it.labelKey) : null; }).filter(Boolean).join(", "),
                  })}
                </p>
                <p>
                  {t("summary_sentence2", { model: selectedBizModel ? t(selectedBizModel.labelKey).toLowerCase() : "" })}
                  {description ? ` ${description}` : ""}
                </p>
              </div>
            </div>

            {/* Locked sections */}
            {[
              { title: t("locked_market_title"), hint: t("locked_market_hint") },
              { title: t("locked_competition_title"), hint: t("locked_competition_hint") },
              { title: t("locked_finance_title"), hint: t("locked_finance_hint") },
            ].map(s => (
              <div key={s.title} className="relative rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm overflow-hidden">
                <div className="blur-sm select-none pointer-events-none">
                  <h2 className="text-lg font-bold text-zinc-900 mb-3">{s.title}</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {["???", "???", "???"].map((v, i) => (
                      <div key={i} className="rounded-xl bg-indigo-50 p-4 text-center">
                        <p className="text-xs text-indigo-400 uppercase font-semibold">{t("value_label", { n: i + 1 })}</p>
                        <p className="mt-1 text-2xl font-black text-indigo-200">€{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-sm">
                  <span className="text-3xl">🔒</span>
                  <p className="font-bold text-zinc-900">{s.title}</p>
                  <p className="text-sm text-zinc-500">{s.hint}</p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/startup/billing">{t("unlock_pro_cta")}</Link>
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("form")}>{t("create_new")}</Button>
              <Button asChild><Link href="/startup">{t("dashboard")}</Link></Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
