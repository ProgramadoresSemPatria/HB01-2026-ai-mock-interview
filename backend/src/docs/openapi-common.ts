import {
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const openApiRegistry = new OpenAPIRegistry();

openApiRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT access token",
});

export const ErrorResponseSchema = openApiRegistry.register(
  "ErrorResponse",
  z.object({
    message: z.string(),
  }),
);

export const ValidationErrorResponseSchema = openApiRegistry.register(
  "ValidationErrorResponse",
  z.object({
    message: z.literal("Validation failed"),
    errors: z.unknown(),
  }),
);

export function jsonContent(schema: z.ZodTypeAny) {
  return {
    "application/json": {
      schema,
    },
  };
}
