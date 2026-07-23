import { createAuthClient } from "better-auth/react";
import { credentialsClient } from "better-auth-credentials-plugin/client";
import { inferAdditionalFields } from "better-auth/client/plugins";

import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [credentialsClient(), inferAdditionalFields<typeof auth>()],
});
