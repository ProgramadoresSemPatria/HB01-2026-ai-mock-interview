export const RESUME_STATUSES = ["processing", "ready", "failed"] as const;
export type ResumeStatus = (typeof RESUME_STATUSES)[number];

export const RESUME_STATUS = {
  processing: "processing",
  ready: "ready",
  failed: "failed",
} as const satisfies Record<string, ResumeStatus>;

export type ResumeRecord = {
  id: string;
  userId: number;
  name: string;
  status: ResumeStatus;
  pdfUrl: string;
  storageKey: string;
  structuredSummary: unknown | null;
  rawText: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};
