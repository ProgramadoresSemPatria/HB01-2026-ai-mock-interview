import { UsersController } from "@/modules/users/controller/users-controller";

import { makeUsersService } from "./users-service-factory";

export function makeUsersController(): UsersController {
  return new UsersController(makeUsersService());
}
