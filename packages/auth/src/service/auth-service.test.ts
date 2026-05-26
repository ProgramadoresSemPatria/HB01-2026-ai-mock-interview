import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IPasswordHasher } from "../protocols/password-hasher";
import type {
  ITokenService,
  SignTokenOptions,
  TokenPayload,
} from "../protocols/token-service";
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

vi.mock("@hackathon2026/common", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@hackathon2026/common")>();
  return {
    ...actual,
    logger: stubLogger,
  };
});

import {
  BadRequestError,
  UnauthorizedError,
} from "@hackathon2026/common";

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
  readonly signCalls: Array<{
    payload: TokenPayload;
    options?: SignTokenOptions;
  }> = [];

  sign(payload: TokenPayload, options?: SignTokenOptions): string {
    this.signCalls.push({ payload, options });
    return this.signResult;
  }

  verify<T extends TokenPayload = TokenPayload>(
    _token: string,
    _secret?: string,
  ): T {
    throw new Error("StubTokenService.verify is not implemented");
  }

  decode<T extends TokenPayload = TokenPayload>(_token: string): T | null {
    return null;
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
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    stubLogger.warnCalls.length = 0;
    passwordHasher = new StubPasswordHasher();
    tokenService = new StubTokenService();
    service = new AuthService(
      mockUserRepository,
      passwordHasher,
      tokenService,
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
      vi.mocked(mockUserRepository.revokeAllUserRefreshTokens).mockResolvedValue(
        undefined,
      );
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
      expect(mockUserRepository.revokeAllUserRefreshTokens).toHaveBeenCalledWith(
        sampleUser.id,
      );
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
});
