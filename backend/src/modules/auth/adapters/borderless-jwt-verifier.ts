import type {
  BorderlessTokenClaims,
  IBorderlessTokenVerifier,
} from "@/modules/auth/protocols/borderless-token-verifier";
import jwt from "jsonwebtoken";

export type BorderlessJwtVerifierConfig = {
  secret: string;
};

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

export class BorderlessJwtVerifier implements IBorderlessTokenVerifier {
  constructor(private readonly config: BorderlessJwtVerifierConfig) {}

  async verify(token: string): Promise<BorderlessTokenClaims> {
    const decoded = jwt.verify(token, this.config.secret);

    if (!decoded || typeof decoded === "string") {
      throw new Error("Invalid token payload");
    }

    const payload = decoded as JwtPayloadRecord;
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
