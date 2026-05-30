import type { SessionSummary, InterviewLevel } from "@/types/interview";

const LEVEL_RANK: Record<InterviewLevel, number> = {
  entry: 1,
  mid: 2,
  senior: 3,
};

export function deriveDashboardStats(sessions: SessionSummary[]) {
  const completed = sessions.filter((s) => s.isFinished);
  const active = sessions.filter((s) => !s.isFinished);

  let highestLevel: InterviewLevel | null = null;
  for (const s of completed) {
    if (!highestLevel || LEVEL_RANK[s.level] > LEVEL_RANK[highestLevel]) {
      highestLevel = s.level;
    }
  }

  return {
    completedCount: completed.length,
    activeCount: active.length,
    highestLevel,
  };
}

export function formatLevel(level: InterviewLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}
