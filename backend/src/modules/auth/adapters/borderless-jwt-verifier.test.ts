import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import { BorderlessJwtVerifier } from "./borderless-jwt-verifier";

const SECRET = "test-borderless-jwt-secret-at-least-32-chars";

describe("BorderlessJwtVerifier", () => {
  const verifier = new BorderlessJwtVerifier({ secret: SECRET });

  it("extracts claims from a valid token using sub + email + name", async () => {
    const token = jwt.sign(
      { sub: "ext-1", email: "a@example.com", name: "Ada" },
      SECRET,
      { expiresIn: "1h" },
    );

    await expect(verifier.verify(token)).resolves.toEqual({
      externalId: "ext-1",
      email: "a@example.com",
      name: "Ada",
    });
  });

  it("falls back to id and username when sub/name are absent", async () => {
    const token = jwt.sign(
      { id: "ext-2", email: "b@example.com", username: "bob" },
      SECRET,
      { expiresIn: "1h" },
    );

    await expect(verifier.verify(token)).resolves.toEqual({
      externalId: "ext-2",
      email: "b@example.com",
      name: "bob",
    });
  });

  it("defaults name to email local-part when name/username missing", async () => {
    const token = jwt.sign(
      { sub: "ext-3", email: "carol@example.com" },
      SECRET,
      { expiresIn: "1h" },
    );

    await expect(verifier.verify(token)).resolves.toMatchObject({
      name: "carol",
    });
  });

  it("rejects expired tokens", async () => {
    const token = jwt.sign(
      { sub: "ext-4", email: "d@example.com" },
      SECRET,
      { expiresIn: "0s" },
    );

    await expect(verifier.verify(token)).rejects.toThrow();
  });

  it("rejects tokens with wrong secret", async () => {
    const token = jwt.sign(
      { sub: "ext-5", email: "e@example.com" },
      "other-secret-at-least-32-characters!!",
      { expiresIn: "1h" },
    );

    await expect(verifier.verify(token)).rejects.toThrow();
  });

  it("rejects tokens missing email", async () => {
    const token = jwt.sign({ sub: "ext-6" }, SECRET, { expiresIn: "1h" });

    await expect(verifier.verify(token)).rejects.toThrow(
      /missing required identity claims/i,
    );
  });

  it("rejects tokens missing external id", async () => {
    const token = jwt.sign({ email: "f@example.com" }, SECRET, {
      expiresIn: "1h",
    });

    await expect(verifier.verify(token)).rejects.toThrow(
      /missing required identity claims/i,
    );
  });
});
