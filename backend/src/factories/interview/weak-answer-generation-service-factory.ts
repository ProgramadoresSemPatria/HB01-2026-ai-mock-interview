import { makeTokenUsageService } from "@/factories/token-usage/token-usage-service-factory";
import { createWeakAnswersGeneratorNode } from "@/infrastructure/ai/langgraph/nodes/weak-answers-generator-node";
import { WeakAnswersGeneratorAdapter } from "@/infrastructure/ai/langgraph/weak-answers-generator-adapter";
import { MessageRepository } from "@/modules/interview/repository/message-repository";
import { SessionRepository } from "@/modules/interview/repository/session-repository";
import { WeakAnswerRepository } from "@/modules/interview/repository/weak-answer-repository";
import { WeakAnswerGenerationService } from "@/modules/interview/service/weak-answer-generation-service";
import { WeakAnswerService } from "@/modules/interview/service/weak-answer-service";
import { ResumeRepository } from "@/modules/resumes/repository/resume-repository";

export function makeWeakAnswerGenerationService(): WeakAnswerGenerationService {
  return new WeakAnswerGenerationService(
    new SessionRepository(),
    new MessageRepository(),
    new ResumeRepository(),
    new WeakAnswersGeneratorAdapter(createWeakAnswersGeneratorNode()),
    new WeakAnswerService(new WeakAnswerRepository()),
    makeTokenUsageService(),
  );
}
