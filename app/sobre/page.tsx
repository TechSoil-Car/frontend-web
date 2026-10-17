import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import hw from "../hardware/hardware.module.css";
import { ArrowIcon, SiteFooter } from "../landing-art";
import { Navbar, Reveal } from "../landing-interactions";
import landing from "../page.module.css";
import styles from "./sobre.module.css";
import { Team } from "./team";
import { PageTransition } from "../page-transition";

export const metadata: Metadata = {
  title: "Sobre | TechSoil Systems",
  description:
    "A TechSoil nasceu na ETEC Bento Quirino, em Campinas, como projeto de engenharia para monitorar o solo de vinhedos com sensores, IoT e uma plataforma digital.",
};

// Conteúdo conforme o relatório da 14ª Mostra 3M (versão de 1º/10/2026).
const highlights = [
  { value: "3", label: "estudantes de Desenvolvimento de Sistemas" },
  { value: "2º", label: "lugar na 16ª Bentotec, em 2025" },
  { value: "Nov.", label: "apresentação na 14ª Mostra 3M" },
];

const timeline = [
  {
    when: "2025",
    title: "TechSoil-Car na 16ª Bentotec",
    text: "A primeira versão, com sensores de temperatura e umidade, ficou em 2º lugar na sua categoria.",
    status: "2º lugar",
  },
  {
    when: "Jun. a ago. 2026",
    title: "Arquitetura e serviços",
    text: "Comunicação por MQTT, backends, banco de dados e testes com dispositivos simulados.",
    status: "Concluído",
  },
  {
    when: "Ago. a out. 2026",
    title: "Plataforma web",
    text: "Visão geral, mapa da lavoura, sensores, alertas e equipe com perfis de acesso.",
    status: "Concluído",
  },
  {
    when: "Out. 2026",
    title: "Sensor 7 em 1 e gabinete",
    text: "Integração da sonda NPK com ESP32, GPS e energia solar, na caixa impressa em 3D.",
    status: "Concluído",
  },
  {
    when: "21 e 22 out. 2026",
    title: "17ª Bentotec",
    text: "Apresentação da TechSoil na feira de tecnologia da ETEC Bento Quirino.",
    status: "Previsto",
  },
  {
    when: "Out. e nov. 2026",
    title: "Carrinho de inspeção",
    text: "Montagem e ensaios do carrinho que registra imagens entre as fileiras.",
    status: "Previsto",
  },
  {
    when: "18 e 19 nov. 2026",
    title: "14ª Mostra 3M",
    text: "Apresentação do conjunto na Mostra de Ciências e Tecnologia Instituto 3M.",
    status: "Previsto",
  },
];

const awards = [
  {
    place: "2º",
    title: "lugar na categoria",
    event: "16ª Bentotec · 2025",
    text: "Feira de tecnologia da ETEC Bento Quirino. O projeto ainda se chamava TechSoil-Car.",
  },
];

// Competições que ainda vão acontecer: entram em awards quando houver resultado.
const upcoming = [
  { event: "17ª Bentotec", when: "21 e 22 out. 2026" },
  { event: "14ª Mostra 3M", when: "18 e 19 nov. 2026" },
];

const validated = [
  "Os sensores da primeira versão distinguiram solo seco, úmido e molhado em ambiente controlado.",
  "Leituras enviadas mais de uma vez não viram registros duplicados.",
  "Uma pessoa vinculada a uma plantação não consegue ver dados de outra.",
  "O fluxo completo, do dispositivo à tela, foi testado com sensores simulados.",
];

const pending = [
  "Comparar as leituras do sensor 7 em 1 com análises de laboratório.",
  "Ensaiar o conjunto em vinhedo, com solo, clima e rede reais.",
  "Medir a autonomia da bateria com o painel solar.",
  "Testar o carrinho entre fileiras, com parada diante de obstáculos.",
];

