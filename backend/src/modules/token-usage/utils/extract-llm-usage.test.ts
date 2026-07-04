import { describe, expect, it } from "vitest";

import {
  extractLlmUsageFromLlmOutput,
  extractLlmUsageFromMetadata,
  extractLlmUsageFromTokenUsage,
} from "./extract-llm-usage";

describe("extractLlmUsageFromMetadata", () => {
  it("reads input and output token counts from usage_metadata", () => {
    expect(
      extractLlmUsageFromMetadata({
        usage_metadata: {
          input_tokens: 120,
          output_tokens: 45,
          total_tokens: 165,
        },
      }),
    ).toEqual({
      promptTokens: 120,
      completionTokens: 45,
    });
  });
});

describe("extractLlmUsageFromTokenUsage", () => {
  it("reads prompt and completion token counts", () => {
    expect(
      extractLlmUsageFromTokenUsage({
        promptTokens: 80,
        completionTokens: 20,
        totalTokens: 100,
      }),
    ).toEqual({
      promptTokens: 80,
      completionTokens: 20,
    });
  });
});

describe("extractLlmUsageFromLlmOutput", () => {
  it("reads tokenUsage from llmOutput", () => {
    expect(
      extractLlmUsageFromLlmOutput({
        tokenUsage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
      }),
    ).toEqual({
      promptTokens: 10,
      completionTokens: 5,
    });
  });
});
