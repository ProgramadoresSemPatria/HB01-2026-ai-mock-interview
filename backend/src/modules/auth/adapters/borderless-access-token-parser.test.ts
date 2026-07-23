import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import { BorderlessAccessTokenParser } from "./borderless-access-token-parser";

const SIGNING_KEY = "test-only-signing-key-ignored-by-parser";

describe("BorderlessAccessTokenParser", () => {
  const parser = new BorderlessAccessTokenParser();

  it("extracts claims from a valid token using sub + email + name", async () => {
    const token = jwt.sign(
      { sub: "ext-1", email: "a@example.com", name: "Ada" },
      SIGNING_KEY,
      { expiresIn: "1h" },
    );

    await expect(parser.verify(token)).resolves.toEqual({
      externalId: "ext-1",
      email: "a@example.com",
      name: "Ada",
    });
  });

  it("falls back to id and username when sub/name are absent", async () => {
    const token = jwt.sign(
      { id: "ext-2", email: "b@example.com", username: "bob" },
      SIGNING_KEY,
      { expiresIn: "1h" },
    );

    await expect(parser.verify(token)).resolves.toEqual({
      externalId: "ext-2",
      email: "b@example.com",
      name: "bob",
    });
  });

  it("defaults name to email local-part when name/username missing", async () => {
    const token = jwt.sign(
      { sub: "ext-3", email: "carol@example.com" },
      SIGNING_KEY,
      { expiresIn: "1h" },
    );

    await expect(parser.verify(token)).resolves.toMatchObject({
      name: "carol",
    });
  });

  it("rejects expired tokens", async () => {
    const token = jwt.sign(
      { sub: "ext-4", email: "d@example.com" },
      SIGNING_KEY,
      { expiresIn: "0s" },
    );

    await expect(parser.verify(token)).rejects.toThrow(/expired/i);
  });

  it("accepts tokens signed with any key (signature not verified)", async () => {
    const token = jwt.sign(
      { sub: "ext-5", email: "e@example.com", name: "Eve" },
      "completely-different-key-does-not-matter",
      { expiresIn: "1h" },
    );

    await expect(parser.verify(token)).resolves.toEqual({
      externalId: "ext-5",
      email: "e@example.com",
      name: "Eve",
    });
  });

  it("rejects tokens missing email", async () => {
    const token = jwt.sign({ sub: "ext-6" }, SIGNING_KEY, { expiresIn: "1h" });

    await expect(parser.verify(token)).rejects.toThrow(
      /missing required identity claims/i,
    );
  });

  it("rejects tokens missing external id", async () => {
    const token = jwt.sign({ email: "f@example.com" }, SIGNING_KEY, {
      expiresIn: "1h",
    });

    await expect(parser.verify(token)).rejects.toThrow(
      /missing required identity claims/i,
    );
  });

  it("rejects non-JWT strings", async () => {
    await expect(parser.verify("not-a-jwt")).rejects.toThrow(
      /invalid token payload/i,
    );
  });
});
