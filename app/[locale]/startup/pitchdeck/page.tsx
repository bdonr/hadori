"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isStartupPaid } from "@/lib/entitlements";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { Navbar } from "@/components/layout/navbar";
import { useTranslations } from "next-intl";

/* ──────────────────────────────────────────────
   Slide definitions
   Free gets slides 0-2, Pro gets all 8
────────────────────────────────────────────── */
interface Slide {
  id: string;
  icon: string;
  titleKey: string;
  proOnly: boolean;
  fields: { labelKey: string; placeholderKey: string; multiline?: boolean }[];
}

const SLIDES: Slide[] = [
  {
    id: "problem",
    icon: "🔥",
    titleKey: "slide_problem_title",
    proOnly: false,
    fields: [
      { labelKey: "slide_problem_f1_label", placeholderKey: "slide_problem_f1_placeholder", multiline: true },
      { labelKey: "slide_problem_f2_label", placeholderKey: "slide_problem_f2_placeholder" },
    ],
  },
  {
    id: "solution",
    icon: "💡",
    titleKey: "slide_solution_title",
    proOnly: false,
    fields: [
      { labelKey: "slide_solution_f1_label", placeholderKey: "slide_solution_f1_placeholder", multiline: true },
      { labelKey: "slide_solution_f2_label", placeholderKey: "slide_solution_f2_placeholder" },
    ],
  },
  {
    id: "model",
    icon: "💰",
    titleKey: "slide_model_title",
    proOnly: false,
    fields: [
      { labelKey: "slide_model_f1_label", placeholderKey: "slide_model_f1_placeholder" },
      { labelKey: "slide_model_f2_label", placeholderKey: "slide_model_f2_placeholder" },
    ],
  },
  {
    id: "market",
    icon: "📊",
    titleKey: "slide_market_title",
    proOnly: true,
    fields: [
      { labelKey: "slide_market_f1_label", placeholderKey: "slide_market_f1_placeholder" },
      { labelKey: "slide_market_f2_label", placeholderKey: "slide_market_f2_placeholder" },
    ],
  },
  {
    id: "traction",
    icon: "🚀",
    titleKey: "slide_traction_title",
    proOnly: true,
    fields: [
      { labelKey: "slide_traction_f1_label", placeholderKey: "slide_traction_f1_placeholder", multiline: true },
      { labelKey: "slide_traction_f2_label", placeholderKey: "slide_traction_f2_placeholder" },
    ],
  },
  {
    id: "competitors",
    icon: "⚔️",
    titleKey: "slide_competitors_title",
    proOnly: true,
    fields: [
      { labelKey: "slide_competitors_f1_label", placeholderKey: "slide_competitors_f1_placeholder" },
      { labelKey: "slide_competitors_f2_label", placeholderKey: "slide_competitors_f2_placeholder" },
    ],
  },
  {
    id: "team",
    icon: "👥",
    titleKey: "slide_team_title",
    proOnly: true,
    fields: [
      { labelKey: "slide_team_f1_label", placeholderKey: "slide_team_f1_placeholder", multiline: true },
      { labelKey: "slide_team_f2_label", placeholderKey: "slide_team_f2_placeholder" },
    ],
  },
  {
    id: "ask",
    icon: "🎯",
    titleKey: "slide_ask_title",
    proOnly: true,
    fields: [
      { labelKey: "slide_ask_f1_label", placeholderKey: "slide_ask_f1_placeholder" },
      { labelKey: "slide_ask_f2_label", placeholderKey: "slide_ask_f2_placeholder", multiline: true },
    ],
  },
];

