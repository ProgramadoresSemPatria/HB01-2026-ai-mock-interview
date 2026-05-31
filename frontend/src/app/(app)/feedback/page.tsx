"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Trash2,
  Calendar,
  MessageSquare,
  Loader2,
  ChevronRight,
  AlertCircle,
  Dumbbell,
  BookOpen,
} from "lucide-react";

import { AppShell } from "@/features/dashboard/app-shell";
import { useAuth } from "@/features/auth/session-provider";
import { useSessions } from "@/lib/query/hooks/use-sessions";
import { useResumes } from "@/lib/query/hooks/use-resumes";
import { useSessionMessages } from "@/lib/query/hooks/use-session-messages";
import { useReviewItems } from "@/lib/query/hooks/use-review-items";
import { ReviewItemsGrid } from "@/features/dashboard/review-items-grid";
import { interviewApi } from "@/lib/api/interview";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import type { SessionMessage } from "@/types/interview";

function getClosingFeedback(messages: SessionMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "ai") {
      return messages[i].content;
    }
  }
  return null;
}

function SessionFeedbackDetail({
  sessionId,
  resumeName,
}: {
  sessionId: string;
  resumeName: string;
}) {
  const messagesQuery = useSessionMessages(sessionId);
  const reviewQuery = useReviewItems();

  const messages = messagesQuery.data?.messages ?? [];
  const closingFeedback = getClosingFeedback(messages);

  const sessionItems =
    reviewQuery.data?.reviewItems.filter((item) => item.sessionId === sessionId) ?? [];

  if (messagesQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 py-12 text-sm text-(--muted-foreground)">
        <Loader2 className="h-5 w-5 animate-spin text-(--primary)" />
        Loading feedback details…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-(--foreground)">
          Feedback Details
        </h2>
        <p className="text-xs text-(--muted-foreground) mt-1">
          Source CV: {resumeName}
        </p>
      </div>

      {closingFeedback ? (
        <div className="space-y-2 pt-4 border-t border-(--border)">
          <h3 className="text-xs font-bold uppercase tracking-wider text-(--muted-foreground)">
            General Feedback
          </h3>
          <div className="rounded-xl bg-(--muted)/40 px-5 py-4 text-sm leading-relaxed text-(--foreground) prose prose-sm max-w-none space-y-2.5 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5">
            <ReactMarkdown>{closingFeedback}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <p className="text-sm text-(--muted-foreground) py-4">No general feedback text found in messages.</p>
      )}

      <div className="space-y-3 pt-4 border-t border-(--border)">
        <h3 className="text-xs font-bold uppercase tracking-wider text-(--muted-foreground)">
          Study Topics Generated
        </h3>
        {reviewQuery.isLoading && (
          <p className="text-xs text-(--muted-foreground)">Loading topics…</p>
        )}
        {!reviewQuery.isLoading && sessionItems.length === 0 && (
          <p className="text-sm text-(--muted-foreground)">No study topics were generated for this session.</p>
        )}
        {!reviewQuery.isLoading && sessionItems.length > 0 && (
          <ReviewItemsGrid items={sessionItems} />
        )}
      </div>
    </div>
  );
}

function FeedbackContent() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: sessionsData, isLoading: isLoadingSessions } = useSessions();
  const sessions = sessionsData?.sessions ?? [];
  const finishedSessions = sessions.filter((s) => s.isFinished);

  const { data: resumesData } = useResumes();
  const resumes = resumesData?.resumes ?? [];

  // Default select first completed session when loaded
  useEffect(() => {
    if (finishedSessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(finishedSessions[0].id);
    }
  }, [finishedSessions, selectedSessionId]);

  async function handleDeleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation(); // Stop click from selecting
    if (!confirm("Are you sure you want to delete this interview feedback and all its review topics?")) {
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setDeletingId(id);
    try {
      await interviewApi.deleteSession(id, token);
      toast.success("Feedback deleted successfully");
      
      // Invalidate queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviewItems });
      
      if (selectedSessionId === id) {
        setSelectedSessionId(null);
      }
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to delete feedback",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const selectedSession = finishedSessions.find((s) => s.id === selectedSessionId);
  const selectedResume = selectedSession
    ? resumes.find((r) => r.id === selectedSession.resumeId)
    : null;
  const selectedResumeName = selectedResume ? selectedResume.name : "Resume";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar List */}
      <div className="w-80 border-r border-(--border) bg-(--card) flex flex-col h-full shrink-0 overflow-hidden">
        <div className="p-4 border-b border-(--border) flex items-center gap-2 text-(--primary)">
          <BookOpen className="h-5 w-5" />
          <h2 className="text-sm font-bold uppercase tracking-wider">Feedbacks List</h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-(--border)/40">
          {isLoadingSessions ? (
            <div className="flex items-center gap-2 py-12 text-xs text-(--muted-foreground) justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading feedbacks…
            </div>
          ) : finishedSessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-(--muted-foreground) space-y-2">
              <AlertCircle className="mx-auto h-8 w-8 opacity-40" />
              <p>No finished interview feedbacks found yet.</p>
              <a
                href="/practice"
                className="cursor-pointer inline-block mt-2 rounded bg-(--foreground) px-3 py-1 text-[10px] font-semibold text-(--background)"
              >
                Go Practice
              </a>
            </div>
          ) : (
            finishedSessions.map((sess) => {
              const isActive = selectedSessionId === sess.id;
              const resumeObj = resumes.find((r) => r.id === sess.resumeId);
              const resumeName = resumeObj ? resumeObj.name : "Resume";

              return (
                <div
                  key={sess.id}
                  onClick={() => setSelectedSessionId(sess.id)}
                  className={cn(
                    "w-full text-left p-3.5 flex items-center justify-between gap-2 transition-colors cursor-pointer hover:bg-(--muted)/20",
                    isActive && "bg-(--accent)/15 border-l-4 border-(--primary) pl-2.5",
                  )}
                >
                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <span className="text-xs font-bold text-(--foreground) truncate">
                      {resumeName}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-(--muted-foreground)">
                      <span className="capitalize font-semibold text-(--primary)">
                        {sess.level}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(sess.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={deletingId === sess.id}
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="cursor-pointer p-1.5 rounded-lg border border-(--border) text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50 shrink-0"
                    title="Delete feedback"
                  >
                    {deletingId === sess.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail Pane */}
      <div className="flex-1 bg-(--background) flex flex-col h-full min-w-0 overflow-hidden relative">
        {selectedSessionId ? (
          <SessionFeedbackDetail
            sessionId={selectedSessionId}
            resumeName={selectedResumeName}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-(--background)">
            <div className="max-w-md space-y-3">
              <div className="mx-auto size-14 rounded-full bg-(--accent)/30 flex items-center justify-center text-(--primary)">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-(--foreground)">
                Select Feedback Report
              </h2>
              <p className="text-xs text-(--muted-foreground) leading-relaxed">
                Choose one of your completed interview session evaluations in the sidebar to review the full details and generated topics.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <AppShell noPadding={true}>
      <FeedbackContent />
    </AppShell>
  );
}
