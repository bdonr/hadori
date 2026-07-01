"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Navbar } from "@/components/layout/navbar";

interface Application {
  id: string;
  fromUid: string;
  toUid: string;
  type: string;
  fromName?: string;
  toName?: string;
  subjectTitle?: string;
  status: string;
  created_at?: { toDate?: () => Date };
}

function createdMillis(a: Application): number {
  return a.created_at?.toDate ? a.created_at.toDate().getTime() : Date.now();
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("investor_pages.requests");
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

export default function InvestorRequestsPage() {
  const t = useTranslations("investor_pages.requests");
  const params = useParams();
  const locale = (params.locale as string) ?? "en";

  const [received, setReceived] = useState<Application[]>([]);
  const [sent, setSent] = useState<Application[]>([]);
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
          .filter(a => a.type === "investor_request")
          .sort((a, b) => createdMillis(b) - createdMillis(a));
        const snt = sentSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Application))
          .filter(a => a.type === "startup_request")
          .sort((a, b) => createdMillis(b) - createdMillis(a));
        setReceived(rec);
        setSent(snt);
      } catch { /* ignore */ }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function setStatus(id: string, status: "accepted" | "declined") {
    setReceived(prev => prev.map(a => a.id === id ? { ...a, status } : a));
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
            {/* Startup interest (startups/projects that requested me) */}
            <section>
              <h2 className="mb-4 font-bold text-zinc-900">{t("received_title")}</h2>
              {received.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-400">{t("received_empty")}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {received.map(a => (
                    <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <div className="min-w-0 flex-1">
                        <Link href={`/${locale}/company/${a.fromUid}`} className="font-semibold text-zinc-900 hover:text-indigo-600 transition-colors">
                          {a.fromName || t("someone")}
                        </Link>
                        {a.subjectTitle && <p className="mt-0.5 text-sm text-zinc-500">{a.subjectTitle}</p>}
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

            {/* Sent requests (startups/projects I requested) */}
            <section>
              <h2 className="mb-4 font-bold text-zinc-900">{t("sent_title")}</h2>
              {sent.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-400">{t("sent_empty")}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {sent.map(a => (
                    <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <span className="min-w-0 flex-1 font-semibold text-zinc-900">
                        {a.subjectTitle || a.toName || t("someone")}
                      </span>
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
