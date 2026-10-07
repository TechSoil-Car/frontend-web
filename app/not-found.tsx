import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Página não encontrada | TechSoil Systems",
  description: "Este caminho não foi encontrado. Volte ao início da TechSoil.",
};

function FieldCompanion() {
  return (
    <svg className={styles.companion} viewBox="0 0 400 400" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="sensor-shell" x1="128" y1="120" x2="290" y2="310" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBFFF4" />
          <stop offset="1" stopColor="#BAD3A4" />
        </linearGradient>
        <linearGradient id="sensor-face" x1="153" y1="164" x2="259" y2="263" gradientUnits="userSpaceOnUse">
          <stop stopColor="#31563C" />
          <stop offset="1" stopColor="#142F23" />
        </linearGradient>
        <linearGradient id="leaf" x1="189" y1="110" x2="258" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#578D3D" />
          <stop offset="1" stopColor="#B5E582" />
        </linearGradient>
      </defs>
      <ellipse cx="202" cy="360" rx="118" ry="16" fill="#23472F" opacity=".12" />
      <path d="M172 302L165 342M231 303L238 342" stroke="#6E825B" strokeWidth="16" strokeLinecap="round" />
      <path d="M145 348C145 335 176 333 181 346L183 354H144L145 348ZM222 346C227 333 258 335 259 348L260 354H221L222 346Z" fill="#294B32" />
      <path d="M125 214C98 216 91 236 98 257M278 214C305 216 312 236 305 257" stroke="#79995E" strokeWidth="17" strokeLinecap="round" />
      <path d="M201 132V90" stroke="#658F47" strokeWidth="9" strokeLinecap="round" />
      <path d="M201 105C181 105 148 84 155 57C183 54 204 75 201 105Z" fill="#719F50" />
      <path d="M199 98C193 60 224 31 258 35C262 72 230 105 199 98Z" fill="url(#leaf)" />
      <path d="M204 90L240 52" stroke="#D1EEAA" strokeWidth="3" strokeLinecap="round" />
      <rect x="120" y="125" width="163" height="187" rx="56" fill="#8CA875" />
      <rect x="120" y="118" width="163" height="187" rx="56" fill="url(#sensor-shell)" stroke="#F6FFEA" strokeWidth="3" />
      <path d="M138 157C143 143 151 137 165 134" stroke="white" strokeWidth="5" strokeLinecap="round" opacity=".8" />
      <rect x="140" y="160" width="123" height="106" rx="34" fill="url(#sensor-face)" />
      <ellipse cx="177" cy="201" rx="10" ry="13" fill="#E7F5D6" />
      <ellipse cx="227" cy="201" rx="10" ry="13" fill="#E7F5D6" />
      <circle cx="180" cy="198" r="3" fill="white" />
      <circle cx="230" cy="198" r="3" fill="white" />
      <path d="M191 228Q202 237 213 228" stroke="#C7EB9C" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="162" cy="221" rx="9" ry="4" fill="#A8D679" opacity=".25" />
      <ellipse cx="242" cy="221" rx="9" ry="4" fill="#A8D679" opacity=".25" />
      <circle cx="202" cy="282" r="5" fill="#6D9D40" />
      <path d="M62 346V319M62 335C46 335 36 324 39 312C53 311 63 321 62 335ZM63 325C63 311 73 302 86 304C87 318 76 327 63 325Z" stroke="#77975C" strokeWidth="3" fill="#AACD85" strokeLinejoin="round" />
      <path d="M332 349V326M332 340C320 340 312 331 314 322C325 321 333 329 332 340ZM333 333C333 321 341 314 351 315C352 326 344 334 333 333Z" stroke="#77975C" strokeWidth="3" fill="#AACD85" strokeLinejoin="round" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="TechSoil Systems — início">
            <span className={styles.mark}>
              <Image src="/techsoil-mark.png" alt="" width={108} height={108} />
            </span>
            <span>TECHSOIL<small>SYSTEMS</small></span>
          </Link>
          <span className={styles.tagline}>Inteligência que nasce no campo.</span>
          <Link href="/dashboard" className={styles.panelLink}>Acessar painel <span aria-hidden="true">↗</span></Link>
        </header>

        <main className={styles.main}>
          <div className={styles.illustration} aria-hidden="true">
            <div className={styles.cloudOne} />
            <div className={styles.cloudTwo} />
            <div className={styles.sun} />
            <span className={styles.errorCode}>404</span>
            <span className={styles.orbitOne}>+</span>
            <span className={styles.orbitTwo}>+</span>
            <FieldCompanion />
            <span className={styles.fieldLine} />
          </div>
          <div className={styles.copy}>
            <p className={styles.eyebrow}><span /> CAMINHO NÃO ENCONTRADO</p>
            <h1>Ops! Saímos da trilha.</h1>
            <p className={styles.description}>Esta página não foi encontrada. Mas o caminho de volta<br className={styles.desktopBreak} /> para a TechSoil está logo aqui.</p>
            <Link href="/" className={styles.homeLink}><span aria-hidden="true">←</span> Voltar ao início</Link>
          </div>
        </main>
        <footer className={styles.footer}>
          <span>TECHSOIL SYSTEMS</span>
          <span>Cultivando conexões. Encontrando caminhos.</span>
          <span>ERRO 404</span>
        </footer>
      </div>
    </div>
  );
}
