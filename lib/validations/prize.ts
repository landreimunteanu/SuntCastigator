import { z } from "zod";

export const prizeTierSchema = z.object({
  name: z.string().trim().min(1, { message: "Introdu numele premiului" }),
  quantity: z.number().int().positive().nullable(),
  value_lei: z.number().nonnegative({ message: "Valoarea trebuie să fie pozitivă" }),
  kind: z.enum(["instant", "draw"], { message: "Alege tipul premiului" }),
});

export type PrizeTierInput = z.infer<typeof prizeTierSchema>;
