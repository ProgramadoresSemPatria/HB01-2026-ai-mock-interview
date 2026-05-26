import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";

import { formatEnvValidationIssues, serverEnv } from "./server-schema";

export type { ServerEnv } from "./server-schema";

export const env = createEnv({
  server: serverEnv,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  onValidationError: (issues) => {
    throw new Error(formatEnvValidationIssues(issues));
  },
});