export default function SobrePage() {
  return (
    <PageTransition>
      <main className={`${landing.page} ${hw.page}`} id="top">
        <Navbar />

        <header className={hw.hero}>
          <Reveal className={hw.heroCopy}>
            <p className={landing.sectionLabel}>Sobre</p>
            <h1>
              Feito em sala de aula,
              <br />
              <mark>pensado para o campo.</mark>
            </h1>
            <p className={hw.lead}>
              A TechSoil nasceu na ETEC Bento Quirino, em Campinas (SP), como um projeto de engenharia
              para ajudar pequenos e médios produtores de uva a acompanhar o solo dos vinhedos.
            </p>
            <dl className={hw.highlights}>
              {highlights.map((item) => (
                <div key={item.label}>
                  <dt>{item.value}</dt>
                  <dd>{item.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal delay={120} className={`${hw.heroMedia} ${styles.photo}`}>
            <Image
              src="/sobre/equipe-bentotec-2025.jpg"
              alt="Arthur, Murilo e Mateus no estande do TechSoil-Car na 16ª Bentotec, com o carrinho, o painel e o sensor em uma caixa de terra"
              fill
              sizes="(max-width: 900px) 92vw, 460px"
              preload
            />
            <span aria-hidden="true">Equipe na 16ª Bentotec, 2025</span>
          </Reveal>
        </header>

        <section className={hw.section} id="pergunta">
          <Reveal className={hw.sectionHead}>
            <p className={landing.sectionLabel}>01 — A pergunta</p>
            <h2>De onde a ideia veio</h2>
          </Reveal>
          <Reveal delay={100} className={styles.question}>
            <blockquote>
              Como juntar sensores de solo, uma plataforma digital e um carrinho de inspeção em uma
              solução de <mark>custo controlado</mark> para acompanhar cada ponto de um vinhedo?
            </blockquote>
            <p>
              Em um vinhedo, as plantas ficam em fileiras e cada ponto pode precisar de visitas
              repetidas. A proposta é reunir as medições num só lugar, por dispositivo e por
              plantação, usando peças vendidas no comércio e módulos que podem evoluir separadamente.
            </p>
          </Reveal>
        </section>

        <section className={hw.section} id="equipe">
          <Reveal className={hw.sectionHead}>
            <p className={landing.sectionLabel}>02 — Equipe</p>
            <h2>Quem está por trás</h2>
            <p className={hw.sectionText}>
              Estudantes do Ensino Médio integrado ao Técnico em Desenvolvimento de Sistemas. Clique
              em um estudante para ler a biografia.
            </p>
          </Reveal>
          <Team />
        </section>

        <section className={hw.section} id="premios">
          <Reveal className={hw.sectionHead}>
            <p className={landing.sectionLabel}>03 — Reconhecimento</p>
            <h2>Prêmios</h2>
          </Reveal>
          <div className={styles.awards}>
            {awards.map((award) => (
              <Reveal key={award.event} className={styles.award}>
                <svg viewBox="0 0 48 48" aria-hidden="true">
                  <circle cx="24" cy="20" r="13" />
                  <path d="M17 31 13 44l11-5 11 5-4-13" />
                </svg>
                <p>
                  <strong>{award.place}</strong> {award.title}
                </p>
                <small>{award.event}</small>
                <span>{award.text}</span>
              </Reveal>
            ))}
            {upcoming.map((item, index) => (
              <Reveal key={item.event} delay={(index + 1) * 100} className={styles.upcoming}>
                <em>Em disputa</em>
                <strong>{item.event}</strong>
                <small>{item.when}</small>
              </Reveal>
            ))}
          </div>
        </section>

        <section className={`${hw.section} ${hw.powerSection}`} id="trajetoria">
          <Reveal className={hw.sectionHead}>
            <p className={landing.sectionLabel}>04 — Trajetória</p>
            <h2>Do primeiro sensor à Mostra 3M</h2>
            <figure className={styles.firstVersion}>
              <Image
                src="/sobre/plataforma-inicial.png"
                alt="Primeira versão da plataforma, chamada TechSoil-Car, com temperatura, umidade e um gráfico de temperatura do solo"
                width={797}
                height={401}
                sizes="300px"
              />
              <figcaption>Primeira versão da plataforma, ainda com o nome TechSoil-Car.</figcaption>
            </figure>
          </Reveal>
          <Reveal delay={100}>
            <ol className={styles.timeline}>
              {timeline.map((step) => (
                <li key={step.title} data-status={step.status}>
                  <small>{step.when}</small>
                  <div>
                    <strong>{step.title}</strong>
                    <span>{step.text}</span>
                  </div>
                  <em>{step.status}</em>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        <section className={hw.section} id="pe-no-chao">
          <Reveal className={hw.sectionHead}>
            <p className={landing.sectionLabel}>05 — Com o pé no chão</p>
            <h2>O que já provamos e o que falta medir</h2>
            <p className={hw.sectionText}>
              Só vamos falar em ganho de produtividade ou economia de insumos depois dos ensaios em campo.
            </p>
          </Reveal>
          <div className={styles.proof}>
            <Reveal className={hw.group}>
              <h3>Já verificado</h3>
              <ul>
                {validated.map((item) => (
                  <li key={item}>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={100} className={`${hw.group} ${styles.pending}`}>
              <h3>Próximos ensaios</h3>
              <ul>
                {pending.map((item) => (
                  <li key={item}>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className={hw.cta}>
          <h2>Quer acompanhar o projeto ou testar na sua propriedade?</h2>
          <Link className={landing.primaryButton} href="/#orcamento">
            Fale com a gente <ArrowIcon />
          </Link>
        </section>

        <SiteFooter />
      </main>
    </PageTransition>
  );
}
