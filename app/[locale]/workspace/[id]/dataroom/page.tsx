import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { canAccessDataRoom } from "@/lib/firebase/workspace";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DataRoom } from "@/components/workspace/DataRoom";

export default async function DataRoomPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const t = await getTranslations("workspace_pages.dataroom");
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const [profileSnap, memberSnap] = await Promise.all([
    adminDb!.collection("profiles").doc(session.uid).get(),
    adminDb!.collection("workspaces").doc(id).collection("members").doc(session.uid).get(),
  ]);
  const tier = profileSnap.data()?.plan_tier ?? "free";
  const memberRole = memberSnap.data()?.role ?? "member";
  const canManage = ["owner", "admin"].includes(memberRole);
  const uploaderName = profileSnap.data()?.full_name ?? "";

  if (!canAccessDataRoom(tier)) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center">
        <span className="text-5xl">🔒</span>
        <h2 className="mt-4 text-xl font-bold text-zinc-900">{t("locked_title")}</h2>
        <p className="mt-2 text-zinc-500 max-w-sm">
          {t("locked_description")}
        </p>
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 max-w-sm text-sm text-indigo-700">
          <p className="font-semibold">{t("included_heading")}</p>
          <ul className="mt-2 space-y-1 text-left list-disc list-inside">
            <li>{t("included_upload")}</li>
            <li>{t("included_control")}</li>
            <li>{t("included_views")}</li>
            <li>{t("included_nda")}</li>
          </ul>
        </div>
        <Link
          href={`/${locale}/startup/billing`}
          className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          {t("upgrade_button")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold text-zinc-900 mb-2">🔒 {t("title")}</h1>
      <p className="text-sm text-zinc-500 mb-6">{t("subtitle")}</p>

      <DataRoom workspaceId={id} locale={locale} canManage={canManage} uploaderName={uploaderName} />
    </div>
  );
}
