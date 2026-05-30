import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/infrastructure/database";
import { env } from "@/config/env";
import { disconnectDatabase, resetDatabase } from "@/test/integration/helpers";
import { UserRepository } from "./user-repository";

describe("UserRepository (integration)", () => {
  const repository = new UserRepository();

  const createUserParams = () => ({
    name: "Jane Doe",
    email: `jane-${crypto.randomUUID()}@example.com`,
    password: "$2b$10$hashedpasswordplaceholderfortests",
  });

  afterEach(async () => {
    vi.useRealTimers();
    await resetDatabase();
  });

  afterAll(() => disconnectDatabase());

  it("create persists a new user", async () => {
    const params = createUserParams();

    const created = await repository.create(params);

    expect(created).toMatchObject({
      name: params.name,
      email: params.email,
      password: params.password,
    });
    expect(created.id).toBeGreaterThan(0);
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  it("getByEmail returns user by email", async () => {
    const params = createUserParams();
    const created = await repository.create(params);

    const found = await repository.getByEmail(params.email);

    expect(found).toMatchObject({
      id: created.id,
      email: params.email,
      name: params.name,
    });
  });

  it("getByEmail returns null when email is unknown", async () => {
    const found = await repository.getByEmail("unknown@example.com");

    expect(found).toBeNull();
  });

  it("getById returns user by id", async () => {
    const params = createUserParams();
    const created = await repository.create(params);

    const found = await repository.getById(created.id);

    expect(found).toMatchObject({
      id: created.id,
      email: params.email,
    });
  });

  it("getById returns null when id does not exist", async () => {
    const found = await repository.getById(999_999);

    expect(found).toBeNull();
  });

  it("update changes user fields", async () => {
    const params = createUserParams();
    const created = await repository.create(params);
    const newPassword = "$2b$10$newhashplaceholderfortests";

    const updated = await repository.update(created.id, {
      password: newPassword,
    });

    expect(updated.id).toBe(created.id);
    expect(updated.password).toBe(newPassword);

    const reloaded = await repository.getById(created.id);
    expect(reloaded?.password).toBe(newPassword);
  });

  it("saveRefreshToken persists expiresAt from REFRESH_EXPIRES", async () => {
    const now = new Date("2026-05-26T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const user = await repository.create(createUserParams());
    const params = {
      id: "refresh-id",
      token: "refresh-token-value",
      userId: user.id,
    };

    const saved = await repository.saveRefreshToken(params);
    const expectedExpiresAt = new Date(now.getTime() + env.REFRESH_EXPIRES * 1000);

    expect(saved).toMatchObject({
      id: params.id,
      token: params.token,
      userId: user.id,
    });
    expect(saved.expiresAt).toEqual(expectedExpiresAt);
  });

  it("getRefreshTokenWithUser returns token with user when not expired", async () => {
    const user = await repository.create(createUserParams());
    const tokenValue = "valid-refresh-token";

    await repository.saveRefreshToken({
      id: "refresh-valid",
      token: tokenValue,
      userId: user.id,
    });

    const result = await repository.getRefreshTokenWithUser(tokenValue);

    expect(result).toMatchObject({
      token: tokenValue,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  });

  it("getRefreshTokenWithUser filters out expired tokens", async () => {
    const user = await repository.create(createUserParams());
    const tokenValue = "expired-refresh-token";

    await prisma.refreshToken.create({
      data: {
        id: "refresh-expired",
        token: tokenValue,
        userId: user.id,
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const result = await repository.getRefreshTokenWithUser(tokenValue);

    expect(result).toBeNull();
  });

  it("deleteRefreshToken removes token by value", async () => {
    const user = await repository.create(createUserParams());
    const tokenValue = "token-to-delete";

    await repository.saveRefreshToken({
      id: "refresh-delete",
      token: tokenValue,
      userId: user.id,
    });

    await repository.deleteRefreshToken(tokenValue);

    const result = await repository.getRefreshTokenWithUser(tokenValue);
    expect(result).toBeNull();
  });

  it("revokeAllUserRefreshTokens deletes all tokens for a user", async () => {
    const user = await repository.create(createUserParams());

    await repository.saveRefreshToken({
      id: "refresh-a",
      token: "token-a",
      userId: user.id,
    });
    await repository.saveRefreshToken({
      id: "refresh-b",
      token: "token-b",
      userId: user.id,
    });

    await repository.revokeAllUserRefreshTokens(user.id);

    expect(await repository.getRefreshTokenWithUser("token-a")).toBeNull();
    expect(await repository.getRefreshTokenWithUser("token-b")).toBeNull();

    const remaining = await prisma.refreshToken.count({
      where: { userId: user.id },
    });
    expect(remaining).toBe(0);
  });
});
