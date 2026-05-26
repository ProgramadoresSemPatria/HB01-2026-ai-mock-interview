import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  IMailer,
  IPasswordHasher,
  ITokenService,
  SignTokenOptions,
  TokenPayload,
} from "../protocols";
import type { UserRepository } from "../repository/user-repository";

const mockRandomUUID = vi.hoisted(() => vi.fn());

const stubLogger = vi.hoisted(() => ({
  warnCalls: [] as string[],
  warn(message: string) {
    this.warnCalls.push(message);
  },
}));

vi.mock("node:crypto", () => ({
  randomUUID: mockRandomUUID,
}));

vi.mock("@/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared")>();
  return {
    ...actual,
    logger: stubLogger,
  };
});

vi.mock("@/config/env", () => ({
  env: {
    JWT_SECRET: "test-jwt-secret-at-least-32-characters",
    FRONTEND_URL: "http://localhost:3001",
    RESET_PASSWORD_JWT_EXPIRE_IN: "1h",
  },
}));

import { BadRequestError, UnauthorizedError } from "@/shared";

import { AuthService } from "./auth-service";

class StubPasswordHasher implements IPasswordHasher {
  hashResult = "hashed-secret";
  compareResult = true;
  readonly hashCalls: string[] = [];
  readonly compareCalls: Array<{ plain: string; hash: string }> = [];

  async hash(plain: string): Promise<string> {
    this.hashCalls.push(plain);
    return this.hashResult;
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    this.compareCalls.push({ plain, hash });
    return this.compareResult;
  }
}

class StubTokenService implements ITokenService {
  signResult = "access-jwt";
  decodeResult: TokenPayload | null = null;
  verifyError: Error | null = null;
  readonly signCalls: Array<{
    payload: TokenPayload;
    options?: SignTokenOptions;
  }> = [];
  readonly verifyCalls: Array<{ token: string; secret?: string }> = [];
  readonly decodeCalls: string[] = [];

  sign(payload: TokenPayload, options?: SignTokenOptions): string {
    this.signCalls.push({ payload, options });
    return this.signResult;
  }

  verify<T extends TokenPayload = TokenPayload>(
    token: string,
    secret?: string,
  ): T {
    this.verifyCalls.push({ token, secret });
    if (this.verifyError) {
      throw this.verifyError;
    }
    return { userId: 1 } as unknown as T;
  }

  decode<T extends TokenPayload = TokenPayload>(token: string): T | null {
    this.decodeCalls.push(token);
    return this.decodeResult as T | null;
  }
}

class StubMailer implements IMailer {
  readonly sendCalls: Array<{ to: string; subject: string; body: string }> = [];

  async send(to: string, subject: string, body: string): Promise<void> {
    this.sendCalls.push({ to, subject, body });
  }
}

const mockUserRepository = {
  getByEmail: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  saveRefreshToken: vi.fn(),
  getRefreshTokenWithUser: vi.fn(),
  deleteRefreshToken: vi.fn(),
  revokeAllUserRefreshTokens: vi.fn(),
} as unknown as UserRepository;

