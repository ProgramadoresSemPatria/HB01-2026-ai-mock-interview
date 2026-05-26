import { AuthService, UserRepository } from "@hackathon2026/auth";
import {
  BcryptPasswordHasher,
  JwtTokenService,
  NodemailerMailerAdapter,
} from "@hackathon2026/common";
import { env } from "@hackathon2026/env/server";
import nodemailer from "nodemailer";

const BCRYPT_SALT_ROUNDS = 10;

export function makeAuthService(): AuthService {
  const userRepository = new UserRepository();
  const passwordHasher = new BcryptPasswordHasher(BCRYPT_SALT_ROUNDS);
  const tokenService = new JwtTokenService({
    secret: env.JWT_SECRET,
    defaultExpiresIn: env.JWT_EXPIRE_IN,
  });
  const mailer = new NodemailerMailerAdapter(
    nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    }),
    { mailFrom: env.MAIL_FROM },
  );

  return new AuthService(userRepository, passwordHasher, tokenService, mailer);
}
