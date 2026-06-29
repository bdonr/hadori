import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all paths except api routes, _next, and static files
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
