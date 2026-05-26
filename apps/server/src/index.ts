import { createContext } from "@hackathon2026/api/context";
import { appRouter } from "@hackathon2026/api/routers/index";
import { env } from "@hackathon2026/env/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";

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

// Auth routes MVC serão registradas em /api/auth via setupRoutes (T28)

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

app.listen(env.PORT || 3000, () => {
  console.log(`Server is running on http://localhost:${env.PORT || 3000}`);
});
