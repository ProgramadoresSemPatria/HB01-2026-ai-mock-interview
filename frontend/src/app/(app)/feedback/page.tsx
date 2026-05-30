"use client";

import { AppShell } from "@/features/dashboard/app-shell";
import {
  ReviewItemsGrid,
  ReviewItemsSectionHeader,
} from "@/features/dashboard/review-items-grid";
import { useReviewItems } from "@/lib/query/hooks/use-review-items";

export default function FeedbackPage() {
  const { data, isLoading, error } = useReviewItems();
  const items = data?.reviewItems ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <ReviewItemsSectionHeader />
        {isLoading && (
          <p className="text-sm text-(--muted-foreground)">Loading…</p>
        )}
        {error && (
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Failed to load"}
          </p>
        )}
        {!isLoading && !error && <ReviewItemsGrid items={items} />}
      </div>
    </AppShell>
  );
}
