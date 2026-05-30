import { env } from "@/config/env";
import type { StreamMeta } from "@/types/interview";

import { ApiError } from "./client";

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

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Stream body is not available");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      if (block.includes("data: [DONE]")) continue;

      const eventMatch = block.match(/^event: (\w+)/m);
      const dataMatch = block.match(/^data: (.+)$/m);
      if (!dataMatch) continue;

      const event = eventMatch?.[1];
      const data = JSON.parse(dataMatch[1]) as Record<string, unknown>;

      if (event === "token" && typeof data.content === "string") {
        callbacks.onToken(data.content);
      }
      if (event === "meta") {
        callbacks.onMeta(data as StreamMeta);
      }
      if (event === "error" && typeof data.message === "string") {
        throw new ApiError(data.message, 500, data);
      }
    }
  }
}
