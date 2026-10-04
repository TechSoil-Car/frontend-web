"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/shared/api/api-client";
import { useAuth } from "../../context/AuthContext";
import { EyeIcon } from "../icons/EyeIcon";
import styles from "./LoginForm.module.css";

type Plantation = { id: string };

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const loginStarted = useRef(false);
  const { status, user, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && !loginStarted.current) {
      router.replace(user?.systemRole === "SUPERADMIN" ? "/dashboard/admin" : "/dashboard");
    }
  }, [router, status, user?.systemRole]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginStarted.current = true;
    setFeedback(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
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
        setFeedback("Não foi possível acessar o painel. Verifique sua conexão e tente novamente.");
      }
      setSubmitting(false);
      loginStarted.current = false;
      return;
    }

    try {
      const plantations = await apiRequest<Plantation[]>("/plantations");
      router.replace(plantations.length === 1 ? "/dashboard" : "/dashboard/plantacoes");
    } catch {
      router.replace("/dashboard");
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.kicker}>Área do cliente</p>
        <h2>Bem-vindo</h2>
        <p>Entre para acompanhar sua operação.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="email">E-mail</label>
        <input className={styles.input} id="email" name="email" type="email" placeholder="seu@email.com" autoComplete="email" maxLength={254} disabled={submitting} required />

        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="password">Senha</label>
          <a href="#recuperar">Esqueci minha senha</a>
        </div>

        <div className={styles.passwordField}>
          <input className={styles.input} id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Digite sua senha" autoComplete="current-password" minLength={8} maxLength={128} disabled={submitting} required />
          <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} disabled={submitting}>
            <EyeIcon open={showPassword} />
          </button>
        </div>

        <button className={styles.submitButton} type="submit" disabled={submitting || status === "loading"}>
          {submitting ? "Entrando..." : "Entrar no painel"} {!submitting && <span>→</span>}
        </button>
        {feedback && <p className={styles.feedback} role="alert">{feedback}</p>}
      </form>

      {/* <div className={styles.divider}><span>ou continue com</span></div>
      <button className={styles.googleButton} type="button"><b>G</b> Continuar com Google</button> */}
      <p className={styles.signup}>Ainda não tem acesso? <a href="#contato">Fale com nosso time</a></p>
    </div>
  );
}
