import { UserRepository } from "@/modules/auth/repository/user-repository";
import { UsersService } from "@/modules/users/service/users-service";

export function makeUsersService(): UsersService {
  return new UsersService(new UserRepository());
}
