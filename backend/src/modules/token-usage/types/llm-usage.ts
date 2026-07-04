export type LlmUsage = {
  promptTokens: number;
  completionTokens: number;
};

export function getTotalTokens(usage: LlmUsage): number {
  return usage.promptTokens + usage.completionTokens;
}
