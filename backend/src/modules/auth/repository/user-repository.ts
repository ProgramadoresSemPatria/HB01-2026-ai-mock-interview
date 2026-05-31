import type {
  CreateUserParams,
  RefreshToken,
  RefreshTokenWithUser,
  SaveRefreshTokenParams,
  UpdateUserParams,
  User,
} from "@/modules/auth/types/user";
import prisma from "@/infrastructure/database";
import { env } from "@/config/env";

export class UserRepository {
  async getByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(params: CreateUserParams): Promise<User> {
    return prisma.user.create({ data: params });
  }

  async getById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async update(id: number, params: UpdateUserParams): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: params,
    });
  }

  async saveRefreshToken(
    params: SaveRefreshTokenParams,
  ): Promise<RefreshToken> {
    const { id, token, userId } = params;
    return prisma.refreshToken.create({
      data: {
        id,
        token,
        userId,
        expiresAt: new Date(Date.now() + env.REFRESH_EXPIRES * 1000),
      },
    });
  }

  async getRefreshTokenWithUser(
    token: string,
  ): Promise<RefreshTokenWithUser | null> {
    return prisma.refreshToken.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.delete({ where: { token } });
  }

  async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