/* ──────────────────────────────────────────────
   Component
────────────────────────────────────────────── */
export default function PitchDeckPage() {
  const t = useTranslations("startup_pages.pitchdeck");
  const params = useParams();
  const locale = (params.locale as string) ?? "en";

  const [isPro, setIsPro] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      try {
        // Load plan tier
        const profileSnap = await getDoc(doc(db, "profiles", user.uid));
        if (profileSnap.exists()) {
          const tier = profileSnap.data().plan_tier as string | undefined;
          setIsPro(isStartupPaid(tier));
        }
        // Load existing pitchdeck
        const deckSnap = await getDoc(doc(db, "pitchdecks", user.uid));
        if (deckSnap.exists()) {
          const slides = deckSnap.data().slides as Record<string, Record<string, string>> | undefined;
          if (slides) setValues(slides);
        }
      } catch { /* ignore */ }
    });
    return () => unsub();
  }, []);

  const visibleSlides = isPro ? SLIDES : SLIDES.slice(0, 3);
  const lockedSlides = isPro ? [] : SLIDES.slice(3);

  function set(slideId: string, label: string, value: string) {
    setValues((prev) => ({
      ...prev,
      [slideId]: { ...(prev[slideId] ?? {}), [label]: value },
    }));
    setSaved(false);
  }

  async function handleSave() {
    if (!uid) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "pitchdecks", uid),
        { slides: values, updated_at: serverTimestamp() },
        { merge: true }
      );
      setSaved(true);
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-10">
        {!isPro && (
          <div className="mb-8 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4 flex items-start gap-3">
            <span className="text-xl">✨</span>
            <div>
              <p className="text-sm font-semibold text-indigo-900">
                {t("upsell_title")}
              </p>
              <p className="mt-0.5 text-sm text-indigo-600">
                {t("upsell_desc")}
              </p>
            </div>
            <Button size="sm" className="ml-auto shrink-0" asChild>
              <Link href={`/${locale}/startup/billing`}>{t("upgrade_to_pro")}</Link>
            </Button>
          </div>
        )}

        {/* Active slides */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSlides.map((slide) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              t={t}
              values={values[slide.id] ?? {}}
              onChange={(label, val) => set(slide.id, label, val)}
            />
          ))}
        </div>

        {/* Locked slides — blurred upsell */}
        {lockedSlides.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-200" />
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                {t("in_pro_plan")}
              </span>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>

            <div className="relative">
              {/* Blurred grid */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 select-none pointer-events-none">
                {lockedSlides.map((slide) => (
                  <div
                    key={slide.id}
                    className="blur-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-2xl">{slide.icon}</span>
                      <h3 className="font-bold text-zinc-900">{t(slide.titleKey)}</h3>
                    </div>
                    {slide.fields.map((f) => (
                      <div key={f.labelKey} className="mb-3">
                        <p className="mb-1 text-xs font-medium text-zinc-500">{t(f.labelKey)}</p>
                        <div className="h-8 rounded-lg bg-zinc-100" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Overlay CTA */}
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-[2px]">
                <div className="text-center px-8">
                  <span className="text-4xl">🔒</span>
                  <h3 className="mt-3 text-lg font-black text-zinc-900">
                    {t("locked_title")}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500 max-w-sm">
                    {t("locked_desc")}
                  </p>
                  <Button className="mt-5" size="lg" asChild>
                    <Link href={`/${locale}/startup/billing`}>{t("locked_cta")}</Link>
                  </Button>
                  <p className="mt-2 text-xs text-zinc-400">{t("locked_note")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save button for active slides */}
        <div className="mt-8 flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm font-medium text-green-600">{t("saved")}</span>
          )}
          <Button size="lg" onClick={handleSave} disabled={saving}>
            {saving ? t("saving") : t("save_pitchdeck")}
          </Button>
        </div>
      </main>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Slide card component
────────────────────────────────────────────── */
function SlideCard({
  slide,
  t,
  values,
  onChange,
}: {
  slide: Slide;
  t: (key: string) => string;
  values: Record<string, string>;
  onChange: (label: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">{slide.icon}</span>
        <h3 className="font-bold text-zinc-900">{t(slide.titleKey)}</h3>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {slide.fields.map((f) =>
          f.multiline ? (
            <div key={f.labelKey}>
              <label className="mb-1 block text-xs font-medium text-zinc-500">{t(f.labelKey)}</label>
              <textarea
                rows={3}
                placeholder={t(f.placeholderKey)}
                value={values[f.labelKey] ?? ""}
                onChange={(e) => onChange(f.labelKey, e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
              />
            </div>
          ) : (
            <div key={f.labelKey}>
              <label className="mb-1 block text-xs font-medium text-zinc-500">{t(f.labelKey)}</label>
              <input
                type="text"
                placeholder={t(f.placeholderKey)}
                value={values[f.labelKey] ?? ""}
                onChange={(e) => onChange(f.labelKey, e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}
