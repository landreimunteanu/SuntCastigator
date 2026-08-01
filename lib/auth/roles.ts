import { getCurrentBrand, type BrandContext, type BrandRole } from "@/lib/supabase/get-brand";

// Role hierarchy: owner ⊃ editor. Kept as a pure function so it can be
// unit-tested without a Supabase client and reused wherever a role check
// is needed (server actions, route handlers, page-level guards).
export function hasRole(actual: BrandRole, required: BrandRole): boolean {
  if (required === "editor") return actual === "editor" || actual === "owner";
  return actual === "owner";
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

// Server-side guard for owner/editor-gated actions. Throws instead of
// returning a status because the callers (server actions, route handlers)
// choose how to surface the error — a route handler translates to a 403,
// a server action bubbles up to the client's error boundary.
export async function requireRole(required: BrandRole): Promise<BrandContext> {
  const context = await getCurrentBrand();
  if (!context) throw new UnauthorizedError("No authenticated brand context");
  if (!hasRole(context.role, required)) throw new ForbiddenError();
  return context;
}
