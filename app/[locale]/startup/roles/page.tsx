"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SkillPicker } from "@/components/SkillPicker";
import { SKILL_CATEGORIES } from "@/lib/skills";

// Predefined roles/positions (shared taxonomy) — so a role posting matches the
// same tags a talent uses to describe themselves. No free-text titles.
const ROLE_OPTIONS = SKILL_CATEGORIES.find(c => c.id === "roles")?.skills ?? [];
import { REGIONS, LANGUAGES, getRegion } from "@/lib/regions";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { Navbar } from "@/components/layout/navbar";
import { planCaps } from "@/lib/entitlements";
import { useTranslations } from "next-intl";
import { useTaxonomy } from "@/lib/taxonomy";

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
  { id: "revenue_share", labelKey: "comp_revenue_share_label", descKey: "comp_revenue_share_desc" },
  { id: "equity", labelKey: "comp_equity_label", descKey: "comp_equity_desc" },
  { id: "cash", labelKey: "comp_cash_label", descKey: "comp_cash_desc" },
  { id: "exposure", labelKey: "comp_exposure_label", descKey: "comp_exposure_desc" },
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
  const t = useTranslations("startup_pages.roles");
  const tax = useTaxonomy();
  const [uid, setUid] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [maxRoles, setMaxRoles] = useState(1);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      try {
        // Read plan_tier and derive the allowed number of active job postings.
        const profileSnap = await getDoc(doc(db, "profiles", user.uid));
        const tier = profileSnap.data()?.plan_tier as string | undefined;
        setMaxRoles(planCaps(tier).activeJobPostings);
      } catch {
        // Read failed — keep the free default of 1
      }
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

  const atLimit = roles.length >= maxRoles;

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
    if (atLimit) return; // enforce active-job-postings cap
    // The sought role itself is a match tag — include it in skills so it
    // matches talent who tagged themselves with that role/position.
    const roleTag = ROLE_OPTIONS.find(r => r.label === title)?.id;
    const skills = roleTag && !neededSkills.includes(roleTag) ? [roleTag, ...neededSkills] : neededSkills;
    const roleData = {
      title, category, description,
      compensation: selectedComp,
      commitment, remote,
      skills,
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

        {/* Post role action + limit awareness */}
        {!showForm && (
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">
              {Number.isFinite(maxRoles)
                ? t("roles_count", { current: roles.length, max: maxRoles })
                : t("roles_count_unlimited", { current: roles.length })}
            </p>
            {atLimit ? (
              <Button asChild variant="outline">
                <Link href="/startup/billing">{t("upgrade_to_pro")}</Link>
              </Button>
            ) : (
              <Button onClick={() => setShowForm(true)}>{t("post_role")}</Button>
            )}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-indigo-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-zinc-900">{t("new_role")}</h2>

            <div className="flex flex-col gap-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  {t("what_seeking")}
                </label>
                <select
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">{t("what_seeking_placeholder")}</option>
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.id} value={r.label}>{tax.skill(r.id)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">{t("category")}</label>
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
                  {t("description")}
                </label>
                <textarea
                  required rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t("description_placeholder")}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  {t("compensation")} <span className="text-zinc-400">{t("multiple_possible")}</span>
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
                      <span className="text-sm font-semibold text-zinc-900">{t(c.labelKey)}</span>
                      <span className="text-xs text-zinc-500">{t(c.descKey)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">{t("commitment")}</label>
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
                  label={t("skills_label")}
                  selected={neededSkills}
                  onChange={setNeededSkills}
                  max={10}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  {t("where_seeking")} <span className="text-zinc-400">{t("country_region")}</span>
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
                      <span>{tax.region(r.id)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">{t("work_language")}</label>
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
                      {tax.language(l.id)}
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
                <span className="text-sm text-zinc-700">{t("remote_possible")}</span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="submit" disabled={!title || selectedComp.length === 0 || atLimit}>
                {t("submit")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                {t("cancel")}
              </Button>
            </div>
          </form>
        )}

        {/* Role list */}
        {roles.length === 0 ? (
          <div className="py-20 text-center text-zinc-400">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-semibold text-zinc-600">{t("empty_title")}</p>
            <p className="mt-1 text-sm">{t("empty_desc")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {roles.map(role => (
              <RoleCard key={role.id} role={role} onDelete={handleDelete} t={t} />
            ))}
          </div>
        )}

        {/* Plan note — only when a higher tier would actually give more roles.
            Unlimited (startup_pro) shows nothing. */}
        {Number.isFinite(maxRoles) && (
          <p className="mt-8 text-center text-xs text-zinc-400">
            {t("roles_allowance", { max: maxRoles })}{" "}
            <Link href="/startup/billing" className="underline hover:text-zinc-600">{t("upgrade_to_pro")}</Link>
          </p>
        )}
      </main>
    </div>
  );
}

function RoleCard({ role, onDelete, t }: { role: Role; onDelete: (id: string) => void; t: (key: string) => string }) {
  const tax = useTaxonomy();
  const compLabels: Record<string, string> = {
    revenue_share: t("complabel_revenue_share"),
    equity: t("complabel_equity"),
    cash: t("complabel_cash"),
    exposure: t("complabel_exposure"),
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
                {t("remote")}
              </span>
            )}
            {role.region && (() => {
              const reg = getRegion(role.region);
              return reg ? (
                <span className="rounded-full bg-zinc-50 border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500">
                  {reg.flag} {tax.region(reg.id)}
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
              {tax.skill(id)}
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
          <Button size="sm" variant="outline">{t("edit")}</Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => onDelete(role.id)}>{t("remove")}</Button>
        </div>
      </div>
    </div>
  );
}
