import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Vercel's Edge middleware has its own invocation timeout, well under
// Supabase's default connect/response timeouts — left unbounded, a slow or
// unreachable auth service turns into a platform-wide 504 instead of a
// contained failure. Bounding the call lets us fail open on our own terms:
// the (dashboard) layout and every dashboard server action re-check
// getUser() anyway, so a timed-out check here just means the redirect
// happens a layer later instead of not happening at all.
const AUTH_CHECK_TIMEOUT_MS = 3000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
  return Promise.race([promise, timeout]);
}

// Runs only on /dashboard/:path* (see middleware.ts matcher). Refreshes the
// Supabase session cookies (so tokens don't silently expire during a user's
// dashboard session) and gates the route: unauthenticated visits are
// 307-redirected to /login with ?next= set so they land back where they
// intended.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const result = await withTimeout(supabase.auth.getUser(), AUTH_CHECK_TIMEOUT_MS);

  // Timed out or errored: fail open here and let the dashboard layout's own
  // getUser() call (no timeout, same request) be the source of truth.
  if (result === null) {
    return response;
  }

  const {
    data: { user },
  } = result;

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
