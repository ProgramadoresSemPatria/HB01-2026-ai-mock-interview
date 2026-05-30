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
  { key: "completed", label: "SESSIONS COMPLETED", icon: Clock },
  { key: "active", label: "ACTIVE SESSIONS", icon: Dumbbell },
  { key: "review", label: "REVIEW ITEMS", icon: ListChecks },
  { key: "level", label: "HIGHEST LEVEL", icon: Award },
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
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className="space-y-3 rounded-xl border border-(--border) bg-(--card) p-5 shadow-sm"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-(--muted-foreground)">
            {label}
          </p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold leading-none text-(--foreground)">
              {values[key]}
            </p>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--muted)">
              <Icon className="h-4 w-4 text-(--foreground)" />
            </div>
          </div>
          <p className="text-xs text-(--muted-foreground)">{subs[key]}</p>
        </div>
      ))}
    </div>
  );
}
