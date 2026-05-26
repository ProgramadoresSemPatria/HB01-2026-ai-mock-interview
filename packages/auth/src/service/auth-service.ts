import {
  BadRequestError,
  logger,
  toUserWithoutPassword,
  UnauthorizedError,
  type CreateUserParams,
  type LoginParams,
  type UserWithoutPassword,
} from "@hackathon2026/common";
import { randomUUID } from "node:crypto";

import type { IPasswordHasher } from "../protocols/password-hasher";
import type { ITokenService } from "../protocols/token-service";
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
}
