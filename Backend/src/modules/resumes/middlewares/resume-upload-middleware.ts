import { env } from "@/config/env";
import multer from "multer";

export const resumeUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.RESUME_MAX_BYTES,
  },
});
