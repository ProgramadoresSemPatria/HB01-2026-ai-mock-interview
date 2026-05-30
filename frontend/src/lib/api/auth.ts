import type {
  LoginResponse,
  MessageResponse,
  RefreshResponse,
  SignupResponse,
  UserWithoutPassword,
} from "@/types/auth";

import { apiRequest } from "./client";

export const authApi = {
  signup(body: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    return apiRequest<SignupResponse>("/api/auth/signup", {
      method: "POST",
      body,
    });
  },

  login(body: { email: string; password: string }) {
    return apiRequest<LoginResponse>("/api/auth/login", {
      method: "POST",
      body,
    });
  },

  refresh(body: { refreshToken: string }) {
    return apiRequest<RefreshResponse>("/api/auth/refresh", {
      method: "POST",
      body,
    });
  },

  requestPasswordReset(body: { email: string }) {
    return apiRequest<MessageResponse>("/api/auth/request-password-reset", {
      method: "POST",
      body,
    });
  },

  resetPassword(body: { token: string; password: string }) {
    return apiRequest<MessageResponse>("/api/auth/reset-password", {
      method: "POST",
      body,
    });
  },
};

export type { UserWithoutPassword };
