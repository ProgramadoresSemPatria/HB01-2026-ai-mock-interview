import { Clock, Dumbbell, ListChecks, Award } from "lucide-react";

import { formatLevel } from "./lib/stats";
import type { InterviewLevel } from "@/types/interview";

type DashboardStatsProps = {
  completedCount: number;
  activeCount: number;
  reviewItemsCount: number;
  highestLevel: InterviewLevel | null;
};

const CARDS = [
  { key: "completed", label: "Sessions completed", icon: Clock },
  { key: "active", label: "Active sessions", icon: Dumbbell },
  { key: "review", label: "Review items", icon: ListChecks },
  { key: "level", label: "Highest level", icon: Award },
] as const;

export function DashboardStats({
  completedCount,
  activeCount,
  reviewItemsCount,
  highestLevel,
}: DashboardStatsProps) {
  const values: Record<string, string> = {
    completed: String(completedCount),
    active: String(activeCount),
    review: String(reviewItemsCount),
    level: highestLevel ? formatLevel(highestLevel) : "—",
  };

  const subs: Record<string, string> = {
    completed: "Finished mock interviews",
    active: "In progress",
    review: "Topics in your backlog",
    level: "Among completed sessions",
  };

  return (
    <ul
      aria-label="Interview activity summary"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {CARDS.map(({ key, label, icon: Icon }) => (
        <li
          key={key}
          className="landing-mist-card flex min-w-0 flex-col gap-3 p-5!"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="landing-tag pt-1 text-text-base!">{label}</p>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-jade-mist">
              <Icon
                aria-hidden="true"
                className="h-4 w-4 text-jade-deep"
                strokeWidth={1.8}
              />
            </div>
          </div>
          <div className="mt-auto min-w-0">
            <p className="manrope truncate text-2xl font-medium leading-none text-ink-black">
              {values[key]}
            </p>
            <p className="manrope mt-2 text-xs leading-relaxed text-text-base">
              {subs[key]}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
