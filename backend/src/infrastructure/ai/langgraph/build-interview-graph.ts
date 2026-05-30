import { HumanMessage } from "@langchain/core/messages";

import { END, START, StateGraph } from "@langchain/langgraph";

import type { BaseCheckpointSaver } from "@langchain/langgraph";

import type {
  IInterviewGraph,
  InterviewGraphInput,
} from "@/modules/interview/protocols/interview-graph";

import {
  InterviewGraphStateAnnotation,
  type InterviewGraphState,
} from "./interview-state";

import { createClosingFeedbackNode } from "./nodes/closing-feedback-node";

import { createInterviewerNode } from "./nodes/interviewer-node";

import {
  extractStreamTokenFromChunk,
  resolveCompletedAiMessage,
} from "./stream-message-tokens";

export type BuildInterviewGraphDeps = {
  checkpointer: BaseCheckpointSaver;
};

function routeFromStart(
  state: InterviewGraphState,
): "interviewer" | "closing_feedback" {
  return state.runReview ? "closing_feedback" : "interviewer";
}

function buildCompiledGraph(deps: BuildInterviewGraphDeps) {
  return new StateGraph(InterviewGraphStateAnnotation)

    .addNode("interviewer", createInterviewerNode())

    .addNode("closing_feedback", createClosingFeedbackNode())

    .addConditionalEdges(START, routeFromStart, [
      "interviewer",

      "closing_feedback",
    ])

    .addEdge("interviewer", END)

    .addEdge("closing_feedback", END)

    .compile({ checkpointer: deps.checkpointer });
}

export function createInterviewGraphConfig(sessionId: string) {
  return {
    configurable: {
      thread_id: sessionId,
    },
  };
}

export function buildInterviewGraph(
  checkpointer: BaseCheckpointSaver,
): IInterviewGraph {
  const graph = buildCompiledGraph({ checkpointer });

  return {
    async *streamMessages(
      input: InterviewGraphInput,

      options: { threadId: string },
    ) {
      const lastMessage = input.messages.at(-1);

      const humanContent = lastMessage?.content ?? "";

      const graphConfig = createInterviewGraphConfig(options.threadId);

      const stream = await graph.stream(
        {
          messages: [new HumanMessage(humanContent)],

          turnCount: input.turnCount,

          maxTurns: input.maxTurns,

          level: input.level,

          userId: input.userId,

          resumeSummary: input.resumeSummary,

          isFinished: input.isFinished,

          runReview: input.runReview,
        },

        {
          ...graphConfig,

          streamMode: "messages",
        },
      );

      for await (const chunk of stream) {
        const content = extractStreamTokenFromChunk(chunk);

        if (content) {
          yield { content };
        }
      }

      const snapshot = await graph.getState(graphConfig);
      const completedAiMessage = resolveCompletedAiMessage(
        snapshot.values.messages,
      );

      return completedAiMessage;
    },
  };
}

export type CompiledInterviewGraph = ReturnType<typeof buildCompiledGraph>;

/** Exposed for unit tests that assert graph compilation with a mocked checkpointer. */

export function buildInterviewGraphForTest(
  deps: BuildInterviewGraphDeps,
): CompiledInterviewGraph {
  return buildCompiledGraph(deps);
}

/** @internal Exported for graph structure tests */

export { routeFromStart };
