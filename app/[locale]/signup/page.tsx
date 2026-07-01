"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { profileDoc } from "@/lib/firebase/refs";
import type { UserRole, Profile } from "@/lib/firebase/collections";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";

const roles: { value: UserRole; labelKey: string; descKey: string; icon: string; subKey: string }[] = [
  {
    value: "creator",
    labelKey: "role_creator_label",
    descKey: "role_creator_desc",
    subKey: "role_creator_sub",
    icon: "🎯",
  },
  {
    value: "talent",
    labelKey: "role_talent_label",
    descKey: "role_talent_desc",
    subKey: "role_talent_sub",
    icon: "⚡",
  },
  {
    value: "investor",
    labelKey: "role_investor_label",
    descKey: "role_investor_desc",
    subKey: "role_investor_sub",
    icon: "💼",
  },
];

export default function SignupPage() {
  const t = useTranslations("signup");
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
        email,
        plan_tier: "free",
        created_at: now,
        updated_at: now,
      };
      await setDoc(profileDoc(user.uid), profile);
      // Public identity — always readable (name/avatar/role). The private
      // profiles doc (email, stripe, plan_tier) stays owner-only.
      await setDoc(doc(db, "publicProfiles", user.uid), {
        uid: user.uid, full_name: name, role, avatar_url: "",
      }, { merge: true });
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
      setError(err instanceof Error ? err.message : t("error_generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16">
      <Link href={`/${locale}`} className="mb-8 text-2xl font-extrabold text-indigo-600">DADORI</Link>

      {step === "role" ? (
        <div className="w-full max-w-md">
          <h1 className="text-center text-2xl font-bold text-zinc-900">{t("role_question")}</h1>
          <p className="mt-2 text-center text-sm text-zinc-500">{t("role_hint")}</p>
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
                  <p className="font-semibold text-zinc-900">{t(r.labelKey)}</p>
                  <p className="text-sm text-zinc-600">{t(r.descKey)}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{t(r.subKey)}</p>
                </div>
              </button>
            ))}
          </div>
          <Button className="mt-6 w-full" disabled={!role} onClick={() => setStep("form")}>
            {t("cta_next")}
          </Button>
          <p className="mt-4 text-center text-sm text-zinc-500">
            {t("already_member")}{" "}
            <Link href={`/${locale}/login`} className="text-indigo-600 hover:underline">{t("login_link")}</Link>
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <button onClick={() => setStep("role")} className="mb-6 text-sm text-zinc-500 hover:text-zinc-700">{t("back")}</button>

          {/* Selected role recap */}
          {role && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <span className="text-2xl">{roles.find(r => r.value === role)?.icon}</span>
              <div>
                <p className="text-sm font-semibold text-indigo-900">{t(roles.find(r => r.value === role)!.labelKey)}</p>
                <p className="text-xs text-indigo-600">{t(roles.find(r => r.value === role)!.descKey)}</p>
              </div>
            </div>
          )}

          <h1 className="text-2xl font-bold text-zinc-900">{t("create_account")}</h1>
          <form onSubmit={handleSignup} className="mt-6 flex flex-col gap-4">
            <div>
              <label htmlFor="signup-name" className="mb-1 block text-sm font-medium text-zinc-700">{t("label_name")}</label>
              <input
                id="signup-name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder={t("placeholder_name")}
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-zinc-700">{t("label_email")}</label>
              <input
                id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-zinc-700">{t("label_password")}</label>
              <input
                id="signup-password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder={t("placeholder_password")}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="mt-2" disabled={loading}>
              {loading ? t("creating") : t("create_account")}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-500">
            {t("already_member")}{" "}
            <Link href={`/${locale}/login`} className="text-indigo-600 hover:underline">{t("login_link")}</Link>
          </p>
          <p className="mt-4 text-center text-xs text-zinc-400">
            {t("terms_prefix")}{" "}
            <Link href={`/${locale}/terms`} className="underline">{t("terms_agb")}</Link> {t("terms_and")}{" "}
            <Link href={`/${locale}/privacy`} className="underline">{t("terms_privacy")}</Link> {t("terms_suffix")}
          </p>
        </div>
      )}
    </div>
  );
}
