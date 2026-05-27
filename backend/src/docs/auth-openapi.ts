import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import {
  ErrorResponseSchema,
  ValidationErrorResponseSchema,
  jsonContent,
} from "./openapi-common";

const SignupRequestSchema = z.object({
  name: z.string().min(1).openapi({
    example: "Jane Doe",
  }),
  email: z.string().email().openapi({
    example: "jane@example.com",
  }),
  password: z.string().min(6).openapi({
    example: "secret123",
  }),
  confirmPassword: z.string().min(1).openapi({
    example: "secret123",
  }),
});

const LoginRequestSchema = z.object({
  email: z.string().email().openapi({
    example: "jane@example.com",
  }),
  password: z.string().min(1).openapi({
    example: "secret123",
  }),
});

const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1).openapi({
    example: "12c4d3af-1ef9-46d4-9471-4402d3d1ec69",
  }),
});

const RequestPasswordResetRequestSchema = z.object({
  email: z.string().email().openapi({
    example: "jane@example.com",
  }),
});

const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1).openapi({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  }),
  password: z.string().min(6).openapi({
    example: "new-secret123",
  }),
});

const UserResponseSchema = z.object({
  id: z.number().int().openapi({
    example: 1,
  }),
  name: z.string().openapi({
    example: "Jane Doe",
  }),
  email: z.string().email().openapi({
    example: "jane@example.com",
  }),
  createdAt: z.string().datetime().openapi({
    example: "2026-01-01T00:00:00.000Z",
  }),
  updatedAt: z.string().datetime().openapi({
    example: "2026-01-01T00:00:00.000Z",
  }),
});

const SignupResponseSchema = z.object({
  user: UserResponseSchema,
});

const LoginResponseSchema = z.object({
  user: UserResponseSchema,
  accessToken: z.string().openapi({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  }),
  refreshToken: z.string().uuid().openapi({
    example: "12c4d3af-1ef9-46d4-9471-4402d3d1ec69",
  }),
});

const RefreshResponseSchema = z.object({
  accessToken: z.string().openapi({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  }),
  refreshToken: z.string().uuid().openapi({
    example: "3488a0ce-bc79-4d11-a7cd-a8574fdbac9b",
  }),
});

const MessageResponseSchema = z.object({
  message: z.string(),
});

export function registerAuthOpenApi(registry: OpenAPIRegistry): void {
  registry.register("SignupRequest", SignupRequestSchema);
  registry.register("LoginRequest", LoginRequestSchema);
  registry.register("RefreshRequest", RefreshRequestSchema);
  registry.register(
    "RequestPasswordResetRequest",
    RequestPasswordResetRequestSchema,
  );
  registry.register("ResetPasswordRequest", ResetPasswordRequestSchema);
  registry.register("AuthUser", UserResponseSchema);
  registry.register("SignupResponse", SignupResponseSchema);
  registry.register("LoginResponse", LoginResponseSchema);
  registry.register("RefreshResponse", RefreshResponseSchema);
  registry.register("MessageResponse", MessageResponseSchema);

  registry.registerPath({
    method: "post",
    path: "/api/auth/signup",
    tags: ["Auth"],
    summary: "Create account",
    request: {
      body: {
        required: true,
        content: jsonContent(SignupRequestSchema),
      },
    },
    responses: {
      201: {
        description: "User created successfully",
        content: jsonContent(SignupResponseSchema),
      },
      400: {
        description: "Business validation error",
        content: jsonContent(ErrorResponseSchema),
      },
      422: {
        description: "Request validation error",
        content: jsonContent(ValidationErrorResponseSchema),
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/login",
    tags: ["Auth"],
    summary: "Authenticate user",
    request: {
      body: {
        required: true,
        content: jsonContent(LoginRequestSchema),
      },
    },
    responses: {
      200: {
        description: "Authenticated successfully",
        content: jsonContent(LoginResponseSchema),
      },
      401: {
        description: "Invalid credentials",
        content: jsonContent(ErrorResponseSchema),
      },
      422: {
        description: "Request validation error",
        content: jsonContent(ValidationErrorResponseSchema),
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/refresh",
    tags: ["Auth"],
    summary: "Rotate access and refresh tokens",
    request: {
      body: {
        required: true,
        content: jsonContent(RefreshRequestSchema),
      },
    },
    responses: {
      200: {
        description: "Tokens rotated successfully",
        content: jsonContent(RefreshResponseSchema),
      },
      401: {
        description: "Refresh token invalid or expired",
        content: jsonContent(ErrorResponseSchema),
      },
      422: {
        description: "Request validation error",
        content: jsonContent(ValidationErrorResponseSchema),
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/request-password-reset",
    tags: ["Auth"],
    summary: "Request password reset instructions",
    request: {
      body: {
        required: true,
        content: jsonContent(RequestPasswordResetRequestSchema),
      },
    },
    responses: {
      200: {
        description: "Password reset instructions processed",
        content: jsonContent(MessageResponseSchema),
      },
      422: {
        description: "Request validation error",
        content: jsonContent(ValidationErrorResponseSchema),
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/reset-password",
    tags: ["Auth"],
    summary: "Reset password with token",
    request: {
      body: {
        required: true,
        content: jsonContent(ResetPasswordRequestSchema),
      },
    },
    responses: {
      200: {
        description: "Password updated successfully",
        content: jsonContent(MessageResponseSchema),
      },
      401: {
        description: "Reset token invalid or expired",
        content: jsonContent(ErrorResponseSchema),
      },
      422: {
        description: "Request validation error",
        content: jsonContent(ValidationErrorResponseSchema),
      },
    },
  });
}
