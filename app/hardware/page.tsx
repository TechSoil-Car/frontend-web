import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, SiteFooter } from "../landing-art";
import { Navbar, Reveal } from "../landing-interactions";
import landing from "../page.module.css";
import { CASE_OUTLINE } from "./case-outline";
import styles from "./hardware.module.css";

export const metadata: Metadata = {
  title: "Hardware | TechSoil Systems",
  description:
    "O sensor de solo TechSoil: sonda NPK 7 em 1, ESP32, GPS e energia solar em uma caixa impressa em 3D.",
};

// Conteúdo conforme o guia "TechSoil — Hardware + Firmware" (rev. 16/10/2026).
const highlights = [
  { value: "7", label: "parâmetros por leitura" },
  { value: "GPS", label: "posição de cada ponto" },
  { value: "Solar", label: "recarga pela tampa" },
];

const layout = [
  {
    title: "Dentro da caixa",
    items: [
      { name: "ESP32-WROOM-32", text: "Controlador encaixado no shield de expansão, com USB acessível para gravação." },
      { name: "GPS NEO-6M", text: "Com antena voltada para o céu, longe dos fios de potência." },
      { name: "Conversor RS485", text: "Módulo MAX3485 de 3,3 V que conversa com a sonda." },
      { name: "TP4056 + MT3608", text: "Carga protegida da bateria e saída ajustada em 5,0 V." },
      { name: "Bateria 18650", text: "Uma célula no holder, com polaridade marcada." },
    ],
  },
  {
    title: "Fora da caixa",
    items: [
      { name: "Sonda NPK 7 em 1", text: "Fica enterrada no solo; só o cabo entra na caixa." },
      { name: "Painel solar", text: "6 V / 6 W preso à tampa, com saída USB regulada de 5 V." },
    ],
  },
  {
    title: "Na própria caixa",
    items: [
      { name: "Prensa-cabos PG7", text: "Entradas vedadas para o cabo do sensor e o do painel." },
      { name: "Junta e dobradiça", text: "Tampa articulada com vedação, aberta sem tracionar os fios." },
    ],
  },
];

const power = [
  { name: "Painel solar", detail: "5 V USB" },
  { name: "TP4056", detail: "carga protegida" },
  { name: "Bateria 18650", detail: "uma célula" },
  { name: "MT3608", detail: "5,0 V" },
  { name: "ESP32 e sonda", detail: "medição e envio" },
];

const specs = [
  { label: "Parâmetros", value: "Umidade, temperatura, condutividade elétrica, pH, nitrogênio, fósforo e potássio" },
  { label: "Sonda", value: "Sensor de solo 7 em 1 com saída RS485 (Modbus), alimentação de 3,3 a 24 V" },
  { label: "Controlador", value: "ESP32-WROOM-32 com shield de expansão" },
  { label: "Comunicação", value: "Wi-Fi com envio por MQTT", note: "Cada leitura sai com horário, identificação da sonda, unidades e posição." },
  { label: "Localização", value: "GPS NEO-6M", note: "A posição só é publicada com sinal válido, junto com a idade da leitura." },
  { label: "Energia", value: "Bateria 18650 com TP4056 protegido, conversor MT3608 em 5,0 V e painel solar 6 V / 6 W" },
  { label: "Gabinete", value: "Caixa própria projetada pela equipe e impressa em 3D, com tampa articulada, junta e prensa-cabos PG7" },
  { label: "Dimensões", value: "Corpo de 350 × 250 mm em planta; 402 mm com as abas de fixação", note: "Abas laterais com furo de 9 mm. Medidas do arquivo do Tinkercad." },
];

