import { z } from "zod";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d\s.-]{6,}$/;

export const entrySubmissionSchema = z.object({
  campaignId: z.string().uuid({ message: "Campanie invalidă" }),
  code: z
    .string()
    .trim()
    .min(1, { message: "Introdu codul promoțional" })
    .max(64, { message: "Codul este prea lung" }),
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Introdu numele complet" })
    .max(100, { message: "Numele este prea lung" }),
  contact: z
    .string()
    .trim()
    .min(3, { message: "Introdu un email sau un telefon" })
    .max(120, { message: "Contactul este prea lung" })
    .refine(
      (v) => (v.includes("@") ? EMAIL_RE.test(v) : PHONE_RE.test(v)),
      { message: "Introdu un email sau un telefon valid" }
    ),
  gdprConsent: z.literal(true, {
    message: "Trebuie să accepți prelucrarea datelor",
  }),
});

export type EntrySubmissionInput = z.infer<typeof entrySubmissionSchema>;
