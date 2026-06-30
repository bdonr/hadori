"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase/client";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { WorkspaceMilestone, MilestoneStatus } from "@/lib/firebase/workspace";
import * as Dialog from "@radix-ui/react-dialog";

const STATUS_STYLES: Record<MilestoneStatus, { label: string; color: string }> = {
  upcoming:    { label: "Upcoming",    color: "bg-zinc-100 text-zinc-600" },
  in_progress: { label: "In progress", color: "bg-blue-100 text-blue-700" },
  completed:   { label: "Completed",   color: "bg-green-100 text-green-700" },
  missed:      { label: "Missed",      color: "bg-red-100 text-red-700" },
};

export default function MilestonesPage() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const [milestones, setMilestones] = useState<WorkspaceMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", status: "upcoming" as MilestoneStatus });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "workspaces", workspaceId, "milestones"), orderBy("dueDate", "asc"));
    return onSnapshot(q, (snap) => {
      setMilestones(snap.docs.map((d) => d.data() as WorkspaceMilestone));
      setLoading(false);
    });
  }, [workspaceId]);

  async function createMilestone() {
    if (!form.title.trim() || !form.dueDate) return;
    setSaving(true);
    await fetch(`/api/workspace/${workspaceId}/milestone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", milestone: form }),
    });
    setForm({ title: "", description: "", dueDate: "", status: "upcoming" });
    setDialogOpen(false);
    setSaving(false);
  }

  async function updateStatus(milestoneId: string, status: MilestoneStatus) {
    await fetch(`/api/workspace/${workspaceId}/milestone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", milestoneId, milestone: { status } }),
    });
  }

  if (loading) return <div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>;

  const overdue = milestones.filter((m) => m.status !== "completed" && new Date(m.dueDate) < new Date());

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-zinc-900">Milestones</h1>
          {overdue.length > 0 && (
            <p className="text-sm text-red-600 mt-0.5">⚠️ {overdue.length} overdue</p>
          )}
        </div>
        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              + Add milestone
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
              <Dialog.Title className="text-lg font-bold text-zinc-900 mb-4">New milestone</Dialog.Title>
              <div className="space-y-3">
                <input
                  autoFocus
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Milestone title"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 resize-none"
                />
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
                <div className="flex gap-2 justify-end">
                  <Dialog.Close asChild>
                    <button className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
                  </Dialog.Close>
                  <button
                    onClick={createMilestone}
                    disabled={saving || !form.title.trim() || !form.dueDate}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Add"}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {milestones.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
          <p className="text-zinc-400">No milestones yet. Add your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => {
            const isOverdue = m.status !== "completed" && new Date(m.dueDate) < new Date();
            const s = STATUS_STYLES[m.status];
            return (
              <div key={m.id} className={`flex items-start gap-4 rounded-xl border bg-white p-4 ${isOverdue ? "border-red-200" : "border-zinc-200"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-medium text-zinc-900 ${m.status === "completed" ? "line-through text-zinc-400" : ""}`}>
                      {m.title}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.color}`}>{s.label}</span>
                    {isOverdue && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">OVERDUE</span>}
                  </div>
                  {m.description && <p className="mt-1 text-sm text-zinc-500">{m.description}</p>}
                  <p className="mt-1 text-xs text-zinc-400">Due: {new Date(m.dueDate).toLocaleDateString()}</p>
                </div>
                <select
                  value={m.status}
                  onChange={(e) => updateStatus(m.id, e.target.value as MilestoneStatus)}
                  className="shrink-0 rounded-lg border border-zinc-200 px-2 py-1 text-xs outline-none"
                >
                  {(Object.keys(STATUS_STYLES) as MilestoneStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_STYLES[s].label}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
