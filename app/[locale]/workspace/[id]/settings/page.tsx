import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const [wsSnap, memberSnap] = await Promise.all([
    adminDb!.collection("workspaces").doc(id).get(),
    adminDb!.collection("workspaces").doc(id).collection("members").doc(session.uid).get(),
  ]);

  if (!wsSnap.exists || !memberSnap.exists) redirect(`/${locale}`);
  const ws = wsSnap.data()!;
  const member = memberSnap.data()!;

  if (member.role !== "owner" && member.role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center p-12 text-center">
        <p className="text-zinc-400">Only owners and admins can access settings.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-lg font-bold text-zinc-900 mb-6">⚙️ Settings</h1>

      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold text-zinc-900 mb-3">Workspace info</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</label>
              <p className="mt-1 text-sm text-zinc-800">{ws.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</label>
              <p className="mt-1 text-sm text-zinc-800 capitalize">{ws.entityType}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Plan</label>
              <p className="mt-1 text-sm text-zinc-800 capitalize">{ws.planTier}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Created</label>
              <p className="mt-1 text-sm text-zinc-800">{new Date(ws.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Extensible: payment settings will go here in Phase X */}
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 text-sm text-zinc-400">
          <p className="font-medium text-zinc-500">Coming soon</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Rename workspace</li>
            <li>Custom columns</li>
            <li>Payment settings (Phase X)</li>
            <li>Archive workspace</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
