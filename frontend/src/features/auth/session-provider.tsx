"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { UserWithoutPassword } from "@/types/auth";

import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
  type AuthSession,
} from "./session-storage";

type AuthContextValue = {
  user: UserWithoutPassword | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
  fetchWithAuth: <T>(request: (token: string) => Promise<T>) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const sessionListeners = new Set<() => void>();

/** Stable snapshot for useSyncExternalStore — avoids infinite re-renders. */
let cachedFingerprint = "";
let cachedSession: AuthSession | null = null;

function sessionFingerprint(session: AuthSession | null): string {
  if (!session) return "";
  return `${session.accessToken}|${session.refreshToken}|${session.user.id}|${session.user.email}`;
}

function invalidateSessionCache() {
  cachedFingerprint = "";
  cachedSession = null;
}

function getSessionSnapshot(): AuthSession | null {
  const next = getStoredSession();
  const fp = sessionFingerprint(next);
  if (fp === cachedFingerprint) {
    return cachedSession;
  }
  cachedFingerprint = fp;
  cachedSession = next;
  return cachedSession;
}

function subscribeSession(onStoreChange: () => void) {
  sessionListeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    sessionListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function notifySessionChange() {
  invalidateSessionCache();
  sessionListeners.forEach((listener) => listener());
}

const emptySnapshot = null as AuthSession | null;

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => emptySnapshot,
  );
  const isReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const persistSession = useCallback((next: AuthSession) => {
    setStoredSession(next);
    notifySessionChange();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      persistSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
      });
      router.push("/dashboard");
    },
    [persistSession, router],
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      confirmPassword: string,
    ) => {
      await authApi.signup({
        name,
        email,
        password,
        confirmPassword,
      });
      const loginRes = await authApi.login({ email, password });
      persistSession({
        accessToken: loginRes.accessToken,
        refreshToken: loginRes.refreshToken,
        user: loginRes.user,
      });
      router.push("/dashboard");
    },
    [persistSession, router],
  );

  const logout = useCallback(() => {
    clearStoredSession();
    notifySessionChange();
    router.push("/login");
  }, [router]);

  const refreshTokens = useCallback(async (): Promise<string | null> => {
    const current = getSessionSnapshot();
    if (!current?.refreshToken) return null;
    try {
      const res = await authApi.refresh({ refreshToken: current.refreshToken });
      const next: AuthSession = {
        ...current,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      };
      persistSession(next);
      return res.accessToken;
    } catch {
      clearStoredSession();
      notifySessionChange();
      return null;
    }
  }, [persistSession]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return getSessionSnapshot()?.accessToken ?? null;
  }, []);

  const fetchWithAuth = useCallback(
    async <T,>(request: (token: string) => Promise<T>): Promise<T> => {
      let token = await getAccessToken();
      if (!token) throw new ApiError("Not authenticated", 401);
      try {
        return await request(token);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          token = await refreshTokens();
          if (!token) throw err;
          return request(token);
        }
        throw err;
      }
    },
    [getAccessToken, refreshTokens],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isReady,
      login,
      signup,
      logout,
      getAccessToken,
      fetchWithAuth,
    }),
    [session, isReady, login, signup, logout, getAccessToken, fetchWithAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthSessionProvider");
  }
  return ctx;
}
