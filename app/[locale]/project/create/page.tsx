"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { SkillPicker } from "@/components/SkillPicker";
import { REGIONS } from "@/lib/regions";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";

const CATEGORIES = [
  { id: "creator", label: "Creator / YouTube", emoji: "🎬" },
  { id: "music", label: "Musik / Podcast", emoji: "🎵" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "community", label: "Community / Newsletter", emoji: "💬" },
  { id: "app", label: "App-Idee", emoji: "📱" },
  { id: "ecommerce", label: "Shop / E-Commerce", emoji: "🛒" },
  { id: "art", label: "Design / Kunst", emoji: "🎨" },
  { id: "education", label: "Bildung / Kurs", emoji: "📚" },
  { id: "events", label: "Events", emoji: "🎪" },
  { id: "other", label: "Sonstiges", emoji: "💡" },
];

const PROBLEM_AREAS = [
  { id: "efficiency", label: "Zu langsame Prozesse" },
  { id: "cost", label: "Zu hohe Kosten" },
  { id: "access", label: "Fehlender Zugang" },
  { id: "quality", label: "Schlechte Qualität / Auswahl" },
  { id: "engagement", label: "Fehlende Community" },
  { id: "monetization", label: "Monetarisierung" },
  { id: "distribution", label: "Reichweite / Distribution" },
  { id: "other", label: "Anderes" },
];

export default function CreateProjectPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "en";
  const t = useTranslations("misc_pages.project_create");

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [region, setRegion] = useState("de");
  const [description, setDescription] = useState("");
  const [stealth, setStealth] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  function toggleProblem(id: string) {
    setProblems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const canSubmit = (stealth ? problems.length > 0 && category : name.trim() && category);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setError(null);

    // Wait for Firebase client auth to finish restoring before deciding the
    // user is logged out — otherwise a fast click bounces them to login.
    if (!authReady) return;

    if (!uid) {
      setError(t("error_login_required"));
      router.push(`/${locale}/login?next=/${locale}/project/create`);
      return;
    }

    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        ownerId: uid,
        name,
        tagline,
        description,
        category,
        skills,
        region,
        stealth,
        stealthProblems: stealth ? problems : [],
        type: "project",
        investorVisible: false,
        stage: "",
        teamSize: "",
        lookingFor: [],
        created_at: serverTimestamp(),
      });
      router.push(`/${locale}/project/${docRef.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error_save_failed"));
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <Navbar />

      <main className="mx-auto max-w-2xl px-6 py-8">

        {/* Stealth toggle */}
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 flex items-start gap-4">
          <div className="flex-1">
            <p className="font-semibold text-zinc-900">🥷 {t("stealth_mode")}</p>
            <p className="text-sm text-zinc-500 mt-0.5">
              {t("stealth_mode_desc")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStealth(!stealth)}
            className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${stealth ? "bg-indigo-600" : "bg-zinc-200"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${stealth ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">

          {/* Kategorie — immer */}
          <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
            <h2 className="font-semibold text-zinc-900">{t("category")}</h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat.id} type="button" onClick={() => setCategory(cat.id === category ? "" : cat.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors flex items-center gap-1.5 ${
                    category === cat.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400"
                  }`}>
                  <span>{cat.emoji}</span>{cat.label}
                </button>
              ))}
            </div>
          </section>

          {/* Stealth: Problem-Bereich */}
          {stealth && (
            <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
              <h2 className="font-semibold text-zinc-900">🔥 {t("problem_area")}</h2>
              <p className="text-xs text-zinc-400">{t("problem_area_hint")}</p>
              <div className="flex flex-wrap gap-2">
                {PROBLEM_AREAS.map(p => (
                  <button key={p.id} type="button" onClick={() => toggleProblem(p.id)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
                      problems.includes(p.id) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400"
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-700">
                🥷 {t("stealth_preview_intro")} <strong>{t("stealth_preview_text", { category: CATEGORIES.find(c=>c.id===category)?.label ?? "…", problems: problems.map(id=>PROBLEM_AREAS.find(p=>p.id===id)?.label).filter(Boolean).join(", ") || "…" })}</strong>
              </div>
            </section>
          )}

          {/* Normalmodus: Name + Details */}
          {!stealth && (
            <>
              <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4">
                <h2 className="font-semibold text-zinc-900">{t("your_project")}</h2>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">{t("name_label")}</label>
                  <input value={name} onChange={e => setName(e.target.value)} required
                    placeholder={t("name_placeholder")}
                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">{t("tagline_label")}</label>
                  <input value={tagline} onChange={e => setTagline(e.target.value)}
                    placeholder={t("tagline_placeholder")}
                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">{t("description_label")} <span className="text-zinc-400 font-normal">{t("optional")}</span></label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    rows={3} placeholder={t("description_placeholder")}
                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none" />
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4">
                <h2 className="font-semibold text-zinc-900">{t("skills_wanted")}</h2>
                <SkillPicker label="" selected={skills} onChange={setSkills} max={8} />
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
                <h2 className="font-semibold text-zinc-900">{t("region")}</h2>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map(r => (
                    <button key={r.id} type="button" onClick={() => setRegion(r.id)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors flex items-center gap-1.5 ${
                        region === r.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-400"
                      }`}>
                      <span>{r.flag}</span><span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          <Button type="submit" size="lg" disabled={!canSubmit || saving} className="disabled:opacity-40">
            {saving ? t("saving") : stealth ? t("publish_stealth") : t("publish_project")}
          </Button>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Upgrade teaser */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <p className="font-semibold text-amber-900">{t("upgrade_title")}</p>
              <p className="text-sm text-amber-700 mt-0.5">
                {t("upgrade_desc")}
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
