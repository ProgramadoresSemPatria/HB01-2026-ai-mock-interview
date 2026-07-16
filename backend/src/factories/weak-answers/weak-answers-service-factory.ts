import { WeakAnswerRepository } from "@/modules/interview/repository/weak-answer-repository";
import { WeakAnswersService } from "@/modules/weak-answers/service/weak-answers-service";

export function makeWeakAnswersService(): WeakAnswersService {
  return new WeakAnswersService(new WeakAnswerRepository());
}
