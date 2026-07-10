"use client";

import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";

import { useOpenReviewSession } from "@/lib/query/hooks/use-open-review-session";
import type { ReviewSessionStatus } from "@/types/review-sessions";

const BANNER_CONFIG: Record<
  Extract<ReviewSessionStatus, "in_progress" | "pending_review">,
  { message: string; href: (sessionId: string) => string }
> = {
  in_progress: {
    message: "Continue your review session",
    href: (sessionId) => `/review-session/${sessionId}`,
  },
  pending_review: {
    message: "Review your suggestions",
    href: (sessionId) => `/review-session/${sessionId}/report`,
  },
};

export function StudyResumeBanner() {
  const { session, isLoading } = useOpenReviewSession();

  if (isLoading || !session) {
    return null;
  }

  if (session.status !== "in_progress" && session.status !== "pending_review") {
    return null;
  }

  const config = BANNER_CONFIG[session.status];

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-(--primary)/30 bg-(--accent)/15 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <BookOpen className="h-5 w-5 shrink-0 text-(--primary)" />
        <p className="text-sm font-medium text-(--foreground)">
          {config.message}
        </p>
      </div>
      <Link
        href={config.href(session.id)}
        className="flex shrink-0 cursor-pointer items-center gap-1 text-sm font-medium text-(--primary) hover:opacity-75"
      >
        Resume
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
