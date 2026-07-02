"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { INVESTOR_FOCUS } from "@/lib/funding";
import { REGIONS } from "@/lib/regions";
import { Navbar } from "@/components/layout/navbar";
import { useTranslations } from "next-intl";
import { useTaxonomy } from "@/lib/taxonomy";
import { isStartupPaid, isStartupProPlus } from "@/lib/entitlements";

interface Match {
  uid: string; name: string; firm: string; role: string; region: string;
  focus: string[]; stages: string[]; checkSize: string; score: number; reasons: string[];
}

export default function DiscoverInvestorsPage() {
  const t = useTranslations("startup_pages.discover");
  const tax = useTaxonomy();
  const { locale } = useParams<{ locale: string }>();
  const [focusFilter, setFocusFilter] = useState<string[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [myTier, setMyTier] = useState<string | null>(null);
  const [myCaps, setMyCaps] = useState<string[] | undefined>(undefined);
  const [myName, setMyName] = useState("");
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  const [introsThisMonth, setIntrosThisMonth] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setMyUid(user.uid);
        try {
          const snap = await getDoc(doc(db, "profiles", user.uid));
          const tier = snap.data()?.plan_tier as string | undefined;
          const capabilities = snap.data()?.capabilities as string[] | undefined;
          setMyTier(tier ?? null);
          setMyCaps(capabilities);
          if (!isStartupPaid({ plan_tier: tier, capabilities })) setLocked(true);
        } catch {
          // ignore — API is the authoritative gate
        }
        try {
          const myPubSnap = await getDoc(doc(db, "publicProfiles", user.uid));
          if (myPubSnap.exists()) setMyName((myPubSnap.data().full_name as string) ?? "");
          const reqSnap = await getDocs(
            query(collection(db, "applications"), where("fromUid", "==", user.uid))
          );
          const myReqs = reqSnap.docs
            .map(d => d.data() as Record<string, unknown>)
            .filter(d => d.type === "investor_request");
          setRequestedIds(myReqs.map(d => d.toUid as string));
          const now = new Date();
          setIntrosThisMonth(myReqs.filter(d => {
            const ts = d.created_at as { toDate?: () => Date } | null | undefined;
            if (!ts?.toDate) return true;
            const created = ts.toDate();
            return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
          }).length);
        } catch { /* ignore */ }
      }
      fetch("/api/startup/matches")
        .then((r) => r.json())
        .then((d) => {
          if (d.locked) setLocked(true);
          setMatches(Array.isArray(d.matches) ? d.matches : []);
        })
        .catch(() => setMatches([]))
        .finally(() => setLoading(false));
    });
    return () => unsub();
  }, []);

  function toggleFocus(id: string) {
    setFocusFilter((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  const introCap = isStartupProPlus({ plan_tier: myTier, capabilities: myCaps }) ? Infinity : 20;
  const atIntroLimit = introsThisMonth >= introCap;

  async function requestIntro(m: Match) {
    if (!myUid || requestedIds.includes(m.uid) || atIntroLimit) return;
    const message = (typeof window !== "undefined" ? window.prompt(t("message_prompt")) : "") ?? "";
    setRequestedIds((prev) => [...prev, m.uid]);
    setIntrosThisMonth((prev) => prev + 1);
    try {
      await addDoc(collection(db, "applications"), {
        fromUid: myUid,
        toUid: m.uid,
        type: "investor_request",
        fromName: myName,
        toName: m.name,
        subjectTitle: m.firm || "",
        message: message.trim(),
        status: "pending",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    } catch { /* keep optimistic state */ }
  }

  const filtered = focusFilter.length
    ? matches.filter((m) => m.focus.some((f) => focusFilter.includes(f)))
    : matches;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        {locked ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center">
            <span className="text-4xl">🔒</span>
            <h2 className="mt-4 text-xl font-bold text-zinc-900">{t("gate_title")}</h2>
            <p className="mt-2 text-sm text-zinc-500">{t("gate_desc")}</p>
            <Link href={`/${locale}/startup/billing`} className="mt-4 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
              {t("upgrade_cta")}
            </Link>
          </div>
        ) : (
        <>
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-amber-900">{t("intro_title")}</p>
            <p className="text-sm text-amber-700">{t("intro_desc")}</p>
          </div>
        </div>

        {/* Focus filter */}
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">{t("focus")}</p>
          <div className="flex flex-wrap gap-1.5">
            {INVESTOR_FOCUS.map((f) => (
              <button key={f.id} onClick={() => toggleFocus(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  focusFilter.includes(f.id) ? "bg-indigo-600 text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300"
                }`}>
                {tax.focus(f.id)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center">
            <span className="text-5xl">🔭</span>
            <p className="mt-4 text-lg font-semibold text-zinc-700">{t("empty_title")}</p>
            <p className="mt-2 text-sm text-zinc-400">{t("empty_desc")}</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm font-semibold text-zinc-500">{t("matches_count", { n: filtered.length })}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((m) => {
                const region = REGIONS.find((r) => r.id === m.region);
                return (
                  <div key={m.uid} className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-zinc-900">{m.name}</p>
                        {m.firm && <p className="text-sm text-zinc-500">{m.firm}</p>}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${m.score >= 70 ? "bg-emerald-100 text-emerald-700" : m.score >= 45 ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-500"}`}>
                          {t("match_score", { n: m.score })}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.reasons.includes("stage") && <Tag>✓ {t("reason_stage")}</Tag>}
                      {m.reasons.includes("region") && <Tag>✓ {t("reason_region")}</Tag>}
                      {m.reasons.includes("focus") && <Tag>✓ {t("reason_focus")}</Tag>}
                    </div>

                    {m.focus.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {m.focus.slice(0, 4).map((f) => (
                          <span key={f} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">{tax.focus(f)}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                      {region && <span>{region.flag} {tax.region(region.id)}</span>}
                      {m.checkSize && <span>{t("check_label")}: {m.checkSize}</span>}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link href={`/${locale}/investor/${m.uid}`}
                        className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700">
                        {t("view_profile")}
                      </Link>
                      {requestedIds.includes(m.uid) ? (
                        <span className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm font-semibold text-green-700">{t("intro_requested")}</span>
                      ) : (
                        <button onClick={() => requestIntro(m)} disabled={atIntroLimit}
                          className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {t("request_intro")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        </>
        )}
      </main>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{children}</span>;
}
