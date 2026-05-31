import { CheckCircle2 } from "lucide-react";

type InterviewCompletionBannerProps = {
  onViewReview?: () => void;
};

export function InterviewCompletionBanner({
  onViewReview,
}: InterviewCompletionBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-(--foreground)">
          Interview completed
        </p>
        <p className="mt-0.5 text-xs text-(--muted-foreground)">
          Your closing feedback and study topics are available below. No new
          messages can be sent.
        </p>
        {onViewReview && (
          <button
            type="button"
            onClick={onViewReview}
            className="cursor-pointer mt-2 text-xs font-medium text-(--primary) underline"
          >
            Jump to review
          </button>
        )}
      </div>
    </div>
  );
}
