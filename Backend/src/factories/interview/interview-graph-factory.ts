import { buildInterviewGraph } from "@/infrastructure/ai/langgraph/build-interview-graph";
import { getCheckpointer } from "@/infrastructure/ai/checkpoint/postgres-checkpointer";
import type { IInterviewGraph } from "@/modules/interview/protocols/interview-graph";

let interviewGraph: IInterviewGraph | undefined;

export function makeInterviewGraph(): IInterviewGraph {
  if (!interviewGraph) {
    interviewGraph = buildInterviewGraph(getCheckpointer());
  }
  return interviewGraph;
}
