import { LoginForm } from "../login-form/LoginForm";
import { LoginStory } from "../login-story/LoginStory";
import styles from "./LoginScreen.module.css";

export function LoginScreen() {
  return (
    <main className={styles.page}>
      <div className={styles.background} aria-hidden="true" />
      <div className={styles.backgroundGlow} aria-hidden="true" />

      <section className={styles.shell} aria-label="Acesso à plataforma TechSoil">
        <LoginStory />
        <LoginForm />
      </section>

      <p className={styles.legal}>© 2026 TechSoil Systems <span>·</span> Inteligência para o solo. Clareza para quem produz.</p>
    </main>
  );
}
