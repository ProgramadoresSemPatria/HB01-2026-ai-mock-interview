import { env } from "@/config/env";
import type { StreamMeta } from "@/types/interview";

import { ApiError } from "./client";
import { readSseStream } from "./sse-stream";

export type StreamTurnCallbacks = {
  onToken: (chunk: string) => void;
  onMeta: (meta: StreamMeta) => void;
  signal?: AbortSignal;
};

export async function streamInterviewTurn(
  sessionId: string,
  content: string,
  token: string,
  callbacks: StreamTurnCallbacks,
): Promise<void> {
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/api/interview/sessions/${sessionId}/stream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ content }),
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
    onMeta: (data) => callbacks.onMeta(data as StreamMeta),
    signal: callbacks.signal,
  });
}
