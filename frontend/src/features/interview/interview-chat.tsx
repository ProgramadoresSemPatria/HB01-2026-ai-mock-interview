"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/session-provider";
import { streamInterviewTurn } from "@/lib/api/interview-stream";
import { useSessionMessages } from "@/lib/query/hooks/use-session-messages";
import { useSessions } from "@/lib/query/hooks/use-sessions";
import { queryKeys } from "@/lib/query/keys";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { SessionMessage } from "@/types/interview";

const WELCOME_MESSAGE =
  "Welcome to your mock interview. When you're ready, send your first message to begin.";

type DisplayMessage =
  | SessionMessage
  | {
      id: string;
      role: "ai";
      content: string;
      createdAt: string;
      streaming?: boolean;
    };

export function InterviewChat({ sessionId }: { sessionId: string }) {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();
  const messagesQuery = useSessionMessages(sessionId);
  const sessionsQuery = useSessions();
  const [draft, setDraft] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const session = sessionsQuery.data?.sessions.find((s) => s.id === sessionId);
  const isFinished = session?.isFinished ?? false;
  const atTurnLimit = session != null && session.turnCount >= session.maxTurns;
  const canSend = !isFinished && !atTurnLimit && !isStreaming;

  const serverMessages = messagesQuery.data?.messages ?? [];
  const showWelcome = serverMessages.length === 0 && !isStreaming;

  const displayMessages: DisplayMessage[] = [...serverMessages];
  if (isStreaming && streamingContent) {
    displayMessages.push({
      id: "streaming",
      role: "ai",
      content: streamingContent,
      createdAt: new Date().toISOString(),
      streaming: true,
    });
  }

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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !canSend) return;

    const token = await getAccessToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setDraft("");
    setIsStreaming(true);
    setStreamingContent("");
    abortRef.current = new AbortController();

    try {
      await streamInterviewTurn(sessionId, content, token, {
        signal: abortRef.current.signal,
        onToken: (chunk) => {
          setStreamingContent((prev) => prev + chunk);
        },
        onMeta: (meta) => {
          if (meta.isFinished) {
            toast.success("Interview finished. Check your review backlog.");
          }
        },
      });
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
      abortRef.current = null;
    }
  }

  if (messagesQuery.isLoading && sessionsQuery.isLoading) {
    return <p className="text-sm text-(--muted-foreground)">Loading chat…</p>;
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-(--foreground)">
            Mock interview
          </h1>
          {session && (
            <p className="text-xs text-(--muted-foreground)">
              Turn {session.turnCount} / {session.maxTurns}
              {session.isFinished && " · Finished"}
            </p>
          )}
        </div>
        {isFinished && (
          <Link
            href="/feedback"
            className="text-sm font-medium text-(--primary) underline"
          >
            Review backlog
          </Link>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-(--border) bg-(--card) p-4">
        {showWelcome && (
          <div className="rounded-lg bg-(--muted)/50 px-4 py-3 text-sm text-(--muted-foreground)">
            {WELCOME_MESSAGE}
          </div>
        )}

        {displayMessages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[85%] rounded-xl px-4 py-2.5 text-sm",
              msg.role === "human"
                ? "ml-auto bg-(--primary) text-(--primary-foreground)"
                : "bg-(--muted) text-(--foreground)",
            )}
          >
            {msg.content}
            {"streaming" in msg && msg.streaming && (
              <Loader2 className="mt-1 inline h-3 w-3 animate-spin" />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            canSend
              ? "Type your answer…"
              : isFinished
                ? "Interview finished"
                : "Cannot send right now"
          }
          disabled={!canSend}
          className="flex-1 rounded-lg border border-(--border) bg-(--background) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSend || !draft.trim()}
          className="rounded-lg bg-(--foreground) px-4 py-2.5 text-sm font-medium text-(--background) disabled:opacity-50"
        >
          {isStreaming ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
