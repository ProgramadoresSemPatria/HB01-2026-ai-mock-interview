import { env } from "@/config/env";
import { setupSwagger } from "@/docs/setup-swagger";
import { errorHandler } from "@/shared/middlewares/error-handler-middleware";
import cors from "cors";
import express, { type Express } from "express";

import { setup as setupCheckpointer } from "@/infrastructure/ai/checkpoint/postgres-checkpointer";
import { makeCheckAuth } from "@/factories/auth/check-auth-factory";
import { setupRoutes } from "./routes";

export async function createApp(): Promise<Express> {
  await setupCheckpointer();

  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.use(express.json());
  setupSwagger(app);
  app.use(makeCheckAuth());

  await setupRoutes(app);

  app.get("/", (_req, res) => {
    res.status(200).send("OK");
  });

  app.use((_req, res) => {
    res.status(404).json({ message: "Not Found" });
  });

  app.use(errorHandler);

  return app;
}
