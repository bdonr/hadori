"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { useTranslations } from "next-intl";
import { isStartupPaid } from "@/lib/entitlements";

const CATEGORIES = [
  { id: "saas", labelKey: "cat_saas", emoji: "💻" }, { id: "marketplace", labelKey: "cat_marketplace", emoji: "🛒" },
  { id: "ecommerce", labelKey: "cat_ecommerce", emoji: "📦" }, { id: "fintech", labelKey: "cat_fintech", emoji: "💳" },
  { id: "health", labelKey: "cat_health", emoji: "🏥" }, { id: "edtech", labelKey: "cat_edtech", emoji: "📚" },
  { id: "climate", labelKey: "cat_climate", emoji: "🌍" }, { id: "creator", labelKey: "cat_creator", emoji: "🎬" },
  { id: "gaming", labelKey: "cat_gaming", emoji: "🎮" }, { id: "ai", labelKey: "cat_ai", emoji: "🤖" },
  { id: "logistics", labelKey: "cat_logistics", emoji: "🚚" }, { id: "other", labelKey: "cat_other", emoji: "💡" },
];
const PROBLEM_AREAS = [
  { id: "efficiency", labelKey: "prob_efficiency" }, { id: "cost", labelKey: "prob_cost" }, { id: "access", labelKey: "prob_access" },
  { id: "information", labelKey: "prob_information" }, { id: "coordination", labelKey: "prob_coordination" }, { id: "trust", labelKey: "prob_trust" },
  { id: "quality", labelKey: "prob_quality" }, { id: "compliance", labelKey: "prob_compliance" }, { id: "engagement", labelKey: "prob_engagement" }, { id: "other", labelKey: "prob_other" },
];
const TARGET_GROUPS = [
  { id: "smb", labelKey: "target_smb" }, { id: "enterprise", labelKey: "target_enterprise" }, { id: "freelancer", labelKey: "target_freelancer" },
  { id: "consumer", labelKey: "target_consumer" }, { id: "creator", labelKey: "target_creator" }, { id: "student", labelKey: "target_student" },
  { id: "hr", labelKey: "target_hr" }, { id: "founder", labelKey: "target_founder" }, { id: "dev", labelKey: "target_dev" }, { id: "health_pro", labelKey: "target_health_pro" },
];
const BUSINESS_MODELS = [
  { id: "saas_sub", labelKey: "biz_saas_sub", emoji: "🔄" }, { id: "transaction", labelKey: "biz_transaction", emoji: "💸" }, { id: "freemium", labelKey: "biz_freemium", emoji: "🆓" },
  { id: "marketplace_fee", labelKey: "biz_marketplace_fee", emoji: "🏪" }, { id: "license", labelKey: "biz_license", emoji: "📄" }, { id: "ads", labelKey: "biz_ads", emoji: "📢" },
  { id: "data", labelKey: "biz_data", emoji: "📊" }, { id: "service", labelKey: "biz_service", emoji: "🤝" }, { id: "hardware", labelKey: "biz_hardware", emoji: "🔧" }, { id: "other", labelKey: "biz_other", emoji: "💡" },
];

type T = (k: string, v?: Record<string, unknown>) => string;

function Chips({ items, selected, onToggle, t }: {
  items: { id: string; labelKey: string; emoji?: string }[]; selected: string | string[]; onToggle: (id: string) => void; t: T;
}) {
  const active = (id: string) => Array.isArray(selected) ? selected.includes(id) : selected === id;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button key={item.id} type="button" onClick={() => onToggle(item.id)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${active(item.id) ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-400"}`}>
          {item.emoji && <span>{item.emoji}</span>}{t(item.labelKey)}
        </button>
      ))}
    </div>
  );
}

interface External { headline: string; whatWeDo: string; forWhom: string; teaser: string; }
interface Internal {
  coreIdea: string; differentiation: string; problem: string; solution: string; businessModel: string;
  competitors?: { name: string; note: string }[]; uniqueness: string; risks?: string; nextSteps: string[];
}

