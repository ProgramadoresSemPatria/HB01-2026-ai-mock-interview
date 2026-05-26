import type { IPasswordHasher } from "@hackathon2026/auth";
import bcrypt from "bcrypt";

export class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly saltRounds: number) {}

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}

export function createBcryptPasswordHasher(
  saltRounds: number,
): IPasswordHasher {
  return new BcryptPasswordHasher(saltRounds);
}
