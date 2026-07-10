const LAST_REVIEW_SESSION_ID_KEY = "hone:last-review-session-id";

export function getLastReviewSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return sessionStorage.getItem(LAST_REVIEW_SESSION_ID_KEY);
}

export function setLastReviewSessionId(sessionId: string): void {
  sessionStorage.setItem(LAST_REVIEW_SESSION_ID_KEY, sessionId);
}

export function clearLastReviewSessionId(): void {
  sessionStorage.removeItem(LAST_REVIEW_SESSION_ID_KEY);
}
