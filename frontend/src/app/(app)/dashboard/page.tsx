"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { useAuth } from "@/features/auth/session-provider";
import { AppShell } from "@/features/dashboard/app-shell";
import { DashboardStats } from "@/features/dashboard/dashboard-stats";
import { deriveDashboardStats } from "@/features/dashboard/lib/stats";
import {
  ReviewItemsGrid,
  ReviewItemsSectionHeader,
} from "@/features/dashboard/review-items-grid";
import { SessionsTable } from "@/features/dashboard/sessions-table";
import { useReviewItems } from "@/lib/query/hooks/use-review-items";
import { useSessions } from "@/lib/query/hooks/use-sessions";

const TABS = ["Overview", "Feedback"] as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const sessionsQuery = useSessions();
  const reviewQuery = useReviewItems();

  const sessions = sessionsQuery.data?.sessions ?? [];
  const reviewItems = reviewQuery.data?.reviewItems ?? [];
  const stats = deriveDashboardStats(sessions);

  const isLoading = sessionsQuery.isLoading || reviewQuery.isLoading;
  const error = sessionsQuery.error ?? reviewQuery.error;

  const header = (
    <header className="flex shrink-0 items-center justify-between border-b border-(--border) bg-(--background) px-6 py-3">
      <div className="flex items-center gap-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-0.5 text-sm transition-colors cursor-pointer",
              activeTab === tab
                ? "border-b-2 border-(--primary) font-semibold text-(--foreground)"
                : "text-(--muted-foreground) hover:text-(--foreground)",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </header>
  );

  return (
    <AppShell header={header}>
      {isLoading && (
        <p className="text-sm text-(--muted-foreground)">Loading dashboard…</p>
      )}
      {error && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : "Failed to load data"}
        </p>
      )}

      {!isLoading && !error && activeTab === "Overview" && (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-(--border) bg-(--card) p-7 shadow-sm">
            <div
              className="pointer-events-none absolute right-6 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 40% 40%, #f97316 0%, #dc2626 40%, #7c3aed 80%, transparent 100%)",
                filter: "blur(2px)",
              }}
            />
            <div className="relative z-10 max-w-md space-y-3">
              <h2 className="text-2xl font-semibold text-(--foreground)">
                Welcome back, {user?.name ?? "there"}.
              </h2>
              <p className="text-sm text-(--muted-foreground)">
                Upload your resume and run AI mock interviews. Review items
                appear after you finish a session.
              </p>
              <div className="flex gap-3 pt-1">
                <Link
                  href="/practice"
                  className="cursor-pointer rounded-lg bg-(--foreground) px-4 py-2 text-sm font-medium text-(--background) transition-opacity hover:opacity-85"
                >
                  Start practice
                </Link>
                <Link
                  href="/feedback"
                  className="cursor-pointer rounded-lg border border-(--border) px-4 py-2 text-sm font-medium text-(--foreground) transition-colors hover:bg-(--muted)"
                >
                  View feedback
                </Link>
              </div>
            </div>
          </div>

          <DashboardStats
            completedCount={stats.completedCount}
            activeCount={stats.activeCount}
            reviewItemsCount={reviewItems.length}
            highestLevel={stats.highestLevel}
          />

          <div className="space-y-4">
            <ReviewItemsSectionHeader />
            <ReviewItemsGrid items={reviewItems} limit={3} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-(--foreground)">
              Recent sessions
            </h3>
            <SessionsTable sessions={sessions} />
          </div>
        </div>
      )}

      {!isLoading && !error && activeTab === "Feedback" && (
        <div className="space-y-4">
          <ReviewItemsSectionHeader />
          <ReviewItemsGrid items={reviewItems} />
        </div>
      )}
    </AppShell>
  );
}
