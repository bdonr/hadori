"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase/client";
import { profileDoc } from "@/lib/firebase/refs";
import type { UserRole, Profile } from "@/lib/firebase/collections";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";

const roles: { value: UserRole; label: string; desc: string; icon: string; sub: string }[] = [
  {
    value: "creator",
    label: "Gründer / Creator",
    desc: "Ich habe eine Idee oder ein Projekt",
    sub: "Starte als Projekt, baue ein Team auf, werde zum Startup",
    icon: "🎯",
  },
  {
    value: "talent",
    label: "Talent",
    desc: "Ich suche spannende Projekte & Startups",
    sub: "Biete deine Skills an, bewirb dich auf Rollen",
    icon: "⚡",
  },
  {
    value: "investor",
    label: "Investor",
    desc: "Ich investiere in Startups",
    sub: "Entdecke validierte Projekte & Startups",
    icon: "💼",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "de";

  const [step, setStep] = useState<"role" | "form">("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    setError(null);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      const now = new Date().toISOString();
      const profile: Profile = {
        uid: user.uid,
        role,
        full_name: name,
        plan_tier: "free",
        created_at: now,
        updated_at: now,
      };
      await setDoc(profileDoc(user.uid), profile);
      const token = await user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      // creator → startup dashboard (same flow)
      const dest = role === "creator" ? "startup" : role;
      router.push(`/${locale}/${dest}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Registrieren");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16">
      <Link href={`/${locale}`} className="mb-8 text-2xl font-extrabold text-indigo-600">DADORI</Link>

      {step === "role" ? (
        <div className="w-full max-w-md">
          <h1 className="text-center text-2xl font-bold text-zinc-900">Wer bist du?</h1>
          <p className="mt-2 text-center text-sm text-zinc-500">Wähle deine Rolle — du kannst sie später nicht ändern.</p>
          <div className="mt-8 grid gap-3">
            {roles.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  role === r.value
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <span className="text-3xl mt-0.5">{r.icon}</span>
                <div>
                  <p className="font-semibold text-zinc-900">{r.label}</p>
                  <p className="text-sm text-zinc-600">{r.desc}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{r.sub}</p>
                </div>
              </button>
            ))}
          </div>
          <Button className="mt-6 w-full" disabled={!role} onClick={() => setStep("form")}>
            Weiter →
          </Button>
          <p className="mt-4 text-center text-sm text-zinc-500">
            Bereits Mitglied?{" "}
            <Link href={`/${locale}/login`} className="text-indigo-600 hover:underline">Einloggen</Link>
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <button onClick={() => setStep("role")} className="mb-6 text-sm text-zinc-500 hover:text-zinc-700">← Zurück</button>

          {/* Selected role recap */}
          {role && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <span className="text-2xl">{roles.find(r => r.value === role)?.icon}</span>
              <div>
                <p className="text-sm font-semibold text-indigo-900">{roles.find(r => r.value === role)?.label}</p>
                <p className="text-xs text-indigo-600">{roles.find(r => r.value === role)?.desc}</p>
              </div>
            </div>
          )}

          <h1 className="text-2xl font-bold text-zinc-900">Konto erstellen</h1>
          <form onSubmit={handleSignup} className="mt-6 flex flex-col gap-4">
            <div>
              <label htmlFor="signup-name" className="mb-1 block text-sm font-medium text-zinc-700">Name</label>
              <input
                id="signup-name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Max Mustermann"
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-zinc-700">E-Mail</label>
              <input
                id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-zinc-700">Passwort</label>
              <input
                id="signup-password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Min. 8 Zeichen"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="mt-2" disabled={loading}>
              {loading ? "Wird erstellt…" : "Konto erstellen"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-500">
            Bereits Mitglied?{" "}
            <Link href={`/${locale}/login`} className="text-indigo-600 hover:underline">Einloggen</Link>
          </p>
          <p className="mt-4 text-center text-xs text-zinc-400">
            Mit der Registrierung stimmst du unseren{" "}
            <Link href={`/${locale}/terms`} className="underline">AGB</Link> und der{" "}
            <Link href={`/${locale}/privacy`} className="underline">Datenschutzerklärung</Link> zu.
          </p>
        </div>
      )}
    </div>
  );
}
