import type { UserWithoutPassword } from "@/types/auth";

const ACCESS_TOKEN_KEY = "hone_access_token";
const REFRESH_TOKEN_KEY = "hone_refresh_token";
const USER_KEY = "hone_user";
const RESUME_ID_KEY = "hone_resume_id";

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: UserWithoutPassword;
};

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!accessToken || !refreshToken || !userRaw) return null;
  try {
    const user = JSON.parse(userRaw) as UserWithoutPassword;
    return { accessToken, refreshToken, user };
  } catch {
    return null;
  }
}

export function setStoredSession(session: AuthSession): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearStoredSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredResumeId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(RESUME_ID_KEY);
}

export function setStoredResumeId(resumeId: string): void {
  localStorage.setItem(RESUME_ID_KEY, resumeId);
}

export function clearStoredResumeId(): void {
  localStorage.removeItem(RESUME_ID_KEY);
}
