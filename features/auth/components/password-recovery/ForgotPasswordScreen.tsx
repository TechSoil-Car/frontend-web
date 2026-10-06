"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ApiError, apiRequest } from "@/shared/api/api-client";
import styles from "../accept-invite-screen/AcceptInviteScreen.module.css";

export function ForgotPasswordScreen() {
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "")
      .trim()
      .toLowerCase();
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        authenticated: false,
        retryOnUnauthorized: false,
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (failure) {
      setError(
        failure instanceof ApiError
          ? failure.message
          : "Não foi possível solicitar a recuperação. Tente novamente.",
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
        <small>RECUPERAÇÃO DE ACESSO</small>
        <h1>Esqueceu sua senha?</h1>
        {sent ? (
          <>
            <p role="status">
              Se existir uma conta ativa com este e-mail, enviaremos as
              instruções para redefinir sua senha.
            </p>
            <p>
              Confira também a pasta de spam. O link vale por 30 minutos por
              padrão. Se precisar solicitar novamente, aguarde ao menos um
              minuto.
            </p>
            <button type="button" onClick={() => setSent(false)}>
              Solicitar novamente
            </button>
          </>
        ) : (
          <>
            <p>Informe o e-mail usado para entrar na TechSoil.</p>
            <form onSubmit={submit}>
              <label>
                E-mail
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  disabled={saving}
                />
              </label>
              <button type="submit" disabled={saving}>
                {saving ? "Solicitando..." : "Enviar instruções"}
              </button>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
            </form>
          </>
        )}
        <Link className={styles.login} href="/login">
          Voltar ao login
        </Link>
      </section>
    </main>
  );
}
