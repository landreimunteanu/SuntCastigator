import { z } from "zod";

// z.string().url() accepts any scheme, including javascript:/data:/vbscript:.
// hero_image_url is rendered as an <Image src> on the public consumer page,
// so it must be restricted to http(s) — one refactor (a link, a CSS
// background) away from turning an unrestricted scheme into stored XSS,
// and an arbitrary host still leaks every visitor's IP/UA on page load.
const httpUrlSchema = z.string().url().refine(
  (v) => v.startsWith("https://") || v.startsWith("http://"),
  { message: "URL-ul trebuie să înceapă cu http:// sau https://" }
);

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
  hero_image_url: httpUrlSchema.optional().or(z.literal("")),
  how_to_text: z.string().max(2000, {
    message: "Textul \"cum participi\" nu poate depăși 2000 de caractere",
  }).optional(),
  rules_pdf_path: z.string().optional(),
});

export type CampaignDraftUpdate = z.infer<typeof campaignDraftUpdateSchema>;
