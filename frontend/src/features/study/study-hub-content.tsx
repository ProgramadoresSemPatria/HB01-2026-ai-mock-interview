"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, BookOpen, Loader2 } from "lucide-react";

import { useAuth } from "@/features/auth/session-provider";
import { InterviewLocaleSelector } from "@/features/interview-locale/interview-locale-selector";
import { useInterviewLocale } from "@/features/interview-locale/use-interview-locale";
import { StudyItemCard } from "@/features/study/study-item-card";
import { StudyResumeBanner } from "@/features/study/study-resume-banner";
import { StudySelectionBar } from "@/features/study/study-selection-bar";
import { StudyTabs } from "@/features/study/study-tabs";
import { setLastReviewSessionId } from "@/features/study/lib/review-session-storage";
import { ApiError } from "@/lib/api/client";
import { reviewItemsApi } from "@/lib/api/review-items";
import { reviewSessionsApi } from "@/lib/api/review-sessions";
import { useReviewItems } from "@/lib/query/hooks/use-review-items";

type StudyTab = "active" | "learned";

const MAX_SELECTION = 10;

export function StudyHubContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getAccessToken, fetchWithAuth } = useAuth();
  const { locale } = useInterviewLocale();

  const [activeTab, setActiveTab] = useState<StudyTab>("active");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isStarting, setIsStarting] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const reviewQuery = useReviewItems(activeTab);
  const items = useMemo(
    () => reviewQuery.data?.reviewItems ?? [],
    [reviewQuery.data?.reviewItems],
  );

  const visibleItemIds = useMemo(
    () => new Set(items.map((item) => item.id)),
    [items],
  );

  const effectiveSelectedIds = useMemo(
    () => new Set([...selectedIds].filter((id) => visibleItemIds.has(id))),
    [selectedIds, visibleItemIds],
  );

  function handleTabChange(tab: StudyTab) {
    setActiveTab(tab);
    setSelectedIds(new Set());
  }

  function handleSelectToggle(itemId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
        return next;
      }
      if (next.size >= MAX_SELECTION) {
        toast.error("You can select at most 10 topics per session");
        return prev;
      }
      next.add(itemId);
      return next;
    });
  }

  async function invalidateReviewItems() {
    await queryClient.invalidateQueries({ queryKey: ["review-items"] });
  }

  async function handleMarkLearned(itemId: string) {
    setPendingItemId(itemId);
    try {
      await fetchWithAuth((token) =>
        reviewItemsApi.patchStatus(token, itemId, "learned"),
      );
      toast.success("Topic marked as learned");
      setSelectedIds((prev) => {
        if (!prev.has(itemId)) return prev;
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      await invalidateReviewItems();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to mark topic as learned",
      );
      await invalidateReviewItems();
    } finally {
      setPendingItemId(null);
    }
  }

  async function handleReactivate(itemId: string) {
    setPendingItemId(itemId);
    try {
      await fetchWithAuth((token) =>
        reviewItemsApi.patchStatus(token, itemId, "active"),
      );
      toast.success("Topic reactivated");
      await invalidateReviewItems();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to reactivate topic",
      );
      await invalidateReviewItems();
    } finally {
      setPendingItemId(null);
    }
  }

  async function handleDelete(itemId: string) {
    setPendingItemId(itemId);
    try {
      await fetchWithAuth((token) => reviewItemsApi.delete(token, itemId));
      toast.success("Topic deleted");
      setSelectedIds((prev) => {
        if (!prev.has(itemId)) return prev;
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      await invalidateReviewItems();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to delete topic",
      );
      await invalidateReviewItems();
    } finally {
      setPendingItemId(null);
    }
  }

  async function handleStartSession() {
    if (effectiveSelectedIds.size === 0 || isStarting) {
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setIsStarting(true);
    try {
      const response = await reviewSessionsApi.create(token, {
        reviewItemIds: [...effectiveSelectedIds],
        interviewLocale: locale,
      });
      setLastReviewSessionId(response.id);
      router.push(`/review-session/${response.id}`);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to start review session",
      );
      if (err instanceof ApiError && err.status === 404) {
        setSelectedIds(new Set());
        await invalidateReviewItems();
      }
    } finally {
      setIsStarting(false);
    }
  }

  const showSelection = activeTab === "active" && items.length > 0;
  const isItemPending = (itemId: string) => pendingItemId === itemId;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-(--primary)">
            <BookOpen className="h-5 w-5" />
            <h1 className="text-xl font-bold text-(--foreground)">Study</h1>
          </div>
          <p className="text-sm text-(--muted-foreground)">
            Manage your study backlog and start focused review sessions.
          </p>
        </div>
        <div className="sm:w-40 shrink-0">
          <InterviewLocaleSelector />
        </div>
      </div>

      <StudyResumeBanner />

      <StudyTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {reviewQuery.isLoading && (
        <div className="flex items-center gap-2 py-12 text-sm text-(--muted-foreground)">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading topics…
        </div>
      )}

      {reviewQuery.error && (
        <p className="text-sm text-red-600">
          {reviewQuery.error instanceof Error
            ? reviewQuery.error.message
            : "Failed to load study topics"}
        </p>
      )}

      {!reviewQuery.isLoading &&
        !reviewQuery.error &&
        items.length === 0 &&
        activeTab === "active" && (
          <div className="rounded-xl border border-dashed border-(--border) p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-(--muted-foreground) opacity-40" />
            <p className="mt-3 text-sm text-(--muted-foreground)">
              No active study topics yet. Complete a mock interview to generate
              topics from your feedback.
            </p>
            <Link
              href="/practice"
              className="mt-4 inline-block cursor-pointer rounded-lg bg-(--foreground) px-4 py-2 text-xs font-semibold text-(--background)"
            >
              Go to Practice
            </Link>
          </div>
        )}

      {!reviewQuery.isLoading &&
        !reviewQuery.error &&
        items.length === 0 &&
        activeTab === "learned" && (
          <div className="rounded-xl border border-dashed border-(--border) p-8 text-center">
            <p className="text-sm text-(--muted-foreground)">
              No mastered topics yet.
            </p>
          </div>
        )}

      {!reviewQuery.isLoading && !reviewQuery.error && items.length > 0 && (
        <div className="space-y-4">
          {items.map((item) => (
            <StudyItemCard
              key={item.id}
              item={item}
              selectable={showSelection}
              selected={effectiveSelectedIds.has(item.id)}
              onSelectToggle={
                showSelection && !isItemPending(item.id)
                  ? () => handleSelectToggle(item.id)
                  : undefined
              }
              onMarkLearned={
                !isItemPending(item.id)
                  ? () => void handleMarkLearned(item.id)
                  : undefined
              }
              onReactivate={
                !isItemPending(item.id)
                  ? () => void handleReactivate(item.id)
                  : undefined
              }
              onDelete={
                !isItemPending(item.id)
                  ? () => void handleDelete(item.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {showSelection && (
        <StudySelectionBar
          selectedCount={effectiveSelectedIds.size}
          onStart={() => void handleStartSession()}
          isStarting={isStarting}
        />
      )}
    </div>
  );
}
