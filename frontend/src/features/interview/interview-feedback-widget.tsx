"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/session-provider";
import { ApiError } from "@/lib/api/client";
import { interviewApi } from "@/lib/api/interview";
import { cn } from "@/lib/utils";
import type { FeedbackRating } from "@/types/interview";

const MAX_COMMENT_LENGTH = 1000;

type InterviewFeedbackWidgetProps = {
  sessionId: string;
};

export function InterviewFeedbackWidget({
  sessionId,
}: InterviewFeedbackWidgetProps) {
  const { getAccessToken } = useAuth();
  const [comment, setComment] = useState("");
  const [selectedRating, setSelectedRating] = useState<FeedbackRating | null>(
    null,
  );
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting || selectedRating === null) return;

    const token = await getAccessToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedComment = comment.trim();
      await interviewApi.submitFeedback(
        sessionId,
        { rating: selectedRating, comment: trimmedComment },
        token,
      );
      setSubmitted(true);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to submit feedback",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mt-3 space-y-3 border-t border-emerald-200 pt-3 dark:border-emerald-900/40"
    >
      <p className="text-xs font-medium text-(--foreground)">
        Was this interview helpful?
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedRating("up")}
          disabled={isSubmitting}
          aria-pressed={selectedRating === "up"}
          className={cn(
            "cursor-pointer flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
            selectedRating === "up"
              ? "border-emerald-500 bg-emerald-100 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-200"
              : "border-(--border) bg-(--background) text-(--foreground) hover:bg-(--muted)/30",
          )}
        >
          👍 Helpful
        </button>

        <button
          type="button"
          onClick={() => setSelectedRating("down")}
          disabled={isSubmitting}
          aria-pressed={selectedRating === "down"}
          className={cn(
            "cursor-pointer flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
            selectedRating === "down"
              ? "border-red-400 bg-red-50 text-red-800 dark:border-red-600 dark:bg-red-950/50 dark:text-red-200"
              : "border-(--border) bg-(--background) text-(--foreground) hover:bg-(--muted)/30",
          )}
        >
          👎 Not helpful
        </button>
      </div>

      <div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={MAX_COMMENT_LENGTH}
          placeholder="Optional comment…"
          rows={3}
          disabled={isSubmitting}
          className="w-full resize-none rounded-lg border border-(--border) bg-(--background) px-3 py-2.5 text-sm text-(--foreground) placeholder:text-(--muted-foreground) focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:opacity-50"
        />
        <p className="mt-1 text-right text-[10px] text-(--muted-foreground)">
          {comment.length}/{MAX_COMMENT_LENGTH}
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || selectedRating === null}
        className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-lg bg-(--foreground) px-4 py-3 text-sm font-semibold text-(--background) transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : submitted ? (
          "Update feedback"
        ) : (
          "Submit feedback"
        )}
      </button>

      {submitted && (
        <p className="text-center text-xs text-emerald-700 dark:text-emerald-400">
          Thanks for your feedback!
        </p>
      )}
    </form>
  );
}
