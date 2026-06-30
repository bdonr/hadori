import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { canAccessDataRoom } from "@/lib/firebase/workspace";
import Link from "next/link";

export default async function DataRoomPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const profileSnap = await adminDb!.collection("profiles").doc(session.uid).get();
  const tier = profileSnap.data()?.plan_tier ?? "free";

  if (!canAccessDataRoom(tier)) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center">
        <span className="text-5xl">🔒</span>
        <h2 className="mt-4 text-xl font-bold text-zinc-900">Data Room</h2>
        <p className="mt-2 text-zinc-500 max-w-sm">
          Share financials, pitch decks, and cap tables with investors — securely. Available on Pro and Scale.
        </p>
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 max-w-sm text-sm text-indigo-700">
          <p className="font-semibold">What's included:</p>
          <ul className="mt-2 space-y-1 text-left list-disc list-inside">
            <li>Upload documents (PDF, slides, spreadsheets)</li>
            <li>Control which investors see what</li>
            <li>See who viewed what and for how long</li>
            <li>Optional NDA before access</li>
          </ul>
        </div>
        <Link
          href={`/${locale}/startup/billing`}
          className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Upgrade to Pro →
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold text-zinc-900 mb-2">🔒 Data Room</h1>
      <p className="text-sm text-zinc-500 mb-6">Share documents with investors. They can only see what you allow.</p>

      {/* Coming soon — ready for Phase X */}
      <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
        <span className="text-4xl">📂</span>
        <p className="mt-4 font-semibold text-zinc-700">No documents yet</p>
        <p className="mt-2 text-sm text-zinc-400">Upload your pitch deck, financials, or any document to share with investors.</p>
        <button
          disabled
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
        >
          Upload document (coming soon)
        </button>
      </div>
    </div>
  );
}
