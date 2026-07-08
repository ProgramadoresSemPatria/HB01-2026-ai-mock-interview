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

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const httpError = toHttpError(err);
  const isHttpError = httpError !== null;
  const statusCode = isHttpError ? httpError.statusCode : 500;
  const message = isHttpError ? httpError.message : "Internal Server Error";

  const requestMeta = {
    method: req.method,
    path: req.path,
  };

  if (statusCode >= 500) {
    const logMessage =
      err instanceof Error ? err.message : "Internal Server Error";
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error(logMessage, { ...requestMeta, statusCode, stack });
  } else if (statusCode >= 400) {
    logger.warn(message, { ...requestMeta, statusCode });
  }

  res.status(statusCode).json({ message });
};
