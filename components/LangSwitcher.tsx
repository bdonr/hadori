"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

const LANG_LABELS: Record<string, string> = {
  de: "🇩🇪 DE", en: "🇬🇧 EN", fr: "🇫🇷 FR",
  ja: "🇯🇵 JA", zh: "🇨🇳 ZH", ru: "🇷🇺 RU", ko: "🇰🇷 KO",
};
const LANG_NAMES: Record<string, string> = {
  de: "Deutsch", en: "English", fr: "Français",
  ja: "日本語", zh: "中文", ru: "Русский", ko: "한국어",
};

export function LangSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function switchLocale(next: string) {
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:border-indigo-300 transition-colors"
      >
        <span>{LANG_LABELS[locale] ?? locale.toUpperCase()}</span>
        <span className="text-zinc-400">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 flex flex-col min-w-[140px] rounded-xl border border-zinc-200 bg-white py-1 shadow-xl">
          {routing.locales.map(l => (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-indigo-50 transition-colors text-left ${
                l === locale ? "text-indigo-700 font-semibold" : "text-zinc-700"
              }`}
            >
              <span className="text-base">{LANG_LABELS[l]?.split(" ")[0]}</span>
              <span>{LANG_NAMES[l]}</span>
              {l === locale && <span className="ml-auto text-indigo-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
