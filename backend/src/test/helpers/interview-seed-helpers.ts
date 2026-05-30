import { randomUUID } from "node:crypto";

import prisma from "@/infrastructure/database";
import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";
import { ResumeStatus } from "../../../prisma/generated/client";

export const sampleStructuredSummary: StructuredSummary = {
  personal_info: {
    name: "Jane Doe",
    title: "Software Engineer",
    about: "Backend developer",
  },
  skills: ["TypeScript", "Node.js"],
  experiences: [
    {
      company: "Acme Corp",
      role: "Developer",
      highlights: ["Built REST APIs"],
    },
  ],
  projects: [
    {
      name: "Portfolio",
      description: "Personal site",
      technologies: ["TypeScript"],
      highlights: ["Deployed to production"],
    },
  ],
  certifications: [],
};

function resumeSeedBase(userId: number, resumeId: string) {
  return {
    id: resumeId,
    userId,
    name: "resume.pdf",
    pdfUrl: `users/${userId}/resumes/${resumeId}.pdf`,
    storageKey: `users/${userId}/resumes/${resumeId}.pdf`,
  };
}

export async function seedReadyResume(userId: number, resumeId = randomUUID()) {
  return prisma.resume.create({
    data: {
      ...resumeSeedBase(userId, resumeId),
      status: ResumeStatus.ready,
      structuredSummary: sampleStructuredSummary,
    },
  });
}

export async function seedProcessingResume(
  userId: number,
  resumeId = randomUUID(),
) {
  return prisma.resume.create({
    data: {
      ...resumeSeedBase(userId, resumeId),
      status: ResumeStatus.processing,
    },
  });
}

export async function seedFailedResume(
  userId: number,
  resumeId = randomUUID(),
  errorMessage = "PDF extraction failed",
) {
  return prisma.resume.create({
    data: {
      ...resumeSeedBase(userId, resumeId),
      status: ResumeStatus.failed,
      errorMessage,
    },
  });
}
