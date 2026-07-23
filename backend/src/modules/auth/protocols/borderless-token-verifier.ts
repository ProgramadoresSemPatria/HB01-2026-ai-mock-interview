export type BorderlessTokenClaims = {
  externalId: string;
  email: string;
  name: string;
};

export interface IBorderlessTokenVerifier {
  verify(token: string): Promise<BorderlessTokenClaims>;
}
