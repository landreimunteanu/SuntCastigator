"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The product's whole pitch is a "live dashboard" during an active
// campaign, but every dashboard page is force-dynamic with no client-side
// refresh — a brand manager watching entries roll in has to manually
// reload. This re-fetches the current route's server data on an interval
// via router.refresh(), which re-runs the page's data fetching without a
// full page reload or losing scroll position. Only mount this on pages for
// an active campaign — a draft/ended campaign's numbers don't change.
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
