import type { ReviewItemStatus, ReviewPriority } from "./review-items";

export type ReviewSessionStatus = "in_progress" | "pending_review" | "completed";

export type ReviewSessionItemReport = {
  id: string;
  reviewItemId: string;
  topic: string;
  currentPriority: ReviewPriority;
  suggestedStatus: ReviewItemStatus | null;
  suggestedPriority: ReviewPriority | null;
  confirmedStatus: ReviewItemStatus | null;
  confirmedPriority: ReviewPriority | null;
};

export type ReviewSession = {
  id: string;
  status: ReviewSessionStatus;
  items: ReviewSessionItemReport[];
};

export type CreateReviewSessionResponse = {
  id: string;
  status: "in_progress";
  items: Array<{
    id: string;
    reviewItemId: string;
    topic: string;
    currentPriority: ReviewPriority;
  }>;
};

/** SSE meta — in-progress turn */
export type ReviewSessionStreamMetaProgress = {
  reviewSessionItemId: string;
  itemIndex: number;
  totalItems: number;
  turnsCompleted: number;
  questionsPerItem: number;
  status: "in_progress";
};

/** SSE meta — evaluation complete */
export type ReviewSessionStreamMetaComplete = {
  status: "pending_review";
  report: Array<{
    reviewSessionItemId: string;
    reviewItemId: string;
    topic: string;
    currentPriority: ReviewPriority;
    suggestedStatus: ReviewItemStatus | null;
    suggestedPriority: ReviewPriority | null;
  }>;
};

export type ReviewSessionStreamMeta =
  | ReviewSessionStreamMetaProgress
  | ReviewSessionStreamMetaComplete;

export type ApplyReviewSessionItem = {
  reviewSessionItemId: string;
  status: ReviewItemStatus;
  priority?: ReviewPriority;
};

export type ApplyReviewSessionRequest = {
  items: ApplyReviewSessionItem[];
};
