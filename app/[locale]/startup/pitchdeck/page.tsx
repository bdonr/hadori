"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isStartupPaid } from "@/lib/entitlements";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase/client";
import { Navbar } from "@/components/layout/navbar";
import { HelpTip } from "@/components/HelpTip";
import { useTranslations } from "next-intl";

/* ──────────────────────────────────────────────
   Slide definitions
   Free gets slides 0-2, Pro gets all 8
────────────────────────────────────────────── */
type FieldType = "select" | "multiselect";

interface SlideField {
  labelKey: string;
  placeholderKey: string;
  multiline?: boolean;
  help?: string;
  type?: FieldType;   // when set → dropdown / multi-select instead of free text
  options?: string;   // key into OPTIONS
}

interface Slide {
  id: string;
  icon: string;
  titleKey: string;
  proOnly: boolean;
  fields: SlideField[];
}

// Predefined option sets — structured input keeps data clean & AI-trainable.
// Labels come from i18n as `opt_${set}_${id}` in the pitchdeck namespace.
const OPTIONS: Record<string, string[]> = {
  audience: ["consumer", "smb", "enterprise", "freelancer", "creator", "student", "developer", "healthcare", "hr", "founder", "public_sector", "other"],
  revenue_model: ["subscription", "transaction_fee", "freemium", "one_time", "marketplace_fee", "ads", "licensing", "usage_based", "service", "other"],
  price_point: ["free", "low", "mid", "high", "enterprise"],
  money_market: ["lt100k", "m100k_1m", "m1m_10m", "m10m_100m", "m100m_1b", "gt1b"],
  money_raise: ["lt50k", "r50k_250k", "r250k_1m", "r1m_3m", "r3m_10m", "gt10m"],
  moat: ["technology", "brand", "network_effect", "data", "cost", "speed", "community", "ip", "other"],
  roles: ["ceo", "cto", "cmo", "coo", "cfo", "product", "engineering", "design", "sales", "marketing", "ops", "other"],
  use_of_funds: ["product", "eng_team", "sales", "marketing", "operations", "international", "other"],
};

const SLIDES: Slide[] = [
  {
    id: "problem",
    icon: "🔥",
    titleKey: "slide_problem_title",
    proOnly: false,
    fields: [
      { labelKey: "slide_problem_f1_label", placeholderKey: "slide_problem_f1_placeholder", multiline: true },
      { labelKey: "slide_problem_f2_label", placeholderKey: "slide_problem_f2_placeholder", type: "multiselect", options: "audience" },
    ],
  },
  {
    id: "solution",
    icon: "💡",
    titleKey: "slide_solution_title",
    proOnly: false,
    fields: [
      { labelKey: "slide_solution_f1_label", placeholderKey: "slide_solution_f1_placeholder", multiline: true },
      { labelKey: "slide_solution_f2_label", placeholderKey: "slide_solution_f2_placeholder", help: "usp" },
    ],
  },
  {
    id: "model",
    icon: "💰",
    titleKey: "slide_model_title",
    proOnly: false,
    fields: [
      { labelKey: "slide_model_f1_label", placeholderKey: "slide_model_f1_placeholder", type: "select", options: "revenue_model" },
      { labelKey: "slide_model_f2_label", placeholderKey: "slide_model_f2_placeholder", type: "select", options: "price_point" },
    ],
  },
  {
    id: "market",
    icon: "📊",
    titleKey: "slide_market_title",
    proOnly: true,
    fields: [
      { labelKey: "slide_market_f1_label", placeholderKey: "slide_market_f1_placeholder", help: "tam", type: "select", options: "money_market" },
      { labelKey: "slide_market_f2_label", placeholderKey: "slide_market_f2_placeholder", help: "sam_som", type: "select", options: "money_market" },
    ],
  },
  {
    id: "traction",
    icon: "🚀",
    titleKey: "slide_traction_title",
    proOnly: true,
    fields: [
      { labelKey: "slide_traction_f1_label", placeholderKey: "slide_traction_f1_placeholder", multiline: true, help: "traction" },
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
      { labelKey: "slide_competitors_f2_label", placeholderKey: "slide_competitors_f2_placeholder", help: "moat", type: "multiselect", options: "moat" },
    ],
  },
  {
    id: "team",
    icon: "👥",
    titleKey: "slide_team_title",
    proOnly: true,
    fields: [
      { labelKey: "slide_team_f1_label", placeholderKey: "slide_team_f1_placeholder", type: "multiselect", options: "roles" },
      { labelKey: "slide_team_f2_label", placeholderKey: "slide_team_f2_placeholder", type: "multiselect", options: "roles" },
    ],
  },
  {
    id: "ask",
    icon: "🎯",
    titleKey: "slide_ask_title",
    proOnly: true,
    fields: [
      { labelKey: "slide_ask_f1_label", placeholderKey: "slide_ask_f1_placeholder", help: "ask", type: "select", options: "money_raise" },
      { labelKey: "slide_ask_f2_label", placeholderKey: "slide_ask_f2_placeholder", type: "multiselect", options: "use_of_funds" },
    ],
  },
];

