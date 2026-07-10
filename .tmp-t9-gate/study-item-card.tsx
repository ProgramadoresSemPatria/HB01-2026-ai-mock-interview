"use client";

import { ReviewPriorityBadge } from "@/features/study/review-priority-badge";
import { cn } from "@/lib/utils";
import type { ReviewItem } from "@/types/review-items";

type StudyItemCardProps = {
  item: ReviewItem;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  onMarkLearned?: () => void;
  onReactivate?: () => void;
  onDelete?: () => void;
};

export function StudyItemCard({
  item,
  selectable = false,
  selected = false,
  onSelectToggle,
  onMarkLearned,
  onReactivate,
  onDelete,
}: StudyItemCardProps) {
  const isActive = item.status === "active";

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete "${item.topic}" from your study backlog? This cannot be undone.`,
      )
    ) {
      onDelete?.();
    }
  };

  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border border-(--border) bg-(--card) p-5 shadow-sm",
        selectable && selected && "ring-2 ring-(--primary)",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {selectable && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelectToggle}
              className="mt-1 h-4 w-4 cursor-pointer accent-(--primary)"
              aria-label={`Select ${item.topic}`}
            />
          )}
          <div className="space-y-2">
            <ReviewPriorityBadge priority={item.priority} />
            <div>
              <p className="font-semibold text-(--foreground)">{item.topic}</p>
              <p className="mt-1 text-xs leading-relaxed text-(--muted-foreground)">
                {item.description}
              </p>
              {!isActive && item.learnedAt && (
                <p className="mt-2 text-xs text-(--muted-foreground)">
                  Learned on{" "}
                  {new Date(item.learnedAt).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {isActive ? (
          <>
            <button
              type="button"
              onClick={onMarkLearned}
              className="cursor-pointer rounded-lg border border-(--border) px-3 py-1.5 text-xs font-medium text-(--foreground) transition-colors hover:bg-(--muted)"
            >
              Mark as learned
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onReactivate}
              className="cursor-pointer rounded-lg border border-(--border) px-3 py-1.5 text-xs font-medium text-(--foreground) transition-colors hover:bg-(--muted)"
            >
              Reactivate
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
