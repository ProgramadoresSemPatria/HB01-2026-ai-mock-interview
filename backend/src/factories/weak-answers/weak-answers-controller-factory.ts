import { WeakAnswersController } from "@/modules/weak-answers/controller/weak-answers-controller";

import { makeWeakAnswersService } from "./weak-answers-service-factory";

export function makeWeakAnswersController(): WeakAnswersController {
  return new WeakAnswersController(makeWeakAnswersService());
}
