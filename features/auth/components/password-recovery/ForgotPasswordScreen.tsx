"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ApiError, apiRequest } from "@/shared/api/api-client";
import { ArrowIcon } from "@/app/landing-art";
import styles from "../auth-form/AuthForm.module.css";
import { AuthShell } from "../auth-shell/AuthShell";
import { RecoverySteps } from "./RecoverySteps";

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
    <AuthShell
      label="Recuperação de acesso"
      title={
        <>
          Esqueceu sua{" "}
          <br />
          <mark>senha?</mark>
        </>
      }
      lead={sent ? undefined : "Acontece. Informe o e-mail usado para entrar na TechSoil e enviamos um link para criar uma nova."}
      aside={<RecoverySteps current={sent ? 1 : 0} />}
      asideLabel="Passos da recuperação de senha"
      mobileAside="top"
      footer={
        <>
          Lembrou a senha? <Link href="/login">Voltar ao login</Link>
        </>
      }
    >
      {sent ? (
        <div className={styles.form}>
          <p className={styles.success} role="status">
            Se existir uma conta ativa com este e-mail, enviaremos as
            instruções para redefinir sua senha.
          </p>
          <p className={styles.text}>
            Confira também a pasta de spam. O link vale por 30 minutos por
            padrão. Se precisar solicitar novamente, aguarde ao menos um
            minuto.
          </p>
          <button className={styles.secondary} type="button" onClick={() => setSent(false)}>
            Solicitar novamente
          </button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              E-mail
            </label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              maxLength={254}
              required
              disabled={saving}
            />
          </div>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <button className={styles.submit} type="submit" disabled={saving}>
            {saving ? (
              <>
                <span className={styles.spinner} aria-hidden="true" /> Solicitando...
              </>
            ) : (
              <>
                Enviar instruções <ArrowIcon />
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
