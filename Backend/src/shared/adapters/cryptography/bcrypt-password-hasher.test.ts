import { describe, expect, it } from "vitest";

import { createBcryptPasswordHasher } from "./bcrypt-password-hasher";

describe("BcryptPasswordHasher", () => {
  const hasher = createBcryptPasswordHasher(4);

  it("hash returns a bcrypt hash different from the plain text", async () => {
    const hash = await hasher.hash("my-password");

    expect(hash).not.toBe("my-password");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("compare returns true for matching password", async () => {
    const hash = await hasher.hash("my-password");

    await expect(hasher.compare("my-password", hash)).resolves.toBe(true);
  });

  it("compare returns false for non-matching password", async () => {
    const hash = await hasher.hash("my-password");

    await expect(hasher.compare("wrong-password", hash)).resolves.toBe(false);
  });

  it("createBcryptPasswordHasher uses configurable salt rounds", async () => {
    const lowRounds = createBcryptPasswordHasher(4);
    const highRounds = createBcryptPasswordHasher(12);

    const lowHash = await lowRounds.hash("same-password");
    const highHash = await highRounds.hash("same-password");

    expect(lowHash).not.toBe(highHash);
    expect(await lowRounds.compare("same-password", lowHash)).toBe(true);
    expect(await highRounds.compare("same-password", highHash)).toBe(true);
  });
});
