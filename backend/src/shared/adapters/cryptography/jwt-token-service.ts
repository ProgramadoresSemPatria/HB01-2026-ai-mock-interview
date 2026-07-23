import type {
  ITokenService,
  SignTokenOptions,
  TokenPayload,
} from "@/modules/auth/protocols/token-service";
import jwt, { type SignOptions } from "jsonwebtoken";

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

/** Requires explicit config — no production JWT secret env (Borderless tokens are decoded only). */
export function createJwtTokenService(
  config: JwtTokenServiceConfig,
): ITokenService {
  return new JwtTokenService(config);
}
