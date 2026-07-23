import { env } from "@/config/env";
import { ApiError } from "./client";

export type TranscribeResponse = {
  text: string;
  language_code: string;
  language_confidence: number;
};

function createRequestSignal(callerSignal?: AbortSignal): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 65_000);

  const abortFromCaller = () => controller.abort();

  if (callerSignal?.aborted) {
    abortFromCaller();
  } else {
    callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      callerSignal?.removeEventListener("abort", abortFromCaller);
    },
  };
}

export async function transcribeAudio(
  blob: Blob,
  token: string,
  options?: { signal?: AbortSignal },
): Promise<TranscribeResponse> {
  const form = new FormData();
  form.append("audio", blob, "recording.webm");

  const request = createRequestSignal(options?.signal);

  try {
    const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/api/transcribe/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      credentials: "include",
      signal: request.signal,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        typeof data === "object" && data && "message" in data
          ? String((data as { message: unknown }).message)
          : res.statusText;
      throw new ApiError(message, res.status, data);
    }

    return data as TranscribeResponse;
  } finally {
    request.cleanup();
  }
}
