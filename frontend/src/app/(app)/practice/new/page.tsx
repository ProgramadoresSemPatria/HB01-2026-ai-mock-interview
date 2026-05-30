"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AppShell } from "@/features/dashboard/app-shell";
import { useAuth } from "@/features/auth/session-provider";
import { getStoredResumeId } from "@/features/auth/session-storage";
import { interviewApi } from "@/lib/api/interview";
import { useResume } from "@/lib/query/hooks/use-resume";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { InterviewLevel } from "@/types/interview";

const LEVELS: { value: InterviewLevel; label: string; description: string }[] =
  [
    { value: "entry", label: "Entry", description: "5 turns" },
    { value: "mid", label: "Mid", description: "7 turns" },
    { value: "senior", label: "Senior", description: "8 turns" },
  ];

function NewSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resumeId") ?? getStoredResumeId() ?? "";
  const { fetchWithAuth } = useAuth();
  const [level, setLevel] = useState<InterviewLevel>("mid");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resumeQuery = useResume(resumeId || null);

  async function handleStart() {
    if (!resumeId) {
      toast.error("Missing resume. Upload a PDF first.");
      router.push("/practice");
      return;
    }
    if (resumeQuery.data?.status !== "ready") {
      toast.error("Resume is not ready yet.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { id } = await fetchWithAuth((token) =>
        interviewApi.createSession({ resumeId, level }, token),
      );
      router.push(`/interview/${id}`);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to create session",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!resumeId) {
    return (
      <p className="text-sm text-(--muted-foreground)">
        No resume selected.{" "}
        <a href="/practice" className="text-(--primary) underline">
          Upload one first
        </a>
        .
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-(--foreground)">
          Choose interview level
        </h1>
        {resumeQuery.data && (
          <p className="mt-1 text-sm text-(--muted-foreground)">
            Resume: {resumeQuery.data.name}
            {resumeQuery.data.status !== "ready" &&
              ` (${resumeQuery.data.status})`}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {LEVELS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLevel(opt.value)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
              level === opt.value
                ? "border-(--primary) bg-(--accent)/40"
                : "border-(--border) hover:bg-(--muted)/50",
            )}
          >
            <span className="font-medium text-(--foreground)">{opt.label}</span>
            <span className="text-xs text-(--muted-foreground)">
              {opt.description}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={
          isSubmitting ||
          resumeQuery.isLoading ||
          resumeQuery.data?.status !== "ready"
        }
        className="w-full rounded-lg bg-(--foreground) py-2.5 text-sm font-medium text-(--background) disabled:opacity-50"
      >
        {isSubmitting ? "Starting…" : "Start interview"}
      </button>
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <AppShell>
      <Suspense
        fallback={<p className="text-sm text-(--muted-foreground)">Loading…</p>}
      >
        <NewSessionContent />
      </Suspense>
    </AppShell>
  );
}
