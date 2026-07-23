import type {
  BorderlessTokenClaims,
  IBorderlessTokenVerifier,
} from "@/modules/auth/protocols/borderless-token-verifier";
import jwt from "jsonwebtoken";

type JwtPayloadRecord = Record<string, unknown>;

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractExternalId(payload: JwtPayloadRecord): string | null {
  return (
    asNonEmptyString(payload.sub) ??
    asNonEmptyString(payload.id) ??
    asNonEmptyString(payload.userId)
  );
}

function extractEmail(payload: JwtPayloadRecord): string | null {
  return asNonEmptyString(payload.email);
}

function extractName(payload: JwtPayloadRecord, email: string): string {
  return (
    asNonEmptyString(payload.name) ??
    asNonEmptyString(payload.username) ??
    email.split("@")[0] ??
    "User"
  );
}

function assertNotExpired(payload: JwtPayloadRecord): void {
  const exp = payload.exp;
  if (typeof exp !== "number") {
    return;
  }

  if (Date.now() >= exp * 1000) {
    throw new Error("Token expired");
  }
}

/**
 * Parses Borderless Bearer access tokens without signature verification.
 * Borderless does not share a JWT secret; identity comes from decoded claims.
 */
export class BorderlessAccessTokenParser implements IBorderlessTokenVerifier {
  async verify(token: string): Promise<BorderlessTokenClaims> {
    const decoded = jwt.decode(token);

    if (!decoded || typeof decoded === "string") {
      throw new Error("Invalid token payload");
    }

    const payload = decoded as JwtPayloadRecord;
    assertNotExpired(payload);

    const externalId = extractExternalId(payload);
    const email = extractEmail(payload);

    if (!externalId || !email) {
      throw new Error("Token missing required identity claims");
    }

    return {
      externalId,
      email,
      name: extractName(payload, email),
    };
  }
}
