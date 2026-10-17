"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiRequest, setAccessToken } from "@/shared/api/api-client";
import { ArrowIcon } from "@/app/landing-art";
import { PasswordChecklist, PasswordInput } from "../auth-form/PasswordInput";
import styles from "../auth-form/AuthForm.module.css";
import { AuthShell } from "../auth-shell/AuthShell";
import { RecoverySteps } from "./RecoverySteps";

// Token lido do link, guardado só em memória. Se a tela for montada de novo (o React faz isso
// em desenvolvimento), a URL já está sem o "#token" e o valor vem daqui.
let capturedToken: string | null = null;

export function ResetPasswordScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Só para a lista de requisitos; o envio continua lendo o FormData.
  const [typedPassword, setTypedPassword] = useState("");
  const [typedConfirmation, setTypedConfirmation] = useState("");
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
      capturedToken = null;
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
    <AuthShell
      label="Segurança da sua conta"
      title={
        complete ? (
          <>
            Senha{" "}
            <br />
            <mark>redefinida.</mark>
          </>
        ) : (
          <>
            Defina sua{" "}
            <br />
            <mark>nova senha.</mark>
          </>
        )
      }
      aside={<RecoverySteps current={complete ? 4 : token ? 2 : 1} />}
      asideLabel="Passos da recuperação de senha"
      mobileAside="top"
    >
      {complete ? (
        <div className={styles.form}>
          <p className={styles.success} role="status">
            Sua senha foi alterada e as sessões anteriores foram encerradas.
            Entre novamente com a nova senha.
          </p>
          <Link className={styles.submit} href="/login">
            Ir para o login <ArrowIcon />
          </Link>
        </div>
      ) : token === null ? (
        <p className={styles.text} role="status">
          <span className={styles.spinner} aria-hidden="true" /> Verificando link...
        </p>
      ) : !token ? (
        <div className={styles.form}>
          <p className={styles.error} role="alert">
            Link incompleto ou inválido. Abra o link recebido por e-mail ou
            solicite uma nova recuperação.
          </p>
          <Link className={styles.submit} href="/forgot-password">
            Solicitar novo link <ArrowIcon />
          </Link>
        </div>
      ) : (
        <form className={styles.form} onSubmit={submit}>
          <p className={styles.text}>
            Use uma senha pessoal. Você precisará entrar novamente após a troca.
          </p>
          <PasswordInput
            id="password"
            name="password"
            label="Nova senha"
            autoComplete="new-password"
            disabled={saving}
            onChange={setTypedPassword}
          />
          <PasswordInput
            id="confirmation"
            name="confirmation"
            label="Confirme a nova senha"
            autoComplete="new-password"
            disabled={saving}
            onChange={setTypedConfirmation}
          />
          <PasswordChecklist password={typedPassword} confirmation={typedConfirmation} />
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <button className={styles.submit} type="submit" disabled={saving}>
            {saving ? (
              <>
                <span className={styles.spinner} aria-hidden="true" /> Redefinindo...
              </>
            ) : (
              <>
                Redefinir senha <ArrowIcon />
              </>
            )}
          </button>
          <Link className={styles.inlineLink} href="/forgot-password">
            Solicitar outro link
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