// Planta com cotas; as coordenadas do contorno já estão em milímetros.
function CaseBlueprint() {
  return (
    <svg className={styles.blueprint} viewBox="-230 -170 460 340" role="img" aria-labelledby="planta-titulo">
      <title id="planta-titulo">Vista superior da caixa: corpo de 350 por 250 mm, com abas laterais de fixação e largura total de 402 mm</title>
      <path className={styles.outline} d={CASE_OUTLINE} fillRule="evenodd" />
      <g className={styles.holes}>
        <circle cx="-187" cy="5" r="4.5" />
        <circle cx="187" cy="5" r="4.5" />
      </g>
      <g className={styles.dims}>
        <path d="M-175 -150 H175 M-175 -158 V-142 M175 -158 V-142" />
        <text x="0" y="-158">350 mm</text>
        <path d="M-201 152 H201 M-201 144 V160 M201 144 V160" />
        <text x="0" y="146">402 mm com abas</text>
        <path d="M216 -120 V130 M208 -120 H224 M208 130 H224" />
        <text x="0" y="0" transform="translate(212 5) rotate(90)">250 mm</text>
        <path d="M-187 5 L-208 -40 H-220" />
        <text x="-222" y="-44" textAnchor="end">⌀ 9 mm</text>
      </g>
      <text className={styles.label} x="0" y="8">VISTA SUPERIOR</text>
    </svg>
  );
}

export default function HardwarePage() {
  return (
    <main className={`${landing.page} ${styles.page}`} id="top">
      <Navbar />

      <header className={styles.hero}>
        <Reveal className={styles.heroCopy}>
          <p className={landing.sectionLabel}>Hardware</p>
          <h1>
            O sensor por trás
            <br />
            <mark>de cada leitura.</mark>
          </h1>
          <p className={styles.lead}>
            Uma sonda enterrada no talhão, um ESP32 com GPS e energia solar, tudo numa caixa
            projetada e impressa em 3D pela equipe TechSoil.
          </p>
          <dl className={styles.highlights}>
            {highlights.map((item) => (
              <div key={item.label}>
                <dt>{item.value}</dt>
                <dd>{item.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <Reveal delay={120} className={styles.heroMedia}>
          <span aria-hidden="true">Gabinete · render 3D</span>
          <Image
            src="/hardware/gabinete-sensor.png"
            alt="Render 3D da caixa do sensor de solo TechSoil, com tampa articulada"
            width={900}
            height={670}
            sizes="(max-width: 900px) 80vw, 420px"
            unoptimized
            preload
          />
        </Reveal>
      </header>

      <section className={styles.section} id="sensor-de-solo">
        <Reveal className={styles.sectionHead}>
          <p className={landing.sectionLabel}>01 — Componentes</p>
          <h2>Dentro e fora da caixa</h2>
        </Reveal>
        <div className={styles.layout}>
          {layout.map((group, index) => (
            <Reveal key={group.title} delay={index * 100} className={styles.group}>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item.name}>
                    <strong>{item.name}</strong>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>

      <section className={styles.section} id="caixa">
        <Reveal className={styles.sectionHead}>
          <p className={landing.sectionLabel}>02 — Gabinete</p>
          <h2>A caixa, em planta</h2>
          <p className={styles.sectionText}>
            Desenho exportado do projeto no Tinkercad. A caixa é impressa em partes e ganha
            abas laterais para ser fixada no campo.
          </p>
        </Reveal>
        <Reveal delay={100} className={styles.blueprintFrame}>
          <CaseBlueprint />
        </Reveal>
      </section>

      <section className={`${styles.section} ${styles.powerSection}`}>
        <Reveal className={styles.sectionHead}>
          <p className={landing.sectionLabel}>03 — Energia</p>
          <h2>Do sol até a leitura</h2>
        </Reveal>
        <Reveal delay={100}>
          <ol className={styles.power}>
            {power.map((step, index) => (
              <li key={step.name} style={{ "--step": index } as CSSProperties}>
                <strong>{step.name}</strong>
                <span>{step.detail}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      <section className={styles.section}>
        <Reveal className={styles.sectionHead}>
          <p className={landing.sectionLabel}>04 — Ficha técnica</p>
          <h2>Especificações</h2>
        </Reveal>
        <Reveal delay={100}>
          <dl className={styles.specs}>
            {specs.map((spec) => (
              <div key={spec.label}>
                <dt>{spec.label}</dt>
                <dd>
                  {spec.value}
                  {spec.note && <small>{spec.note}</small>}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      <section className={styles.cta}>
        <h2>Quer ver o sensor funcionando na sua propriedade?</h2>
        <Link className={landing.primaryButton} href="/#orcamento">
          Solicitar proposta <ArrowIcon />
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
