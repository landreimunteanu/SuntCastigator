import { createServiceClient } from "@/lib/supabase/service";

export type SubmitInput = {
  campaignId: string;
  code: string;
  fullName: string;
  contact: string;
  gdprConsent: true;
  ip: string | null;
};

export type SubmitResult =
  | { kind: "valid"; entryId: string }
  | { kind: "duplicate" }
  | { kind: "invalid_format" }
  | { kind: "rate_limited"; reason: "ip" | "contact" }
  | { kind: "campaign_ended" }
  | { kind: "campaign_not_started" }
  | { kind: "campaign_not_active" }
  | { kind: "campaign_not_found" }
  | { kind: "error" };

// Maps the plpgsql RAISE messages from submit_entry() to typed results.
// The route handler translates each kind to an HTTP status; keeping the
// mapping here means the API surface never sees raw pg error strings.
function mapRaiseMessage(message: string): SubmitResult {
  switch (message) {
    case "rate_limit_ip":
      return { kind: "rate_limited", reason: "ip" };
    case "rate_limit_contact":
      return { kind: "rate_limited", reason: "contact" };
    case "campaign_ended":
      return { kind: "campaign_ended" };
    case "campaign_not_started":
      return { kind: "campaign_not_started" };
    case "campaign_not_active":
      return { kind: "campaign_not_active" };
    case "campaign_not_found":
      return { kind: "campaign_not_found" };
    default:
      return { kind: "error" };
  }
}

export async function submitEntry(input: SubmitInput): Promise<SubmitResult> {
  const service = createServiceClient();

  const nowIso = new Date().toISOString();

  const { data, error } = await service.rpc("submit_entry", {
    p_campaign_id: input.campaignId,
    p_code: input.code,
    p_full_name: input.fullName,
    p_contact: input.contact,
    p_ip: input.ip,
    p_gdpr_consent_at: nowIso,
  });

  if (error) {
    // supabase-js surfaces PostgREST errors with `.message`; for RPC RAISEs the
    // message is the plpgsql string ('rate_limit_ip', 'campaign_ended', ...).
    return mapRaiseMessage(error.message);
  }

  // RPC returns SETOF (entry_id uuid, entry_status text) — take the first row.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { kind: "error" };

  const status = (row as { entry_status?: string }).entry_status;
  const entryId = (row as { entry_id?: string }).entry_id;

  switch (status) {
    case "valid":
      return { kind: "valid", entryId: entryId ?? "" };
    case "duplicate":
      return { kind: "duplicate" };
    case "invalid":
      return { kind: "invalid_format" };
    default:
      return { kind: "error" };
  }
}
