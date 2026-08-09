import Image from "next/image";
import {
  ArrowIcon,
  Brand,
  FieldIntelligence,
  InteractiveDashboard,
  Navbar,
} from "./landing-interactions";
import styles from "./page.module.css";

const capabilities = [
  {
    number: "01",
    title: "Solo sob controle",
    text: "Umidade, temperatura, pH, condutividade e nutrientes acompanhados em uma única leitura.",
  },
  {
    number: "02",
    title: "Visão que percorre",
    text: "Um carrinho autônomo registra a plantação e ajuda a identificar pontos que pedem atenção.",
  },
  {
    number: "03",
    title: "Decisão com contexto",
    text: "Dados organizados em um painel simples para você agir com mais precisão e menos desperdício.",
  },
];

const steps = [
  ["01", "Instalamos", "Os dispositivos são associados à sua área e preparados para a rotina da plantação."],
  ["02", "Monitoramos", "Sensores e imagens transformam o campo em informações claras e contínuas."],
  ["03", "Você decide", "O painel destaca o que mudou para apoiar decisões rápidas e responsáveis."],
];

export default function Home() {
  return (
    <main>
      <Navbar />

      <section className={styles.hero} id="inicio">
        <Image
          className={styles.heroImage}
          src="/hero-vineyard.png"
          alt="Vinhedo monitorado por sensor de solo e carrinho autônomo"
          fill
          sizes="100vw"
          priority
        />
        <div className={styles.heroShade} />

        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>
            <span /> Tecnologia que nasce no campo
          </p>
          <h1>
            Cultive decisões.
            <br />
            <em>Colha resultados.</em>
          </h1>
          <p className={styles.heroLead}>
            Inteligência de solo e monitoramento autônomo para transformar cada
            leitura do campo em uma escolha mais precisa.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="#orcamento">
              Solicitar orçamento <ArrowIcon />
            </a>
            <a className={styles.ghostButton} href="#solucao">
              Conhecer a solução
            </a>
          </div>
        </div>

        <div className={styles.heroFoot} aria-label="Destaques da solução">
          <span><strong>7</strong> parâmetros do solo</span>
          <span><strong>24h</strong> de visão contínua</span>
          <a href="#solucao">Explore a TechSoil <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section className={styles.intro} id="solucao">
        <div className={styles.sectionLabel}>01 — A solução</div>
        <div className={styles.introCopy}>
          <p className={styles.kicker}>Tecnologia útil, do jeito que o campo precisa.</p>
          <h2>Menos incerteza entre você e a próxima decisão.</h2>
          <p>
            A TechSoil reúne sensores, automação e uma leitura visual da plantação
            em uma experiência acessível. Você acompanha o que importa sem precisar
            transformar sua rotina em uma planilha.
          </p>
        </div>

        <div className={styles.capabilityGrid}>
          {capabilities.map((capability) => (
            <article className={styles.capabilityCard} key={capability.number}>
              <span>{capability.number}</span>
              <div className={styles.cardGlyph} aria-hidden="true" />
              <h3>{capability.title}</h3>
              <p>{capability.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.technology} id="tecnologia">
        <div className={styles.techCopy}>
          <div className={styles.sectionLabel}>02 — Tecnologia</div>
          <p className={styles.kicker}>O campo fala. A TechSoil traduz.</p>
          <h2>Uma visão completa, sem complicar a leitura.</h2>
          <p>
            Da saúde química do solo às imagens capturadas entre as fileiras, cada
            dado chega organizado por plantação e por dispositivo.
          </p>
          <ul>
            <li><span /> Leituras de NPK, pH e condutividade elétrica</li>
            <li><span /> Temperatura e umidade em acompanhamento contínuo</li>
            <li><span /> Inspeção visual georreferenciada da plantação</li>
          </ul>
        </div>

        <InteractiveDashboard />
        <FieldIntelligence />
      </section>

      <section className={styles.process} id="como-funciona">
        <div className={styles.sectionLabel}>03 — Como funciona</div>
        <div className={styles.processHead}>
          <p className={styles.kicker}>Da terra à tela.</p>
          <h2>Três passos para enxergar melhor sua produção.</h2>
        </div>
        <div className={styles.steps}>
          {steps.map(([number, title, text]) => (
            <article key={number}>
              <span>{number}</span>
              <div className={styles.stepLine}><i /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.about} id="sobre">
        <div className={styles.aboutVisual}>
          <div className={styles.orbit}><span>SOLO</span><span>DADOS</span><span>DECISÃO</span></div>
          <Image src="/techsoil-mark.png" alt="Símbolo TechSoil" width={420} height={420} />
        </div>
        <div className={styles.aboutCopy}>
          <div className={styles.sectionLabel}>04 — Sobre nós</div>
          <p className={styles.kicker}>Inovação próxima de quem produz.</p>
          <h2>Tecnologia agrícola que cabe na realidade do produtor.</h2>
          <p>
            A TechSoil Systems nasceu para aproximar ferramentas modernas de quem
            cuida da terra todos os dias. Desenvolvemos uma solução profissional,
            acessível e construída a partir de necessidades reais do campo.
          </p>
        </div>
      </section>

      <section className={styles.quote} id="orcamento">
        <div>
          <p className={styles.eyebrow}><span /> Comece uma conversa</p>
          <h2>Seu campo já gera sinais.<br /><em>Vamos transformá-los em decisões?</em></h2>
        </div>
        <div className={styles.quoteAction}>
          <p>Conte um pouco sobre a sua produção e receba uma proposta pensada para a sua realidade.</p>
          <a className={styles.primaryButton} href="mailto:contato@techsoil.com.br?subject=Solicitação%20de%20orçamento%20TechSoil">
            Solicitar orçamento <ArrowIcon />
          </a>
          <small>A criação da conta acontece somente após a contratação.</small>
        </div>
      </section>

      <footer className={styles.footer}>
        <Brand />
        <p>Inteligência para o solo. Clareza para quem produz.</p>
        <a href="#inicio">Voltar ao topo ↑</a>
        <small>© 2026 TechSoil Systems</small>
      </footer>
    </main>
  );
}
