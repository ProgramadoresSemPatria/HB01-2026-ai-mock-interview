export type TokenPayload = Record<string, unknown>;

export type SignTokenOptions = {
  expiresIn?: string | number;
  secret?: string;
};

export interface ITokenService {
  sign(payload: TokenPayload, options?: SignTokenOptions): string;
  verify<T extends TokenPayload = TokenPayload>(
    token: string,
    secret?: string,
  ): T;
  decode<T extends TokenPayload = TokenPayload>(token: string): T | null;
}
