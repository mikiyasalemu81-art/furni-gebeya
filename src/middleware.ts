import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Protected paths requiring active session
const PROTECTED_PREFIXES = [
  "/profile",
  "/my-posts",
  "/chat",
  "/onboarding",
];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Run next-intl middleware first for routing/locale handling
  const response = intlMiddleware(req);

  // Check if target is a protected route (stripped of locale)
  // e.g. /en/profile -> /profile
  const pathnameWithoutLocale = pathname.replace(/^\/(en|am|om)/, "") || "/";
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathnameWithoutLocale.startsWith(prefix)
  );

  const sessionCookie = req.cookies.get("furni_user_session")?.value;

  if (isProtected && !sessionCookie) {
    // Determine locale
    const localeMatch = pathname.match(/^\/(en|am|om)/);
    const locale = localeMatch ? localeMatch[1] : "en";
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Match all request paths except for files and static resources
  matcher: ["/", "/(am|en|om)/:path*", "/((?!api|_next|_vercel|icons|.*\\..*).*)"],
};
