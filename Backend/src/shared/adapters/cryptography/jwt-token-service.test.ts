import { describe, expect, it } from "vitest";

import { createJwtTokenService } from "./jwt-token-service";

const testConfig = {
  secret: "test-secret-key-at-least-32-characters-long",
  defaultExpiresIn: "1h",
} as const;

describe("JwtTokenService", () => {
  const tokenService = createJwtTokenService(testConfig);

  it("sign returns a JWT string", () => {
    const token = tokenService.sign({ userId: 1 });

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("verify returns the original payload for a valid token", () => {
    const payload = { userId: 42, role: "admin" };
    const token = tokenService.sign(payload);

    expect(tokenService.verify(token)).toMatchObject(payload);
  });

  it("verify accepts an optional secret override", () => {
    const customSecret = "another-secret-key-with-32-chars-min";
    const token = tokenService.sign({ userId: 1 }, { secret: customSecret });

    expect(tokenService.verify(token, customSecret)).toMatchObject({
      userId: 1,
    });
  });

  it("verify throws for an invalid token", () => {
    expect(() => tokenService.verify("not-a-valid-token")).toThrow();
  });

  it("decode returns payload without verifying signature", () => {
    const payload = { userId: 7 };
    const token = tokenService.sign(payload);

    expect(tokenService.decode(token)).toMatchObject(payload);
  });

  it("decode returns null for malformed tokens", () => {
    expect(tokenService.decode("not-a-valid-token")).toBeNull();
  });

  it("sign honors custom expiresIn in options", () => {
    const token = tokenService.sign({ userId: 1 }, { expiresIn: "2h" });

    expect(tokenService.verify(token)).toMatchObject({ userId: 1 });
  });
});
