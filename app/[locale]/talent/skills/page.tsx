"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SkillPicker } from "@/components/SkillPicker";
import { getSkillLabel } from "@/lib/skills";
import { REGIONS, LANGUAGES } from "@/lib/regions";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Navbar } from "@/components/layout/navbar";

const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "Einsteiger", desc: "< 1 Jahr" },
  { id: "intermediate", label: "Fortgeschritten", desc: "1–3 Jahre" },
  { id: "experienced", label: "Erfahren", desc: "3–5 Jahre" },
  { id: "expert", label: "Experte", desc: "5+ Jahre" },
];

const AVAILABILITY = [
  { id: "immediately", label: "Sofort verfügbar" },
  { id: "part_time", label: "Nebenbei (< 20h/Woche)" },
  { id: "project_based", label: "Projektbasiert" },
  { id: "not_available", label: "Gerade nicht verfügbar" },
];

export default function TalentSkillsPage() {
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
            <h2 className="mb-1 text-base font-bold text-zinc-900">Wer bist du?</h2>
            <p className="mb-4 text-sm text-zinc-500">Ein kurzer Satz über dich — was machst du, womit hilfst du?</p>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="z.B. Ich bin freiberuflicher Video-Editor mit Fokus auf Gaming-Content und schneide seit 3 Jahren YouTube-Videos für Creator mit 10k–500k Subs."
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Skills */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <SkillPicker
              label="Was kannst du? (bis zu 15 Skills)"
              selected={skills}
              onChange={setSkills}
              max={15}
            />
          </div>

          {/* Experience + Availability */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-zinc-800">Erfahrungslevel</p>
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
                    <span className="text-sm font-medium text-zinc-900">{l.label}</span>
                    <span className="text-xs text-zinc-400">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-zinc-800">Verfügbarkeit</p>
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
                    {a.label}
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
                <span className="text-sm text-zinc-700">Remote bevorzugt</span>
              </label>
            </div>
          </div>

          {/* Region & Language */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h2 className="mb-1 text-base font-bold text-zinc-900">Wo möchtest du arbeiten?</h2>
            <p className="mb-4 text-sm text-zinc-500">Wähle Länder oder Regionen — du kannst mehrere auswählen.</p>
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
                  <span>{r.label}</span>
                  {regions.includes(r.id) && <span className="text-indigo-400">✓</span>}
                </button>
              ))}
            </div>

            <h2 className="mb-1 text-sm font-bold text-zinc-900">Sprachen</h2>
            <p className="mb-3 text-sm text-zinc-500">In welchen Sprachen kannst du arbeiten?</p>
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
              <p className="mb-3 text-sm font-semibold text-indigo-900">Profilvorschau — so sehen dich Startups & Creator</p>
              {bio && <p className="mb-3 text-sm text-indigo-800 italic">"{bio}"</p>}
              <div className="flex flex-wrap gap-1.5">
                {skills.map(id => (
                  <span key={id} className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white">
                    {getSkillLabel(id)}
                  </span>
                ))}
              </div>
              {experience && (
                <p className="mt-2 text-xs text-indigo-600">
                  {EXPERIENCE_LEVELS.find(l => l.id === experience)?.label} ·{" "}
                  {AVAILABILITY.find(a => a.id === availability)?.label ?? ""}
                  {remote ? " · Remote" : ""}
                </p>
              )}
              {regions.length > 0 && (
                <p className="mt-1 text-xs text-indigo-500">
                  {regions.map(id => {
                    const r = REGIONS.find(x => x.id === id);
                    return r ? `${r.flag} ${r.label}` : id;
                  }).join(" · ")}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button type="submit" size="lg" disabled={skills.length === 0}>
              {saved ? "✓ Gespeichert!" : "Profil speichern"}
            </Button>
            {skills.length === 0 && (
              <p className="text-sm text-zinc-400">Wähl mindestens einen Skill aus</p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
