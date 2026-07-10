import { logger } from "./logger";

function toErrorMeta(reason: unknown): { message: string; stack?: string } {
  if (reason instanceof Error) {
    return { message: reason.message, stack: reason.stack };
  }

  return { message: String(reason) };
}

export function setupProcessErrorHandlers(): void {
  process.on("unhandledRejection", (reason) => {
    const { message, stack } = toErrorMeta(reason);
    const meta: Record<string, string> = { reason: message };

    if (stack) {
      meta.stack = stack;
    }

    logger.error("Unhandled promise rejection", meta);
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });
}
