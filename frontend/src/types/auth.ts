export type UserWithoutPassword = {
  /** Borderless user id (string). */
  id: string;
  name: string;
  email: string;
  interviewLocale: "en" | "pt" | null;
};

export type MessageResponse = {
  message: string;
};
