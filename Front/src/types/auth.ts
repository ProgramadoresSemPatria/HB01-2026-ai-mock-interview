export type UserWithoutPassword = {
  id: number;
  name: string;
  email: string;
};

export type LoginResponse = {
  user: UserWithoutPassword;
  accessToken: string;
  refreshToken: string;
};

export type SignupResponse = {
  user: UserWithoutPassword;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export type MessageResponse = {
  message: string;
};