export default function PlanPage() {
  const t = useTranslations("startup_pages.plan") as unknown as T;
  const { locale } = useParams<{ locale: string }>();
  const [tier, setTier] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "questions" | "result">("form");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [bizModel, setBizModel] = useState("");
  const [description, setDescription] = useState("");

  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [external, setExternal] = useState<External | null>(null);
  const [internal, setInternal] = useState<Internal | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [showExternal, setShowExternal] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    if (!u) { setTier("free"); return; }
    setUid(u.uid);
    try {
      const [s, bp] = await Promise.all([
        getDoc(doc(db, "profiles", u.uid)),
        getDoc(doc(db, "businessplans", u.uid)),
      ]);
      setTier((s.data()?.plan_tier as string) ?? "free");
      // Load a previously generated plan so it is never "lost" on reload.
      if (bp.exists()) {
        const d = bp.data() as { external?: External; internal?: Internal; showExternal?: boolean };
        if (typeof d.showExternal === "boolean") setShowExternal(d.showExternal);
        if (d.external && d.internal) {
          setExternal(d.external);
          setInternal(d.internal);
          setStep("result");
        }
      }
    } catch { setTier("free"); }
  }), []);

  const paid = isStartupPaid(tier);
  const toggleMulti = (set: React.Dispatch<React.SetStateAction<string[]>>, id: string) =>
    set((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const label = (arr: { id: string; labelKey: string }[], id: string) => { const it = arr.find((x) => x.id === id); return it ? t(it.labelKey) : id; };
  const paramsForApi = () => ({
    name, category: label(CATEGORIES, category),
    problems: problems.map((p) => label(PROBLEM_AREAS, p)),
    targets: targets.map((g) => label(TARGET_GROUPS, g)),
    bizModel: label(BUSINESS_MODELS, bizModel), description,
  });

  const canSubmit = name.trim() && category && problems.length > 0 && targets.length > 0 && bizModel;

  async function fetchQuestions(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/ai/plan/questions", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ params: paramsForApi(), locale }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.questions)) { setError(res.status === 403 ? t("paid_only") : t("ai_error")); return; }
      setQuestions(data.questions); setAnswers(new Array(data.questions.length).fill("")); setStep("questions");
    } catch { setError(t("ai_error")); } finally { setBusy(false); }
  }

  async function generatePlan() {
    setBusy(true); setError(null);
    try {
      const qa = questions.map((q, i) => ({ q, a: answers[i] ?? "" }));
      const res = await fetch("/api/ai/plan/generate", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ params: paramsForApi(), qa, locale }),
      });
      const data = await res.json();
      if (!res.ok || !data.internal) { setError(t("ai_error")); return; }
      setExternal(data.external); setInternal(data.internal); setStep("result");
    } catch { setError(t("ai_error")); } finally { setBusy(false); }
  }

  async function toggleShowExternal() {
    const next = !showExternal;
    setShowExternal(next);
    if (!uid) return;
    try {
      await setDoc(doc(db, "businessplans", uid), { showExternal: next, updated_at: serverTimestamp() }, { merge: true });
    } catch { setShowExternal(!next); }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">

        {tier && !paid && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <span className="text-3xl">🔒</span>
            <p className="mt-2 font-bold text-amber-900">{t("paid_only")}</p>
            <Button asChild className="mt-3"><Link href={`/${locale}/startup/billing`}>{t("unlock_pro_cta")}</Link></Button>
          </div>
        )}

        {step === "form" && (
          <form onSubmit={fetchQuestions} className="flex flex-col gap-6">
            <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-zinc-900">{t("startup_name")}</h2>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t("startup_name_placeholder")}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
            </section>
            <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-zinc-900">{t("category")}</h2>
              <Chips items={CATEGORIES} selected={category} onToggle={(id) => setCategory(id === category ? "" : id)} t={t} />
            </section>
            <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-zinc-900">{t("problem_heading")}</h2>
              <p className="text-xs text-zinc-400">{t("problem_hint")}</p>
              <Chips items={PROBLEM_AREAS} selected={problems} onToggle={(id) => toggleMulti(setProblems, id)} t={t} />
            </section>
            <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-zinc-900">{t("target_heading")}</h2>
              <p className="text-xs text-zinc-400">{t("target_hint")}</p>
              <Chips items={TARGET_GROUPS} selected={targets} onToggle={(id) => toggleMulti(setTargets, id)} t={t} />
            </section>
            <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-zinc-900">{t("biz_heading")}</h2>
              <Chips items={BUSINESS_MODELS} selected={bizModel} onToggle={(id) => setBizModel(id === bizModel ? "" : id)} t={t} />
            </section>
            <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-zinc-900">{t("desc_heading")} <span className="text-sm font-normal text-zinc-400">{t("optional")}</span></h2>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder={t("desc_placeholder")}
                className="resize-none rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
            </section>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" size="lg" disabled={!canSubmit || busy || !paid} className="disabled:opacity-40">
              {busy ? t("generating_questions") : t("next_questions")}
            </Button>
            {!canSubmit && <p className="text-center text-xs text-zinc-400">{t("generate_hint")}</p>}
          </form>
        )}

        {step === "questions" && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">{t("questions_title")}</h2>
              <p className="text-sm text-zinc-500">{t("questions_hint")}</p>
            </div>
            {questions.map((q, i) => (
              <div key={i} className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-zinc-800">{i + 1}. {q}</p>
                <textarea value={answers[i] ?? ""} onChange={(e) => setAnswers((a) => { const n = [...a]; n[i] = e.target.value; return n; })}
                  rows={2} placeholder={t("answer_placeholder")}
                  className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              </div>
            ))}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("form")} disabled={busy}>{t("back")}</Button>
              <Button onClick={generatePlan} disabled={busy} className="flex-1">
                {busy ? t("generating_plan") : t("generate_plan")}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && external && internal && (
          <div className="flex flex-col gap-6">
            <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">{t("saved_note")}</p>

            {/* External */}
            <section className="rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900">{t("version_external_title")}</h2>
              <p className="mb-4 text-sm text-emerald-700">{t("version_external_desc")}</p>

              {/* Publish-teaser toggle — controls the public company page */}
              <div className={`mb-4 flex items-start justify-between gap-4 rounded-xl border p-4 ${showExternal ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-zinc-50"}`}>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {showExternal ? `🌍 ${t("show_external_public_title")}` : `🔒 ${t("show_external_private_title")}`}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {showExternal ? t("show_external_public_desc") : t("show_external_private_desc")}
                  </p>
                </div>
                <button type="button" aria-label="toggle-plan-public" onClick={toggleShowExternal}
                  className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${showExternal ? "bg-emerald-500" : "bg-zinc-300"}`}>
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${showExternal ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <h3 className="text-xl font-extrabold text-zinc-900">{external.headline}</h3>
              <Field label={t("ext_whatWeDo")} value={external.whatWeDo} />
              <Field label={t("ext_forWhom")} value={external.forWhom} />
              <Field label={t("ext_teaser")} value={external.teaser} />
            </section>

            {/* Internal */}
            <section className="rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900">{t("version_internal_title")}</h2>
              <p className="mb-4 text-sm text-indigo-700">{t("version_internal_desc")}</p>
              <Field label={t("int_core")} value={internal.coreIdea} strong />
              <Field label={t("int_diff")} value={internal.differentiation} strong />
              <Field label={t("int_problem")} value={internal.problem} />
              <Field label={t("int_solution")} value={internal.solution} />
              <Field label={t("int_model")} value={internal.businessModel} />
              {internal.competitors && internal.competitors.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t("int_competitors")}</p>
                  <div className="mt-1 flex flex-col gap-1.5">
                    {internal.competitors.map((c, i) => (
                      <div key={i} className="rounded-lg border border-zinc-100 bg-zinc-50 p-2 text-sm">
                        <span className="font-semibold text-zinc-800">{c.name}</span> <span className="text-zinc-500">— {c.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Field label={t("int_uniqueness")} value={internal.uniqueness} strong />
              {internal.risks && <Field label={t("int_risks")} value={internal.risks} />}
              {internal.nextSteps && internal.nextSteps.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t("int_next")}</p>
                  <ul className="mt-1 space-y-1 text-sm text-zinc-700">
                    {internal.nextSteps.map((s, i) => <li key={i} className="flex gap-2"><span className="text-indigo-500">→</span>{s}</li>)}
                  </ul>
                </div>
              )}
            </section>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep("form"); setExternal(null); setInternal(null); }}>{t("create_new")}</Button>
              <Button asChild><Link href={`/${locale}/startup/overview`}>{t("to_overview")}</Link></Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  if (!value) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className={`mt-0.5 text-sm leading-relaxed ${strong ? "font-semibold text-zinc-900" : "text-zinc-600"}`}>{value}</p>
    </div>
  );
}
