"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, getDoc, query, where, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Navbar } from "@/components/layout/navbar";

interface Application {
  id: string;
  fromUid: string;
  toUid: string;
  type: string;
  fromName?: string;
  toName?: string;
  roleTitle?: string;
  subjectTitle?: string;
  message?: string;
  status: string;
  created_at?: { toDate?: () => Date };
}

function createdMillis(a: Application): number {
  return a.created_at?.toDate ? a.created_at.toDate().getTime() : Date.now();
}

// Batch-fetch publicProfiles for the given uids and return a map of
// uid -> full_name (only for profiles that actually exist and have a name).
async function fetchNames(uids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(uids.filter(Boolean))];
  const map: Record<string, string> = {};
  await Promise.all(
    unique.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, "publicProfiles", uid));
        if (snap.exists()) {
          const name = (snap.data().full_name as string) ?? "";
          if (name) map[uid] = name;
        }
      } catch { /* ignore per-doc */ }
    })
  );
  return map;
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("startup_pages.applicants");
  const color =
    status === "accepted" ? "bg-green-50 text-green-700 border-green-200" :
    status === "declined" ? "bg-zinc-100 text-zinc-500 border-zinc-200" :
                            "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {t(`status_${status}`)}
    </span>
  );
}

// Render a counterpart name. Link to their profile only when the name was
// resolved from a real publicProfiles doc (stored name or live-fetched name);
// otherwise render plain text with the "someone" fallback.
function CounterpartName({
  uid, storedName, resolvedName, href,
}: { uid: string; storedName?: string; resolvedName?: string; href: string }) {
  const t = useTranslations("startup_pages.applicants");
  const name = storedName || resolvedName || "";
  if (!name) return <span className="font-semibold text-zinc-900">{t("someone")}</span>;
  // We can link when we have a resolved profile. `storedName` alone doesn't prove
  // the profile exists, but resolvedName (from a getDoc that existed) does.
  return (
    <Link href={href} className="font-semibold text-zinc-900 hover:text-indigo-600 transition-colors">
      {name}
    </Link>
  );
}

function MessageNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 border-l-2 border-zinc-200 pl-2 text-sm italic text-zinc-400">
      &ldquo;{message}&rdquo;
    </p>
  );
}

