import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: "📄",
    title: "KI-Businessplan",
    desc: "Generiere in Minuten einen vollständigen Businessplan — Executive Summary, TAM/SAM/SOM, Wettbewerber, Finanzplanung. Jede Zahl mit echter Quelle belegt.",
  },
  {
    icon: "🤝",
    title: "Talent-Marktplatz",
    desc: "Finde Co-Founder, Entwickler oder Designer — auf Cash- und/oder Equity-Basis. Skill-basiertes Matching bringt die richtigen Leute zusammen.",
  },
  {
    icon: "💡",
    title: "Investor-Netzwerk",
    desc: "Sobald dein Startup die Validierungshürde erreicht, wirst du für passende Investoren sichtbar — mit gesichertem Data Room und DADORI-Badge.",
  },
];

const steps = [
  { num: "01", title: "Rolle wählen", desc: "Startup, Talent oder Investor — dein Dashboard passt sich an." },
  { num: "02", title: "Profil aufbauen", desc: "Startup-Idee eingeben oder Skill-Profil anlegen." },
  { num: "03", title: "KI arbeiten lassen", desc: "Der KI-Assistent erstellt deinen Plan mit echten Marktdaten." },
  { num: "04", title: "Wachsen", desc: "Team finden, Investoren gewinnen, skalieren." },
];

const pricingStartup = [
  { tier: "Free", price: "0 €", features: ["1 Businessplan / Monat", "1 offene Stelle", "Basis-Analyse"] },
  { tier: "Pro", price: "49 €", features: ["5 Businesspläne / Monat", "KI-Marktanalyse", "PDF-Export", "5 offene Stellen", "Investor-Sichtbarkeit", "Data Room"], highlight: true },
  { tier: "Scale", price: "149 €", features: ["Unbegrenzte Pläne", "Alles aus Pro", "Priority Support", "Unbegrenzte Stellen"] },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-28 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <span className="mb-4 inline-block rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-700">
            Idea · Team · Capital
          </span>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-6xl">
            Deine Startup-Plattform.<br />
            <span className="text-indigo-600">Von der Idee zum Investment.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600">
            DADORI verbindet Gründer, Talente und Investoren. Erstelle einen KI-Businessplan mit echten Marktdaten,
            bau dein Team auf und werde von Investoren entdeckt — alles auf einer Plattform.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Jetzt kostenlos starten</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Features entdecken</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-zinc-900">Alles was du brauchst</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-zinc-500">
            Drei Säulen. Eine Plattform. Kein Raten.
          </p>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 text-4xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-zinc-900">So funktioniert DADORI</h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col">
                <span className="text-4xl font-black text-indigo-100">{s.num}</span>
                <h3 className="mt-2 font-semibold text-zinc-900">{s.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / data promise */}
      <section className="border-y border-indigo-100 bg-indigo-600 py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-2xl font-bold">Echte Daten. Keine erfundenen Zahlen.</h2>
          <p className="mt-4 text-indigo-100">
            Jede Marktgröße, jeder Trend und jede Wettbewerberinfo in unseren KI-Plänen
            kommt aus verifizierten Quellen — mit sichtbarem Nachweis. Keine Halluzinationen.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-zinc-900">Preise (Startups)</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-zinc-500">
            Monatlich kündbar. Kein verstecktes Kleingedrucktes.
          </p>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {pricingStartup.map((p) => (
              <div
                key={p.tier}
                className={`rounded-2xl border p-8 ${
                  p.highlight
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-xl"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <p className={`text-sm font-semibold uppercase tracking-widest ${p.highlight ? "text-indigo-200" : "text-zinc-400"}`}>
                  {p.tier}
                </p>
                <p className={`mt-2 text-4xl font-black ${p.highlight ? "text-white" : "text-zinc-900"}`}>
                  {p.price}
                  <span className="text-base font-normal">/Monat</span>
                </p>
                <ul className="mt-6 space-y-2">
                  {p.features.map((feat) => (
                    <li key={feat} className={`flex items-start gap-2 text-sm ${p.highlight ? "text-indigo-100" : "text-zinc-600"}`}>
                      <span>✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  variant={p.highlight ? "secondary" : "default"}
                  asChild
                >
                  <Link href="/signup">{p.tier === "Free" ? "Kostenlos starten" : "Plan wählen"}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-10 text-center text-sm text-zinc-400">
        <p>© {new Date().getFullYear()} DADORI. Alle Rechte vorbehalten.</p>
        <div className="mt-3 flex justify-center gap-6">
          <Link href="/privacy" className="hover:text-zinc-600">Datenschutz</Link>
          <Link href="/imprint" className="hover:text-zinc-600">Impressum</Link>
          <Link href="/terms" className="hover:text-zinc-600">AGB</Link>
        </div>
      </footer>
    </div>
  );
}
