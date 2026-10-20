"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authApi from "../services/auth-api";
import { PANEL_OFFLINE, setAccessToken } from "@/shared/api/api-client";
import type {
  AuthStatus,
  AuthUser,
  LoginCredentials,
} from "../types/auth.types";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Tries again to restore the session after "unavailable". */
  retry: () => void;
  updateProfile: (name: string) => Promise<authApi.UserProfile>;
  completePasswordChange: () => void;
  passwordChanged: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(PANEL_OFFLINE ? "unauthenticated" : "loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const clearSession = useCallback(() => {
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    // No backend to ask: without this every page of the public site would call the API.
    if (PANEL_OFFLINE) return;
    let active = true;

    void authApi.refreshSession().then((result) => {
      if (!active) return;
      if (result.status === "renewed") {
        setUser(result.user);
        setStatus("authenticated");
      } else if (result.status === "expired") {
        clearSession();
      } else {
        // Rate limit, server error or offline: keep the session, offer a retry.
        setStatus("unavailable");
      }
    });

    window.addEventListener("techsoil:session-expired", clearSession);
    return () => {
      active = false;
      window.removeEventListener("techsoil:session-expired", clearSession);
    };
  }, [attempt, clearSession]);

  const handleLogin = useCallback(async (credentials: LoginCredentials) => {
    const session = await authApi.login(credentials);
    setUser(session.user);
    setStatus("authenticated");
    setPasswordChanged(false);
    return session.user;
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // Offline the server keeps the token until it expires, but this browser leaves.
      clearSession();
    }
  }, [clearSession]);

  const handleUpdateProfile = useCallback(async (name: string) => {
    const profile = await authApi.updateProfile(name);
    setUser((current) => (current?.id === profile.id ? profile : current));
    return profile;
  }, []);

  const completePasswordChange = useCallback(() => {
    setAccessToken(null);
    setPasswordChanged(true);
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      status,
      user,
      login: handleLogin,
      logout: handleLogout,
      retry,
      updateProfile: handleUpdateProfile,
      completePasswordChange,
      passwordChanged,
    }),
    [
      handleLogin,
      handleLogout,
      retry,
      handleUpdateProfile,
      completePasswordChange,
      passwordChanged,
      status,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
