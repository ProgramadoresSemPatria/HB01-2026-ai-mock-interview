import { AIMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { ChatOpenAI } from "@langchain/openai";

import { createInterviewModel } from "@/infrastructure/ai/openai-models";
import {
  appendClosingFeedbackCta,
  buildClosingFeedbackChatPromptTemplate,
} from "@/modules/interview/prompts/closing-feedback-prompt";
import { buildInterviewerChatPromptTemplate } from "@/modules/interview/prompts/interviewer-system-prompt";

import type { InterviewGraphState } from "../interview-state";

export type InterviewerNodeDeps = {
  model?: ChatOpenAI;
};

export function createInterviewerNode(deps: InterviewerNodeDeps = {}) {
  const model = deps.model ?? createInterviewModel();
  const outputParser = new StringOutputParser();

  return async function interviewerNode(
    state: InterviewGraphState,
    config?: RunnableConfig,
  ): Promise<Pick<InterviewGraphState, "messages">> {
    const promptTemplate = state.runReview
      ? buildClosingFeedbackChatPromptTemplate({
          level: state.level,
          resumeSummary: state.resumeSummary,
          interviewLocale: state.interviewLocale,
          jobDescription: state.jobDescription,
        })
      : buildInterviewerChatPromptTemplate({
          level: state.level,
          resumeSummary: state.resumeSummary,
          turnCount: state.turnCount,
          maxTurns: state.maxTurns,
          interviewLocale: state.interviewLocale,
          jobDescription: state.jobDescription,
        });

    const chain = promptTemplate.pipe(model).pipe(outputParser);
    const rawContent = await chain.invoke({ history: state.messages }, config);

    const content = state.runReview
      ? appendClosingFeedbackCta(rawContent, state.interviewLocale)
      : rawContent;

    return { messages: [new AIMessage({ content })] };
  };
}
