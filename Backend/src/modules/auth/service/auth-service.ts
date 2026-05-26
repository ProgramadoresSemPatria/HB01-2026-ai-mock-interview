import {
  BadRequestError,
  logger,
  toUserWithoutPassword,
  UnauthorizedError,
  type CreateUserParams,
  type LoginParams,
  type UserWithoutPassword,
} from "@/shared";
import type { IMailer, IPasswordHasher, ITokenService } from "../protocols";
import { env } from "@/config/env";
import { randomUUID } from "node:crypto";

import type { UserRepository } from "../repository/user-repository";

export type LoginResult = {
  user: UserWithoutPassword;
  accessToken: string;
  refreshToken: string;
};

export type RefreshResult = {
  accessToken: string;
  refreshToken: string;
};

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly mailer: IMailer,
  ) {}

  async signUp(params: CreateUserParams): Promise<UserWithoutPassword> {
    const existing = await this.userRepository.getByEmail(params.email);
    if (existing) {
      throw new BadRequestError("Email already in use");
    }

    const password = await this.passwordHasher.hash(params.password);
    const user = await this.userRepository.create({
      ...params,
      password,
    });

    return toUserWithoutPassword(user);
  }

  async login(params: LoginParams): Promise<LoginResult> {
    const user = await this.userRepository.getByEmail(params.email);

    if (!user) {
      logger.warn("Invalid login attempt");
      throw new UnauthorizedError("Invalid credentials");
    }

    const passwordMatches = await this.passwordHasher.compare(
      params.password,
      user.password,
    );

    if (!passwordMatches) {
      logger.warn("Invalid login attempt");
      throw new UnauthorizedError("Invalid credentials");
    }

    const accessToken = this.tokenService.sign({ userId: user.id });
    const refreshId = randomUUID();
    const refreshToken = randomUUID();

    await this.userRepository.saveRefreshToken({
      id: refreshId,
      token: refreshToken,
      userId: user.id,
    });

    return {
      user: toUserWithoutPassword(user),
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
    const stored =
      await this.userRepository.getRefreshTokenWithUser(refreshToken);

    if (!stored) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    await this.userRepository.revokeAllUserRefreshTokens(stored.userId);

    const accessToken = this.tokenService.sign({ userId: stored.userId });
    const refreshId = randomUUID();
    const newRefreshToken = randomUUID();

    await this.userRepository.saveRefreshToken({
      id: refreshId,
      token: newRefreshToken,
      userId: stored.userId,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.getByEmail(email);

    if (!user) {
      return;
    }

    const resetSecret = env.JWT_SECRET + user.password;

    const token = this.tokenService.sign(
      { userId: user.id },
      {
        secret: resetSecret,
        expiresIn: env.RESET_PASSWORD_JWT_EXPIRE_IN,
      },
    );

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

    await this.mailer.send(
      user.email,
      "Password reset",
      `Use the following link to reset your password: ${resetUrl}`,
    );
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const decoded = this.tokenService.decode<{ userId?: number }>(token);

    if (!decoded?.userId) {
      throw new UnauthorizedError("Invalid or expired reset token");
    }

    const user = await this.userRepository.getById(decoded.userId);

    if (!user) {
      throw new UnauthorizedError("Invalid or expired reset token");
    }

    const resetSecret = env.JWT_SECRET + user.password;

    try {
      this.tokenService.verify(token, resetSecret);
    } catch {
      throw new UnauthorizedError("Invalid or expired reset token");
    }

    const hashedPassword = await this.passwordHasher.hash(password);

    await this.userRepository.update(user.id, { password: hashedPassword });
  }
}
