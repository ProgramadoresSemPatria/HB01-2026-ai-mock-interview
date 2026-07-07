import { Loader2 } from "lucide-react";

type StudySelectionBarProps = {
  selectedCount: number;
  onStart: () => void;
  isStarting?: boolean;
};

export function StudySelectionBar({
  selectedCount,
  onStart,
  isStarting = false,
}: StudySelectionBarProps) {
  const isDisabled = selectedCount === 0 || isStarting;

  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t border-(--border) bg-(--background) px-4 py-3 md:-mx-6 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-(--muted-foreground)">
          {selectedCount} selected
        </p>
        <button
          type="button"
          onClick={onStart}
          disabled={isDisabled}
          aria-busy={isStarting}
          className="cursor-pointer flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-lg bg-(--foreground) px-4 py-2.5 text-sm font-medium text-(--background) disabled:opacity-50 disabled:pointer-events-none"
        >
          {isStarting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Starting…
            </>
          ) : (
            "Start review session"
          )}
        </button>
      </div>
    </div>
  );
}
