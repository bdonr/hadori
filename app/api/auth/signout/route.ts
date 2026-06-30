import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("__session");
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("__session");
  return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL ?? "https://dadori.com"));
}
