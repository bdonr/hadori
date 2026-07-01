"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("misc_pages.notification_bell");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
        aria-label={t("notifications")}
      >
        <span className="text-lg">🔔</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3 bg-zinc-50">
              <p className="text-sm font-bold text-zinc-900">{t("notifications")}</p>
            </div>
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-zinc-400">{t("no_new_notifications")}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