export default function StartupApplicantsPage() {
  const t = useTranslations("startup_pages.applicants");
  const params = useParams();
  const locale = (params.locale as string) ?? "en";

  const [received, setReceived] = useState<Application[]>([]);
  const [sent, setSent] = useState<Application[]>([]);
  const [investorInterest, setInvestorInterest] = useState<Application[]>([]);
  const [investorsRequested, setInvestorsRequested] = useState<Application[]>([]);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      try {
        const [recSnap, sentSnap] = await Promise.all([
          getDocs(query(collection(db, "applications"), where("toUid", "==", user.uid))),
          getDocs(query(collection(db, "applications"), where("fromUid", "==", user.uid))),
        ]);
        const rec = recSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Application))
          .filter(a => a.type === "application")
          .sort((a, b) => createdMillis(b) - createdMillis(a));
        const snt = sentSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Application))
          .filter(a => a.type === "contact_request")
          .sort((a, b) => createdMillis(b) - createdMillis(a));
        const recAll = recSnap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
        const sentAll = sentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
        const invInterest = recAll
          .filter(a => a.type === "startup_request")
          .sort((a, b) => createdMillis(b) - createdMillis(a));
        const invRequested = sentAll
          .filter(a => a.type === "investor_request")
          .sort((a, b) => createdMillis(b) - createdMillis(a));
        setReceived(rec);
        setSent(snt);
        setInvestorInterest(invInterest);
        setInvestorsRequested(invRequested);

        // Resolve counterpart names LIVE for rows whose stored name is empty:
        // received/interest use fromUid, sent/requested use toUid.
        const needed = [
          ...rec.filter(a => !a.fromName).map(a => a.fromUid),
          ...invInterest.filter(a => !a.fromName).map(a => a.fromUid),
          ...snt.filter(a => !a.toName).map(a => a.toUid),
          ...invRequested.filter(a => !a.toName).map(a => a.toUid),
        ];
        if (needed.length > 0) setNameMap(await fetchNames(needed));
      } catch { /* ignore */ }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function setStatus(id: string, status: "accepted" | "declined") {
    setReceived(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setInvestorInterest(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    try {
      await updateDoc(doc(db, "applications", id), { status, updated_at: serverTimestamp() });
    } catch { /* keep optimistic */ }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-extrabold text-zinc-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>

        {loading ? (
          <div className="py-20 text-center text-zinc-400"><p className="text-sm">{t("loading")}</p></div>
        ) : (
          <div className="mt-8 flex flex-col gap-10">
            {/* Received applications */}
            <section>
              <h2 className="mb-4 font-bold text-zinc-900">{t("received_title")}</h2>
              {received.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-400">{t("received_empty")}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {received.map(a => (
                    <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <div className="min-w-0 flex-1">
                        <CounterpartName uid={a.fromUid} storedName={a.fromName} resolvedName={nameMap[a.fromUid]} href={`/${locale}/user/${a.fromUid}`} />
                        {a.roleTitle && <p className="mt-0.5 text-sm text-zinc-500">{a.roleTitle}</p>}
                        <MessageNote message={a.message} />
                      </div>
                      <StatusBadge status={a.status} />
                      {a.status === "pending" && (
                        <div className="flex gap-2">
                          <button onClick={() => setStatus(a.id, "accepted")}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">
                            {t("accept")}
                          </button>
                          <button onClick={() => setStatus(a.id, "declined")}
                            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:border-zinc-300 transition-colors">
                            {t("decline")}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Sent contact requests */}
            <section>
              <h2 className="mb-4 font-bold text-zinc-900">{t("sent_title")}</h2>
              {sent.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-400">{t("sent_empty")}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {sent.map(a => (
                    <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <div className="min-w-0 flex-1">
                        <CounterpartName uid={a.toUid} storedName={a.toName} resolvedName={nameMap[a.toUid]} href={`/${locale}/user/${a.toUid}`} />
                        <MessageNote message={a.message} />
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Investor interest (investors who requested me) */}
            <section>
              <h2 className="mb-4 font-bold text-zinc-900">{t("investor_interest_title")}</h2>
              {investorInterest.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-400">{t("investor_interest_empty")}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {investorInterest.map(a => (
                    <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <div className="min-w-0 flex-1">
                        <CounterpartName uid={a.fromUid} storedName={a.fromName} resolvedName={nameMap[a.fromUid]} href={`/${locale}/investor/${a.fromUid}`} />
                        {a.subjectTitle && <p className="mt-0.5 text-sm text-zinc-500">{a.subjectTitle}</p>}
                        <MessageNote message={a.message} />
                      </div>
                      <StatusBadge status={a.status} />
                      {a.status === "pending" && (
                        <div className="flex gap-2">
                          <button onClick={() => setStatus(a.id, "accepted")}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">
                            {t("accept")}
                          </button>
                          <button onClick={() => setStatus(a.id, "declined")}
                            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:border-zinc-300 transition-colors">
                            {t("decline")}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Investors requested (investors I requested) */}
            <section>
              <h2 className="mb-4 font-bold text-zinc-900">{t("investors_requested_title")}</h2>
              {investorsRequested.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-400">{t("investors_requested_empty")}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {investorsRequested.map(a => (
                    <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <div className="min-w-0 flex-1">
                        <CounterpartName uid={a.toUid} storedName={a.toName} resolvedName={nameMap[a.toUid]} href={`/${locale}/investor/${a.toUid}`} />
                        {a.subjectTitle && <p className="mt-0.5 text-sm text-zinc-500">{a.subjectTitle}</p>}
                        <MessageNote message={a.message} />
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
