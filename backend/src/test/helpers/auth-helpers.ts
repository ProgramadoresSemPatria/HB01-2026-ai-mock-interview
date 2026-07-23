import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import prisma from "@/infrastructure/database";

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

  const accessToken = jwt.sign(
    {
      sub: externalId,
      email,
      name,
    },
    env.BORDERLESS_JWT_SECRET,
    { expiresIn: "1h" },
  );

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
}): string {
  return jwt.sign(
    {
      sub: claims.externalId,
      email: claims.email,
      name: claims.name ?? "Test User",
    },
    env.BORDERLESS_JWT_SECRET,
    { expiresIn: "1h" },
  );
}

export function authHeader(accessToken: string): { Authorization: string } {
  return { Authorization: `Bearer ${accessToken}` };
}
