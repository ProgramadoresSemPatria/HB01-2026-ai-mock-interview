import { createOpenApiDocument } from "@/docs/openapi";
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

export function setupSwagger(app: Express): void {
  const openApiDocument = createOpenApiDocument();

  app.get("/api-docs.json", (_req, res) => {
    res.status(200).json(openApiDocument);
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      explorer: true,
    }),
  );
}
