import { interviewLocaleSchema } from "@/shared";
import { z } from "zod";

export const updateInterviewLocaleSchema = z.object({
  interviewLocale: interviewLocaleSchema,
});

export type UpdateInterviewLocaleInput = z.infer<
  typeof updateInterviewLocaleSchema
>;
