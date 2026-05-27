import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import { registerAuthOpenApi } from "./auth-openapi";
import { openApiRegistry } from "./openapi-common";

registerAuthOpenApi(openApiRegistry);

export function createOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(openApiRegistry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Hackathon2026 API",
      version: "1.0.0",
      description: "Auth API documentation",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Authentication and password recovery endpoints",
      },
    ],
  });
}