/* ──────────────────────────────────────────────
   Component
────────────────────────────────────────────── */
export default function PitchDeckPage() {
  const t = useTranslations("startup_pages.pitchdeck");
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) ?? "en";

  const [isPro, setIsPro] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, Record<string, string | string[]>>>({});
  const [images, setImages] = useState<Record<string, string>>({});
  const [deckPublic, setDeckPublic] = useState(false);
  const [slidePublic, setSlidePublic] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
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
          setIsPro(isStartupPaid({
            plan_tier: profileSnap.data().plan_tier as string | undefined,
            capabilities: profileSnap.data().capabilities as string[] | undefined,
          }));
        }
        // Load existing pitchdeck
        const deckSnap = await getDoc(doc(db, "pitchdecks", user.uid));
        if (deckSnap.exists()) {
          const d = deckSnap.data();
          const slides = d.slides as Record<string, Record<string, string | string[]>> | undefined;
          if (slides) setValues(slides);
          const imgs = d.images as Record<string, string> | undefined;
          if (imgs) setImages(imgs);
          if (typeof d.isPublic === "boolean") setDeckPublic(d.isPublic);
          const sv = d.slidePublic as Record<string, boolean> | undefined;
          if (sv) setSlidePublic(sv);
        }
      } catch { /* ignore */ }
    });
    return () => unsub();
  }, []);

  const visibleSlides = isPro ? SLIDES : SLIDES.slice(0, 3);
  const lockedSlides = isPro ? [] : SLIDES.slice(3);

  function set(slideId: string, label: string, value: string | string[]) {
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
        { slides: values, images, isPublic: deckPublic, slidePublic, updated_at: serverTimestamp() },
        { merge: true }
      );
      setSaved(true);
      // Redirect to the overview so the founder can review the saved deck.
      setTimeout(() => router.push(`/${locale}/startup/overview`), 700);
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  async function uploadImage(slideId: string, file: File) {
    if (!uid || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // 5 MB cap (matches storage rule)
    setUploading(slideId); setImgError(false);
    try {
      const ref = storageRef(storage, `pitchdecks/${uid}/${slideId}`);
      await uploadBytes(ref, file, { contentType: file.type });
      const url = await getDownloadURL(ref);
      const next = { ...images, [slideId]: url };
      setImages(next);
      // Persist immediately so the image survives without pressing Save.
      await setDoc(doc(db, "pitchdecks", uid), { images: next, updated_at: serverTimestamp() }, { merge: true });
    } catch { setImgError(true); } finally {
      setUploading(null);
    }
  }

  async function removeImage(slideId: string) {
    if (!uid) return;
    const next = { ...images };
    delete next[slideId];
    setImages(next);
    try {
      await deleteObject(storageRef(storage, `pitchdecks/${uid}/${slideId}`)).catch(() => {});
      await setDoc(doc(db, "pitchdecks", uid), { images: next, updated_at: serverTimestamp() }, { merge: true });
    } catch { /* ignore */ }
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

        {imgError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {t("image_error")}
          </div>
        )}

        {/* Visibility control — decide IF and WHAT of the deck is public */}
        <div className={`mb-6 rounded-2xl border p-5 ${deckPublic ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-white"} shadow-sm`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-zinc-900">{deckPublic ? `🌍 ${t("vis_public_title")}` : `🔒 ${t("vis_private_title")}`}</p>
              <p className="mt-0.5 text-sm text-zinc-500">{deckPublic ? t("vis_public_desc") : t("vis_private_desc")}</p>
            </div>
            <button type="button" aria-label="toggle-deck-public" onClick={() => { setDeckPublic((v) => !v); setSaved(false); }}
              className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${deckPublic ? "bg-emerald-500" : "bg-zinc-300"}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${deckPublic ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          {deckPublic && <p className="mt-3 text-xs text-emerald-700">{t("vis_slide_hint")}</p>}
        </div>

        {/* Active slides */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSlides.map((slide) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              t={t}
              values={values[slide.id] ?? {}}
              onChange={(label, val) => set(slide.id, label, val)}
              image={images[slide.id]}
              uploading={uploading === slide.id}
              onUpload={(file) => uploadImage(slide.id, file)}
              onRemoveImage={() => removeImage(slide.id)}
              deckPublic={deckPublic}
              slidePublic={slidePublic[slide.id] ?? false}
              onTogglePublic={() => { setSlidePublic((p) => ({ ...p, [slide.id]: !(p[slide.id] ?? false) })); setSaved(false); }}
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
  image,
  uploading,
  onUpload,
  onRemoveImage,
  deckPublic,
  slidePublic,
  onTogglePublic,
}: {
  slide: Slide;
  t: (key: string) => string;
  values: Record<string, string | string[]>;
  onChange: (label: string, value: string | string[]) => void;
  image?: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemoveImage: () => void;
  deckPublic: boolean;
  slidePublic: boolean;
  onTogglePublic: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">{slide.icon}</span>
        <h3 className="font-bold text-zinc-900">{t(slide.titleKey)}</h3>
        {deckPublic && (
          <button type="button" onClick={onTogglePublic} title={slidePublic ? t("vis_slide_public") : t("vis_slide_private")}
            className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${slidePublic ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
            {slidePublic ? `🌍 ${t("vis_slide_public")}` : `🔒 ${t("vis_slide_private")}`}
          </button>
        )}
      </div>

      {/* Slide image */}
      <div className="mb-3">
        {image ? (
          <div className="group relative overflow-hidden rounded-xl border border-zinc-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-32 w-full object-cover" />
            <button type="button" onClick={onRemoveImage}
              className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              {t("remove_image")}
            </button>
          </div>
        ) : (
          <label className={`flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-200 text-xs font-medium text-zinc-400 transition-colors hover:border-indigo-300 hover:text-indigo-500 ${uploading ? "opacity-50" : ""}`}>
            <span className="text-lg">🖼️</span>
            {uploading ? t("uploading") : t("add_image")}
            <input type="file" accept="image/*" className="hidden" disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
          </label>
        )}
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {slide.fields.map((f) => {
          const raw = values[f.labelKey];
          const label = (
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              {t(f.labelKey)}{f.help && <HelpTip term={f.help} />}
            </label>
          );

          // Single-choice dropdown
          if (f.type === "select" && f.options) {
            const val = typeof raw === "string" ? raw : "";
            return (
              <div key={f.labelKey}>
                {label}
                <select value={val} onChange={(e) => onChange(f.labelKey, e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-indigo-400">
                  <option value="">{t("select_placeholder")}</option>
                  {OPTIONS[f.options].map((id) => (
                    <option key={id} value={id}>{t(`opt_${f.options}_${id}`)}</option>
                  ))}
                </select>
              </div>
            );
          }

          // Multi-choice chips
          if (f.type === "multiselect" && f.options) {
            const arr = Array.isArray(raw) ? raw : [];
            const toggle = (id: string) => onChange(f.labelKey, arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
            return (
              <div key={f.labelKey}>
                {label}
                <div className="flex flex-wrap gap-1.5">
                  {OPTIONS[f.options].map((id) => (
                    <button key={id} type="button" onClick={() => toggle(id)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${arr.includes(id) ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-400"}`}>
                      {t(`opt_${f.options}_${id}`)}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          // Free text
          const strVal = typeof raw === "string" ? raw : "";
          return (
            <div key={f.labelKey}>
              {label}
              {f.multiline ? (
                <textarea rows={3} placeholder={t(f.placeholderKey)} value={strVal}
                  onChange={(e) => onChange(f.labelKey, e.target.value)}
                  className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
              ) : (
                <input type="text" placeholder={t(f.placeholderKey)} value={strVal}
                  onChange={(e) => onChange(f.labelKey, e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
