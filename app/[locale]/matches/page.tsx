"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/layout/navbar";

export default function MatchesPage() {
  const params = useParams();
  const locale = (params.locale as string) ?? "en";
  const t = useTranslations("misc_pages.matches");

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mt-16 text-center">
          <span className="text-5xl">🤝</span>
          <p className="mt-4 text-lg font-semibold text-zinc-700">{t("no_matches")}</p>
          <p className="mt-2 text-sm text-zinc-400">{t("no_matches_desc")}</p>
          <Link href={`/${locale}/explore`} className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
            {t("discover_projects")}
          </Link>
        </div>
      </main>
    </div>
  );
}
