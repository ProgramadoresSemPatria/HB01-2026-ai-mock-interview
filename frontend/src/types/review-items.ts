export type ReviewPriority = "low" | "medium" | "high";

export type ReviewItem = {
  id: string;
  sessionId: string;
  topic: string;
  description: string;
  priority: ReviewPriority;
  createdAt: string;
  updatedAt: string;
};

export type ListReviewItemsResponse = {
  reviewItems: ReviewItem[];
};
