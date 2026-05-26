/** Domain user entity (mirrors Prisma `User` model). */
export type User = {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

/** User fields safe to return from service/controller layers. */
export type UserWithoutPassword = Omit<User, "password">;

/** Persist signup payload — `confirmPassword` is validated at the HTTP/Zod boundary only. */
export type CreateUserParams = {
  name: string;
  email: string;
  password: string;
};

export type LoginParams = {
  email: string;
  password: string;
};

export type UpdateUserParams = {
  password: string;
};

export type RefreshToken = {
  id: string;
  token: string;
  userId: number;
  expiresAt: Date;
  createdAt: Date;
};

export type SaveRefreshTokenParams = {
  id: string;
  token: string;
  userId: number;
};

export type RefreshTokenWithUser = RefreshToken & {
  user: User;
};

export function toUserWithoutPassword(user: User): UserWithoutPassword {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}
