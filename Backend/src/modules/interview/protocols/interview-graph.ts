import type { InterviewLevel } from "@/modules/interview/validations/interview-schemas";
import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";

export type InterviewGraphStreamToken = {
  content: string;
};

export type InterviewGraphInput = {
  messages: { role: "human"; content: string }[];
  turnCount: number;
  maxTurns: number;
  level: InterviewLevel;
  userId: number;
  resumeSummary: StructuredSummary;
  isFinished: boolean;
  runReview: boolean;
};

export interface IInterviewGraph {
  streamMessages(
    input: InterviewGraphInput,
    options: { threadId: string },
  ): AsyncIterable<InterviewGraphStreamToken>;
}
