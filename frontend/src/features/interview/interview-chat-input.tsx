import { useId, useState } from "react";
import { Loader2 } from "lucide-react";

import { InterviewMicControl } from "@/features/interview/interview-mic-control";

type InterviewChatInputProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  canSend: boolean;
  isStreaming: boolean;
  isFinished: boolean;
  locale?: "en" | "pt";
  getAccessToken?: () => Promise<string | null>;
  onTranscript?: (text: string) => void;
  sttBlocked?: boolean;
};

export function InterviewChatInput({
  draft,
  onDraftChange,
  onSubmit,
  canSend,
  isStreaming,
  isFinished,
  locale,
  getAccessToken,
  onTranscript,
  sttBlocked = false,
}: InterviewChatInputProps) {
  const inputId = useId();
  const [isSttBusy, setIsSttBusy] = useState(false);
  const hasSpeechToText = Boolean(locale && getAccessToken && onTranscript);
  const isInputDisabled = !canSend || isSttBusy || sttBlocked;
  const placeholder = canSend
    ? "Type your answer…"
    : isFinished
      ? "Interview finished"
      : isStreaming
        ? "AI is responding…"
        : "Cannot send right now";

  return (
    <div className="mt-4 space-y-2">
      {isStreaming && (
        <p className="text-xs text-text-base" role="status">
          AI is responding…
        </p>
      )}

      <form onSubmit={onSubmit} className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          Interview response
        </label>
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder={placeholder}
          disabled={isInputDisabled}
          aria-busy={isStreaming}
          className="min-w-0 flex-1 rounded-full border border-border-hairline bg-paper-white px-4 py-2.5 text-sm text-ink-black placeholder:text-text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade focus-visible:ring-offset-2 disabled:opacity-50"
        />
        {hasSpeechToText && locale && getAccessToken && onTranscript && (
          <InterviewMicControl
            locale={locale}
            getAccessToken={getAccessToken}
            onTranscript={onTranscript}
            onBusyChange={setIsSttBusy}
            isStartDisabled={!canSend || isStreaming || sttBlocked}
          />
        )}
        <button
          type="submit"
          disabled={isInputDisabled || !draft.trim()}
          className="flex min-w-22 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-jade-deep px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-black disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade focus-visible:ring-offset-2"
        >
          {isStreaming ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Sending…
            </>
          ) : (
            "Send"
          )}
        </button>
      </form>
    </div>
  );
}
