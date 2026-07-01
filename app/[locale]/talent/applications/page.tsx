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
  message?: string;
  status: string;
  created_at?: { toDate?: () => Date };
}

function createdMillis(a: Application): number {
  return a.created_at?.toDate ? a.created_at.toDate().getTime() : Date.now();
}

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

function MessageNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 border-l-2 border-zinc-200 pl-2 text-sm italic text-zinc-400">
      &ldquo;{message}&rdquo;
    </p>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("talent_pages.applications");
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

export default function TalentApplicationsPage() {
  const t = useTranslations("talent_pages.applications");
  const params = useParams();
  const locale = (params.locale as string) ?? "en";

  const [mine, setMine] = useState<Application[]>([]);
  const [requests, setRequests] = useState<Application[]>([]);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      try {
        const [mineSnap, reqSnap] = await Promise.all([
          getDocs(query(collection(db, "applications"), where("fromUid", "==", user.uid))),
          getDocs(query(collection(db, "applications"), where("toUid", "==", user.uid))),
        ]);
        const myApps = mineSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Application))
          .filter(a => a.type === "application")
          .sort((a, b) => createdMillis(b) - createdMillis(a));
        const reqs = reqSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Application))
          .filter(a => a.type === "contact_request")
          .sort((a, b) => createdMillis(b) - createdMillis(a));
        setMine(myApps);
        setRequests(reqs);

        // Resolve counterpart names LIVE where the stored name is empty:
        // my applications show the target (toUid); requests show the sender (fromUid).
        const needed = [
          ...myApps.filter(a => !a.toName).map(a => a.toUid),
          ...reqs.filter(a => !a.fromName).map(a => a.fromUid),
        ];
        if (needed.length > 0) setNameMap(await fetchNames(needed));
      } catch { /* ignore */ }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function setStatus(id: string, status: "accepted" | "declined") {
    setRequests(prev => prev.map(a => a.id === id ? { ...a, status } : a));
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
            {/* My applications */}
            <section>
              <h2 className="mb-4 font-bold text-zinc-900">{t("mine_title")}</h2>
              {mine.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-400">{t("mine_empty")}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {mine.map(a => (
                    <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-900">{a.roleTitle || t("a_role")}</p>
                        {(a.toName || nameMap[a.toUid]) && <p className="mt-0.5 text-sm text-zinc-500">{a.toName || nameMap[a.toUid]}</p>}
                        <MessageNote message={a.message} />
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Contact requests received */}
            <section>
              <h2 className="mb-4 font-bold text-zinc-900">{t("requests_title")}</h2>
              {requests.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-400">{t("requests_empty")}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {requests.map(a => (
                    <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <div className="min-w-0 flex-1">
                        {(a.fromName || nameMap[a.fromUid]) ? (
                          <Link href={`/${locale}/user/${a.fromUid}`} className="font-semibold text-zinc-900 hover:text-indigo-600 transition-colors">
                            {a.fromName || nameMap[a.fromUid]}
                          </Link>
                        ) : (
                          <span className="font-semibold text-zinc-900">{t("someone")}</span>
                        )}
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
          </div>
        )}
      </main>
    </div>
  );
}
