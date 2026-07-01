import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  // Redirect logged-in users to their dashboard.
  // IMPORTANT: redirect() works by throwing a NEXT_REDIRECT error, so it must
  // NOT be called inside a try/catch — the catch would swallow the redirect
  // and the logged-in user would wrongly see the marketing landing page.
  const session = await getServerSession();
  let role: string | null = null;
  if (session && adminDb) {
    try {
      const snap = await adminDb.collection("profiles").doc(session.uid).get();
      role = (snap.data()?.role as string) ?? null;
    } catch {
      // Could not read profile — treat as logged-in but unknown role below.
    }
  }
  if (session) {
    if (role === "talent") redirect(`/${locale}/talent`);
    if (role === "investor") redirect(`/${locale}/investor`);
    // Default any other logged-in user (startup/creator/unknown) to the startup dashboard.
    redirect(`/${locale}/startup`);
  }

  const t = await getTranslations("landing");

  const features = [
    { icon: "📄", title: t("feature_plan"), desc: t("feature_plan_desc") },
    { icon: "🤝", title: t("feature_talent"), desc: t("feature_talent_desc") },
    { icon: "💡", title: t("feature_investor"), desc: t("feature_investor_desc") },
  ];

  const steps = [
    { num: "01", title: t("step1_title"), desc: t("step1_desc") },
    { num: "02", title: t("step2_title"), desc: t("step2_desc") },
    { num: "03", title: t("step3_title"), desc: t("step3_desc") },
    { num: "04", title: t("step4_title"), desc: t("step4_desc") },
  ];

  const pricingStartup = [
    {
      tier: "Free",
      price: "0 €",
      features: [t("price_free_f1"), t("price_free_f2"), t("price_free_f3")],
      highlight: false,
    },
    {
      tier: "Pro",
      price: "49 €",
      features: [t("price_pro_f1"), t("price_pro_f2"), t("price_pro_f3"), t("price_pro_f4"), t("price_pro_f5"), t("price_pro_f6")],
      highlight: true,
    },
    {
      tier: "Scale",
      price: "149 €",
      features: [t("price_scale_f1"), t("price_scale_f2"), t("price_scale_f3"), t("price_scale_f4")],
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-28 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <span className="mb-4 inline-block rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-700">
            Idea · Team · Capital
          </span>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-6xl">
            {t("hero_title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600">
            {t("hero_sub")}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href={`/${locale}/signup`}>{t("cta_startup")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={`/${locale}#features`}>{t("hero_discover")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-zinc-900">{t("features_title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-zinc-500">{t("features_sub")}</p>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 text-4xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-zinc-900">{t("how_title")}</h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col">
                <span className="text-4xl font-black text-indigo-100">{s.num}</span>
                <h3 className="mt-2 font-semibold text-zinc-900">{s.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-indigo-100 bg-indigo-600 py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-2xl font-bold">{t("trust_title")}</h2>
          <p className="mt-4 text-indigo-100">{t("trust_desc")}</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-zinc-900">{t("pricing_title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-zinc-500">{t("pricing_sub")}</p>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {pricingStartup.map((p) => (
              <div
                key={p.tier}
                className={`rounded-2xl border p-8 ${
                  p.highlight
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-xl"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <p className={`text-sm font-semibold uppercase tracking-widest ${p.highlight ? "text-indigo-200" : "text-zinc-400"}`}>
                  {p.tier}
                </p>
                <p className={`mt-2 text-4xl font-black ${p.highlight ? "text-white" : "text-zinc-900"}`}>
                  {p.price}
                  <span className="text-base font-normal">/{t("per_month")}</span>
                </p>
                <ul className="mt-6 space-y-2">
                  {p.features.map((feat) => (
                    <li key={feat} className={`flex items-start gap-2 text-sm ${p.highlight ? "text-indigo-100" : "text-zinc-600"}`}>
                      <span>✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Button className="mt-8 w-full" variant={p.highlight ? "secondary" : "default"} asChild>
                  <Link href={`/${locale}/signup`}>{p.highlight ? t("cta_choose") : t("cta_free")}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-10 text-center text-sm text-zinc-400">
        <p>{t("footer_rights", { year: new Date().getFullYear() })}</p>
        <div className="mt-3 flex justify-center gap-6">
          <Link href={`/${locale}/privacy`} className="hover:text-zinc-600">{t("footer_privacy")}</Link>
          <Link href={`/${locale}/imprint`} className="hover:text-zinc-600">{t("footer_imprint")}</Link>
          <Link href={`/${locale}/terms`} className="hover:text-zinc-600">{t("footer_terms")}</Link>
        </div>
      </footer>
    </div>
  );
}
