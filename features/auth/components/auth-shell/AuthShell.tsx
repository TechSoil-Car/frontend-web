import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/app/landing-art";
import landing from "@/app/page.module.css";
import { PageTransition } from "@/app/page-transition";
import styles from "./AuthShell.module.css";

type AuthShellProps = {
  label: string;
  title: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  // Painel verde da direita; no celular ele some ("hide") ou vai para cima do formulário ("top").
  aside: ReactNode;
  asideLabel: string;
  mobileAside?: "hide" | "top";
};

// Estrutura comum das telas de acesso, no mesmo visual da landing.
export function AuthShell({ label, title, lead, children, footer, aside, asideLabel, mobileAside = "hide" }: AuthShellProps) {
  return (
    <PageTransition>
      <main className={`${landing.page} ${styles.page}`} data-mobile-aside={mobileAside}>
        <section className={styles.main}>
          <header className={styles.top}>
            <Link href="/" aria-label="TechSoil Systems — início">
              <Brand />
            </Link>
            <Link className={styles.back} href="/">
              ← Voltar ao site
            </Link>
          </header>

          <div className={styles.content}>
            <p className={landing.sectionLabel}>{label}</p>
            <h1 className={styles.title}>{title}</h1>
            {lead && <p className={styles.lead}>{lead}</p>}
            <div className={styles.card}>{children}</div>
            {footer && <div className={styles.footer}>{footer}</div>}
          </div>

          <p className={styles.legal}>© 2026 TechSoil Systems · Inteligência para o solo. Clareza para quem produz.</p>
        </section>

        <aside className={styles.aside} aria-label={asideLabel}>
          {aside}
        </aside>
      </main>
    </PageTransition>
  );
}
