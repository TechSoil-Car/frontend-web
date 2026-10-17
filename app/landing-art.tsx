import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
  );
}

export function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className={`${styles.brand} ${inverted ? styles.brandInverted : ""}`}>
      <span className={styles.brandMark}>
        <Image src="/techsoil-mark.png" alt="" width={128} height={128} />
      </span>
      <span>
        <strong>TECHSOIL</strong>
        <small>SYSTEMS</small>
      </span>
    </span>
  );
}

const footerLinks = [
  { label: "Plataforma", href: "/plataforma" },
  { label: "Tecnologia", href: "/#tecnologia" },
  { label: "Hardware", href: "/hardware" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Perguntas", href: "/#perguntas" },
  { label: "Sobre", href: "/sobre" },
  { label: "Entrar", href: "/login" },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div>
          <Brand inverted />
          <p>Inteligência para o solo. Clareza para quem produz.</p>
        </div>
        <nav aria-label="Rodapé">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>
      </div>
      <div className={styles.footerBottom}>
        <small>© 2026 TechSoil Systems</small>
        <a href="#top">Voltar ao topo ↑</a>
      </div>
    </footer>
  );
}
