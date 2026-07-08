import { env } from "@/config/env";
import type { ReviewSessionStreamMeta } from "@/types/review-sessions";

import { ApiError } from "./client";
import { readSseStream } from "./sse-stream";

export type StreamReviewSessionCallbacks = {
  onToken: (chunk: string) => void;
  onMeta: (meta: ReviewSessionStreamMeta) => void;
  signal?: AbortSignal;
};

export async function streamReviewSessionTurn(
  sessionId: string,
  answer: string | undefined,
  token: string,
  callbacks: StreamReviewSessionCallbacks,
): Promise<void> {
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/api/review-sessions/${sessionId}/stream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(answer !== undefined ? { answer } : {}),
      credentials: "include",
      signal: callbacks.signal,
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message: unknown }).message)
        : res.statusText;
    throw new ApiError(message, res.status, data);
  }

  await readSseStream(res, {
    onToken: callbacks.onToken,
    onMeta: (data) => callbacks.onMeta(data as ReviewSessionStreamMeta),
    // Per-item evaluation failures are non-fatal; pending_review meta still follows.
    isFatalError: (data) => !("reviewSessionItemId" in data),
    signal: callbacks.signal,
  });
}
