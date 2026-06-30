"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase/client";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import type { WorkspaceTask, WorkspaceColumn } from "@/lib/firebase/workspace";
import { DEFAULT_COLUMNS } from "@/lib/firebase/workspace";
import * as Dialog from "@radix-ui/react-dialog";

const PRIORITY_COLORS: Record<string, string> = {
  low:    "bg-zinc-100 text-zinc-600",
  medium: "bg-blue-100 text-blue-700",
  high:   "bg-red-100 text-red-700",
};

export default function WorkspaceBoard() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [columns] = useState<WorkspaceColumn[]>(DEFAULT_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({ title: "", columnId: "todo", priority: "medium" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!db) return;
    const q = query(
      collection(db, "workspaces", workspaceId, "tasks"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => d.data() as WorkspaceTask));
      setLoading(false);
    });
    return unsub;
  }, [workspaceId]);

  async function createTask() {
    if (!newTask.title.trim()) return;
    setSaving(true);
    await fetch(`/api/workspace/${workspaceId}/board`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", task: newTask }),
    });
    setNewTask({ title: "", columnId: "todo", priority: "medium" });
    setDialogOpen(false);
    setSaving(false);
  }

  async function moveTask(taskId: string, columnId: string) {
    await fetch(`/api/workspace/${workspaceId}/board`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move", taskId, columnId }),
    });
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/workspace/${workspaceId}/board`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", taskId }),
    });
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-zinc-900">Board</h1>
        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              + Add task
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
              <Dialog.Title className="text-lg font-bold text-zinc-900 mb-4">New task</Dialog.Title>
              <div className="space-y-3">
                <input
                  autoFocus
                  value={newTask.title}
                  onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && createTask()}
                  placeholder="Task title"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
                <div className="flex gap-3">
                  <select
                    value={newTask.columnId}
                    onChange={(e) => setNewTask((p) => ({ ...p, columnId: e.target.value }))}
                    className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none"
                  >
                    {columns.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value }))}
                    className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Dialog.Close asChild>
                    <button className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
                  </Dialog.Close>
                  <button
                    onClick={createTask}
                    disabled={saving || !newTask.title.trim()}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Add task"}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Kanban */}
      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.columnId === col.id);
          return (
            <div key={col.id} className="flex w-64 shrink-0 flex-col gap-2">
              {/* Column header */}
              <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${col.color}`}>
                <span className="text-sm font-semibold text-zinc-800">{col.title}</span>
                <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold text-zinc-600">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="flex flex-col gap-2">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    columns={columns}
                    onMove={moveTask}
                    onDelete={deleteTask}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({
  task, columns, onMove, onDelete,
}: {
  task: WorkspaceTask;
  columns: WorkspaceColumn[];
  onMove: (id: string, col: string) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="group relative rounded-xl border border-zinc-200 bg-white p-3 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-800 leading-snug">{task.title}</p>
        <div ref={ref} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="rounded p-0.5 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ···
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-10 min-w-36 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Move to</p>
              {columns.filter((c) => c.id !== task.columnId).map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onMove(task.id, c.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  {c.title}
                </button>
              ))}
              <hr className="my-1 border-zinc-100" />
              <button
                onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="text-[10px] text-zinc-400">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {task.assignedName && (
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
            {task.assignedName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
