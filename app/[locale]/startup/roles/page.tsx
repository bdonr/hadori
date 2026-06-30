"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SkillPicker } from "@/components/SkillPicker";
import { getSkillLabel } from "@/lib/skills";
import { REGIONS, LANGUAGES, getRegion } from "@/lib/regions";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { Navbar } from "@/components/layout/navbar";

const CATEGORIES = [
  "Video & Schnitt",
  "Design & Thumbnail",
  "Marketing & Growth",
  "Community Management",
  "Technik & Development",
  "Co-Gründer / Co-Creator",
  "Business & Finanzen",
  "Social Media",
  "Sonstiges",
];

const COMPENSATION = [
  { id: "revenue_share", label: "Revenue Share", desc: "% vom Umsatz / Kanal-Einnahmen" },
  { id: "equity", label: "Equity", desc: "Unternehmensanteile" },
  { id: "cash", label: "Gehalt / Honorar", desc: "Fixer Betrag oder Stundensatz" },
  { id: "exposure", label: "Exposure", desc: "Sichtbarkeit & Portfolio-Aufbau" },
];

const COMMITMENT = [
  "Freelance / Projekt",
  "Teilzeit (< 20h/Woche)",
  "Vollzeit",
  "Co-Founder (Vollzeit)",
];

interface Role {
  id: string;
  title: string;
  category: string;
  description: string;
  compensation: string[];
  commitment: string;
  remote: boolean;
  skills?: string[];
  region?: string;
  language?: string;
}

export default function RolesPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      try {
        const q = query(collection(db, "roles"), where("ownerId", "==", user.uid), orderBy("created_at", "desc"));
        const snap = await getDocs(q);
        setRoles(snap.docs.map(d => ({ id: d.id, ...d.data() } as Role)));
      } catch {
        // Firebase not configured or no index yet
      }
    });
    return () => unsub();
  }, []);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [selectedComp, setSelectedComp] = useState<string[]>([]);
  const [commitment, setCommitment] = useState("");
  const [remote, setRemote] = useState(true);
  const [neededSkills, setNeededSkills] = useState<string[]>([]);
  const [region, setRegion] = useState("de");
  const [language, setLanguage] = useState("de");

  function toggleComp(id: string) {
    setSelectedComp(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const roleData = {
      title, category, description,
      compensation: selectedComp,
      commitment, remote,
      skills: neededSkills,
      region, language,
      ownerId: uid ?? "",
    };
    let newId = crypto.randomUUID();
    if (uid) {
      try {
        const ref = await addDoc(collection(db, "roles"), { ...roleData, created_at: serverTimestamp() });
        newId = ref.id;
      } catch {
        // Firebase not configured — use local id
      }
    }
    setRoles(prev => [{ id: newId, ...roleData } as Role, ...prev]);
    setShowForm(false);
    setTitle(""); setCategory(""); setDescription("");
    setSelectedComp([]); setCommitment(""); setRemote(true); setNeededSkills([]);
    setRegion("de"); setLanguage("de");
  }

  async function handleDelete(id: string) {
    setRoles(prev => prev.filter(r => r.id !== id));
    if (uid) {
      try { await deleteDoc(doc(db, "roles", id)); } catch { /* ignore */ }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-10">

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-indigo-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-zinc-900">Neue Rolle ausschreiben</h2>

            <div className="flex flex-col gap-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Was suchst du?
                </label>
                <input
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="z.B. Video-Cutter, Thumbnail-Designer, Co-Streamer, CTO …"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Kategorie</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c} type="button"
                      onClick={() => setCategory(c)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        category === c
                          ? "bg-indigo-600 text-white"
                          : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Beschreibung
                </label>
                <textarea
                  required rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Wer bist du, was machst du, was erwartest du von der Person? Je konkreter, desto besser."
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Vergütung <span className="text-zinc-400">(mehrere möglich)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COMPENSATION.map(c => (
                    <button
                      key={c.id} type="button"
                      onClick={() => toggleComp(c.id)}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${
                        selectedComp.includes(c.id)
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-zinc-200 bg-white hover:border-zinc-300"
                      }`}
                    >
                      <span className="text-sm font-semibold text-zinc-900">{c.label}</span>
                      <span className="text-xs text-zinc-500">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Zeitaufwand</label>
                <div className="flex flex-wrap gap-2">
                  {COMMITMENT.map(c => (
                    <button
                      key={c} type="button"
                      onClick={() => setCommitment(c)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        commitment === c
                          ? "bg-indigo-600 text-white"
                          : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SkillPicker
                  label="Welche Skills werden gebraucht?"
                  selected={neededSkills}
                  onChange={setNeededSkills}
                  max={10}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Wo suchst du? <span className="text-zinc-400">(Land / Region)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map(r => (
                    <button
                      key={r.id} type="button"
                      onClick={() => setRegion(r.id)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        region === r.id
                          ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      <span>{r.flag}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Arbeitssprache</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.id} type="button"
                      onClick={() => setLanguage(l.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        language === l.id
                          ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remote}
                  onChange={e => setRemote(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-zinc-700">Remote möglich</span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="submit" disabled={!title || selectedComp.length === 0}>
                Ausschreiben
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Abbrechen
              </Button>
            </div>
          </form>
        )}

        {/* Role list */}
        {roles.length === 0 ? (
          <div className="py-20 text-center text-zinc-400">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-semibold text-zinc-600">Noch keine offenen Rollen</p>
            <p className="mt-1 text-sm">Schreib deine erste Rolle aus um Talente zu finden.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {roles.map(role => (
              <RoleCard key={role.id} role={role} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Free plan note */}
        <p className="mt-8 text-center text-xs text-zinc-400">
          Free-Plan: 1 aktive Rolle · <Link href="/startup/billing" className="underline hover:text-zinc-600">Auf Pro upgraden</Link> für bis zu 5 Rollen
        </p>
      </main>
    </div>
  );
}

function RoleCard({ role, onDelete }: { role: Role; onDelete: (id: string) => void }) {
  const compLabels: Record<string, string> = {
    revenue_share: "Revenue Share",
    equity: "Equity",
    cash: "Gehalt",
    exposure: "Exposure",
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-zinc-900">{role.title}</h3>
            {role.category && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                {role.category}
              </span>
            )}
            {role.remote && (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                Remote
              </span>
            )}
            {role.region && (() => {
              const reg = getRegion(role.region);
              return reg ? (
                <span className="rounded-full bg-zinc-50 border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500">
                  {reg.flag} {reg.label}
                </span>
              ) : null;
            })()}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">{role.description}</p>
        </div>
      </div>

      {role.skills && role.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {role.skills.map(id => (
            <span key={id} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
              {getSkillLabel(id)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        {role.compensation.map(c => (
          <span key={c} className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-600">
            {compLabels[c] ?? c}
          </span>
        ))}
        {role.commitment && (
          <span className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-600">
            {role.commitment}
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline">Bearbeiten</Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => onDelete(role.id)}>Entfernen</Button>
        </div>
      </div>
    </div>
  );
}
