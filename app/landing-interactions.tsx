"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import styles from "./page.module.css";

const navItems = [
  { label: "Início", href: "#inicio", id: "inicio" },
  { label: "Solução", href: "#solucao", id: "solucao" },
  { label: "Tecnologia", href: "#tecnologia", id: "tecnologia" },
  { label: "Como funciona", href: "#como-funciona", id: "como-funciona" },
  { label: "Sobre", href: "#sobre", id: "sobre" },
];

const sectionIds = [...navItems.map((item) => item.id), "orcamento"];

export function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
  );
}

export function Brand() {
  return (
    <span className={styles.brand}>
      <span className={styles.brandMark}>
        <Image src="/techsoil-mark.png" alt="" width={128} height={128} priority />
      </span>
      <span>
        <strong>TECHSOIL</strong>
        <small>SYSTEMS</small>
      </span>
    </span>
  );
}

export function Navbar() {
  const [activeSection, setActiveSection] = useState("inicio");

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      const marker = window.innerHeight * 0.38;
      let current = sectionIds[0];

      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= marker) {
          current = id;
        }
      }

      setActiveSection(current);
      frame = 0;
    };

    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header className={styles.navWrap}>
      <nav className={styles.nav} aria-label="Navegação principal">
        <a href="#inicio" aria-label="TechSoil Systems — início">
          <Brand />
        </a>

        <div className={styles.navLinks}>
          {navItems.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <a
                key={item.href}
                href={item.href}
                className={isActive ? styles.navLinkActive : undefined}
                aria-current={isActive ? "location" : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </div>

        <a
          className={`${styles.navCta} ${activeSection === "orcamento" ? styles.navCtaActive : ""}`}
          href="#orcamento"
          aria-current={activeSection === "orcamento" ? "location" : undefined}
        >
          Orçamento <ArrowIcon />
        </a>
      </nav>
    </header>
  );
}

export function InteractiveDashboard() {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const card = cardRef.current;
    if (!card) return;

    const bounds = card.getBoundingClientRect();
    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;

    card.style.setProperty("--tilt-x", `${vertical * -8}deg`);
    card.style.setProperty("--tilt-y", `${horizontal * 10}deg`);
    card.style.setProperty("--glow-x", `${(horizontal + 0.5) * 100}%`);
    card.style.setProperty("--glow-y", `${(vertical + 0.5) * 100}%`);
  };

  const resetCard = () => {
    const card = cardRef.current;
    if (!card) return;

    card.style.setProperty("--tilt-x", "1deg");
    card.style.setProperty("--tilt-y", "-3deg");
    card.style.setProperty("--glow-x", "50%");
    card.style.setProperty("--glow-y", "50%");
  };

  return (
    <div
      ref={cardRef}
      className={styles.dashboard}
      aria-label="Prévia do painel TechSoil"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetCard}
    >
      <div className={styles.dashboardGlow} />
      <div className={styles.dashboardTop}>
        <Brand />
        <span>Fazenda Ferragut <i /></span>
      </div>
      <div className={styles.dashboardBody}>
        <div className={styles.dashboardTitle}>
          <div>
            <small>VISÃO GERAL</small>
            <h3>Bom dia, produtor.</h3>
          </div>
          <span className={styles.status}><i /> Sistema online</span>
        </div>
        <div className={styles.metrics}>
          <div><small>Umidade do solo</small><strong>42,5<sup>%</sup></strong><span>nível adequado</span></div>
          <div><small>Temperatura</small><strong>22,1<sup>°C</sup></strong><span>condição estável</span></div>
          <div><small>pH do solo</small><strong>6,8</strong><span>faixa ideal</span></div>
        </div>
        <div className={styles.chartCard}>
          <div><small>UMIDADE — ÚLTIMAS 24H</small><b>Monitoramento contínuo</b></div>
          <svg viewBox="0 0 600 130" role="img" aria-label="Gráfico de umidade estável">
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#73b640" stopOpacity=".35" />
                <stop offset="100%" stopColor="#73b640" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className={styles.chartFill} d="M0 93 C60 82 86 88 128 67 S205 51 250 60 327 92 375 69 450 30 500 43 555 73 600 44 V130 H0Z" />
            <path className={styles.chartLine} d="M0 93 C60 82 86 88 128 67 S205 51 250 60 327 92 375 69 450 30 500 43 555 73 600 44" />
          </svg>
        </div>
      </div>
    </div>
  );
}

type MapMode = "solo" | "umidade" | "inspecoes";
type SectorId = "a" | "b" | "c";

