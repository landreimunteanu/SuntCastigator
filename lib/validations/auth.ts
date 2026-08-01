import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: "Introdu adresa de email" })
    .email({ message: "Adresă de email invalidă" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
