import { describe, expect, it } from "vitest";

import { structuredSummarySchema } from "./resume-schemas";

const validSummary = {
  personal_info: {
    name: "Jane Doe",
    title: "Senior Backend Engineer",
    about: "Backend engineer focused on APIs and data systems.",
  },
  skills: ["TypeScript", "PostgreSQL", "LangGraph"],
  experiences: [
    {
      company: "Acme Corp",
      role: "Software Engineer",
      highlights: ["Led API redesign", "Reduced latency by 40%"],
    },
  ],
  projects: [
    {
      name: "Open-source CLI tool",
      description: "Developer productivity CLI",
      technologies: ["Node.js"],
      highlights: ["500+ GitHub stars"],
    },
    { name: "Internal observability dashboard" },
  ],
  certifications: ["AWS Solutions Architect"],
};

describe("structuredSummarySchema", () => {
  it("accepts a payload matching the spec shape", () => {
    const result = structuredSummarySchema.safeParse(validSummary);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validSummary);
    }
  });

  it("accepts minimal payload without optional fields", () => {
    const result = structuredSummarySchema.safeParse({
      personal_info: {
        name: "Jane Doe",
        title: "Senior Backend Engineer",
      },
      skills: [],
      experiences: [],
      projects: [],
    });

    expect(result.success).toBe(true);
  });

  it("accepts empty skills, experiences, and projects arrays", () => {
    const result = structuredSummarySchema.safeParse({
      ...validSummary,
      skills: [],
      experiences: [],
      projects: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing personal_info", () => {
    const { personal_info: _personalInfo, ...withoutPersonalInfo } =
      validSummary;

    const result = structuredSummarySchema.safeParse(withoutPersonalInfo);

    expect(result.success).toBe(false);
  });

  it("rejects empty personal_info.name", () => {
    const result = structuredSummarySchema.safeParse({
      ...validSummary,
      personal_info: { ...validSummary.personal_info, name: "   " },
    });

    expect(result.success).toBe(false);
  });

  it("rejects experience missing highlights array", () => {
    const result = structuredSummarySchema.safeParse({
      ...validSummary,
      experiences: [
        {
          company: "Acme Corp",
          role: "Software Engineer",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects project missing name", () => {
    const result = structuredSummarySchema.safeParse({
      ...validSummary,
      projects: [{ description: "Missing name" }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-string skill entries", () => {
    const result = structuredSummarySchema.safeParse({
      ...validSummary,
      skills: ["TypeScript", 42],
    });

    expect(result.success).toBe(false);
  });

  it("strips unknown top-level fields", () => {
    const result = structuredSummarySchema.safeParse({
      ...validSummary,
      education: [{ institution: "MIT" }],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("education");
    }
  });
});
