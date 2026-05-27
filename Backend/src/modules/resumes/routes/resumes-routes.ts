import { resumeUploadMiddleware } from "@/modules/resumes/middlewares/resume-upload-middleware";
import type { Router } from "express";

import { makeResumesController } from "@/factories/resumes/resumes-controller-factory";

export default function resumesRoutes(router: Router): void {
  const controller = makeResumesController();

  router.post(
    "/",
    resumeUploadMiddleware.single("file"),
    controller.upload,
  );
  router.get("/:id", controller.getById);
}
