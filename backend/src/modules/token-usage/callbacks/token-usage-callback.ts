import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";

import type { LlmUsage } from "@/modules/token-usage/types/llm-usage";
import { extractLlmUsageFromLlmOutput } from "@/modules/token-usage/utils/extract-llm-usage";

export function createUsageCaptureCallback(): {
  callback: BaseCallbackHandler;
  getUsage: () => LlmUsage | undefined;
} {
  let captured: LlmUsage | undefined;

  const callback = BaseCallbackHandler.fromMethods({
    handleLLMEnd(output: LLMResult) {
      const fromOutput = extractLlmUsageFromLlmOutput(output.llmOutput);
      if (fromOutput) {
        captured = fromOutput;
      }
    },
  });

  return {
    callback,
    getUsage: () => captured,
  };
}
