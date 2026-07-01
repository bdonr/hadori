"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function WorkspaceCreateCard({ locale, uid }: { locale: string; uid: string }) {
  const t = useTranslations("workspace_pages.create_card");
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), entityType: "startup", entityId: uid }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        router.push(`/${locale}/workspace/${data.id}`);
        return;
      }
      setError(data.error ?? t("error_create"));
    } catch {
      setError(t("error_network"));
    } finally {
      setCreating(false);
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 p-6 hover:border-violet-400 transition-all text-left"
      >
        <span className="text-3xl">🚀</span>
        <div>
          <h2 className="font-semibold text-violet-900">{t("create_heading")}</h2>
          <p className="text-sm text-violet-600">{t("features")}</p>
        </div>
        <span className="ml-auto text-sm font-semibold text-violet-600 border border-violet-300 rounded-lg px-3 py-1 hover:bg-violet-100">
          {t("create_arrow")}
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
      <h2 className="font-semibold text-violet-900 mb-3">🚀 {t("create_heading")}</h2>
      <div className="flex gap-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder={t("name_placeholder")}
          className="flex-1 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
        />
        <button
          onClick={create}
          disabled={creating || !name.trim()}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {creating ? "…" : t("create_button")}
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="rounded-lg border border-violet-200 px-3 py-2 text-sm text-violet-500 hover:bg-violet-100"
        >
          ✕
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
