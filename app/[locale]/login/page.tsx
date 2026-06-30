"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase/client";
import { profileDoc } from "@/lib/firebase/refs";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { LangSwitcher } from "@/components/LangSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const token = await user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const snap = await getDoc(profileDoc(user.uid));
      const role = snap.data()?.role;
      if (role === "startup" || role === "creator") router.push(`/${locale}/startup`);
      else if (role === "talent") router.push(`/${locale}/talent`);
      else if (role === "investor") router.push(`/${locale}/investor`);
      else router.push(`/${locale}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="absolute top-4 right-4">
        <LangSwitcher />
      </div>
      <Link href={`/${locale}`} className="mb-8 text-2xl font-extrabold text-indigo-600">
        {tNav("brand")}
      </Link>
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-zinc-900">{t("login_title")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("login_sub")}</p>
        <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-zinc-700">{t("email")}</label>
            <input
              id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-zinc-700">{t("password")}</label>
            <input
              id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="mt-2" disabled={loading}>
            {loading ? "…" : t("btn_login")}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          {t("switch_to_signup").split("?")[0]}?{" "}
          <Link href={`/${locale}/signup`} className="text-indigo-600 hover:underline">
            {t("switch_to_signup").split("? ")[1] ?? t("switch_to_signup")}
          </Link>
        </p>
      </div>
    </div>
  );
}
