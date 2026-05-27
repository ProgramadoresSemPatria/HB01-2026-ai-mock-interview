import { z } from "zod";

const nonEmptyString = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

const personalInfoSchema = z.object({
  name: nonEmptyString("Name"),
  title: nonEmptyString("Title"),
  about: nonEmptyString("About").optional(),
});

const experienceSchema = z.object({
  company: nonEmptyString("Company"),
  role: nonEmptyString("Role"),
  highlights: z.array(nonEmptyString("Highlight")),
});

const projectSchema = z.object({
  name: nonEmptyString("Project name"),
  description: nonEmptyString("Project description").optional(),
  technologies: z.array(nonEmptyString("Technology")).optional(),
  highlights: z.array(nonEmptyString("Highlight")).optional(),
});

export const structuredSummarySchema = z.object({
  personal_info: personalInfoSchema,
  skills: z.array(nonEmptyString("Skill")),
  experiences: z.array(experienceSchema),
  projects: z.array(projectSchema),
  certifications: z.array(nonEmptyString("Certification")).optional(),
});

export type StructuredSummary = z.infer<typeof structuredSummarySchema>;
