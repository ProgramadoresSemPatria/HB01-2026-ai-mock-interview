import { z } from "zod";

const nonEmptyString = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

const personalInfoSchema = z.object({
  name: nonEmptyString("Name"),
  title: nonEmptyString("Title"),
  about: z.string(),
});

const experienceSchema = z.object({
  company: nonEmptyString("Company"),
  role: nonEmptyString("Role"),
  highlights: z.array(nonEmptyString("Highlight")),
});

const projectSchema = z.object({
  name: nonEmptyString("Project name"),
  description: z.string(),
  technologies: z.array(nonEmptyString("Technology")),
  highlights: z.array(nonEmptyString("Highlight")),
});

export const structuredSummarySchema = z.object({
  personal_info: personalInfoSchema,
  skills: z.array(nonEmptyString("Skill")),
  experiences: z.array(experienceSchema),
  projects: z.array(projectSchema),
  certifications: z.array(nonEmptyString("Certification")),
});

export type StructuredSummary = z.infer<typeof structuredSummarySchema>;
