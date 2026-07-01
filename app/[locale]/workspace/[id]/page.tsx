"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import type { WorkspaceTask, WorkspaceColumn, WorkspaceSprint } from "@/lib/firebase/workspace";
import { DEFAULT_COLUMNS } from "@/lib/firebase/workspace";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";

const PRIORITY_BAR: Record<string, string> = {
  low: "bg-zinc-300", medium: "bg-blue-400", high: "bg-red-500",
};
const PRIORITY_CHIP: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-600", medium: "bg-blue-100 text-blue-700", high: "bg-red-100 text-red-700",
};

// Deadline urgency → { color classes, kind }
function deadlineInfo(due?: string | null) {
  if (!due) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(due); d.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (days < 0) return { kind: "overdue", cls: "bg-red-100 text-red-700 border-red-200", days };
  if (days === 0) return { kind: "today", cls: "bg-amber-100 text-amber-800 border-amber-200", days };
  if (days <= 2) return { kind: "soon", cls: "bg-amber-50 text-amber-700 border-amber-100", days };
  return { kind: "later", cls: "bg-zinc-50 text-zinc-500 border-zinc-200", days };
}

function daysBetween(a: string, b: string) {
  const d1 = new Date(a); d1.setHours(0, 0, 0, 0);
  const d2 = new Date(b); d2.setHours(0, 0, 0, 0);
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

export default function WorkspaceBoard() {
  const t = useTranslations("workspace_pages.board");
  const { id: workspaceId, locale } = useParams<{ id: string; locale: string }>();
  const [uid, setUid] = useState<string | null>(null);
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [sprints, setSprints] = useState<WorkspaceSprint[]>([]);
  const [columns] = useState<WorkspaceColumn[]>(DEFAULT_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [sprintFilter, setSprintFilter] = useState<string>("all"); // all | backlog | <sprintId>
  const [dragTask, setDragTask] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const [newTask, setNewTask] = useState({ title: "", columnId: "todo", priority: "medium", dueDate: "", labels: "", sprintId: "" });
  const [taskDialog, setTaskDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [sprintDialog, setSprintDialog] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: "", goal: "", startDate: "", endDate: "" });

  const [aiDialog, setAiDialog] = useState(false);
  const [aiGoal, setAiGoal] = useState("");
  const [aiHorizon, setAiHorizon] = useState(8);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [aiResult, setAiResult] = useState<{ sprintsCreated: number; tasksCreated: number; roles: { title: string; why: string; skills?: string[] }[] } | null>(null);

  async function runAiPlan() {
    setAiRunning(true); setAiError(false);
    try {
      const res = await fetch(`/api/ai/plan-to-board`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, goal: aiGoal.trim(), horizonWeeks: aiHorizon }),
      });
      const data = await res.json();
      if (!res.ok || !data.sprintsCreated) { setAiError(true); return; }
      setAiResult(data); setAiDialog(false);
    } catch { setAiError(true); }
    finally { setAiRunning(false); }
  }

  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null)), []);

  useEffect(() => {
    if (!db) return;
    const unsubT = onSnapshot(
      query(collection(db, "workspaces", workspaceId, "tasks"), orderBy("createdAt", "asc")),
      (snap) => { setTasks(snap.docs.map((d) => d.data() as WorkspaceTask)); setLoading(false); }
    );
    const unsubS = onSnapshot(
      collection(db, "workspaces", workspaceId, "sprints"),
      (snap) => setSprints(snap.docs.map((d) => d.data() as WorkspaceSprint))
    );
    return () => { unsubT(); unsubS(); };
  }, [workspaceId]);

  async function boardAction(payload: Record<string, unknown>) {
    await fetch(`/api/workspace/${workspaceId}/board`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
  }
  async function sprintAction(payload: Record<string, unknown>) {
    await fetch(`/api/workspace/${workspaceId}/sprint`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
  }

  async function createTask() {
    if (!newTask.title.trim()) return;
    setSaving(true);
    await boardAction({ action: "create", task: {
      title: newTask.title.trim(), columnId: newTask.columnId, priority: newTask.priority,
      dueDate: newTask.dueDate || null,
      labels: newTask.labels.split(",").map((s) => s.trim()).filter(Boolean),
      sprintId: newTask.sprintId || (sprintFilter !== "all" && sprintFilter !== "backlog" ? sprintFilter : null),
    } });
    setNewTask({ title: "", columnId: "todo", priority: "medium", dueDate: "", labels: "", sprintId: "" });
    setTaskDialog(false); setSaving(false);
  }

  async function createSprint() {
    if (!newSprint.name.trim() || !newSprint.startDate || !newSprint.endDate) return;
    setSaving(true);
    const anyActive = sprints.some((s) => s.status === "active");
    await sprintAction({ action: "create", sprint: { ...newSprint, name: newSprint.name.trim(), status: anyActive ? "planned" : "active" } });
    setNewSprint({ name: "", goal: "", startDate: "", endDate: "" });
    setSprintDialog(false); setSaving(false);
  }

  const move = (taskId: string, columnId: string) => boardAction({ action: "move", taskId, columnId });
  const del = (taskId: string) => boardAction({ action: "delete", taskId });
  const claim = (taskId: string, on: boolean) => boardAction({ action: "claim", taskId, claim: on });
  const setSprint = (taskId: string, sprintId: string | null) => boardAction({ action: "setSprint", taskId, sprintId });

  // Filter tasks by the selected sprint view
  const visibleTasks = tasks.filter((task) => {
    if (sprintFilter === "all") return true;
    if (sprintFilter === "backlog") return !task.sprintId;
    return task.sprintId === sprintFilter;
  });

  const activeSprint = sprints.find((s) => s.status === "active");
  const activeTasks = activeSprint ? tasks.filter((t) => t.sprintId === activeSprint.id) : [];
  const activeDone = activeTasks.filter((t) => t.columnId === "done").length;

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
        <h1 className="text-lg font-bold text-zinc-900">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setAiDialog(true)}
            className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors">
            {t("ai_plan")}
          </button>
          <button onClick={() => setSprintDialog(true)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors">
            {t("new_sprint")}
          </button>
          <button onClick={() => setTaskDialog(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            {t("add_task_button")}
          </button>
        </div>
      </div>

      {/* Active sprint banner */}
      {activeSprint && (
        <ActiveSprintBar
          sprint={activeSprint} done={activeDone} total={activeTasks.length}
          onComplete={() => sprintAction({ action: "setStatus", sprintId: activeSprint.id, status: "completed" })}
        />
      )}

      {/* Sprint filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-100 bg-white px-6 py-2.5">
        <FilterChip active={sprintFilter === "all"} onClick={() => setSprintFilter("all")} label={t("all_sprints")} />
        <FilterChip active={sprintFilter === "backlog"} onClick={() => setSprintFilter("backlog")} label={t("backlog")} />
        {sprints.map((s) => (
          <FilterChip key={s.id} active={sprintFilter === s.id} onClick={() => setSprintFilter(s.id)}
            label={s.name} dot={s.status === "active" ? "bg-emerald-500" : s.status === "completed" ? "bg-zinc-300" : "bg-amber-400"}
            action={s.status === "planned" ? { label: t("start_sprint"), fn: () => sprintAction({ action: "setStatus", sprintId: s.id, status: "active" }) } : undefined}
          />
        ))}
      </div>

      {/* Kanban */}
      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {columns.map((col) => {
          const colTasks = visibleTasks.filter((task) => task.columnId === col.id);
          const isOver = dragOverCol === col.id;
          return (
            <div key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
              onDragLeave={() => setDragOverCol((c) => (c === col.id ? null : c))}
              onDrop={() => { if (dragTask) move(dragTask, col.id); setDragTask(null); setDragOverCol(null); }}
              className={`flex w-72 shrink-0 flex-col gap-2 rounded-xl p-1 transition-colors ${isOver ? "bg-indigo-50 ring-2 ring-indigo-200" : ""}`}
            >
              <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${col.color}`}>
                <span className="text-sm font-semibold text-zinc-800">{col.title}</span>
                <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold text-zinc-600">{colTasks.length}</span>
              </div>
              <div className="flex min-h-[40px] flex-col gap-2">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id} task={task} columns={columns} sprints={sprints} uid={uid}
                    onMove={move} onDelete={del} onClaim={claim} onSetSprint={setSprint}
                    onDragStart={() => setDragTask(task.id)} onDragEnd={() => setDragTask(null)}
                    dragging={dragTask === task.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New task dialog */}
      <Dialog.Root open={taskDialog} onOpenChange={setTaskDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="mb-4 text-lg font-bold text-zinc-900">{t("new_task_title")}</Dialog.Title>
            <div className="space-y-3">
              <input autoFocus value={newTask.title}
                onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && createTask()}
                placeholder={t("task_title_placeholder")}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
              <div className="flex gap-3">
                <select value={newTask.columnId} onChange={(e) => setNewTask((p) => ({ ...p, columnId: e.target.value }))}
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none">
                  {columns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <select value={newTask.priority} onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value }))}
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none">
                  <option value="low">{t("priority_low")}</option>
                  <option value="medium">{t("priority_medium")}</option>
                  <option value="high">{t("priority_high")}</option>
                </select>
              </div>
              <div className="flex gap-3">
                <label className="flex-1 text-xs text-zinc-500">
                  {t("label_due")}
                  <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none" />
                </label>
                <label className="flex-1 text-xs text-zinc-500">
                  {t("label_sprint")}
                  <select value={newTask.sprintId} onChange={(e) => setNewTask((p) => ({ ...p, sprintId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none">
                    <option value="">{t("no_sprint")}</option>
                    {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
              </div>
              <input value={newTask.labels} onChange={(e) => setNewTask((p) => ({ ...p, labels: e.target.value }))}
                placeholder={t("labels_placeholder")}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              <div className="flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">{t("cancel")}</button>
                </Dialog.Close>
                <button onClick={createTask} disabled={saving || !newTask.title.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? t("saving") : t("add_task_button")}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* AI plan dialog */}
      <Dialog.Root open={aiDialog} onOpenChange={setAiDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="mb-1 text-lg font-bold text-zinc-900">{t("ai_dialog_title")}</Dialog.Title>
            <p className="mb-4 text-sm text-zinc-500">{t("ai_dialog_desc")}</p>
            <div className="space-y-3">
              <textarea autoFocus value={aiGoal} onChange={(e) => setAiGoal(e.target.value)} rows={2}
                placeholder={t("ai_goal_placeholder")}
                className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
              <label className="block text-xs text-zinc-500">{t("ai_horizon")}
                <select value={aiHorizon} onChange={(e) => setAiHorizon(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none">
                  {[4, 6, 8, 12, 16].map((w) => <option key={w} value={w}>{t("ai_weeks", { n: w })}</option>)}
                </select>
              </label>
              {aiError && <p className="text-sm text-red-600">{t("ai_error")}</p>}
              <div className="flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">{t("cancel")}</button>
                </Dialog.Close>
                <button onClick={runAiPlan} disabled={aiRunning}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
                  {aiRunning ? t("ai_generating") : t("ai_generate")}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* AI result — role suggestions */}
      <Dialog.Root open={!!aiResult} onOpenChange={(o) => { if (!o) setAiResult(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-bold text-zinc-900">✨ {t("ai_result_title")}</Dialog.Title>
            {aiResult && (
              <>
                <p className="mt-1 text-sm text-zinc-500">{t("ai_result_summary", { sprints: aiResult.sprintsCreated, tasks: aiResult.tasksCreated })}</p>
                {aiResult.roles.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">{t("ai_roles_title")}</p>
                    <div className="flex flex-col gap-2">
                      {aiResult.roles.map((r, i) => (
                        <div key={i} className="rounded-xl border border-zinc-200 p-3">
                          <p className="text-sm font-semibold text-zinc-900">{r.title}</p>
                          <p className="text-xs text-zinc-500">{r.why}</p>
                          {r.skills && r.skills.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {r.skills.map((s) => <span key={s} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-600">{s}</span>)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <Link href={`/${locale}/startup/roles`} className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700">{t("ai_view_roles")}</Link>
                  </div>
                )}
                <div className="mt-5 flex justify-end">
                  <button onClick={() => setAiResult(null)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">{t("close")}</button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* New sprint dialog */}
      <Dialog.Root open={sprintDialog} onOpenChange={setSprintDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="mb-4 text-lg font-bold text-zinc-900">{t("new_sprint")}</Dialog.Title>
            <div className="space-y-3">
              <input autoFocus value={newSprint.name} onChange={(e) => setNewSprint((p) => ({ ...p, name: e.target.value }))}
                placeholder={t("sprint_name_placeholder")}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              <input value={newSprint.goal} onChange={(e) => setNewSprint((p) => ({ ...p, goal: e.target.value }))}
                placeholder={t("sprint_goal_placeholder")}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              <div className="flex gap-3">
                <label className="flex-1 text-xs text-zinc-500">{t("start_date")}
                  <input type="date" value={newSprint.startDate} onChange={(e) => setNewSprint((p) => ({ ...p, startDate: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none" />
                </label>
                <label className="flex-1 text-xs text-zinc-500">{t("end_date")}
                  <input type="date" value={newSprint.endDate} onChange={(e) => setNewSprint((p) => ({ ...p, endDate: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none" />
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">{t("cancel")}</button>
                </Dialog.Close>
                <button onClick={createSprint} disabled={saving || !newSprint.name.trim() || !newSprint.startDate || !newSprint.endDate}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? t("saving") : t("create")}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function FilterChip({ active, onClick, label, dot, action }: {
  active: boolean; onClick: () => void; label: string; dot?: string;
  action?: { label: string; fn: () => void };
}) {
  return (
    <span className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${active ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-200"}`}>
      <button onClick={onClick} className="flex items-center gap-1.5">
        {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
        {label}
      </button>
      {action && (
        <button onClick={action.fn} className="text-emerald-600 hover:text-emerald-700" title={action.label}>▶</button>
      )}
    </span>
  );
}

function ActiveSprintBar({ sprint, done, total, onComplete }: {
  sprint: WorkspaceSprint; done: number; total: number; onComplete: () => void;
}) {
  const t = useTranslations("workspace_pages.board");
  const left = daysBetween(new Date().toISOString(), sprint.endDate);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-emerald-100 bg-emerald-50/60 px-6 py-3">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">{t("status_active")}</span>
        <span className="font-bold text-zinc-900">{sprint.name}</span>
        {sprint.goal && <span className="text-sm text-zinc-500">— {sprint.goal}</span>}
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 w-32 overflow-hidden rounded-full bg-emerald-100">
          <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-semibold text-emerald-700">{t("progress", { done, total })}</span>
      </div>
      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${left < 0 ? "border-red-200 bg-red-100 text-red-700" : "border-emerald-200 bg-white text-emerald-700"}`}>
        {left < 0 ? t("ended") : left === 1 ? t("day_left") : t("days_left", { n: left })}
      </span>
      <button onClick={onComplete} className="ml-auto rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
        {t("complete_sprint")}
      </button>
    </div>
  );
}

function TaskCard({ task, columns, sprints, uid, onMove, onDelete, onClaim, onSetSprint, onDragStart, onDragEnd, dragging }: {
  task: WorkspaceTask; columns: WorkspaceColumn[]; sprints: WorkspaceSprint[]; uid: string | null;
  onMove: (id: string, col: string) => void; onDelete: (id: string) => void;
  onClaim: (id: string, on: boolean) => void; onSetSprint: (id: string, sprintId: string | null) => void;
  onDragStart: () => void; onDragEnd: () => void; dragging: boolean;
}) {
  const t = useTranslations("workspace_pages.board");
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dl = deadlineInfo(task.dueDate);
  const mine = task.assignedTo && task.assignedTo === uid;

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false); }
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      className={`group relative flex overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:border-indigo-200 hover:shadow-md ${dragging ? "opacity-40" : ""}`}>
      {/* priority bar */}
      <div className={`w-1 shrink-0 ${PRIORITY_BAR[task.priority] ?? PRIORITY_BAR.medium}`} />
      <div className="flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug text-zinc-800">{task.title}</p>
          <div ref={ref} className="relative shrink-0">
            <button onClick={() => setMenuOpen((p) => !p)}
              className="rounded p-0.5 text-zinc-300 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100">···</button>
            {menuOpen && (
              <div className="absolute right-0 top-6 z-20 min-w-40 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{t("move_to")}</p>
                {columns.filter((c) => c.id !== task.columnId).map((c) => (
                  <button key={c.id} onClick={() => { onMove(task.id, c.id); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">{c.title}</button>
                ))}
                <hr className="my-1 border-zinc-100" />
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{t("assign_sprint")}</p>
                <button onClick={() => { onSetSprint(task.id, null); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">{t("no_sprint")}</button>
                {sprints.map((s) => (
                  <button key={s.id} onClick={() => { onSetSprint(task.id, s.id); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">{s.name}</button>
                ))}
                <hr className="my-1 border-zinc-100" />
                <button onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">{t("delete")}</button>
              </div>
            )}
          </div>
        </div>

        {/* labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {task.labels.map((l) => (
              <span key={l} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">{l}</span>
            ))}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${PRIORITY_CHIP[task.priority] ?? PRIORITY_CHIP.medium}`}>
            {t(`priority_${task.priority}` as "priority_low")}
          </span>
          {dl && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${dl.cls}`}>
              {dl.kind === "overdue" ? t("overdue") : dl.kind === "today" ? t("due_today") : new Date(task.dueDate!).toLocaleDateString()}
            </span>
          )}

          {/* claim / assignee */}
          <div className="ml-auto">
            {task.assignedTo ? (
              <button onClick={() => mine && onClaim(task.id, false)} title={mine ? t("release") : task.assignedName ?? ""}
                className={`flex items-center gap-1 rounded-full py-0.5 pl-0.5 pr-2 text-[10px] font-semibold ${mine ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" : "bg-zinc-100 text-zinc-600"}`}>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">
                  {(task.assignedName ?? "?").charAt(0).toUpperCase()}
                </span>
                {mine ? t("you") : task.assignedName}
              </button>
            ) : (
              <button onClick={() => onClaim(task.id, true)}
                className="rounded-full border border-dashed border-zinc-300 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 hover:border-indigo-400 hover:text-indigo-600">
                + {t("claim")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
