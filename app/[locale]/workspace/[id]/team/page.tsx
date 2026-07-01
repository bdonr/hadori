"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase/client";
import { collection, onSnapshot } from "firebase/firestore";
import type { WorkspaceMember, WorkspaceMemberRole } from "@/lib/firebase/workspace";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";

const ROLE_COLORS: Record<WorkspaceMemberRole, string> = {
  owner:       "bg-indigo-100 text-indigo-700",
  admin:       "bg-purple-100 text-purple-700",
  member:      "bg-blue-100 text-blue-700",
  contributor: "bg-zinc-100 text-zinc-600",
  investor:    "bg-emerald-100 text-emerald-700",
  guest:       "bg-zinc-100 text-zinc-400",
};

const ROLES: WorkspaceMemberRole[] = ["admin", "member", "contributor", "investor", "guest"];

export default function TeamPage() {
  const t = useTranslations("workspace_pages.team");
  const { id: workspaceId } = useParams<{ id: string }>();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ email: "", role: "member" as WorkspaceMemberRole });
  const [inviteLink, setInviteLink] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(
      collection(db, "workspaces", workspaceId, "members"),
      (snap) => {
        setMembers(snap.docs.map((d) => d.data() as WorkspaceMember));
        setLoading(false);
      }
    );
    return unsub;
  }, [workspaceId]);

  async function sendInvite() {
    if (!invite.email.trim()) return;
    setSending(true);
    const res = await fetch(`/api/workspace/${workspaceId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: invite.email, role: invite.role }),
    });
    const data = await res.json();
    setInviteLink(data.inviteLink ?? "");
    setSending(false);
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-zinc-900">{t("title", { n: members.length })}</h1>
        <Dialog.Root open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) { setInviteLink(""); setInvite({ email: "", role: "member" }); } }}>
          <Dialog.Trigger asChild>
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              {t("invite_member_button")}
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
              <Dialog.Title className="text-lg font-bold text-zinc-900 mb-4">{t("invite_dialog_title")}</Dialog.Title>
              {!inviteLink ? (
                <div className="space-y-3">
                  <input
                    autoFocus
                    type="email"
                    value={invite.email}
                    onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))}
                    placeholder={t("email_placeholder")}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  />
                  <select
                    value={invite.role}
                    onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value as WorkspaceMemberRole }))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-400">
                    {invite.role === "investor" && `👁 ${t("role_hint_investor")}`}
                    {invite.role === "contributor" && `✏️ ${t("role_hint_contributor")}`}
                    {invite.role === "member" && `✏️ ${t("role_hint_member")}`}
                    {invite.role === "admin" && `🔧 ${t("role_hint_admin")}`}
                    {invite.role === "guest" && `👁 ${t("role_hint_guest")}`}
                  </p>
                  <div className="flex gap-2 justify-end">
                    <Dialog.Close asChild>
                      <button className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">{t("cancel")}</button>
                    </Dialog.Close>
                    <button
                      onClick={sendInvite}
                      disabled={sending || !invite.email.trim()}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {sending ? t("sending") : t("send_invite")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-600">{t("invite_sent")}</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={inviteLink}
                      className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(inviteLink)}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
                    >
                      {t("copy")}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <Dialog.Close asChild>
                      <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">{t("done")}</button>
                    </Dialog.Close>
                  </div>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.uid} className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
              {m.full_name.charAt(0).toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{m.full_name}</p>
              <p className="text-xs text-zinc-400">{t("joined", { date: new Date(m.joinedAt).toLocaleDateString() })}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${ROLE_COLORS[m.role] ?? "bg-zinc-100 text-zinc-500"}`}>
              {m.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
