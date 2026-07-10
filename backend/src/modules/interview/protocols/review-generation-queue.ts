export type ReviewGenerationJobData = {
  sessionId: string;
};

export interface IReviewGenerationQueue {
  add(params: { sessionId: string }): Promise<void>;
  /** Remove prior job (failed/completed) so the same jobId can be re-enqueued on manual retry */
  remove(sessionId: string): Promise<void>;
}
