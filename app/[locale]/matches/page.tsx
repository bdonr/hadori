"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function MatchesPage() {
  const params = useParams();
  const locale = (params.locale as string) ?? "en";

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href="/" className="text-xl font-extrabold text-indigo-600">DADORI</Link>
          <h1 className="text-lg font-semibold text-zinc-900 ml-4">Matches & Intros</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mt-16 text-center">
          <span className="text-5xl">🤝</span>
          <p className="mt-4 text-lg font-semibold text-zinc-700">Noch keine Matches</p>
          <p className="mt-2 text-sm text-zinc-400">Matches erscheinen hier sobald Startups und Talente zusammenpassen.</p>
          <Link href={`/${locale}/explore`} className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
            Projekte entdecken →
          </Link>
        </div>
      </main>
    </div>
  );
}
