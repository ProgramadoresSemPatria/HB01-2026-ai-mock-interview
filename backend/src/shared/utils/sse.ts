import type { Response } from "express";

export type SseEvent = "token" | "meta" | "error";

export function writeEvent(
  res: Response,
  event: SseEvent,
  data: unknown,
): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  (res as any).flush?.();
}

export function writeDone(res: Response): void {
  res.write("data: [DONE]\n\n");
  (res as any).flush?.();
}
