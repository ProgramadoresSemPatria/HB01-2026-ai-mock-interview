import { AIMessage, SystemMessage } from "@langchain/core/messages";

import type { ChatOpenAI } from "@langchain/openai";

import { createInterviewModel } from "@/infrastructure/ai/openai-models";

import {
  appendClosingFeedbackCta,
  buildClosingFeedbackPrompt,
} from "@/modules/interview/prompts/closing-feedback-prompt";
import { buildInterviewerSystemPrompt } from "@/modules/interview/prompts/interviewer-system-prompt";

import type { InterviewGraphState } from "../interview-state";

export type InterviewerNodeDeps = {
  model?: ChatOpenAI;
};

export function createInterviewerNode(deps: InterviewerNodeDeps = {}) {
  const model = deps.model ?? createInterviewModel();

  return async function interviewerNode(
    state: InterviewGraphState,
  ): Promise<Pick<InterviewGraphState, "messages">> {
    const systemPrompt = state.runReview
      ? buildClosingFeedbackPrompt({
          level: state.level,
          resumeSummary: state.resumeSummary,
        })
      : buildInterviewerSystemPrompt({
          level: state.level,
          resumeSummary: state.resumeSummary,
          turnCount: state.turnCount,
          maxTurns: state.maxTurns,
        });

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      ...state.messages,
    ]);

    const rawContent =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    const content = state.runReview
      ? appendClosingFeedbackCta(rawContent)
      : rawContent;

    return { messages: [new AIMessage({ content })] };
  };
}
