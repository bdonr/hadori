"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SkillPicker } from "@/components/SkillPicker";
import { useTaxonomy } from "@/lib/taxonomy";
import { REGIONS, LANGUAGES } from "@/lib/regions";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Navbar } from "@/components/layout/navbar";

const EXPERIENCE_LEVELS = [
  { id: "beginner", labelKey: "exp_beginner", descKey: "exp_beginner_desc" },
  { id: "intermediate", labelKey: "exp_intermediate", descKey: "exp_intermediate_desc" },
  { id: "experienced", labelKey: "exp_experienced", descKey: "exp_experienced_desc" },
  { id: "expert", labelKey: "exp_expert", descKey: "exp_expert_desc" },
];

type PublicFields = {
  skills: boolean;
  bio: boolean;
  experience: boolean;
  availability: boolean;
  regions: boolean;
  languages: boolean;
};

const DEFAULT_PUBLIC_FIELDS: PublicFields = {
  skills: true,
  bio: true,
  experience: false,
  availability: false,
  regions: false,
  languages: false,
};

const AVAILABILITY = [
  { id: "immediately", labelKey: "avail_immediately" },
  { id: "part_time", labelKey: "avail_part_time" },
  { id: "project_based", labelKey: "avail_project_based" },
  { id: "not_available", labelKey: "avail_not_available" },
];

