"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/session-provider";
import { streamInterviewTurn } from "@/lib/api/interview-stream";
import { useSessionMessages } from "@/lib/query/hooks/use-session-messages";
import { useSessions } from "@/lib/query/hooks/use-sessions";
import { queryKeys } from "@/lib/query/keys";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type {
  ListMessagesResponse,
  ListSessionsResponse,
  SessionMessage,
  StreamMeta,
} from "@/types/interview";

import { InterviewChatInput } from "./interview-chat-input";
import { InterviewCompletionBanner } from "./interview-completion-banner";
import {
  InterviewMessageList,
  type DisplayMessage,
} from "./interview-message-list";
import { InterviewReviewPanel } from "./interview-review-panel";

export function InterviewChat({ sessionId }: { sessionId: string }) {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();
  const messagesQuery = useSessionMessages(sessionId);
  const sessionsQuery = useSessions();
  const [draft, setDraft] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [pendingHuman, setPendingHuman] = useState<SessionMessage | null>(
    null,
  );
  const abortRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef("");
  const [viewMode, setViewMode] = useState<"chat" | "review">("chat");

  useEffect(() => {
    setViewMode("chat");
  }, [sessionId]);

  const session = sessionsQuery.data?.sessions.find((s) => s.id === sessionId);
  const isFinished = session?.isFinished ?? false;
  const atTurnLimit = session != null && session.turnCount >= session.maxTurns;
  const isCompleted = isFinished || atTurnLimit;
  const canSend = !isCompleted && !isStreaming;

  const serverMessages = messagesQuery.data?.messages ?? [];
  const showWelcome =
    serverMessages.length === 0 && !isStreaming && !pendingHuman;

  const displayMessages: DisplayMessage[] = [...serverMessages];

  if (
    pendingHuman &&
    !serverMessages.some(
      (m) => m.role === "human" && m.content === pendingHuman.content,
    )
  ) {
    displayMessages.push(pendingHuman);
  }

  if (isStreaming) {
    if (streamingContent) {
      displayMessages.push({
        id: "streaming",
        role: "ai",
        content: streamingContent,
        createdAt: new Date().toISOString(),
        streaming: true,
      });
    } else {
      displayMessages.push({
        id: "typing",
        role: "ai",
        content: "",
        createdAt: new Date().toISOString(),
        typing: true,
      });
    }
  }

  const updateSessionMeta = useCallback(
    (meta: StreamMeta) => {
      queryClient.setQueryData<ListSessionsResponse>(
        queryKeys.sessions,
        (old) => {
          if (!old) return old;
          return {
            sessions: old.sessions.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    turnCount: meta.turnCount,
                    maxTurns: meta.maxTurns,
                    isFinished: meta.isFinished,
                  }
                : s,
            ),
          };
        },
      );
    },
    [queryClient, sessionId],
  );

  const mergeStreamedMessages = useCallback(
    (humanContent: string, aiContent: string) => {
      queryClient.setQueryData<ListMessagesResponse>(
        queryKeys.sessionMessages(sessionId),
        (old) => {
          const existing = old?.messages ?? [];
          const withoutPending = existing.filter(
            (m) => m.id !== "pending-human",
          );

          const hasHuman = withoutPending.some(
            (m) => m.role === "human" && m.content === humanContent,
          );
          const next: SessionMessage[] = [...withoutPending];

          if (!hasHuman) {
            next.push({
              id: "pending-human",
              role: "human",
              content: humanContent,
              createdAt: new Date().toISOString(),
            });
          }

          if (aiContent) {
            next.push({
              id: `optimistic-ai-${Date.now()}`,
              role: "ai",
              content: aiContent,
              createdAt: new Date().toISOString(),
            });
          }

          return { messages: next };
        },
      );
    },
    [queryClient, sessionId],
  );

  const invalidateAfterTurn = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.sessionMessages(sessionId),
    });
    void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    void queryClient.invalidateQueries({ queryKey: queryKeys.reviewItems });
  }, [queryClient, sessionId]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function scrollToReview() {
    document
      .getElementById("interview-review")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  async function sendMessage(content: string) {
    if (!content || !canSend) return;

    const token = await getAccessToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setPendingHuman({
      id: "pending-human",
      role: "human",
      content,
      createdAt: new Date().toISOString(),
    });
    setIsStreaming(true);
    setStreamingContent("");
    streamingContentRef.current = "";
    abortRef.current = new AbortController();

    try {
      await streamInterviewTurn(sessionId, content, token, {
        signal: abortRef.current.signal,
        onToken: (chunk) => {
          streamingContentRef.current += chunk;
          setStreamingContent((prev) => prev + chunk);
        },
        onMeta: (meta) => {
          updateSessionMeta(meta);
          if (meta.isFinished) {
            toast.success("Interview finished. Review your feedback below.");
          }
        },
      });

      mergeStreamedMessages(content, streamingContentRef.current);
      invalidateAfterTurn();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        invalidateAfterTurn();
        return;
      }
      toast.error(err instanceof ApiError ? err.message : "Stream failed");
      invalidateAfterTurn();
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      streamingContentRef.current = "";
      setPendingHuman(null);
      abortRef.current = null;
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    setDraft("");
    void sendMessage(content);
  }

  function handleStart() {
    void sendMessage("Hi, I'm ready for the interview!");
  }

  if (messagesQuery.isLoading) {
    return <p className="text-sm text-(--muted-foreground)">Loading chat…</p>;
  }

  if (messagesQuery.error) {
    const message =
      messagesQuery.error instanceof ApiError &&
      messagesQuery.error.status === 404
        ? "Interview session not found."
        : messagesQuery.error instanceof Error
          ? messagesQuery.error.message
          : "Failed to load messages";

    return (
      <div className="mx-auto max-w-3xl space-y-2">
        <p className="text-sm text-red-600">{message}</p>
        <Link href="/dashboard" className="text-sm text-(--primary) underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-(--foreground)">
            Mock interview
          </h1>
          {session && (
            <p className="text-xs text-(--muted-foreground) mr-2">
              Turn {session.turnCount} / {session.maxTurns}
              {isCompleted && " · Finished"}
            </p>
          )}

          {isCompleted && (
            <div className="flex rounded-lg border border-(--border) bg-(--muted)/20 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("chat")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                  viewMode === "chat"
                    ? "bg-(--foreground) text-(--background)"
                    : "text-(--muted-foreground) hover:text-(--foreground)"
                )}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setViewMode("review")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                  viewMode === "review"
                    ? "bg-(--foreground) text-(--background)"
                    : "text-(--muted-foreground) hover:text-(--foreground)"
                )}
              >
                Review
              </button>
            </div>
          )}
        </div>

        {isCompleted && viewMode === "chat" && (
          <button
            type="button"
            onClick={() => setViewMode("review")}
            className="text-sm font-medium text-(--primary) underline"
          >
            View review
          </button>
        )}
      </div>

      {viewMode === "chat" ? (
        <div className="flex-1 flex flex-col min-h-0">
          <InterviewMessageList
            messages={displayMessages}
            showWelcome={showWelcome}
            onStart={handleStart}
          />

          {isCompleted && (
            <div className="mt-4 shrink-0">
              <InterviewCompletionBanner onViewReview={() => setViewMode("review")} />
            </div>
          )}

          <InterviewChatInput
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={handleSend}
            canSend={canSend}
            isStreaming={isStreaming}
            isFinished={isCompleted}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0">
          <InterviewReviewPanel sessionId={sessionId} messages={serverMessages} />
        </div>
      )}
    </div>
  );
}
