import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ReviewPriorityBadge } from "@/features/study/review-priority-badge";
import type { ReviewItem } from "@/types/review-items";

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
        return (
          <div
            key={item.id}
            className="space-y-3 rounded-xl border border-(--border) bg-(--card) p-5 shadow-sm"
          >
            <ReviewPriorityBadge priority={item.priority} />
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
        className="cursor-pointer flex items-center gap-1.5 text-sm font-medium text-(--primary) transition-opacity hover:opacity-75"
      >
        View all
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
