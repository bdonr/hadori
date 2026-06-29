"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { REGIONS } from "@/lib/regions";
import { INVESTOR_FOCUS, CHECK_SIZES } from "@/lib/funding";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const ROLES = [
  { id: "angel", label: "Angel Investor" },
  { id: "vc_partner", label: "VC Partner" },
  { id: "vc_associate", label: "VC Associate" },
  { id: "family_office", label: "Family Office" },
  { id: "corporate_vc", label: "Corporate VC" },
  { id: "micro_vc", label: "Micro-VC" },
  { id: "lp", label: "LP (Limited Partner)" },
];

const STAGE_PREFS = [
  { id: "idea",       label: "Idee 💡" },
  { id: "pre_seed",   label: "Pre-Seed 🌱" },
  { id: "seed",       label: "Seed 🌿" },
  { id: "series_a",   label: "Series A 📈" },
  { id: "series_b",   label: "Series B+ 🏦" },
  { id: "bootstrapped", label: "Bootstrapped 💪" },
];

export default function InvestorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "en";

  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [role, setRole] = useState("angel");
  const [bio, setBio] = useState("");
  const [focus, setFocus] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [checkSize, setCheckSize] = useState("");
  const [dealsPerYear, setDealsPerYear] = useState("");
  const [region, setRegion] = useState("de");
  const [openToIntros, setOpenToIntros] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      if (!name) setName(user.displayName ?? "");
      try {
        const snap = await getDoc(doc(db, "investors", user.uid));
        if (snap.exists()) {
          const d = snap.data() as Record<string, unknown>;
          if (typeof d.name === "string" && d.name) setName(d.name);
          if (typeof d.firm === "string") setFirm(d.firm);
          if (typeof d.role === "string") setRole(d.role);
          if (typeof d.bio === "string") setBio(d.bio);
          if (Array.isArray(d.focus)) setFocus(d.focus as string[]);
          if (Array.isArray(d.stages)) setStages(d.stages as string[]);
          if (typeof d.checkSize === "string") setCheckSize(d.checkSize);
          if (typeof d.dealsPerYear === "string") setDealsPerYear(d.dealsPerYear);
          if (typeof d.region === "string") setRegion(d.region);
          if (typeof d.openToIntros === "boolean") setOpenToIntros(d.openToIntros);
        }
      } catch {
        // Firebase not configured
      }
    });
    return () => unsub();
  }, []);

  function toggle<T extends string>(set: React.Dispatch<React.SetStateAction<T[]>>, id: T) {
    set(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (uid) {
      try {
        await setDoc(doc(db, "investors", uid), {
          name, firm, role, bio, focus, stages, checkSize, dealsPerYear, region, openToIntros,
          updated_at: serverTimestamp(),
        }, { merge: true });
      } catch {
        // Firebase not configured
      }
    }
    setSaved(true);
    setTimeout(() => router.push(`/${locale}/investor`), 800);
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <Link href="/investor" className="text-sm text-zinc-400 hover:text-zinc-600">← Dashboard</Link>
          <h1 className="text-lg font-semibold text-zinc-900">Investor-Profil</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <form onSubmit={handleSave} className="flex flex-col gap-5">

          {/* Basis */}
          <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4">
            <h2 className="font-semibold text-zinc-900">Über dich</h2>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">Firma / Fonds <span className="text-zinc-400 font-normal">(optional)</span></label>
              <input value={firm} onChange={e => setFirm(e.target.value)} placeholder="z.B. Sequoia, Independent Angel"
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700">Rolle</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <button key={r.id} type="button" onClick={() => setRole(r.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${role === r.id ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-emerald-300"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">Bio / Investment-Thesis <span className="text-zinc-400 font-normal">(optional)</span></label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                placeholder="Was macht dich als Investor aus? Was suchst du in Gründern?"
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 resize-none" />
            </div>
          </section>

          {/* Investment-Fokus */}
          <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4">
            <h2 className="font-semibold text-zinc-900">Investment-Fokus</h2>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700">Branchen / Kategorien</label>
              <div className="flex flex-wrap gap-2">
                {INVESTOR_FOCUS.map(f => (
                  <button key={f.id} type="button" onClick={() => toggle(setFocus, f.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${focus.includes(f.id) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-emerald-300"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700">Bevorzugte Phasen</label>
              <div className="flex flex-wrap gap-2">
                {STAGE_PREFS.map(s => (
                  <button key={s.id} type="button" onClick={() => toggle(setStages, s.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${stages.includes(s.id) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-emerald-300"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700">Typische Check-Size</label>
              <div className="flex flex-wrap gap-2">
                {CHECK_SIZES.map(c => (
                  <button key={c.id} type="button" onClick={() => setCheckSize(c.id === checkSize ? "" : c.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${checkSize === c.id ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-emerald-300"}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">Deals pro Jahr</label>
              <input value={dealsPerYear} onChange={e => setDealsPerYear(e.target.value)} placeholder="z.B. 3–5"
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 w-40" />
            </div>
          </section>

          {/* Region */}
          <section className="rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-3">
            <h2 className="font-semibold text-zinc-900">Region</h2>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map(r => (
                <button key={r.id} type="button" onClick={() => setRegion(r.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors flex items-center gap-1.5 ${region === r.id ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-zinc-700 border-zinc-200 hover:border-emerald-300"}`}>
                  <span>{r.flag}</span><span>{r.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Intros */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-zinc-900">Offen für HADORI Intros</p>
                <p className="text-sm text-zinc-500 mt-0.5">Gründer können eine Intro-Anfrage stellen.</p>
              </div>
              <button type="button" onClick={() => setOpenToIntros(!openToIntros)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${openToIntros ? "bg-emerald-600" : "bg-zinc-200"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${openToIntros ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </section>

          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saved ? "Gespeichert ✓" : "Profil speichern"}
          </Button>
        </form>
      </main>
    </div>
  );
}
