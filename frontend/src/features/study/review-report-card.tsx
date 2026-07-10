"use client";

import { AlertCircle } from "lucide-react";

import { ReviewPriorityBadge } from "@/features/study/review-priority-badge";
import { cn } from "@/lib/utils";
import type { ReviewPriority } from "@/types/review-items";

import type { ReportCardState, ReportCardStatePatch } from "./lib/report-card-state";

const PRIORITY_OPTIONS: ReviewPriority[] = ["low", "medium", "high"];

type ReviewReportCardProps = {
  card: ReportCardState;
  onChange: (patch: ReportCardStatePatch) => void;
};

function formatSuggestedCopy(card: ReportCardState): string {
  if (card.evaluationFailed) {
    return "Evaluation unavailable — choose an outcome below";
  }

  if (card.suggestedStatus === "learned") {
    return "Suggested: mark as learned";
  }

  if (card.suggestedPriority) {
    return `Suggested: ${card.suggestedPriority} priority`;
  }

  return "No suggestion";
}

export function ReviewReportCard({ card, onChange }: ReviewReportCardProps) {
  const isActive = card.status === "active";

  return (
    <div className="space-y-4 rounded-xl border border-(--border) bg-(--card) p-5 shadow-sm">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-(--foreground)">{card.topic}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-(--muted-foreground)">
          <span>Current:</span>
          <ReviewPriorityBadge priority={card.currentPriority} />
        </div>

        {card.evaluationFailed ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{formatSuggestedCopy(card)}</span>
          </div>
        ) : (
          <p className="text-xs text-(--muted-foreground)">
            {formatSuggestedCopy(card)}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ status: "active" })}
            className={cn(
              "cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "border-(--primary) bg-(--primary) text-(--primary-foreground)"
                : "border-(--border) text-(--foreground) hover:bg-(--muted)",
            )}
          >
            Keep active
          </button>
          <button
            type="button"
            onClick={() => onChange({ status: "learned" })}
            className={cn(
              "cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              !isActive
                ? "border-(--primary) bg-(--primary) text-(--primary-foreground)"
                : "border-(--border) text-(--foreground) hover:bg-(--muted)",
            )}
          >
            Mark as learned
          </button>
        </div>

        {isActive && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-(--muted-foreground)">
              Priority
            </span>
            <select
              value={card.priority ?? card.currentPriority}
              onChange={(event) =>
                onChange({ priority: event.target.value as ReviewPriority })
              }
              className="w-full max-w-xs cursor-pointer rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground)"
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
