import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import type { Profile } from "@/lib/firebase/collections";
import { VisibilityToggle } from "./VisibilityToggle";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { getTranslations } from "next-intl/server";

export default async function VisibilityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("startup_pages.visibility");
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const snap = await adminDb!.collection("profiles").doc(session.uid).get();
  const profile = snap.data() as Profile | undefined;
  if (!profile || (profile.role !== "startup" && profile.role !== "creator")) redirect(`/${locale}/login`);

  const isPro = profile.plan_tier === "pro" || profile.plan_tier === "scale";
  const isVisible = profile.investor_visible ?? false;

  const perks = [
    { icon: "🔍", title: t("perk_findable_title"), desc: t("perk_findable_desc") },
    { icon: "📬", title: t("perk_requests_title"), desc: t("perk_requests_desc") },
    { icon: "🏅", title: t("perk_badge_title"), desc: t("perk_badge_desc") },
    { icon: "🔒", title: t("perk_dataroom_title"), desc: t("perk_dataroom_desc") },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-12">

        {/* Status card */}
        <div className={`rounded-2xl border p-6 ${isPro ? "border-indigo-200 bg-indigo-50" : "border-zinc-200 bg-white"} shadow-sm`}>
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                {isPro
                  ? isVisible
                    ? t("status_visible")
                    : t("status_disabled")
                  : t("status_become_visible")}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {isPro
                  ? isVisible
                    ? t("status_visible_desc")
                    : t("status_disabled_desc")
                  : t("status_free_desc")}
              </p>
            </div>

            {isPro ? (
              <VisibilityToggle uid={session.uid} initialValue={isVisible} />
            ) : (
              <Button asChild className="shrink-0">
                <Link href={`/${locale}/startup/billing`}>{t("upgrade_to_pro")}</Link>
              </Button>
            )}
          </div>
        </div>

        {/* What you get */}
        <div className="mt-10">
          <h3 className="mb-5 text-base font-bold text-zinc-900">{t("perks_heading")}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {perks.map((p) => (
              <div
                key={p.title}
                className={`flex gap-4 rounded-xl border bg-white p-5 shadow-sm ${!isPro ? "opacity-60" : ""}`}
              >
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <p className="font-semibold text-zinc-900">{p.title}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Free upsell banner */}
        {!isPro && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <span className="text-2xl">⚡</span>
              <div className="flex-1">
                <p className="font-bold text-amber-900">{t("upsell_title")}</p>
                <p className="mt-1 text-sm text-amber-800">
                  {t("upsell_desc")}
                </p>
              </div>
              <Button asChild className="shrink-0 bg-amber-600 hover:bg-amber-700">
                <Link href={`/${locale}/startup/billing`}>{t("price_per_month")}</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Legal note */}
        <p className="mt-8 text-xs text-zinc-400">
          {t("legal_note")}
        </p>
      </main>
    </div>
  );
}
