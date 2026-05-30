import { describe, expect, it } from "vitest";

import { structuredSummarySchema } from "./resume-schemas";

const validStructuredSummary = {
  personal_info: {
    name: "Jane Doe",
    title: "Software Engineer",
    about: "Experienced full-stack developer.",
  },
  skills: ["TypeScript", "Node.js"],
  experiences: [
    {
      company: "Acme Corp",
      role: "Senior Developer",
      highlights: ["Led API redesign", "Mentored juniors"],
    },
  ],
  projects: [
    {
      name: "Portfolio",
      description: "Personal portfolio site",
      technologies: ["React", "Next.js"],
      highlights: ["Deployed on Vercel"],
    },
  ],
  certifications: ["AWS Certified Developer"],
};

describe("structuredSummarySchema", () => {
  it("accepts a valid structured summary", () => {
    const result = structuredSummarySchema.safeParse(validStructuredSummary);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validStructuredSummary);
    }
  });

  it("accepts empty arrays for list fields", () => {
    const result = structuredSummarySchema.safeParse({
      ...validStructuredSummary,
      skills: [],
      experiences: [],
      projects: [],
      certifications: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty personal_info name", () => {
    const result = structuredSummarySchema.safeParse({
      ...validStructuredSummary,
      personal_info: {
        ...validStructuredSummary.personal_info,
        name: "   ",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty personal_info title", () => {
    const result = structuredSummarySchema.safeParse({
      ...validStructuredSummary,
      personal_info: {
        ...validStructuredSummary.personal_info,
        title: "",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects skill entry that is only whitespace", () => {
    const result = structuredSummarySchema.safeParse({
      ...validStructuredSummary,
      skills: ["TypeScript", "  "],
    });

    expect(result.success).toBe(false);
  });

  it("rejects experience with empty company", () => {
    const result = structuredSummarySchema.safeParse({
      ...validStructuredSummary,
      experiences: [
        {
          company: "",
          role: "Developer",
          highlights: ["Built APIs"],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects experience highlight that is only whitespace", () => {
    const result = structuredSummarySchema.safeParse({
      ...validStructuredSummary,
      experiences: [
        {
          company: "Acme Corp",
          role: "Developer",
          highlights: ["  "],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects project with empty name", () => {
    const result = structuredSummarySchema.safeParse({
      ...validStructuredSummary,
      projects: [
        {
          name: "  ",
          description: "A project",
          technologies: ["React"],
          highlights: ["Shipped v1"],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects project technology that is only whitespace", () => {
    const result = structuredSummarySchema.safeParse({
      ...validStructuredSummary,
      projects: [
        {
          name: "Portfolio",
          description: "A project",
          technologies: [""],
          highlights: ["Shipped v1"],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects certification that is only whitespace", () => {
    const result = structuredSummarySchema.safeParse({
      ...validStructuredSummary,
      certifications: ["  "],
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing personal_info", () => {
    const { personal_info: _personalInfo, ...withoutPersonalInfo } =
      validStructuredSummary;
    const result = structuredSummarySchema.safeParse(withoutPersonalInfo);

    expect(result.success).toBe(false);
  });
});
