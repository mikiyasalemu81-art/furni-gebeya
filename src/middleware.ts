import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames and skip internal next/public files
  matcher: ["/", "/(am|en|om)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
