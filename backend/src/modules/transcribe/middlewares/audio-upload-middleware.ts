import { env } from "@/config/env";
import multer from "multer";

export const audioUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.TRANSCRIBE_MAX_BYTES,
  },
});
