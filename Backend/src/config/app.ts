import { env } from "@/config/env";
import { errorHandler } from "@/shared";
import cors from "cors";
import express, { type Express } from "express";

import { makeCheckAuth } from "@/factories/auth/check-auth-factory";
import { setupRoutes } from "./routes";

export async function createApp(): Promise<Express> {
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
