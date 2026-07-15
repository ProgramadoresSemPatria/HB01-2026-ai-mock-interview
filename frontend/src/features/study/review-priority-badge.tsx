import { cn } from "@/lib/utils";
import type { ReviewPriority } from "@/types/review-items";

const PRIORITY_STYLES: Record<
  ReviewPriority,
  { badge: string; label: string }
> = {
  high: {
    badge: "bg-red-100 text-red-700",
    label: "high priority",
  },
  medium: {
    badge: "bg-jade-pale text-jade-deep",
    label: "medium priority",
  },
  low: {
    badge: "bg-mist-gray text-text-base",
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
