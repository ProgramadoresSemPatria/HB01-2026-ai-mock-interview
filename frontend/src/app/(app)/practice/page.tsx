"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Play,
  FileText,
  Clock,
  Plus,
  Loader2,
  AlertCircle,
  Dumbbell,
  ChevronRight,
  MessageSquare,
} from "lucide-react";

import { AppShell } from "@/features/dashboard/app-shell";
import { useAuth } from "@/features/auth/session-provider";
import { useResumes } from "@/lib/query/hooks/use-resumes";
import { useSessions } from "@/lib/query/hooks/use-sessions";
import { interviewApi } from "@/lib/api/interview";
import { InterviewChat } from "@/features/interview/interview-chat";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils";
import type { InterviewLevel } from "@/types/interview";
import {
  getStoredResumeId,
  setStoredResumeId,
} from "@/features/auth/session-storage";

const LEVELS: { value: InterviewLevel; label: string; turns: string }[] = [
  { value: "entry", label: "Entry Level", turns: "5 turns" },
  { value: "mid", label: "Mid Level", turns: "7 turns" },
  { value: "senior", label: "Senior Level", turns: "8 turns" },
];

function PracticeContent() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeResumeId, setActiveResumeId] = useState<string | null>(() =>
    getStoredResumeId(),
  );
  const [level, setLevel] = useState<InterviewLevel>("mid");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const { data: resumesData, isLoading: isLoadingResumes } = useResumes();
  const resumes = resumesData?.resumes ?? [];
  const readyResumes = resumes.filter((r) => r.status === "ready");

  const { data: sessionsData, isLoading: isLoadingSessions } = useSessions();
  const sessions = sessionsData?.sessions ?? [];

  // Update selected resume if none stored but ready resumes are loaded
  useEffect(() => {
    if (readyResumes.length > 0 && !activeResumeId) {
      const stored = getStoredResumeId();
      const hasStored = readyResumes.some((r) => r.id === stored);
      const fallbackId = hasStored ? stored : readyResumes[0].id;
      if (fallbackId) {
        setStoredResumeId(fallbackId);
        setActiveResumeId(fallbackId);
      }
    }
  }, [readyResumes, activeResumeId]);

  // Load sessionId from search parameters if present, or auto-load the latest active session
  const querySessionId = searchParams.get("sessionId");
  useEffect(() => {
    if (querySessionId) {
      setActiveSessionId(querySessionId);
    } else if (sessions.length > 0 && !activeSessionId) {
      // Auto-load the most recent session
      setActiveSessionId(sessions[0].id);
    }
  }, [querySessionId, sessions, activeSessionId]);

  async function handleStartNewInterview() {
    if (!activeResumeId) {
      toast.error("Please upload and select a CV first.");
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setIsCreatingSession(true);
    try {
      const { id } = await interviewApi.createSession(
        { resumeId: activeResumeId, level },
        token,
      );
      
      toast.success("New interview session created!");
      
      // Invalidate query to refresh list
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      
      // Select the new session
      setActiveSessionId(id);
      router.push(`/practice?sessionId=${id}`);
    } catch (err) {
      toast.error("Failed to create interview session");
      console.error(err);
    } finally {
      setIsCreatingSession(false);
    }
  }

  function handleSelectSession(id: string) {
    setActiveSessionId(id);
    router.push(`/practice?sessionId=${id}`);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Lateral Panel */}
      <div className="w-80 border-r border-(--border) bg-(--card) flex flex-col h-full shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-(--border) space-y-4">
          <div className="flex items-center gap-2 text-(--primary)">
            <Dumbbell className="h-5 w-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Practice Panel</h2>
          </div>

          {/* Active CV Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-(--muted-foreground) uppercase tracking-wider">
              Active CV
            </label>
            {isLoadingResumes ? (
              <div className="flex items-center gap-2 py-2 text-xs text-(--muted-foreground)">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading CVs…
              </div>
            ) : readyResumes.length === 0 ? (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-dashed border-amber-500/25 bg-amber-500/5">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  No ready CV found.{" "}
                  <a href="/resumes" className="underline font-bold">
                    Upload one
                  </a>{" "}
                  first to practice.
                </div>
              </div>
            ) : (
              <select
                value={activeResumeId ?? ""}
                onChange={(e) => {
                  setStoredResumeId(e.target.value);
                  setActiveResumeId(e.target.value);
                }}
                className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm font-medium text-(--foreground) focus:outline-none focus:ring-2 focus:ring-(--primary)"
              >
                {readyResumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Choose level */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-(--muted-foreground) uppercase tracking-wider">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-1">
              {LEVELS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLevel(opt.value)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 border rounded-lg text-center transition-all",
                    level === opt.value
                      ? "border-(--primary) bg-(--accent)/20 text-(--primary) font-semibold"
                      : "border-(--border) text-(--foreground) hover:bg-(--muted)/40",
                  )}
                >
                  <span className="text-xs">{opt.label.split(" ")[0]}</span>
                  <span className="text-[9px] opacity-75">{opt.turns}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Start New Session CTA */}
          <button
            type="button"
            disabled={isCreatingSession || readyResumes.length === 0}
            onClick={handleStartNewInterview}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-(--foreground) px-4 py-2.5 text-sm font-medium text-(--background) transition-opacity hover:opacity-85 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isCreatingSession ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Start New Practice
          </button>
        </div>

        {/* Sessions History */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 bg-(--muted)/30 border-b border-(--border) flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-(--muted-foreground)" />
            <span className="text-xs font-bold uppercase tracking-wider text-(--muted-foreground)">
              Previous Conversations
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-(--border)/40">
            {isLoadingSessions ? (
              <div className="flex items-center gap-2 py-8 text-xs text-(--muted-foreground) justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading sessions…
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-(--muted-foreground)">
                No previous sessions found. Start a new session above!
              </div>
            ) : (
              sessions.map((sess) => {
                const isActive = activeSessionId === sess.id;
                const resumeObj = resumes.find((r) => r.id === sess.resumeId);
                const resumeName = resumeObj ? resumeObj.name : "Resume";

                return (
                  <button
                    key={sess.id}
                    type="button"
                    onClick={() => handleSelectSession(sess.id)}
                    className={cn(
                      "w-full text-left p-3.5 flex flex-col gap-1 transition-colors hover:bg-(--muted)/20",
                      isActive && "bg-(--accent)/15 border-l-4 border-(--primary) pl-2.5",
                    )}
                  >
                    <div className="flex justify-between items-start gap-2 min-w-0">
                      <span className="text-xs font-bold text-(--foreground) truncate flex-1">
                        {resumeName}
                      </span>
                      <span className={cn(
                        "text-[9px] uppercase tracking-wider font-semibold px-1 rounded shrink-0",
                        sess.isFinished
                          ? "bg-slate-500/10 text-slate-600"
                          : "bg-emerald-500/10 text-emerald-600"
                      )}>
                        {sess.isFinished ? "Finished" : "Active"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-(--muted-foreground)">
                      <span className="capitalize font-medium">
                        {sess.level} level · {sess.turnCount}/{sess.maxTurns} turns
                      </span>
                      <span>
                        {new Date(sess.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Expanded Chat Pane */}
      <div className="flex-1 bg-(--background) flex flex-col h-full min-w-0 overflow-hidden relative">
        {activeSessionId ? (
          <div className="flex-1 flex flex-col h-full p-4 overflow-hidden">
            <InterviewChat key={activeSessionId} sessionId={activeSessionId} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-(--background)">
            <div className="max-w-md space-y-4">
              <div className="mx-auto size-16 rounded-full bg-(--accent)/30 flex items-center justify-center text-(--primary) animate-bounce">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-(--foreground)">
                AI Mock Interview
              </h2>
              <p className="text-sm text-(--muted-foreground) leading-relaxed">
                Improve your system design and coding communication skills with our real-time AI interviewer.
              </p>
              <div className="pt-2 border-t border-(--border)/50 flex flex-col gap-2">
                <p className="text-xs text-(--muted-foreground)">
                  {readyResumes.length === 0
                    ? "Upload your resume PDF first to start practicing."
                    : "Select a previous conversation from history or start a new practice in the sidebar panel to begin."}
                </p>
                {readyResumes.length === 0 && (
                  <a
                    href="/resumes"
                    className="inline-flex mx-auto items-center gap-1.5 rounded-lg bg-(--foreground) px-4 py-2 text-xs font-semibold text-(--background) transition-opacity hover:opacity-85"
                  >
                    Go to Resumes
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <AppShell noPadding={true}>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-(--primary)" />
            <span className="text-sm text-(--muted-foreground)">Loading Practice…</span>
          </div>
        }
      >
        <PracticeContent />
      </Suspense>
    </AppShell>
  );
}
