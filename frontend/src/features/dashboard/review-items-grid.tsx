import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ReviewItem, ReviewPriority } from "@/types/review-items";

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

export function ReviewItemsGrid({
  items,
  limit,
}: {
  items: ReviewItem[];
  limit?: number;
}) {
  const visible = limit ? items.slice(0, limit) : items;

  if (visible.length === 0) {
    return (
      <p className="text-sm text-(--muted-foreground)">
        No review items yet. Complete an interview to generate your study
        backlog.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {visible.map((item) => {
        const styles = PRIORITY_STYLES[item.priority];
        return (
          <div
            key={item.id}
            className="space-y-3 rounded-xl border border-(--border) bg-(--card) p-5 shadow-sm"
          >
            <span
              className={cn(
                "inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                styles.badge,
              )}
            >
              {styles.label}
            </span>
            <div>
              <p className="font-semibold text-(--foreground)">{item.topic}</p>
              <p className="mt-1 text-xs leading-relaxed text-(--muted-foreground)">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ReviewItemsSectionHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-(--foreground)">
          Review backlog
        </h3>
        <p className="text-xs text-(--muted-foreground)">
          Topics identified after your mock interviews.
        </p>
      </div>
      <Link
        href="/feedback"
        className="flex items-center gap-1.5 text-sm font-medium text-(--primary) transition-opacity hover:opacity-75"
      >
        View all
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
