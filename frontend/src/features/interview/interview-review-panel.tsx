"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowRight } from "lucide-react";

import { ReviewItemsGrid } from "@/features/dashboard/review-items-grid";
import { useReviewItems } from "@/lib/query/hooks/use-review-items";
import type { SessionMessage } from "@/types/interview";

type InterviewReviewPanelProps = {
  sessionId: string;
  messages: SessionMessage[];
};

function getClosingFeedback(messages: SessionMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "ai") {
      return messages[i].content;
    }
  }
  return null;
}

export function InterviewReviewPanel({
  sessionId,
  messages,
}: InterviewReviewPanelProps) {
  const { data, isLoading, error } = useReviewItems();
  const sessionItems =
    data?.reviewItems.filter((item) => item.sessionId === sessionId) ?? [];
  const closingFeedback = getClosingFeedback(messages);

  return (
    <section
      id="interview-review"
      className="mt-6 space-y-4 rounded-xl border border-(--border) bg-(--card) p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-(--foreground)">
            Interview review
          </h2>
          <p className="text-xs text-(--muted-foreground)">
            Closing feedback and topics to study from this session.
          </p>
        </div>
        <Link
          href="/feedback"
          className="cursor-pointer flex shrink-0 items-center gap-1 text-xs font-medium text-(--primary) hover:opacity-75"
        >
          Full backlog
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {closingFeedback && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
            General feedback
          </h3>
          <div className="rounded-lg bg-(--muted)/40 px-4 py-3 text-sm leading-relaxed text-(--foreground) prose prose-sm max-w-none space-y-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5">
            <ReactMarkdown>{closingFeedback}</ReactMarkdown>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
          Topics to review
        </h3>
        {isLoading && (
          <p className="text-sm text-(--muted-foreground)">Seus itens estão sendo gerados, estarão disponíveis em breve</p>
        )}
        {error && (
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Failed to load topics"}
          </p>
        )}
        {!isLoading && !error && (
          <ReviewItemsGrid items={sessionItems} />
        )}
      </div>
    </section>
  );
}
