import { password } from "bun";
import type { IPasswordHasher } from "@/modules/auth/protocols/password-hasher";

export class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly cost: number) {}

  async hash(plain: string): Promise<string> {
    return password.hash(plain, {
      algorithm: "bcrypt",
      cost: this.cost,
    });
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return password.verify(plain, hash);
  }
}

export function createBcryptPasswordHasher(cost: number): IPasswordHasher {
  return new BcryptPasswordHasher(cost);
}
