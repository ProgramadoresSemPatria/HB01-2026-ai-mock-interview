import { ChatOpenAI } from "@langchain/openai";

import { env } from "@/config/env";

function createOpenAIModel(model: string): ChatOpenAI {
  return new ChatOpenAI({
    model,
    apiKey: env.OPENAI_API_KEY,
  });
}

export function createInterviewModel(): ChatOpenAI {
  return createOpenAIModel(env.OPENAI_MODEL_INTERVIEW);
}

export function createExtractionModel(): ChatOpenAI {
  return createOpenAIModel(env.OPENAI_MODEL_EXTRACTION);
}

export function createReviewModel(): ChatOpenAI {
  return createOpenAIModel(env.OPENAI_MODEL_REVIEW);
}
