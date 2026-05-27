import { createExtractionModel } from "@/infrastructure/ai/openai-models";
import { ResumeProcessor } from "@/infrastructure/queue/resume-processor";
import { createR2ObjectStorage } from "@/infrastructure/storage/r2-client";
import { ResumeRepository } from "@/modules/resumes/repository/resume-repository";

export function makeResumeProcessor(): ResumeProcessor {
  return new ResumeProcessor({
    resumeRepository: new ResumeRepository(),
    objectStorage: createR2ObjectStorage(),
    extractionModel: createExtractionModel(),
  });
}
