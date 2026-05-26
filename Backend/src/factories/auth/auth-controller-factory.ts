import { AuthController } from "@/modules/auth/controller/auth-controller";
import { makeAuthService } from "./auth-service-factory";

export function makeAuthController(): AuthController {
  return new AuthController(makeAuthService());
}
