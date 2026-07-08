import { ApiError } from "./client";

export type SseStreamCallbacks = {
  onToken: (content: string) => void;
  onMeta: (data: Record<string, unknown>) => void;
  onError?: (message: string, extra?: Record<string, unknown>) => void;
  /** When false, error events are reported via onError but do not abort the stream. */
  isFatalError?: (data: Record<string, unknown>) => boolean;
  signal?: AbortSignal;
};

export async function readSseStream(
  response: Response,
  callbacks: SseStreamCallbacks,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Stream body is not available");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (callbacks.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

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
        callbacks.onMeta(data);
      }
      if (event === "error" && typeof data.message === "string") {
        const isFatal = callbacks.isFatalError?.(data) ?? true;
        callbacks.onError?.(data.message, data);
        if (isFatal) {
          throw new ApiError(data.message, 500, data);
        }
      }
    }
  }
}
