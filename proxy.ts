import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Runs before every matched request — refreshes the Supabase auth session
// and redirects unauthenticated visitors away from /dashboard.
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
