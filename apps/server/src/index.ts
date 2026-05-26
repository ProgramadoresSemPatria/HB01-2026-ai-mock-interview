import { createContext } from "@hackathon2026/api/context";
import { appRouter } from "@hackathon2026/api/routers/index";
import { env } from "@hackathon2026/env/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";

import { setupRoutes } from "./config/routes";

async function main(): Promise<void> {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.use(express.json());

  await setupRoutes(app);

  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  app.get("/", (_req, res) => {
    res.status(200).send("OK");
  });

  const port = env.PORT || 3000;

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

main().catch((error: unknown) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
