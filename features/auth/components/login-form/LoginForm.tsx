"use client";

import { FormEvent, useState } from "react";
import { EyeIcon } from "../icons/EyeIcon";
import styles from "./LoginForm.module.css";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
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
        <input className={styles.input} id="email" name="email" type="email" placeholder="seu@email.com" autoComplete="email" required />

        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="password">Senha</label>
          <a href="#recuperar">Esqueci minha senha</a>
        </div>

        <div className={styles.passwordField}>
          <input className={styles.input} id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Digite sua senha" autoComplete="current-password" required />
          <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
            <EyeIcon open={showPassword} />
          </button>
        </div>

        <button className={styles.submitButton} type="submit">Entrar no painel <span>→</span></button>
        {submitted && <p className={styles.feedback} role="status">Acesso recebido. Conectando ao seu painel...</p>}
      </form>

      {/* <div className={styles.divider}><span>ou continue com</span></div>
      <button className={styles.googleButton} type="button"><b>G</b> Continuar com Google</button> */}
      <p className={styles.signup}>Ainda não tem acesso? <a href="#contato">Fale com nosso time</a></p>
    </div>
  );
}
