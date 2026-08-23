"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../services/auth-api";
import type { AuthStatus, AuthUser, LoginCredentials } from "../types/auth.types";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  const clearSession = useCallback(() => {
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    let active = true;

    authApi
      .refreshSession()
      .then((session) => {
        if (!active) return;
        setUser(session.user);
        setStatus("authenticated");
      })
      .catch(() => {
        if (active) clearSession();
      });

    window.addEventListener("techsoil:session-expired", clearSession);
    return () => {
      active = false;
      window.removeEventListener("techsoil:session-expired", clearSession);
    };
  }, [clearSession]);

  const handleLogin = useCallback(async (credentials: LoginCredentials) => {
    const session = await authApi.login(credentials);
    setUser(session.user);
    setStatus("authenticated");
    return session.user;
  }, []);

  const handleLogout = useCallback(async () => {
    await authApi.logout();
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ status, user, login: handleLogin, logout: handleLogout }),
    [handleLogin, handleLogout, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
