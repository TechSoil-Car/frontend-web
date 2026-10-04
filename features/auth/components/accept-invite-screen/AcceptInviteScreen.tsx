"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ApiError, apiRequest } from "@/shared/api/api-client";
import styles from "./AcceptInviteScreen.module.css";

export function AcceptInviteScreen({ token }: { token: string }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== form.get("confirmation")) {
      setError("As senhas devem ser iguais.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/invites/accept", {
        method: "POST",
        authenticated: false,
        retryOnUnauthorized: false,
        body: JSON.stringify({ token, password }),
      });
      setAccepted(true);
      window.history.replaceState(null, "", "/accept-invite");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Não foi possível ativar a conta. Tente novamente.",
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
        <small>SEU ACESSO À PLATAFORMA</small>
        <h1>{accepted ? "Conta ativada" : "Defina sua senha"}</h1>
        {accepted ? (
          <>
            <p>
              Sua conta está pronta. Entre com o e-mail que recebeu o convite e
              a senha que você escolheu.
            </p>
            <Link className={styles.login} href="/login">
              Ir para o login →
            </Link>
          </>
        ) : !token ? (
          <>
            <p role="alert">
              O link de ativação está incompleto. Abra o convite recebido por
              e-mail ou solicite um novo ao administrador.
            </p>
            <Link href="/login">Voltar ao login</Link>
          </>
        ) : (
          <>
            <p>
              Crie uma senha pessoal para ativar sua conta. Não compartilhe este
              link nem sua senha.
            </p>
            <form onSubmit={submit}>
              <label>
                Nova senha
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  maxLength={72}
                  required
                  autoComplete="new-password"
                  disabled={saving}
                />
              </label>
              <label>
                Confirme a senha
                <input
                  name="confirmation"
                  type="password"
                  minLength={8}
                  maxLength={72}
                  required
                  autoComplete="new-password"
                  disabled={saving}
                />
              </label>
              <small>Use entre 8 e 72 caracteres.</small>
              <button type="submit" disabled={saving}>
                {saving ? "Ativando..." : "Ativar minha conta"}
              </button>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
            </form>
          </>
        )}
      </section>
    </main>
  );
}
