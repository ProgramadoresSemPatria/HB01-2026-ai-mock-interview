import { logger } from "../logger";

type StreamFlow = "interview" | "review-session";

type LogStreamErrorContext = {
  flow: StreamFlow;
  userId: number;
  sessionId: string;
  err: unknown;
  aborted?: boolean;
  reviewSessionItemId?: string;
};

function toErrorMeta(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack };
  }

  return { message: String(err) };
}

export function logStreamError(context: LogStreamErrorContext): void {
  const { flow, userId, sessionId, err, aborted, reviewSessionItemId } =
    context;
  const { message, stack } = toErrorMeta(err);

  const meta: Record<string, string | number> = {
    flow,
    userId,
    sessionId,
    message,
  };

  if (stack) {
    meta.stack = stack;
  }

  if (reviewSessionItemId) {
    meta.reviewSessionItemId = reviewSessionItemId;
  }

  if (aborted) {
    logger.warn("Client disconnected during stream", meta);
    return;
  }

  logger.error(`${flow} stream failed`, meta);
}
