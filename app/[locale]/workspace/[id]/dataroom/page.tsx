import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { canAccessDataRoom } from "@/lib/firebase/workspace";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function DataRoomPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const t = await getTranslations("workspace_pages.dataroom");
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const profileSnap = await adminDb!.collection("profiles").doc(session.uid).get();
  const tier = profileSnap.data()?.plan_tier ?? "free";

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

      {/* Coming soon — ready for Phase X */}
      <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
        <span className="text-4xl">📂</span>
        <p className="mt-4 font-semibold text-zinc-700">{t("empty_title")}</p>
        <p className="mt-2 text-sm text-zinc-400">{t("empty_description")}</p>
        <button
          disabled
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
        >
          {t("upload_button")}
        </button>
      </div>
    </div>
  );
}