export default function TalentSkillsPage() {
  const t = useTranslations("talent_pages.skills");
  const tax = useTaxonomy();
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "en";
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");
  const [remote, setRemote] = useState(true);
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);
  const [regions, setRegions] = useState<string[]>(["worldwide"]);
  const [languages, setLanguages] = useState<string[]>(["de"]);
  const [uid, setUid] = useState<string | null>(null);
  const [publicFields, setPublicFields] = useState<PublicFields>(DEFAULT_PUBLIC_FIELDS);

  // Load existing profile from Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "talent", user.uid));
        if (snap.exists()) {
          const d = snap.data() as Record<string, unknown>;
          if (Array.isArray(d.skills)) setSkills(d.skills as string[]);
          if (typeof d.bio === "string") setBio(d.bio);
          if (typeof d.availability === "string") setAvailability(d.availability);
          if (Array.isArray(d.regions)) setRegions(d.regions as string[]);
          if (Array.isArray(d.languages)) setLanguages(d.languages as string[]);
          if (typeof d.remote === "boolean") setRemote(d.remote);
          if (typeof d.experience === "string") setExperience(d.experience);
          if (d.publicFields && typeof d.publicFields === "object") {
            const pf = d.publicFields as Partial<PublicFields>;
            setPublicFields({
              skills: typeof pf.skills === "boolean" ? pf.skills : DEFAULT_PUBLIC_FIELDS.skills,
              bio: typeof pf.bio === "boolean" ? pf.bio : DEFAULT_PUBLIC_FIELDS.bio,
              experience: typeof pf.experience === "boolean" ? pf.experience : DEFAULT_PUBLIC_FIELDS.experience,
              availability: typeof pf.availability === "boolean" ? pf.availability : DEFAULT_PUBLIC_FIELDS.availability,
              regions: typeof pf.regions === "boolean" ? pf.regions : DEFAULT_PUBLIC_FIELDS.regions,
              languages: typeof pf.languages === "boolean" ? pf.languages : DEFAULT_PUBLIC_FIELDS.languages,
            });
          }
        }
      } catch {
        // Firebase not configured — ignore, use local state
      }
    });
    return () => unsub();
  }, []);

  function toggleRegion(id: string) {
    setRegions(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  }
  function toggleLanguage(id: string) {
    setLanguages(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  }

  function togglePublic(field: keyof PublicFields) {
    setPublicFields(prev => ({ ...prev, [field]: !prev[field] }));
  }

  function VisibilityToggle({ field }: { field: keyof PublicFields }) {
    const isPublic = publicFields[field];
    return (
      <button
        type="button"
        onClick={() => togglePublic(field)}
        aria-pressed={isPublic}
        title={isPublic ? t("visibility_hint") : t("visibility_hint")}
        className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
          isPublic
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-zinc-200 bg-zinc-50 text-zinc-500"
        }`}
      >
        <span>{isPublic ? "🌍" : "🔒"}</span>
        <span>{isPublic ? t("public_toggle") : t("private_toggle")}</span>
      </button>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (uid) {
      try {
        await setDoc(doc(db, "talent", uid), {
          skills,
          bio,
          availability,
          experience,
          remote,
          regions,
          languages,
          publicFields,
          updated_at: serverTimestamp(),
        }, { merge: true });
      } catch {
        // Firebase not configured — save silently fails, still redirect
      }
    }
    setSaved(true);
    setTimeout(() => {
      router.push(`/${locale}/user/me`);
    }, 800);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <form onSubmit={handleSave} className="flex flex-col gap-8">

          {/* Intro */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="mb-1 flex items-start justify-between gap-3">
              <h2 className="text-base font-bold text-zinc-900">{t("who_title")}</h2>
              <VisibilityToggle field="bio" />
            </div>
            <p className="mb-4 text-sm text-zinc-500">{t("who_hint")}</p>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder={t("bio_placeholder")}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Skills */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="mb-2 flex justify-end">
              <VisibilityToggle field="skills" />
            </div>
            <SkillPicker
              label={t("skills_label")}
              selected={skills}
              onChange={setSkills}
              max={15}
            />
          </div>

          {/* Experience + Availability */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-800">{t("experience_title")}</p>
                <VisibilityToggle field="experience" />
              </div>
              <div className="flex flex-col gap-2">
                {EXPERIENCE_LEVELS.map(l => (
                  <button
                    key={l.id} type="button"
                    onClick={() => setExperience(l.id)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                      experience === l.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <span className="text-sm font-medium text-zinc-900">{t(l.labelKey)}</span>
                    <span className="text-xs text-zinc-400">{t(l.descKey)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-800">{t("availability_title")}</p>
                <VisibilityToggle field="availability" />
              </div>
              <div className="flex flex-col gap-2">
                {AVAILABILITY.map(a => (
                  <button
                    key={a.id} type="button"
                    onClick={() => setAvailability(a.id)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      availability === a.id
                        ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                        : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    {t(a.labelKey)}
                  </button>
                ))}
              </div>

              <label className="mt-4 flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remote}
                  onChange={e => setRemote(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600"
                />
                <span className="text-sm text-zinc-700">{t("remote_preferred")}</span>
              </label>
            </div>
          </div>

          {/* Region & Language */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="mb-1 flex items-start justify-between gap-3">
              <h2 className="text-base font-bold text-zinc-900">{t("where_title")}</h2>
              <VisibilityToggle field="regions" />
            </div>
            <p className="mb-4 text-sm text-zinc-500">{t("where_hint")}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRegion(r.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    regions.includes(r.id)
                      ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  <span>{r.flag}</span>
                  <span>{tax.region(r.id)}</span>
                  {regions.includes(r.id) && <span className="text-indigo-400">✓</span>}
                </button>
              ))}
            </div>

            <div className="mb-1 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-zinc-900">{t("languages_title")}</h2>
              <VisibilityToggle field="languages" />
            </div>
            <p className="mb-3 text-sm text-zinc-500">{t("languages_hint")}</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => toggleLanguage(l.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    languages.includes(l.id)
                      ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {skills.length > 0 && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
              <p className="mb-3 text-sm font-semibold text-indigo-900">{t("preview_title")}</p>
              {bio && <p className="mb-3 text-sm text-indigo-800 italic">"{bio}"</p>}
              <div className="flex flex-wrap gap-1.5">
                {skills.map(id => (
                  <span key={id} className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white">
                    {tax.skill(id)}
                  </span>
                ))}
              </div>
              {experience && (
                <p className="mt-2 text-xs text-indigo-600">
                  {(() => { const l = EXPERIENCE_LEVELS.find(l => l.id === experience); return l ? t(l.labelKey) : ""; })()} ·{" "}
                  {(() => { const a = AVAILABILITY.find(a => a.id === availability); return a ? t(a.labelKey) : ""; })()}
                  {remote ? t("preview_remote_suffix") : ""}
                </p>
              )}
              {regions.length > 0 && (
                <p className="mt-1 text-xs text-indigo-500">
                  {regions.map(id => {
                    const r = REGIONS.find(x => x.id === id);
                    return r ? `${r.flag} ${tax.region(r.id)}` : id;
                  }).join(" · ")}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button type="submit" size="lg" disabled={skills.length === 0}>
              {saved ? t("saved") : t("save_profile")}
            </Button>
            {skills.length === 0 && (
              <p className="text-sm text-zinc-400">{t("min_one_skill")}</p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
