"use client";

import { useCallback, useEffect, useState } from "react";

// Token lido do link, guardado só em memória. Se a tela for montada de novo (o React faz isso
// em desenvolvimento), a URL já está sem o "#token" e o valor vem daqui.
let capturedToken: string | null = null;

/**
 * Token de redefinição de senha do "#token" da URL. null enquanto a URL não foi lida;
 * "" quando falta ou é inválido.
 */
export function useResetToken() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const value = new URLSearchParams(window.location.hash.slice(1)).get("token");
      if (value !== null) capturedToken = /^[A-Za-z0-9_-]{43}$/.test(value) ? value : "";
      setToken(capturedToken ?? "");
      // Hold the secret only in memory; no query string or local storage.
      window.history.replaceState(null, "", "/reset-password");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  /** Descarta o token depois de usado. */
  const clearToken = useCallback(() => {
    setToken("");
    capturedToken = null;
  }, []);
  return { token, clearToken };
}
