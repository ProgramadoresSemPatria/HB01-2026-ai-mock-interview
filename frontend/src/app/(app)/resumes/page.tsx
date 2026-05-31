"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  Calendar,
  Star,
} from "lucide-react";

import { AppShell } from "@/features/dashboard/app-shell";
import { useAuth } from "@/features/auth/session-provider";
import { uploadResume, deleteResume } from "@/lib/api/resumes";
import { useResumes } from "@/lib/query/hooks/use-resumes";
import { queryKeys } from "@/lib/query/keys";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  getStoredResumeId,
  setStoredResumeId,
} from "@/features/auth/session-storage";

type UploadState = "idle" | "uploading";

export default function ResumesPage() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(() =>
    getStoredResumeId(),
  );

  const { data, isLoading, error } = useResumes();
  const resumes = data?.resumes ?? [];

  // Automatically make the first ready resume active if none is set
  const readyResumes = resumes.filter((r) => r.status === "ready");
  if (!activeResumeId && readyResumes.length > 0) {
    const firstReadyId = readyResumes[0].id;
    setStoredResumeId(firstReadyId);
    setActiveResumeId(firstReadyId);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    const token = await getAccessToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setUploadError(null);
    setUploadState("uploading");

    try {
      const preview = await uploadResume(file, token);
      toast.success("Resume uploaded successfully! Processing started.");
      
      // Invalidate query to trigger refresh
      void queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
      
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // If no active resume is set, set this one
      if (!activeResumeId) {
        setStoredResumeId(preview.id);
        setActiveResumeId(preview.id);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Upload failed";
      setUploadError(message);
      toast.error(message);
    } finally {
      setUploadState("idle");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this resume? All related interview sessions will be lost.")) {
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setDeletingId(id);
    try {
      await deleteResume(id, token);
      toast.success("Resume deleted successfully");
      
      // Invalidate queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviewItems });
      
      if (activeResumeId === id) {
        setStoredResumeId("");
        setActiveResumeId(null);
      }
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to delete resume",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleSetActive(id: string) {
    setStoredResumeId(id);
    setActiveResumeId(id);
    toast.success("Active resume updated!");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">
            My Resumes
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            Upload, manage, and select your active resumes for AI mock interviews.
          </p>
        </div>

        {/* Upload Form */}
        <div className="rounded-2xl border border-(--border) bg-(--card) p-6 shadow-sm">
          <h2 className="text-base font-semibold text-(--foreground) mb-4">
            Upload New Resume
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setUploadError(null);
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "cursor-pointer flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-(--border) p-8 transition-colors hover:border-(--primary)/50",
                file && "border-(--primary) bg-(--accent)/20",
              )}
            >
              {file ? (
                <>
                  <FileText className="h-10 w-10 text-(--primary)" />
                  <span className="text-sm font-medium text-(--foreground)">
                    {file.name}
                  </span>
                  <span className="text-xs text-(--muted-foreground)">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · PDF selected
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-(--muted-foreground)" />
                  <span className="text-sm font-medium text-(--foreground)">
                    Click to select a PDF resume
                  </span>
                  <span className="text-xs text-(--muted-foreground)">
                    Only PDF files are supported
                  </span>
                </>
              )}
            </button>

            {uploadError && (
              <p className="text-sm text-red-600 font-medium">{uploadError}</p>
            )}

            <button
              type="submit"
              disabled={!file || uploadState === "uploading"}
              className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-(--foreground) px-4 py-2.5 text-sm font-medium text-(--background) transition-opacity hover:opacity-85 disabled:opacity-50 disabled:pointer-events-none"
            >
              {uploadState === "uploading" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {uploadState === "uploading" ? "Uploading & Enqueuing…" : "Upload PDF Resume"}
            </button>
          </form>
        </div>

        {/* Resumes List */}
        <div className="rounded-2xl border border-(--border) bg-(--card) p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-(--foreground)">
            Saved Resumes
          </h2>

          {isLoading && (
            <div className="flex items-center gap-2 py-8 text-sm text-(--muted-foreground) justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading resumes…
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 text-center py-8">
              {error instanceof Error ? error.message : "Failed to load resumes"}
            </p>
          )}

          {!isLoading && !error && resumes.length === 0 && (
            <div className="text-center py-12 text-sm text-(--muted-foreground) border border-dashed border-(--border) rounded-xl">
              No resumes found. Upload your first PDF resume above to start practicing.
            </div>
          )}

          {!isLoading && !error && resumes.length > 0 && (
            <div className="divide-y divide-(--border) overflow-hidden rounded-xl border border-(--border)">
              {resumes.map((resume) => {
                const isActive = activeResumeId === resume.id;
                const isReady = resume.status === "ready";
                const isFailed = resume.status === "failed";
                const isProcessing = resume.status === "processing";

                return (
                  <div
                    key={resume.id}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-colors",
                      isActive ? "bg-(--accent)/10" : "hover:bg-(--muted)/20",
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <FileText className={cn("h-8 w-8 shrink-0 mt-0.5", isActive ? "text-(--primary)" : "text-(--muted-foreground)")} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-(--foreground) truncate">
                          {resume.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-(--muted-foreground)">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(resume.createdAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          {/* Status Badge */}
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium text-[10px] uppercase tracking-wider",
                              isReady && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                              isFailed && "bg-red-500/10 text-red-600 dark:text-red-400",
                              isProcessing && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                            )}
                          >
                            {isProcessing && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                            {isReady && <CheckCircle className="h-2.5 w-2.5" />}
                            {isFailed && <XCircle className="h-2.5 w-2.5" />}
                            {resume.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isReady && (
                        <button
                          type="button"
                          onClick={() => handleSetActive(resume.id)}
                          className={cn(
                            "cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                            isActive
                              ? "bg-(--primary) text-(--primary-foreground) border-transparent"
                              : "border-(--border) text-(--foreground) hover:bg-(--muted)",
                          )}
                        >
                          <Star className={cn("h-3.5 w-3.5 fill-current", isActive ? "text-yellow-300" : "text-transparent")} />
                          {isActive ? "Active" : "Set Active"}
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={deletingId === resume.id}
                        onClick={() => handleDelete(resume.id)}
                        className="cursor-pointer p-1.5 rounded-lg border border-(--border) text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Delete resume"
                      >
                        {deletingId === resume.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
