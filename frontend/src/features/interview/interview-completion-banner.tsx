import { CheckCircle2 } from "lucide-react";

import { InterviewFeedbackWidget } from "./interview-feedback-widget";

type InterviewCompletionBannerProps = {
  sessionId: string;
  onViewReview?: () => void;
};

export function InterviewCompletionBanner({
  sessionId,
  onViewReview,
}: InterviewCompletionBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-jade-pale px-4 py-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-jade-deep" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-black">
          Interview completed
        </p>
        <p className="mt-0.5 text-xs leading-5 text-text-base">
          Your closing feedback is available below. Study topics appear in
          Review when ready. No new messages can be sent.
        </p>
        {onViewReview && (
          <button
            type="button"
            onClick={onViewReview}
            className="mt-2 cursor-pointer rounded-sm text-xs font-semibold text-jade-deep underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade focus-visible:ring-offset-2"
          >
            Jump to review
          </button>
        )}
        <InterviewFeedbackWidget sessionId={sessionId} />
      </div>
    </div>
  );
}
