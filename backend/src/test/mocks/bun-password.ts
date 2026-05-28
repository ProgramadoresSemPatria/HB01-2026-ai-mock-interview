import bcrypt from "bcrypt";

type BcryptHashOptions = {
  algorithm: "bcrypt";
  cost: number;
};

/** Vitest runs on Node — mirrors `Bun.password` bcrypt behaviour for unit tests. */
export const password = {
  hash(plain: string, options: BcryptHashOptions): Promise<string> {
    return bcrypt.hash(plain, options.cost);
  },

  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },
};
