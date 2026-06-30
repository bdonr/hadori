import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import Link from "next/link";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const session = await getServerSession();

  if (!session) {
    redirect(`/${locale}/login?redirect=/invite/${token}`);
  }

  // Look up the invite
  const invitesSnap = await adminDb!
    .collectionGroup("invites")
    .where("token", "==", token)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (invitesSnap.empty) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <span className="text-5xl">😕</span>
        <h1 className="mt-4 text-xl font-bold text-zinc-900">Invalid or expired invite</h1>
        <p className="mt-2 text-sm text-zinc-500">This invite link is no longer valid.</p>
        <Link href={`/${locale}`} className="mt-6 text-sm text-indigo-600 hover:underline">
          Go to homepage
        </Link>
      </div>
    );
  }

  const inviteDoc = invitesSnap.docs[0];
  const invite = inviteDoc.data();

  // Check expiry
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <span className="text-5xl">⏰</span>
        <h1 className="mt-4 text-xl font-bold text-zinc-900">Invite expired</h1>
        <p className="mt-2 text-sm text-zinc-500">Ask the workspace owner to send a new invite.</p>
        <Link href={`/${locale}`} className="mt-6 text-sm text-indigo-600 hover:underline">
          Go to homepage
        </Link>
      </div>
    );
  }

  const workspaceId = inviteDoc.ref.parent.parent!.id;

  // Auto-accept
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "https://dadori.com"}/api/workspace/${workspaceId}/invite/accept`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `__session=${session.uid}` },
      body: JSON.stringify({ token }),
    }
  );

  if (res.ok) {
    redirect(`/${locale}/workspace/${workspaceId}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <span className="text-5xl">⚠️</span>
      <h1 className="mt-4 text-xl font-bold text-zinc-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-zinc-500">Could not accept the invite. Please try again.</p>
      <Link href={`/${locale}`} className="mt-6 text-sm text-indigo-600 hover:underline">
        Go to homepage
      </Link>
    </div>
  );
}
