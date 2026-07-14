import { Send } from "lucide-react";

type InterviewChatComposeProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
};

export function InterviewChatCompose({
  draft,
  onDraftChange,
  onSubmit,
  disabled = false,
}: InterviewChatComposeProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="shrink-0 border-t border-[var(--color-border-hairline)] p-4 md:p-6"
    >
      <div className="flex items-center gap-3 rounded-[16px] border border-[var(--color-border-hairline)] bg-white px-4 py-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Type your response…"
          disabled={disabled}
          className="manrope min-w-0 flex-1 bg-transparent text-sm text-[var(--color-ink-black)] placeholder:text-[var(--color-smoke-gray)] focus:outline-none disabled:opacity-50"
        />
        <span className="manrope hidden shrink-0 text-[10px] text-[var(--color-ash-gray)] sm:inline">
          Press Enter to send
        </span>
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          aria-label="Send message"
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-jade text-paper-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="size-4" strokeWidth={1.5} />
        </button>
      </div>
    </form>
  );
}
