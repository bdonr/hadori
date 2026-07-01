"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";

/**
 * A small "?" that explains a jargon term in the user's language:
 * plain meaning + example + what impact the choice has.
 * Content lives under the `glossary` namespace as
 * `${term}_term`, `${term}_simple`, `${term}_example`, `${term}_impact`.
 */
export function HelpTip({ term }: { term: string }) {
  const t = useTranslations("glossary");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t(`${term}_term`)}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-600 transition-colors hover:bg-indigo-200 hover:text-indigo-700"
      >
        ?
      </button>
      {open && (
        <span className="absolute left-0 top-6 z-40 w-72 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-xl">
          <span className="block text-sm font-bold text-zinc-900">{t(`${term}_term`)}</span>
          <span className="mt-1 block text-xs leading-relaxed text-zinc-600">{t(`${term}_simple`)}</span>
          <span className="mt-2 block rounded-lg bg-zinc-50 p-2 text-xs leading-relaxed text-zinc-600">
            <b className="text-zinc-500">{t("example_label")}: </b>{t(`${term}_example`)}
          </span>
          <span className="mt-1.5 block text-xs leading-relaxed text-indigo-700">
            <b>{t("impact_label")}: </b>{t(`${term}_impact`)}
          </span>
        </span>
      )}
    </span>
  );
}
