import { ArrowIcon, Brand } from "./landing-art";
import {
  AlertFeed,
  CountUp,
  HeroShowcase,
  Navbar,
  ProductShowcase,
  QuoteForm,
  Reveal,
  RoverMission,
  SensorLive,
  Steps,
} from "./landing-interactions";
import styles from "./page.module.css";

const devices = [
  {
    tone: styles.cardForest,
    place: "Subsolo",
    title: "Sensor de solo",
    text: "Lê umidade, temperatura, pH, condutividade e NPK onde a raiz realmente vive.",
    art: <SensorLive />,
  },
  {
    tone: styles.cardCream,
    place: "Entre as fileiras",
    title: "Carrinho autônomo",
    text: "Percorre a plantação registrando imagens georreferenciadas dos pontos que pedem atenção.",
    art: <RoverMission />,
  },
  {
    tone: styles.cardLime,
    place: "Na sua mão",
    title: "Painel web",
    text: "Tudo organizado por propriedade e por dispositivo, no computador ou no celular.",
    art: <AlertFeed />,
  },
];

const stats = [
  { value: 7, suffix: "", text: "parâmetros do solo em cada leitura" },
  { value: 1, suffix: " min", text: "entre cada atualização automática do painel" },
  { value: 24, suffix: "h", text: "de visão contínua, faça chuva ou faça sol" },
  { value: 3, suffix: "", text: "perfis de acesso para dividir o trabalho com a equipe" },
];

const questions = [
  {
    question: "O que os sensores medem?",
    answer: "Umidade, temperatura, pH, condutividade elétrica, nitrogênio, fósforo e potássio — sete parâmetros em cada leitura.",
  },
  {
    question: "Quem instala os dispositivos?",
    answer: "A equipe TechSoil. Os sensores e o carrinho são associados à sua área e preparados para a rotina da plantação.",
  },
  {
    question: "Consigo acompanhar pelo celular?",
    answer: "Sim. O painel funciona no navegador do computador e do celular, com as mesmas leituras, mapa e alertas.",
  },
  {
    question: "Minha equipe pode acessar também?",
    answer: "Pode. Você convida pessoas e escolhe o perfil de cada uma — proprietário, operador ou visualizador — e quais propriedades ela enxerga.",
  },
  {
    question: "Quando recebo o meu acesso?",
    answer: "A criação da conta acontece somente após a contratação. Comece pelo formulário abaixo e retornamos com uma proposta.",
  },
];

const marquee = "NITROGÊNIO ✦ FÓSFORO ✦ POTÁSSIO ✦ pH ✦ CONDUTIVIDADE ✦ UMIDADE ✦ TEMPERATURA ✦ ";

