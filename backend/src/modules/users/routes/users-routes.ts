import { updateInterviewLocaleSchema } from "@/modules/users/validations/users-schemas";
import { asyncHandler, validate } from "@/shared";
import type { Router } from "express";

import { makeUsersController } from "@/factories/users/users-controller-factory";

export default function usersRoutes(router: Router): void {
  const controller = makeUsersController();

  router.patch(
    "/me/interview-locale",
    validate(updateInterviewLocaleSchema),
    asyncHandler(controller.updateInterviewLocale),
  );
}
