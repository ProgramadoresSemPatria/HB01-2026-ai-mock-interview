import { z } from "zod";

export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
