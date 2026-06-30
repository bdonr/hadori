import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { canUseAI, canAccessDataRoom } from "@/lib/firebase/workspace";
import { LangSwitcher } from "@/components/LangSwitcher";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const [wsSnap, memberSnap, profileSnap] = await Promise.all([
    adminDb!.collection("workspaces").doc(id).get(),
    adminDb!.collection("workspaces").doc(id).collection("members").doc(session.uid).get(),
    adminDb!.collection("profiles").doc(session.uid).get(),
  ]);

  if (!wsSnap.exists || !memberSnap.exists) redirect(`/${locale}`);

  const ws = wsSnap.data()!;
  const member = memberSnap.data()!;
  const profile = profileSnap.data();
  const tier = profile?.plan_tier ?? "free";
  const tNav = await getTranslations("nav");

  const dashboardHref =
    profile?.role === "talent" ? `/${locale}/talent`
    : profile?.role === "investor" ? `/${locale}/investor`
    : `/${locale}/startup`;

  const nav = [
    { href: `/${locale}/workspace/${id}`,             icon: "⚡", label: "Board" },
    { href: `/${locale}/workspace/${id}/milestones`,  icon: "🎯", label: "Milestones" },
    { href: `/${locale}/workspace/${id}/team`,        icon: "👥", label: "Team" },
    { href: `/${locale}/workspace/${id}/ai`,          icon: "🤖", label: "AI Assistant", locked: !canUseAI(tier), lockLabel: "Pro+" },
    { href: `/${locale}/workspace/${id}/dataroom`,    icon: "🔒", label: "Data Room", locked: !canAccessDataRoom(tier), lockLabel: "Pro+", investorOnly: member.role === "investor" },
    { href: `/${locale}/workspace/${id}/settings`,    icon: "⚙️", label: "Settings", ownerOnly: member.role !== "owner" && member.role !== "admin" },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white">
        {/* Header */}
        <div className="border-b border-zinc-100 px-4 py-4">
          <Link href={`/${locale}`} className="text-sm font-extrabold text-indigo-600">{tNav("brand")}</Link>
          <p className="mt-0.5 truncate text-xs font-semibold text-zinc-700">{ws.name}</p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            ws.entityType === "startup" ? "bg-indigo-100 text-indigo-700" : "bg-purple-100 text-purple-700"
          }`}>
            {ws.entityType}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.locked ? `/${locale}/startup/billing` : item.href}
              className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                item.locked
                  ? "text-zinc-400 hover:bg-zinc-50"
                  : "text-zinc-700 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.locked && (
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400">
                  {item.lockLabel}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-100 px-3 py-3 space-y-2">
          <Link href={dashboardHref} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-700">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              {(profile?.full_name ?? "?").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-zinc-700">{profile?.full_name}</p>
              <p className="text-[10px] text-zinc-400 capitalize">{member.role}</p>
            </div>
          </div>
          <LangSwitcher />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
