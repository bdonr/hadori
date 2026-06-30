import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_SEGMENTS = ["startup", "talent", "investor", "workspace"];

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
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
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // Match all paths except api routes, _next, and static files
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
