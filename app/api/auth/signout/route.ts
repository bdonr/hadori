import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function signout(req: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete("__session");

  // If called via fetch (XHR), return JSON; if form submit, redirect
  const isXhr = req.headers.get("x-requested-with") === "XMLHttpRequest"
    || req.headers.get("accept")?.includes("application/json");

  if (isXhr) {
    return NextResponse.json({ ok: true });
  }

  const origin = req.headers.get("origin") ?? "https://dadori.com";
  const locale = req.cookies.get("NEXT_LOCALE")?.value ?? "de";
  return NextResponse.redirect(new URL(`/${locale}`, origin));
}

export const POST = signout;
export const GET  = signout;
