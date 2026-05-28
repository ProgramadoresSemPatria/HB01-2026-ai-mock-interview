import type { ErrorRequestHandler } from "express";
import multer from "multer";

import { BadRequestError, HttpError } from "../errors/http-errors";
import { logger } from "../logger";

function toHttpError(err: unknown): HttpError | null {
  if (err instanceof HttpError) {
    return err;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return new BadRequestError("PDF file exceeds maximum allowed size");
    }
    return new BadRequestError(err.message);
  }

  return null;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const httpError = toHttpError(err);
  const isHttpError = httpError !== null;
  const statusCode = isHttpError ? httpError.statusCode : 500;
  const message = isHttpError ? httpError.message : "Internal Server Error";

  if (statusCode >= 500) {
    const logMessage =
      err instanceof Error ? err.message : "Internal Server Error";
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error(logMessage, { stack });
    console.error("[HTTP ERROR]", statusCode, logMessage);
    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    } else {
      console.error(err);
    }
  }

  res.status(statusCode).json({ message });
};
