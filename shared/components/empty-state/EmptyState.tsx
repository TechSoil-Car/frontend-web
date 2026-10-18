import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export type EmptyArt = "sensor" | "clear" | "search" | "field" | "bell" | "team";

// Ilustrações em traço, no estilo da landing: contorno escuro com detalhes em verde-limão.
const art: Record<EmptyArt, ReactNode> = {
  sensor: (
    <>
      <path className={styles.soil} d="M8 66h80v18H8z" />
      <path d="M8 66h80" />
      <rect className={styles.accent} x="38" y="26" width="20" height="26" rx="4" />
      <path d="M48 52v26M44 78h8" />
      <path className={styles.wave} d="M30 22a24 24 0 0 1 36 0M36 28a14 14 0 0 1 24 0" />
      <circle cx="20" cy="76" r="1.6" />
      <circle cx="74" cy="74" r="1.6" />
    </>
  ),
  clear: (
    <>
      <circle className={styles.accent} cx="48" cy="44" r="24" />
      <path d="M37 44l8 8 15-16" />
      <path d="M20 80c8-6 16-6 28 0s20 6 28 0" />
      <path className={styles.wave} d="M18 30l4-4M78 30l-4-4M48 12v-4" />
    </>
  ),
  search: (
    <>
      <path d="M10 76c12-8 24-8 36 0s24 8 40 0" />
      <path d="M14 86h68" />
      <circle className={styles.accent} cx="44" cy="40" r="18" />
      <path d="M57 53l15 15" />
    </>
  ),
  field: (
    <>
      <path className={styles.soil} d="M6 62c18-10 66-10 84 0v22H6z" />
      <path d="M6 62c18-10 66-10 84 0" />
      <path d="M18 72l6-8M36 74l4-10M56 74l-4-10M74 72l-6-8" />
      <circle className={styles.accent} cx="70" cy="26" r="10" />
      <path d="M48 40v18M48 48c-6-2-9-6-9-11 6 0 9 4 9 11zM48 46c6-2 9-6 9-11-6 0-9 4-9 11z" />
    </>
  ),
  bell: (
    <>
      <path className={styles.accent} d="M30 62V44a18 18 0 0 1 36 0v18l6 6H24z" />
      <path d="M42 74a6 6 0 0 0 12 0" />
      <path className={styles.wave} d="M70 20h10l-10 10h10" />
    </>
  ),
  team: (
    <>
      <circle className={styles.accent} cx="36" cy="38" r="11" />
      <circle cx="62" cy="40" r="9" />
      <path d="M16 76c2-12 10-18 20-18s18 6 20 18" />
      <path d="M52 62c3-3 6-4 10-4 9 0 15 6 17 16" />
    </>
  ),
};

type EmptyStateProps = {
  art: EmptyArt;
  title: string;
  text?: ReactNode;
  children?: ReactNode;
  // "card": bloco próprio com fundo branco; "plain": dentro de um painel que já tem fundo.
  variant?: "card" | "plain";
};

// Estado vazio padrão do painel: ilustração, título, explicação e ações opcionais.
export function EmptyState({ art: name, title, text, children, variant = "card" }: EmptyStateProps) {
  return (
    <section className={`${styles.empty} ${styles[variant]}`}>
      <svg className={styles.art} viewBox="0 0 96 96" aria-hidden="true">
        {art[name]}
      </svg>
      <h2 className={styles.title}>{title}</h2>
      {text && <p className={styles.text}>{text}</p>}
      {children && <div className={styles.actions}>{children}</div>}
    </section>
  );
}

type LoadingStateProps = {
  title: string;
  text?: ReactNode;
  variant?: "page" | "card" | "inline";
};

// Carregamento padrão: um sensor no solo emitindo sinal enquanto os dados chegam.
export function LoadingState({ title, text, variant = "page" }: LoadingStateProps) {
  return (
    <div className={`${styles.loading} ${styles[variant]}`} role="status">
      <svg className={styles.loadingArt} viewBox="0 0 96 96" aria-hidden="true">
        <path className={styles.soil} d="M8 66h80v18H8z" />
        <path d="M8 66h80" />
        <rect className={styles.accent} x="38" y="30" width="20" height="24" rx="4" />
        <path d="M48 54v24" />
        <path className={styles.ring1} d="M28 26a28 28 0 0 1 40 0" />
        <path className={styles.ring2} d="M35 32a18 18 0 0 1 26 0" />
      </svg>
      <div>
        <strong className={styles.title}>{title}</strong>
        {text && <p className={styles.text}>{text}</p>}
      </div>
      <span className={styles.bar} aria-hidden="true" />
    </div>
  );
}
