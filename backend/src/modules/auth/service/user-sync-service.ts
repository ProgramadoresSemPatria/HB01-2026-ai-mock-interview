import type { BorderlessTokenClaims } from "@/modules/auth/protocols/borderless-token-verifier";
import type { UserRepository } from "@/modules/auth/repository/user-repository";
import type { User } from "@/modules/auth/types/user";

export class UserSyncService {
  constructor(private readonly userRepository: UserRepository) {}

  async resolveLocalUser(claims: BorderlessTokenClaims): Promise<User> {
    return this.userRepository.upsertFromBorderless({
      externalId: claims.externalId,
      email: claims.email,
      name: claims.name,
    });
  }
}
