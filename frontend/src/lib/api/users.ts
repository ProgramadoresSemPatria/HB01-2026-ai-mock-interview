import { apiRequest } from "./client";

export const usersApi = {
  patchInterviewLocale(token: string, locale: "en" | "pt") {
    return apiRequest<{ interviewLocale: "en" | "pt" }>(
      "/api/users/me/interview-locale",
      {
        method: "PATCH",
        body: { interviewLocale: locale },
        token,
      },
    );
  },
};
