"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

/* ──────────────────────────────────────────────
   Slide definitions
   Free gets slides 0-2, Pro gets all 8
────────────────────────────────────────────── */
interface Slide {
  id: string;
  icon: string;
  title: string;
  proOnly: boolean;
  fields: { label: string; placeholder: string; multiline?: boolean }[];
}

const SLIDES: Slide[] = [
  {
    id: "problem",
    icon: "🔥",
    title: "Das Problem",
    proOnly: false,
    fields: [
      { label: "Welches Problem löst du?", placeholder: "Beschreibe den Schmerzpunkt deiner Zielgruppe …", multiline: true },
      { label: "Betroffene Zielgruppe", placeholder: "z.B. KMU-Gründer, HR-Manager in Unternehmen 50–500 MA" },
    ],
  },
  {
    id: "solution",
    icon: "💡",
    title: "Deine Lösung",
    proOnly: false,
    fields: [
      { label: "Wie löst du das Problem?", placeholder: "Dein Produkt / Service in 2–3 Sätzen …", multiline: true },
      { label: "Einzigartiger Vorteil (USP)", placeholder: "Was macht dich besser als der Status Quo?" },
    ],
  },
  {
    id: "model",
    icon: "💰",
    title: "Geschäftsmodell",
    proOnly: false,
    fields: [
      { label: "Wie verdienst du Geld?", placeholder: "z.B. SaaS-Abo, Transaktionsgebühr, Lizenz …" },
      { label: "Preismodell", placeholder: "z.B. 49 €/Monat pro Nutzer, Freemium + Upgrade" },
    ],
  },
  {
    id: "market",
    icon: "📊",
    title: "Marktgröße",
    proOnly: true,
    fields: [
      { label: "TAM (Total Addressable Market)", placeholder: "z.B. 4,2 Mrd. € — Quelle: Statista 2024" },
      { label: "SAM / SOM", placeholder: "Realistisch erreichbarer Marktanteil in 3 Jahren" },
    ],
  },
  {
    id: "traction",
    icon: "🚀",
    title: "Traction & Meilensteine",
    proOnly: true,
    fields: [
      { label: "Bisherige Erfolge", placeholder: "Nutzer, Umsatz, Pilotpartner, Preise …", multiline: true },
      { label: "Nächste 12 Monate", placeholder: "Was willst du mit dem Investment erreichen?" },
    ],
  },
  {
    id: "competitors",
    icon: "⚔️",
    title: "Wettbewerb",
    proOnly: true,
    fields: [
      { label: "Hauptwettbewerber", placeholder: "z.B. Wettbewerber A, B, C" },
      { label: "Dein Wettbewerbsvorteil", placeholder: "Warum gewinnt ihr trotzdem?" },
    ],
  },
  {
    id: "team",
    icon: "👥",
    title: "Team",
    proOnly: true,
    fields: [
      { label: "Gründer & Rollen", placeholder: "Name, Rolle, relevante Erfahrung …", multiline: true },
      { label: "Offene Schlüsselstellen", placeholder: "z.B. suchen CTO mit ML-Erfahrung" },
    ],
  },
  {
    id: "ask",
    icon: "🎯",
    title: "Der Ask",
    proOnly: true,
    fields: [
      { label: "Wie viel Kapital suchst du?", placeholder: "z.B. 500.000 € Seed-Runde" },
      { label: "Verwendung der Mittel", placeholder: "z.B. 60 % Produkt, 30 % Marketing, 10 % Ops", multiline: true },
    ],
  },
];

/* ──────────────────────────────────────────────
   Component
────────────────────────────────────────────── */
export default function PitchDeckPage() {
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
          setIsPro(tier === "pro" || tier === "scale");
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
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/startup`} className="text-sm text-zinc-400 hover:text-zinc-600">
              ← Dashboard
            </Link>
            <h1 className="text-lg font-semibold text-zinc-900">Pitchdeck erstellen</h1>
          </div>
          {isPro && (
            <Button size="sm" variant="outline">
              Als PDF exportieren
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {!isPro && (
          <div className="mb-8 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4 flex items-start gap-3">
            <span className="text-xl">✨</span>
            <div>
              <p className="text-sm font-semibold text-indigo-900">
                Kostenlos: 3 Kernslides — Pro: vollständiges 8-Slide-Deck
              </p>
              <p className="mt-0.5 text-sm text-indigo-600">
                Mit Pro erhältst du Markt, Traction, Wettbewerb, Team & Ask — plus PDF-Export für Investorengespräche.
              </p>
            </div>
            <Button size="sm" className="ml-auto shrink-0" asChild>
              <Link href={`/${locale}/startup/billing`}>Auf Pro upgraden</Link>
            </Button>
          </div>
        )}

        {/* Active slides */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSlides.map((slide) => (
            <SlideCard
              key={slide.id}
              slide={slide}
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
                Im Pro-Plan
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
                      <h3 className="font-bold text-zinc-900">{slide.title}</h3>
                    </div>
                    {slide.fields.map((f) => (
                      <div key={f.label} className="mb-3">
                        <p className="mb-1 text-xs font-medium text-zinc-500">{f.label}</p>
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
                    5 weitere Slides im Pro-Plan
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500 max-w-sm">
                    Marktgröße, Traction, Wettbewerb, Team & Investor-Ask —
                    das vollständige Pitchdeck für echte Investorengespräche.
                  </p>
                  <Button className="mt-5" size="lg" asChild>
                    <Link href={`/${locale}/startup/billing`}>Auf Pro upgraden — 49 €/Monat</Link>
                  </Button>
                  <p className="mt-2 text-xs text-zinc-400">Monatlich kündbar · PDF-Export inklusive</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save button for active slides */}
        <div className="mt-8 flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm font-medium text-green-600">✓ Gespeichert</span>
          )}
          <Button size="lg" onClick={handleSave} disabled={saving}>
            {saving ? "Speichern …" : "Pitchdeck speichern"}
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
  values,
  onChange,
}: {
  slide: Slide;
  values: Record<string, string>;
  onChange: (label: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">{slide.icon}</span>
        <h3 className="font-bold text-zinc-900">{slide.title}</h3>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {slide.fields.map((f) =>
          f.multiline ? (
            <div key={f.label}>
              <label className="mb-1 block text-xs font-medium text-zinc-500">{f.label}</label>
              <textarea
                rows={3}
                placeholder={f.placeholder}
                value={values[f.label] ?? ""}
                onChange={(e) => onChange(f.label, e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
              />
            </div>
          ) : (
            <div key={f.label}>
              <label className="mb-1 block text-xs font-medium text-zinc-500">{f.label}</label>
              <input
                type="text"
                placeholder={f.placeholder}
                value={values[f.label] ?? ""}
                onChange={(e) => onChange(f.label, e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}