const sampleUser = {
  id: 1,
  name: "Jane Doe",
  email: "jane@example.com",
  password: "hashed-password",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

describe("AuthService", () => {
  let passwordHasher: StubPasswordHasher;
  let tokenService: StubTokenService;
  let mailer: StubMailer;
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    stubLogger.warnCalls.length = 0;
    passwordHasher = new StubPasswordHasher();
    tokenService = new StubTokenService();
    mailer = new StubMailer();
    service = new AuthService(
      mockUserRepository,
      passwordHasher,
      tokenService,
      mailer,
    );
    mockRandomUUID
      .mockReturnValueOnce("refresh-id-uuid")
      .mockReturnValueOnce("refresh-token-uuid");
  });

  describe("signUp", () => {
    it("creates a user with hashed password and returns user without password", async () => {
      vi.mocked(mockUserRepository.getByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.create).mockResolvedValue({
        ...sampleUser,
        password: "hashed-secret",
      });

      const result = await service.signUp({
        name: sampleUser.name,
        email: sampleUser.email,
        password: "plain-password",
      });

      expect(mockUserRepository.getByEmail).toHaveBeenCalledWith(
        sampleUser.email,
      );
      expect(passwordHasher.hashCalls).toEqual(["plain-password"]);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        name: sampleUser.name,
        email: sampleUser.email,
        password: "hashed-secret",
      });
      expect(result).toEqual({
        id: sampleUser.id,
        name: sampleUser.name,
        email: sampleUser.email,
        createdAt: sampleUser.createdAt,
        updatedAt: sampleUser.updatedAt,
      });
      expect(result).not.toHaveProperty("password");
    });

    it("throws BadRequestError when email is already in use", async () => {
      vi.mocked(mockUserRepository.getByEmail).mockResolvedValue(sampleUser);

      await expect(
        service.signUp({
          name: "Other",
          email: sampleUser.email,
          password: "plain-password",
        }),
      ).rejects.toThrow(BadRequestError);

      expect(passwordHasher.hashCalls).toHaveLength(0);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("returns tokens and user without password when credentials are valid", async () => {
      vi.mocked(mockUserRepository.getByEmail).mockResolvedValue(sampleUser);
      passwordHasher.compareResult = true;
      vi.mocked(mockUserRepository.saveRefreshToken).mockResolvedValue({
        id: "refresh-id-uuid",
        token: "refresh-token-uuid",
        userId: sampleUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.login({
        email: sampleUser.email,
        password: "plain-password",
      });

      expect(passwordHasher.compareCalls).toEqual([
        { plain: "plain-password", hash: sampleUser.password },
      ]);
      expect(tokenService.signCalls).toEqual([
        { payload: { userId: sampleUser.id }, options: undefined },
      ]);
      expect(mockUserRepository.saveRefreshToken).toHaveBeenCalledWith({
        id: "refresh-id-uuid",
        token: "refresh-token-uuid",
        userId: sampleUser.id,
      });
      expect(result).toEqual({
        user: {
          id: sampleUser.id,
          name: sampleUser.name,
          email: sampleUser.email,
          createdAt: sampleUser.createdAt,
          updatedAt: sampleUser.updatedAt,
        },
        accessToken: "access-jwt",
        refreshToken: "refresh-token-uuid",
      });
      expect(result.user).not.toHaveProperty("password");
      expect(stubLogger.warnCalls).toHaveLength(0);
    });

    it("throws UnauthorizedError and logs warn when user is not found", async () => {
      vi.mocked(mockUserRepository.getByEmail).mockResolvedValue(null);

      await expect(
        service.login({
          email: "missing@example.com",
          password: "plain-password",
        }),
      ).rejects.toThrow(UnauthorizedError);

      expect(stubLogger.warnCalls).toEqual(["Invalid login attempt"]);
      expect(passwordHasher.compareCalls).toHaveLength(0);
      expect(tokenService.signCalls).toHaveLength(0);
      expect(mockUserRepository.saveRefreshToken).not.toHaveBeenCalled();
    });

    it("throws UnauthorizedError and logs warn when password does not match", async () => {
      vi.mocked(mockUserRepository.getByEmail).mockResolvedValue(sampleUser);
      passwordHasher.compareResult = false;

      await expect(
        service.login({
          email: sampleUser.email,
          password: "wrong-password",
        }),
      ).rejects.toThrow(UnauthorizedError);

      expect(stubLogger.warnCalls).toEqual(["Invalid login attempt"]);
      expect(tokenService.signCalls).toHaveLength(0);
      expect(mockUserRepository.saveRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe("refreshAccessToken", () => {
    it("rotates tokens, revokes existing refresh tokens, and persists the new refresh token", async () => {
      mockRandomUUID.mockReset();
      mockRandomUUID
        .mockReturnValueOnce("new-refresh-id")
        .mockReturnValueOnce("new-refresh-token");

      vi.mocked(mockUserRepository.getRefreshTokenWithUser).mockResolvedValue({
        id: "old-refresh-id",
        token: "old-refresh-token",
        userId: sampleUser.id,
        expiresAt: new Date("2026-12-31T00:00:00.000Z"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        user: sampleUser,
      });
      vi.mocked(
        mockUserRepository.revokeAllUserRefreshTokens,
      ).mockResolvedValue(undefined);
      let signedBeforeSave = false;
      vi.mocked(mockUserRepository.saveRefreshToken).mockImplementation(
        async (params) => {
          signedBeforeSave = tokenService.signCalls.length > 0;
          return {
            id: params.id,
            token: params.token,
            userId: params.userId,
            expiresAt: new Date(),
            createdAt: new Date(),
          };
        },
      );

      const result = await service.refreshAccessToken("old-refresh-token");

      expect(mockUserRepository.getRefreshTokenWithUser).toHaveBeenCalledWith(
        "old-refresh-token",
      );
      expect(
        mockUserRepository.revokeAllUserRefreshTokens,
      ).toHaveBeenCalledWith(sampleUser.id);
      expect(tokenService.signCalls).toEqual([
        { payload: { userId: sampleUser.id }, options: undefined },
      ]);
      expect(mockUserRepository.saveRefreshToken).toHaveBeenCalledWith({
        id: "new-refresh-id",
        token: "new-refresh-token",
        userId: sampleUser.id,
      });
      expect(result).toEqual({
        accessToken: "access-jwt",
        refreshToken: "new-refresh-token",
      });
      expect(signedBeforeSave).toBe(true);
    });

    it("throws UnauthorizedError with status 401 when refresh token is expired or revoked", async () => {
      vi.mocked(mockUserRepository.getRefreshTokenWithUser).mockResolvedValue(
        null,
      );

      await expect(
        service.refreshAccessToken("missing-or-expired-token"),
      ).rejects.toMatchObject({
        name: "UnauthorizedError",
        statusCode: 401,
      });

      expect(
        mockUserRepository.revokeAllUserRefreshTokens,
      ).not.toHaveBeenCalled();
      expect(tokenService.signCalls).toHaveLength(0);
      expect(mockUserRepository.saveRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe("requestPasswordReset", () => {
    it("signs a reset token with derived secret and sends email when user exists", async () => {
      vi.mocked(mockUserRepository.getByEmail).mockResolvedValue(sampleUser);
      tokenService.signResult = "reset-jwt-token";

      await service.requestPasswordReset(sampleUser.email);

      expect(mockUserRepository.getByEmail).toHaveBeenCalledWith(
        sampleUser.email,
      );
      expect(tokenService.signCalls).toEqual([
        {
          payload: { userId: sampleUser.id },
          options: {
            secret: `test-jwt-secret-at-least-32-characters${sampleUser.password}`,
            expiresIn: "1h",
          },
        },
      ]);
      expect(mailer.sendCalls).toEqual([
        {
          to: sampleUser.email,
          subject: "Password reset",
          body: "Use the following link to reset your password: http://localhost:3001/reset-password?token=reset-jwt-token",
        },
      ]);
    });

    it("returns silently without sending email when user does not exist", async () => {
      vi.mocked(mockUserRepository.getByEmail).mockResolvedValue(null);

      await expect(
        service.requestPasswordReset("missing@example.com"),
      ).resolves.toBeUndefined();

      expect(tokenService.signCalls).toHaveLength(0);
      expect(mailer.sendCalls).toHaveLength(0);
    });
  });

  describe("resetPassword", () => {
    it("verifies token with derived secret, hashes password, and updates user", async () => {
      tokenService.decodeResult = { userId: sampleUser.id };
      vi.mocked(mockUserRepository.getById).mockResolvedValue(sampleUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue({
        ...sampleUser,
        password: "hashed-secret",
      });

      await service.resetPassword("reset-jwt-token", "new-password");

      expect(tokenService.decodeCalls).toEqual(["reset-jwt-token"]);
      expect(mockUserRepository.getById).toHaveBeenCalledWith(sampleUser.id);
      expect(tokenService.verifyCalls).toEqual([
        {
          token: "reset-jwt-token",
          secret: `test-jwt-secret-at-least-32-characters${sampleUser.password}`,
        },
      ]);
      expect(passwordHasher.hashCalls).toEqual(["new-password"]);
      expect(mockUserRepository.update).toHaveBeenCalledWith(sampleUser.id, {
        password: "hashed-secret",
      });
    });

    it("throws UnauthorizedError when token is invalid or expired", async () => {
      tokenService.decodeResult = { userId: sampleUser.id };
      vi.mocked(mockUserRepository.getById).mockResolvedValue(sampleUser);
      tokenService.verifyError = new Error("invalid signature");

      await expect(
        service.resetPassword("bad-token", "new-password"),
      ).rejects.toMatchObject({
        name: "UnauthorizedError",
        statusCode: 401,
      });

      expect(passwordHasher.hashCalls).toHaveLength(0);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it("throws UnauthorizedError when decoded token has no userId", async () => {
      tokenService.decodeResult = {};

      await expect(
        service.resetPassword("malformed-token", "new-password"),
      ).rejects.toMatchObject({
        name: "UnauthorizedError",
        statusCode: 401,
      });

      expect(mockUserRepository.getById).not.toHaveBeenCalled();
      expect(tokenService.verifyCalls).toHaveLength(0);
    });
  });
});
