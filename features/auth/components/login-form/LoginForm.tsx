"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiError, apiRequest } from "@/shared/api/api-client";
import { useAuth } from "../../context/AuthContext";
import { ArrowIcon } from "@/app/landing-art";
import { PasswordInput } from "../auth-form/PasswordInput";
import styles from "../auth-form/AuthForm.module.css";

type Plantation = { id: string };

export function LoginForm() {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const loginStarted = useRef(false);
  const { status, user, login, passwordChanged } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && !loginStarted.current) {
      router.replace(
        user?.systemRole === "SUPERADMIN" ? "/dashboard/admin" : "/dashboard",
      );
    }
  }, [router, status, user?.systemRole]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginStarted.current = true;
    setFeedback(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") ?? "");

    try {
      const account = await login({ email, password });
      if (account.systemRole === "SUPERADMIN") {
        router.replace("/dashboard/admin");
        return;
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFeedback("E-mail ou senha inválidos.");
      } else if (error instanceof ApiError && error.status === 429) {
        setFeedback("Muitas tentativas. Aguarde um minuto e tente novamente.");
      } else {
        setFeedback(
          "Não foi possível acessar o painel. Verifique sua conexão e tente novamente.",
        );
      }
      setSubmitting(false);
      loginStarted.current = false;
      return;
    }

    try {
      const plantations = await apiRequest<Plantation[]>("/plantations");
      router.replace(
        plantations.length === 1 ? "/dashboard" : "/dashboard/plantacoes",
      );
    } catch {
      router.replace("/dashboard");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {passwordChanged && (
        <p className={styles.success} role="status">
          Senha alterada com sucesso. Todas as sessões foram encerradas. Entre
          com a nova senha.
        </p>
      )}

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
          disabled={submitting}
          required
        />
      </div>

      <PasswordInput
        id="password"
        name="password"
        label="Senha"
        placeholder="Digite sua senha"
        autoComplete="current-password"
        maxLength={128}
        disabled={submitting}
      />
      <Link className={styles.inlineLink} href="/forgot-password">
        Esqueci minha senha
      </Link>

      {feedback && (
        <p className={styles.error} role="alert">
          {feedback}
        </p>
      )}

      <button
        className={styles.submit}
        type="submit"
        disabled={submitting || status === "loading"}
      >
        {submitting ? (
          <>
            <span className={styles.spinner} aria-hidden="true" /> Entrando...
          </>
        ) : (
          <>
            Entrar no painel <ArrowIcon />
          </>
        )}
      </button>
    </form>
  );
}
