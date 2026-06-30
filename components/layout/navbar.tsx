"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LangSwitcher } from "@/components/LangSwitcher";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface UserState {
  uid: string;
  name: string;
  role: string;
}

export function Navbar() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const router = useRouter();
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && db) {
        try {
          const snap = await getDoc(doc(db, "profiles", firebaseUser.uid));
          const data = snap.data();
          setUser({
            uid: firebaseUser.uid,
            name: data?.full_name ?? firebaseUser.displayName ?? "?",
            role: data?.role ?? "startup",
          });
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleSignout() {
    // Clear UI immediately so name disappears before navigation
    setUser(null);
    setLoading(false);
    // Sign out from Firebase first so onAuthStateChanged fires null
    if (auth) {
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
    }
    // Delete server session cookie
    await fetch("/api/auth/signout", { method: "POST" });
    // Hard navigation so the server re-renders without session
    window.location.href = `/${locale}`;
  }

  function dashboardHref() {
    if (!user) return `/${locale}`;
    if (user.role === "talent") return `/${locale}/talent`;
    if (user.role === "investor") return `/${locale}/investor`;
    return `/${locale}/startup`;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={`/${locale}`} className="text-xl font-bold tracking-tight text-indigo-600">
          {t("brand")}
        </Link>
        <nav className="hidden gap-6 text-sm text-zinc-600 sm:flex">
          <Link href={`/${locale}#features`} className="hover:text-zinc-900">Features</Link>
          <Link href={`/${locale}#pricing`} className="hover:text-zinc-900">Pricing</Link>
        </nav>
        <div className="flex items-center gap-3">
          <LangSwitcher />
          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    href={dashboardHref()}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-indigo-300 transition-colors"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    {user.name}
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleSignout}>
                    {t("signout")}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/${locale}/login`}>{t("login")}</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/${locale}/signup`}>{t("signup")}</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
