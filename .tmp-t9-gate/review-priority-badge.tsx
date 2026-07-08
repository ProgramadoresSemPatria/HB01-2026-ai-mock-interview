import { cn } from "@/lib/utils";
import type { ReviewPriority } from "@/types/review-items";

const PRIORITY_STYLES: Record<
  ReviewPriority,
  { badge: string; label: string }
> = {
  high: {
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    label: "high priority",
  },
  medium: {
    badge: "bg-(--accent) text-(--accent-foreground)",
    label: "medium priority",
  },
  low: {
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    label: "low priority",
  },
};

type ReviewPriorityBadgeProps = {
  priority: ReviewPriority;
  className?: string;
};

export function ReviewPriorityBadge({
  priority,
  className,
}: ReviewPriorityBadgeProps) {
  const styles = PRIORITY_STYLES[priority];

  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
        styles.badge,
        className,
      )}
    >
      {styles.label}
    </span>
  );
}
