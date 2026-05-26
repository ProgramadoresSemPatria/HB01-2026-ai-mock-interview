import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    findFirst: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock("@/infrastructure/database", () => ({
  default: mockPrisma,
}));

vi.mock("@/config/env", () => ({
  env: {
    REFRESH_EXPIRES: 3600,
  },
}));

import { UserRepository } from "./user-repository";

const sampleUser = {
  id: 1,
  name: "Jane Doe",
  email: "jane@example.com",
  password: "hashed-password",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

const sampleRefreshToken = {
  id: "refresh-id",
  token: "refresh-token-value",
  userId: 1,
  expiresAt: new Date("2026-12-31T00:00:00.000Z"),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("UserRepository", () => {
  const repository = new UserRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("getByEmail queries user by email", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(sampleUser);

    const result = await repository.getByEmail(sampleUser.email);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: sampleUser.email },
    });
    expect(result).toEqual(sampleUser);
  });

  it("create persists a new user", async () => {
    const params = {
      name: sampleUser.name,
      email: sampleUser.email,
      password: sampleUser.password,
    };
    mockPrisma.user.create.mockResolvedValue(sampleUser);

    const result = await repository.create(params);

    expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: params });
    expect(result).toEqual(sampleUser);
  });

  it("getById queries user by id", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(sampleUser);

    const result = await repository.getById(sampleUser.id);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: sampleUser.id },
    });
    expect(result).toEqual(sampleUser);
  });

  it("update changes user fields", async () => {
    const updatedUser = { ...sampleUser, password: "new-hash" };
    mockPrisma.user.update.mockResolvedValue(updatedUser);

    const result = await repository.update(sampleUser.id, {
      password: "new-hash",
    });

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: sampleUser.id },
      data: { password: "new-hash" },
    });
    expect(result).toEqual(updatedUser);
  });

  it("saveRefreshToken persists expiresAt from REFRESH_EXPIRES", async () => {
    const now = new Date("2026-05-26T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const params = {
      id: sampleRefreshToken.id,
      token: sampleRefreshToken.token,
      userId: sampleRefreshToken.userId,
    };
    const expectedExpiresAt = new Date(now.getTime() + 3600 * 1000);
    mockPrisma.refreshToken.create.mockResolvedValue({
      ...sampleRefreshToken,
      expiresAt: expectedExpiresAt,
    });

    const result = await repository.saveRefreshToken(params);

    expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
      data: {
        ...params,
        expiresAt: expectedExpiresAt,
      },
    });
    expect(result.expiresAt).toEqual(expectedExpiresAt);
  });

  it("getRefreshTokenWithUser filters out expired tokens", async () => {
    const refreshWithUser = {
      ...sampleRefreshToken,
      user: sampleUser,
    };
    mockPrisma.refreshToken.findFirst.mockResolvedValue(refreshWithUser);

    const result = await repository.getRefreshTokenWithUser(
      sampleRefreshToken.token,
    );

    expect(mockPrisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: {
        token: sampleRefreshToken.token,
        expiresAt: { gt: expect.any(Date) },
      },
      include: { user: true },
    });
    expect(result).toEqual(refreshWithUser);
  });

  it("deleteRefreshToken removes token by value", async () => {
    mockPrisma.refreshToken.delete.mockResolvedValue(sampleRefreshToken);

    await repository.deleteRefreshToken(sampleRefreshToken.token);

    expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { token: sampleRefreshToken.token },
    });
  });

  it("revokeAllUserRefreshTokens deletes all tokens for a user", async () => {
    mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

    await repository.revokeAllUserRefreshTokens(sampleUser.id);

    expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: sampleUser.id },
    });
  });
});
