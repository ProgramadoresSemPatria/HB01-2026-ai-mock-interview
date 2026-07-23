import jwt, { type SignOptions } from "jsonwebtoken";
import prisma from "@/infrastructure/database";

/** Test-only signing key — parser ignores signature and only decodes claims. */
const AUTH_TEST_SIGNING_KEY = "test-only-signing-key-not-for-production";

export type SeededAuthUser = {
  userId: number;
  externalId: string;
  email: string;
  name: string;
  accessToken: string;
};

export async function seedAuthenticatedUser(overrides?: {
  externalId?: string;
  email?: string;
  name?: string;
}): Promise<SeededAuthUser> {
  const externalId = overrides?.externalId ?? `ext-${crypto.randomUUID()}`;
  const email =
    overrides?.email ?? `user-${crypto.randomUUID()}@example.com`;
  const name = overrides?.name ?? "Jane Doe";

  const user = await prisma.user.create({
    data: {
      externalId,
      email,
      name,
      password: null,
    },
  });

  const accessToken = signBorderlessAccessToken({
    externalId,
    email,
    name,
  });

  return {
    userId: user.id,
    externalId,
    email,
    name,
    accessToken,
  };
}

/** Sign a Borderless-shaped JWT without persisting a user (middleware will upsert). */
export function signBorderlessAccessToken(claims: {
  externalId: string;
  email: string;
  name?: string;
  expiresIn?: SignOptions["expiresIn"];
}): string {
  return jwt.sign(
    {
      sub: claims.externalId,
      email: claims.email,
      name: claims.name ?? "Test User",
    },
    AUTH_TEST_SIGNING_KEY,
    { expiresIn: claims.expiresIn ?? "1h" },
  );
}

export function authHeader(accessToken: string): { Authorization: string } {
  return { Authorization: `Bearer ${accessToken}` };
}
