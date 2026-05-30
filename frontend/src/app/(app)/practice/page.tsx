"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/features/dashboard/app-shell";
import { useAuth } from "@/features/auth/session-provider";
import {
  clearStoredResumeId,
  setStoredResumeId,
} from "@/features/auth/session-storage";
import { uploadResume } from "@/lib/api/resumes";
import { useResume } from "@/lib/query/hooks/use-resume";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type UploadState = "idle" | "uploading" | "polling" | "ready" | "error";

export default function PracticePage() {
  const { getAccessToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const resumeQuery = useResume(resumeId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    const token = await getAccessToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setError(null);
    setUploadState("uploading");

    try {
      const preview = await uploadResume(file, token);
      setResumeId(preview.id);
      setStoredResumeId(preview.id);
      setUploadState("polling");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Upload failed";
      setError(message);
      setUploadState("error");
      toast.error(message);
    }
  }

  const resume = resumeQuery.data;
  const isReady = resume?.status === "ready";
  const isFailed = resume?.status === "failed";
  const isProcessing =
    uploadState === "polling" && resume?.status === "processing";

  if (isReady && resumeId) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg space-y-6">
          <div className="flex items-center gap-3 text-emerald-600">
            <CheckCircle className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-semibold text-(--foreground)">
                Resume ready
              </h1>
              <p className="text-sm text-(--muted-foreground)">{resume.name}</p>
            </div>
          </div>
          <Link
            href={`/practice/new?resumeId=${resumeId}`}
            className="inline-flex w-full items-center justify-center rounded-lg bg-(--foreground) px-4 py-3 text-sm font-medium text-(--background) transition-opacity hover:opacity-85"
          >
            Choose level and start interview
          </Link>
          <button
            type="button"
            onClick={() => {
              setResumeId(null);
              setFile(null);
              setUploadState("idle");
              clearStoredResumeId();
            }}
            className="text-sm text-(--muted-foreground) underline"
          >
            Upload another resume
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-(--foreground)">
            Upload resume
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            PDF only. Processing runs asynchronously on the backend.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setError(null);
              setUploadState("idle");
              setResumeId(null);
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-(--border) p-8 transition-colors",
              file && "border-(--primary) bg-(--accent)/30",
            )}
          >
            {file ? (
              <>
                <FileText className="h-10 w-10 text-(--primary)" />
                <span className="text-sm font-medium text-(--foreground)">
                  {file.name}
                </span>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-(--muted-foreground)" />
                <span className="text-sm text-(--muted-foreground)">
                  Click to select a PDF
                </span>
              </>
            )}
          </button>

          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-(--muted-foreground)">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing resume…
            </div>
          )}

          {isFailed && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="h-4 w-4" />
              Resume processing failed. Try uploading again.
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={!file || uploadState === "uploading" || isProcessing}
            className="w-full rounded-lg bg-(--foreground) py-2.5 text-sm font-medium text-(--background) disabled:opacity-50"
          >
            {uploadState === "uploading" ? "Uploading…" : "Upload PDF"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
