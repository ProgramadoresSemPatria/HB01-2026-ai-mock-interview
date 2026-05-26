// Auth MVC - Implementação manual (Tasks T15-T27)

export type {
  IMailer,
  IPasswordHasher,
  ITokenService,
  SignTokenOptions,
  TokenPayload,
} from "@hackathon2026/common";
export { UserRepository } from "./repository/user-repository";
export {
  AuthService,
  type LoginResult,
  type RefreshResult,
} from "./service/auth-service";
export {
  loginSchema,
  passwordResetSchema,
  refreshSchema,
  requestPasswordResetSchema,
  signupSchema,
  type LoginInput,
  type PasswordResetInput,
  type RefreshInput,
  type RequestPasswordResetInput,
  type SignupInput,
  type SignupOutput,
} from "./validations";
