import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Only the dashboard needs an auth gate + refreshed session cookies here.
    // Marketing, /c/[slug], /api/*, /login and /auth/callback either need no
    // auth or already check it server-side, so they skip this Supabase
    // round-trip entirely — keeps a slow/unreachable auth service from
    // blocking pages that don't depend on it.
    "/dashboard/:path*",
  ],
};
