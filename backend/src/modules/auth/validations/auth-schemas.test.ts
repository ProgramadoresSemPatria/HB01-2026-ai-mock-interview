import { describe, expect, it } from "vitest";

import {
  loginSchema,
  passwordResetSchema,
  refreshSchema,
  requestPasswordResetSchema,
  signupSchema,
} from "./index";

describe("signupSchema", () => {
  const validSignup = {
    name: "Jane Doe",
    email: "jane@example.com",
    password: "secret12",
    confirmPassword: "secret12",
  };

  it("accepts valid signup input and omits confirmPassword", () => {
    const result = signupSchema.safeParse(validSignup);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "secret12",
      });
      expect(result.data).not.toHaveProperty("confirmPassword");
    }
  });

  it("trims name and email", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      name: "  Jane Doe  ",
      email: "  jane@example.com  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jane Doe");
      expect(result.data.email).toBe("jane@example.com");
    }
  });

  it("rejects mismatched confirmPassword", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      confirmPassword: "different",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes("confirmPassword")),
      ).toBe(true);
    }
  });

  it("rejects password shorter than 6 characters", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      name: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing confirmPassword", () => {
    const { confirmPassword: _confirmPassword, ...withoutConfirm } = validSignup;
    const result = signupSchema.safeParse(withoutConfirm);

    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "any-password",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
      expect(result.data.password).toBe("any-password");
    }
  });

  it("trims email", () => {
    const result = loginSchema.safeParse({
      email: "  user@example.com  ",
      password: "secret",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid",
      password: "secret",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(loginSchema.safeParse({ email: "user@example.com" }).success).toBe(
      false,
    );
    expect(loginSchema.safeParse({ password: "secret" }).success).toBe(false);
  });
});

describe("refreshSchema", () => {
  it("accepts a non-empty refresh token", () => {
    const result = refreshSchema.safeParse({
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.refreshToken).toBe(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      );
    }
  });

  it("rejects empty refresh token", () => {
    const result = refreshSchema.safeParse({ refreshToken: "" });

    expect(result.success).toBe(false);
  });

  it("rejects missing refresh token", () => {
    const result = refreshSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe("passwordResetSchema", () => {
  it("accepts valid token and password", () => {
    const result = passwordResetSchema.safeParse({
      token: "reset-token-abc",
      password: "newpass1",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        token: "reset-token-abc",
        password: "newpass1",
      });
    }
  });

  it("rejects password shorter than 6 characters", () => {
    const result = passwordResetSchema.safeParse({
      token: "reset-token-abc",
      password: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty token", () => {
    const result = passwordResetSchema.safeParse({
      token: "",
      password: "newpass1",
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(
      passwordResetSchema.safeParse({ token: "abc" }).success,
    ).toBe(false);
    expect(
      passwordResetSchema.safeParse({ password: "newpass1" }).success,
    ).toBe(false);
  });
});

describe("requestPasswordResetSchema", () => {
  it("accepts a valid email", () => {
    const result = requestPasswordResetSchema.safeParse({
      email: "user@example.com",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("trims email", () => {
    const result = requestPasswordResetSchema.safeParse({
      email: "  user@example.com  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects invalid email", () => {
    const result = requestPasswordResetSchema.safeParse({
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = requestPasswordResetSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
