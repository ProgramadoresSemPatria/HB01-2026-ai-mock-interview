import type {
  ITokenService,
  SignTokenOptions,
  TokenPayload,
} from "@/modules/auth/protocols/token-service";
import jwt, { type SignOptions } from "jsonwebtoken";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export type JwtTokenServiceConfig = {
  secret: string;
  defaultExpiresIn: string;
};

export class JwtTokenService implements ITokenService {
  constructor(private readonly config: JwtTokenServiceConfig) {}

  sign(payload: TokenPayload, options?: SignTokenOptions): string {
    const signOptions: SignOptions = {
      expiresIn: (options?.expiresIn ??
        this.config.defaultExpiresIn) as SignOptions["expiresIn"],
    };

    return jwt.sign(
      payload,
      options?.secret ?? this.config.secret,
      signOptions,
    );
  }

  verify<T extends TokenPayload = TokenPayload>(
    token: string,
    secret?: string,
  ): T {
    return jwt.verify(token, secret ?? this.config.secret) as T;
  }

  decode<T extends TokenPayload = TokenPayload>(token: string): T | null {
    const decoded = jwt.decode(token);

    if (!decoded || typeof decoded === "string") {
      return null;
    }

    return decoded as T;
  }
}

type EnvServerModule = {
  env: {
    BORDERLESS_JWT_SECRET: string;
  };
};

function readEnvConfig(): JwtTokenServiceConfig {
  const { env } = require("@/config/env") as EnvServerModule;

  return {
    secret: env.BORDERLESS_JWT_SECRET,
    defaultExpiresIn: "1h",
  };
}

export function createJwtTokenService(
  overrides?: Partial<JwtTokenServiceConfig>,
): ITokenService {
  const fromEnv =
    overrides?.secret !== undefined && overrides?.defaultExpiresIn !== undefined
      ? null
      : readEnvConfig();

  return new JwtTokenService({
    secret: overrides?.secret ?? fromEnv!.secret,
    defaultExpiresIn: overrides?.defaultExpiresIn ?? fromEnv!.defaultExpiresIn,
  });
}
