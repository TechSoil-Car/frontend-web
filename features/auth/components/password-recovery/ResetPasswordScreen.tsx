"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiRequest, setAccessToken } from "@/shared/api/api-client";
import styles from "../accept-invite-screen/AcceptInviteScreen.module.css";

export function ResetPasswordScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const value =
        new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
      setToken(/^[A-Za-z0-9_-]{43}$/.test(value) ? value : "");
      // Hold the secret only in memory; no query string or local storage.
      window.history.replaceState(null, "", "/reset-password");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== form.get("confirmation")) {
      setError("As senhas devem ser iguais.");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError(
        "A senha deve ter no máximo 72 bytes. Use uma senha mais curta.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        authenticated: false,
        retryOnUnauthorized: false,
        body: JSON.stringify({ token, password }),
      });
      setComplete(true);
      setToken("");
      setAccessToken(null);
      window.dispatchEvent(new Event("techsoil:session-expired"));
    } catch (failure) {
      setError(
        failure instanceof ApiError
          ? failure.message
          : "Não foi possível redefinir a senha. Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link className={styles.brand} href="/">
          TECHSOIL SYSTEMS
        </Link>
        <small>SEGURANÇA DA SUA CONTA</small>
        <h1>{complete ? "Senha redefinida" : "Defina sua nova senha"}</h1>
        {complete ? (
          <>
            <p role="status">
              Sua senha foi alterada e as sessões anteriores foram encerradas.
              Entre novamente com a nova senha.
            </p>
            <Link className={styles.login} href="/login">
              Ir para o login
            </Link>
          </>
        ) : token === null ? (
          <p role="status">Verificando link...</p>
        ) : !token ? (
          <>
            <p role="alert">
              Link incompleto ou inválido. Abra o link recebido por e-mail ou
              solicite uma nova recuperação.
            </p>
            <Link className={styles.login} href="/forgot-password">
              Solicitar novo link
            </Link>
          </>
        ) : (
          <>
            <p>
              Use uma senha pessoal de 8 a 72 caracteres (até 72 bytes). Você
              precisará entrar novamente após a troca.
            </p>
            <form onSubmit={submit}>
              <label>
                Nova senha
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  disabled={saving}
                />
              </label>
              <label>
                Confirme a nova senha
                <input
                  name="confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  disabled={saving}
                />
              </label>
              <button type="submit" disabled={saving}>
                {saving ? "Redefinindo..." : "Redefinir senha"}
              </button>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
            </form>
            <Link href="/forgot-password">Solicitar outro link</Link>
          </>
        )}
      </section>
    </main>
  );
}
