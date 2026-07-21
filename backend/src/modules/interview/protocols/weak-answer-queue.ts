export interface IWeakAnswerQueue {
  add(params: { sessionId: string }): Promise<void>;
}
