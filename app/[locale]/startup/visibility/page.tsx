import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import type { Profile } from "@/lib/firebase/collections";
import { VisibilityToggle } from "./VisibilityToggle";
import { Button } from "@/components/ui/button";

export default async function VisibilityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const snap = await adminDb!.collection("profiles").doc(session.uid).get();
  const profile = snap.data() as Profile | undefined;
  if (!profile || profile.role !== "startup") redirect(`/${locale}/login`);

  const isPro = profile.plan_tier === "pro" || profile.plan_tier === "scale";
  const isVisible = profile.investor_visible ?? false;

  const perks = [
    { icon: "🔍", title: "Auffindbar für 200+ Investoren", desc: "Dein Profil erscheint im Investoren-Feed von DADORI-geprüften VCs und Angels." },
    { icon: "📬", title: "Direkte Anfragen erhalten", desc: "Investoren können dich direkt kontaktieren — du entscheidest, ob du antwortest." },
    { icon: "🏅", title: "DADORI-Verified Badge", desc: "Zeigt Investoren, dass dein Businessplan und Pitchdeck geprüft wurden." },
    { icon: "🔒", title: "Data Room", desc: "Teile Dokumente sicher mit ausgewählten Investoren — du kontrollierst den Zugang." },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Link href={`/${locale}/startup`} className="text-sm text-zinc-400 hover:text-zinc-600">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-semibold text-zinc-900">Investor-Sichtbarkeit</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">

        {/* Status card */}
        <div className={`rounded-2xl border p-6 ${isPro ? "border-indigo-200 bg-indigo-50" : "border-zinc-200 bg-white"} shadow-sm`}>
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                {isPro
                  ? isVisible
                    ? "🟢 Du bist für Investoren sichtbar"
                    : "⚪ Sichtbarkeit ist deaktiviert"
                  : "🔒 Für Investoren sichtbar werden"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {isPro
                  ? isVisible
                    ? "Investoren können dein Profil jetzt finden und dich kontaktieren."
                    : "Du bist im Pro-Plan — aktiviere die Sichtbarkeit, wenn du bereit bist."
                  : "Im Free-Plan bist du für Investoren nicht auffindbar. Upgrade auf Pro, um die Sichtbarkeit selbst zu steuern."}
              </p>
            </div>

            {isPro ? (
              <VisibilityToggle uid={session.uid} initialValue={isVisible} />
            ) : (
              <Button asChild className="shrink-0">
                <Link href={`/${locale}/startup/billing`}>Auf Pro upgraden</Link>
              </Button>
            )}
          </div>
        </div>

        {/* What you get */}
        <div className="mt-10">
          <h3 className="mb-5 text-base font-bold text-zinc-900">Was du als sichtbares Startup bekommst</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {perks.map((p) => (
              <div
                key={p.title}
                className={`flex gap-4 rounded-xl border bg-white p-5 shadow-sm ${!isPro ? "opacity-60" : ""}`}
              >
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <p className="font-semibold text-zinc-900">{p.title}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Free upsell banner */}
        {!isPro && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <span className="text-2xl">⚡</span>
              <div className="flex-1">
                <p className="font-bold text-amber-900">Du entscheidest — nicht wir</p>
                <p className="mt-1 text-sm text-amber-800">
                  Im Pro-Plan kannst du die Sichtbarkeit jederzeit ein- und ausschalten.
                  Kein automatisches Auflisten — nur wenn du aktiv Interesse hast.
                </p>
              </div>
              <Button asChild className="shrink-0 bg-amber-600 hover:bg-amber-700">
                <Link href={`/${locale}/startup/billing`}>49 €/Monat</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Legal note */}
        <p className="mt-8 text-xs text-zinc-400">
          DADORI vermittelt ausschließlich Kontakte zwischen Startups und Investoren.
          Wir sind nicht an Transaktionen beteiligt und erheben keine Beteiligungsgebühren.
          Hol dir rechtliche Beratung, bevor du Kapital annimmst.
        </p>
      </main>
    </div>
  );
}
