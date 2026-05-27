import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

import { env } from "@/config/env";

let checkpointerInstance: PostgresSaver | undefined;

export function getCheckpointer(): PostgresSaver {
  if (!checkpointerInstance) {
    checkpointerInstance = PostgresSaver.fromConnString(env.DATABASE_URL);
  }
  return checkpointerInstance;
}

export async function setup(): Promise<void> {
  await getCheckpointer().setup();
}
