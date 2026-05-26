import { z } from "zod";

export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ message: "Invalid email" })),
});

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;