export default function Home() {
  return (
    <main className={styles.page}>
      <Navbar />

      <HeroShowcase>
        <p className={styles.eyebrow}><span /> Monitoramento de solo em tempo real</p>
        <h1>
          Saiba o que o seu
          <br />
          solo precisa
          <br />
          <mark>antes da safra.</mark>
        </h1>
        <p className={styles.heroLead}>
          Sensores leem o solo direto no talhão. A TechSoil transforma cada leitura
          em alertas simples no seu celular — sem planilha, sem achismo.
        </p>
        <div className={styles.heroActions}>
          <a className={styles.primaryButton} href="#orcamento">
            Solicitar proposta <ArrowIcon />
          </a>
          <a className={styles.outlineButton} href="#como-funciona">Ver como funciona</a>
        </div>
        <div className={styles.worksOn}>
          <span>Acompanhe de onde estiver</span>
          <ul>
            <li>Celular</li>
            <li>Computador</li>
            <li>Alertas automáticos</li>
          </ul>
        </div>
      </HeroShowcase>

      <section className={styles.platform} id="plataforma">
        <div className={styles.sectionHead}>
          <Reveal>
            <p className={styles.sectionLabel}>01 — A plataforma</p>
            <h2>
              Você não gerencia
              <br />
              <em>o que não mede.</em>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className={styles.sectionLead}>
              Todos os talhões num só painel: leituras ao vivo, mapa de satélite e
              alertas que mostram o que precisa de atenção — não só o que aconteceu.
            </p>
          </Reveal>
        </div>
        <ProductShowcase />
      </section>

      <section className={styles.technology} id="tecnologia">
        <div className={styles.sectionHead}>
          <Reveal>
            <p className={styles.sectionLabel}>02 — Tecnologia</p>
            <h2>
              O campo fala.
              <br />
              <mark>A TechSoil traduz.</mark>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className={styles.sectionLead}>
              Da química do solo às imagens entre as fileiras, cada dado chega
              organizado por propriedade e por dispositivo.
            </p>
          </Reveal>
        </div>
        <div className={styles.devices}>
          {devices.map((device, index) => (
            <Reveal as="article" key={device.title} className={`${styles.deviceCard} ${device.tone}`} delay={index * 120}>
              <div className={styles.deviceArt}>
                <span>{device.place}</span>
                {device.art}
              </div>
              <div className={styles.deviceCopy}>
                <h3>{device.title}</h3>
                <p>{device.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className={styles.process} id="como-funciona">
        <div className={styles.marquee} aria-hidden="true">
          <div>
            <span>{marquee.repeat(2)}</span>
            <span>{marquee.repeat(2)}</span>
          </div>
        </div>
        <div className={styles.sectionHead}>
          <Reveal>
            <p className={styles.sectionLabel}>03 — Como funciona</p>
            <h2 className={styles.giant}>Da terra<br />à tela.</h2>
          </Reveal>
          <Reveal delay={120}>
            <p className={styles.sectionLead}>
              Três passos — e você não precisa ser especialista em tecnologia para
              nenhum deles.
            </p>
          </Reveal>
        </div>
        <Steps />
      </section>

      <section className={styles.why}>
        <Reveal>
          <p className={styles.sectionLabel}>04 — Por que TechSoil</p>
          <h2>
            Menos incerteza entre você
            <br />
            <strong>e a próxima decisão.</strong>
          </h2>
        </Reveal>
        <dl className={styles.stats}>
          {stats.map((stat, index) => (
            <Reveal key={stat.text} delay={index * 100}>
              <dt><CountUp value={stat.value} suffix={stat.suffix} /></dt>
              <dd>{stat.text}</dd>
            </Reveal>
          ))}
        </dl>

        <div className={styles.faq} id="perguntas">
          <div>
            <p className={styles.sectionLabel}>Perguntas frequentes</p>
            <h2 className={styles.faqTitle}>Dúvidas antes de começar?</h2>
            <p className={styles.faqLead}>Se a sua não estiver aqui, fale com a gente pelo formulário abaixo.</p>
          </div>
          <div className={styles.faqList}>
            {questions.map((item, index) => (
              <details key={item.question} open={index === 0}>
                <summary>
                  {item.question}
                  <i aria-hidden="true" />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.quote} id="orcamento">
        <svg className={styles.quoteRings} viewBox="0 0 620 620" aria-hidden="true">
          {[300, 240, 180, 120].map((radius, index) => (
            <circle key={radius} cx="310" cy="310" r={radius} fill="none" stroke="#172018" strokeOpacity={0.1 + index * 0.02} strokeDasharray={index % 2 ? "4 10" : undefined} />
          ))}
        </svg>
        <Reveal className={styles.quoteCopy}>
          <p className={styles.sectionLabel}>Comece uma conversa</p>
          <h2>Seu campo já gera sinais. Vamos transformá-los em decisões?</h2>
          <p>Conte um pouco sobre a sua produção e receba uma proposta pensada para a sua realidade.</p>
        </Reveal>
        <Reveal delay={150}>
          <QuoteForm />
        </Reveal>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div>
            <Brand inverted />
            <p>Inteligência para o solo. Clareza para quem produz.</p>
          </div>
          <nav aria-label="Rodapé">
            <a href="#plataforma">Plataforma</a>
            <a href="#tecnologia">Tecnologia</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#perguntas">Perguntas</a>
            <a href="/login">Entrar</a>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <small>© 2026 TechSoil Systems</small>
          <a href="#inicio">Voltar ao topo ↑</a>
        </div>
      </footer>
    </main>
  );
}
