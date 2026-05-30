import { Loader2 } from "lucide-react";

type InterviewChatInputProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  canSend: boolean;
  isStreaming: boolean;
  isFinished: boolean;
};

export function InterviewChatInput({
  draft,
  onDraftChange,
  onSubmit,
  canSend,
  isStreaming,
  isFinished,
}: InterviewChatInputProps) {
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
        <p className="text-xs text-(--muted-foreground)">AI is responding…</p>
      )}

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder={placeholder}
          disabled={!canSend}
          aria-busy={isStreaming}
          className="flex-1 rounded-lg border border-(--border) bg-(--background) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSend || !draft.trim()}
          className="flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-lg bg-(--foreground) px-4 py-2.5 text-sm font-medium text-(--background) disabled:opacity-50"
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
