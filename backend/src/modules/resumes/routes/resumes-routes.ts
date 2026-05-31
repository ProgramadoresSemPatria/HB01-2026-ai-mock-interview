import { resumeUploadMiddleware } from "@/modules/resumes/middlewares/resume-upload-middleware";
import { asyncHandler } from "@/shared";
import type { Router } from "express";

import { makeResumesController } from "@/factories/resumes/resumes-controller-factory";

export default function resumesRoutes(router: Router): void {
  const controller = makeResumesController();

  router.post(
    "/",
    resumeUploadMiddleware.single("file"),
    asyncHandler(controller.upload),
  );
  router.get("/", asyncHandler(controller.list));
  router.get("/:id", asyncHandler(controller.getById));
  router.delete("/:id", asyncHandler(controller.delete));
}
