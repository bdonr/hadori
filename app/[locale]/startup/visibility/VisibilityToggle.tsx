"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export function VisibilityToggle({ uid, initialValue }: { uid: string; initialValue: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    setSaving(true);
    setError(false);
    const next = !enabled;
    // Optimistic flip
    setEnabled(next);
    try {
      await updateDoc(doc(db, "profiles", uid), { investor_visible: next });
      // Re-render the server component so the status text/heading reflect the
      // new value (they are server-rendered, not just this toggle).
      router.refresh();
    } catch {
      setEnabled(!next); // revert on failure
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={saving}
        aria-pressed={enabled}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          enabled ? "bg-indigo-600" : "bg-zinc-300"
        } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 translate-y-px rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
      {error && <span className="text-xs text-red-600">!</span>}
    </div>
  );
}
