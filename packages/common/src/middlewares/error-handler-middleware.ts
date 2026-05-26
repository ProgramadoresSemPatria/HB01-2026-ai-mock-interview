import type { ErrorRequestHandler } from "express";
import { HttpError } from "../errors/http-errors";
import { logger } from "../logger";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isHttpError = err instanceof HttpError;
  const statusCode = isHttpError ? err.statusCode : 500;
  const message = isHttpError ? err.message : "Internal Server Error";

  if (statusCode >= 500) {
    const logMessage =
      err instanceof Error ? err.message : "Internal Server Error";
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error(logMessage, { stack });
  }

  res.status(statusCode).json({ message });
};
