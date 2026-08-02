import { z } from "zod";

export const campaignNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Introdu numele campaniei" })
    .max(100, { message: "Numele campaniei nu poate depăși 100 de caractere" }),
});

export type CampaignNameInput = z.infer<typeof campaignNameSchema>;

export const campaignDraftUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Introdu numele campaniei" })
    .max(100, { message: "Numele campaniei nu poate depăși 100 de caractere" })
    .optional(),
  code_length: z.number().int().min(6).max(14).optional(),
  code_charset: z
    .enum(["letters", "digits", "alphanumeric"], {
      message: "Format cod invalid",
    })
    .optional(),
  code_regex: z.string().optional(),
  single_use_codes: z.boolean().optional(),
  block_invalid_format: z.boolean().optional(),
  limit_per_contact_24h: z.number().int().min(0).optional(),
  starts_at: z.string().date().optional(),
  ends_at: z.string().date().optional(),
  hero_image_url: z.string().url().optional().or(z.literal("")),
  how_to_text: z.string().optional(),
  rules_pdf_path: z.string().optional(),
});

export type CampaignDraftUpdate = z.infer<typeof campaignDraftUpdateSchema>;
