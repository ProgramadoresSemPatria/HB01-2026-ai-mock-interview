// Auth MVC - Implementação manual (Tasks T15-T27)
// Este arquivo será expandido com service, repository, validations

export type {
  IMailer,
  IPasswordHasher,
  ITokenService,
  SignTokenOptions,
  TokenPayload,
} from "./protocols";
export { UserRepository } from "./repository/user-repository";
export {
  AuthService,
  type LoginResult,
  type RefreshResult,
} from "./service/auth-service";
