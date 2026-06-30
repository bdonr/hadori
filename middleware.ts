import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_SEGMENTS = ["startup", "talent", "investor", "workspace"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Match /{locale}/{protected}/* — e.g. /de/startup, /en/investor/billing
  const segments = pathname.split("/").filter(Boolean);
  // segments[0] = locale, segments[1] = section
  if (segments.length >= 2 && PROTECTED_SEGMENTS.includes(segments[1])) {
    const session = req.cookies.get("__session")?.value;
    if (!session) {
      const locale = segments[0];
      const loginUrl = new URL(`/${locale}/login`, req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(de|en|fr|ja|ko|ru|zh)/:path*"],
};
