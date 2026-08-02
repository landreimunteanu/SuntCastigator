import { z } from "zod";

export const productRowSchema = z.object({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

export type ProductRow = z.infer<typeof productRowSchema>;