const mapModes: { id: MapMode; label: string }[] = [
  { id: "solo", label: "Saúde do solo" },
  { id: "umidade", label: "Umidade" },
  { id: "inspecoes", label: "Inspeções" },
];

const sectorData: Record<MapMode, Record<SectorId, { value: string; label: string; status: string; tone: "good" | "watch" | "alert" }>> = {
  solo: {
    a: { value: "pH 6,8", label: "Faixa adequada", status: "Estável", tone: "good" },
    b: { value: "N 45", label: "Nitrogênio (mg/kg)", status: "Estável", tone: "good" },
    c: { value: "410", label: "Condutividade (μS/cm)", status: "Atenção", tone: "alert" },
  },
  umidade: {
    a: { value: "42,5%", label: "Umidade do solo", status: "Adequada", tone: "good" },
    b: { value: "38,2%", label: "Umidade do solo", status: "Acompanhar", tone: "watch" },
    c: { value: "29,8%", label: "Umidade do solo", status: "Baixa", tone: "alert" },
  },
  inspecoes: {
    a: { value: "0 alertas", label: "Última inspeção", status: "Concluída", tone: "good" },
    b: { value: "1 ponto", label: "Requer nova análise", status: "Revisar", tone: "watch" },
    c: { value: "Pendente", label: "Ainda não percorrido", status: "Próxima rota", tone: "alert" },
  },
};

const sectorNames: Record<SectorId, string> = {
  a: "Talhão A",
  b: "Talhão B",
  c: "Talhão C",
};

export function FieldIntelligence() {
  const [mode, setMode] = useState<MapMode>("solo");
  const [activeSector, setActiveSector] = useState<SectorId>("a");
  const current = sectorData[mode][activeSector];

  return (
    <div className={styles.fieldFeature}>
      <div className={styles.fieldFeatureHead}>
        <div>
          <p className={styles.kicker}>Inteligência por área</p>
          <h2>Não saiba apenas o que acontece. <em>Saiba onde acontece.</em></h2>
        </div>
        <p>
          Leituras do solo e inspeções georreferenciadas mostram onde está tudo
          bem e quais pontos da plantação merecem sua atenção.
        </p>
      </div>

      <div className={styles.fieldMap}>
        <Image
          src="/vineyard-sectors.png"
          alt="Vista aérea de talhões de um vinhedo"
          fill
          sizes="(max-width: 960px) 100vw, 86vw"
        />
        <div className={styles.fieldMapShade} />

        <div className={styles.mapTopbar}>
          <div>
            <span className={styles.liveDot} />
            Fazenda Ferragut
            <small>Visualização demonstrativa</small>
          </div>
          <span>Atualizado agora</span>
        </div>

        <div className={styles.mapModes} role="tablist" aria-label="Camada de dados">
          {mapModes.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              className={mode === item.id ? styles.mapModeActive : undefined}
              onClick={() => setMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {(["a", "b", "c"] as SectorId[]).map((sector) => {
          const data = sectorData[mode][sector];
          return (
            <button
              key={sector}
              type="button"
              aria-label={`${sectorNames[sector]}: ${data.value}, ${data.status}`}
              className={`${styles.fieldZone} ${styles[`fieldZone${sector.toUpperCase()}`]} ${styles[`zone${data.tone}`]} ${activeSector === sector ? styles.fieldZoneActive : ""}`}
              onMouseEnter={() => setActiveSector(sector)}
              onFocus={() => setActiveSector(sector)}
              onClick={() => setActiveSector(sector)}
            >
              <span className={styles.zoneLabel}>
                <i />
                <strong>{sectorNames[sector]}</strong>
                <small>{data.value}</small>
              </span>
            </button>
          );
        })}

        <aside className={styles.mapInsight} aria-live="polite">
          <div>
            <small>ÁREA SELECIONADA</small>
            <span className={`${styles.insightStatus} ${styles[`insight${current.tone}`]}`}>
              <i /> {current.status}
            </span>
          </div>
          <h3>{sectorNames[activeSector]}</h3>
          <strong>{current.value}</strong>
          <p>{current.label}</p>
          <div className={styles.insightMeta}>
            <span>Última leitura<strong>há 2 min</strong></span>
            <span>Dispositivo<strong>sensor_01</strong></span>
          </div>
        </aside>

        <div className={styles.mapLegend}>
          <span><i className={styles.legendGood} /> Adequado</span>
          <span><i className={styles.legendWatch} /> Acompanhar</span>
          <span><i className={styles.legendAlert} /> Atenção</span>
        </div>
      </div>
    </div>
  );
}
