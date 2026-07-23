import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import { openApiRegistry } from "./openapi-common";

export function createOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(openApiRegistry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Hackathon2026 API",
      version: "1.0.0",
      description:
        "Mock interview API. Authenticate with a Borderless Bearer access token.",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    tags: [],
  });
}
