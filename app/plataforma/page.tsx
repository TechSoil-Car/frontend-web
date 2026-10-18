import type { Metadata } from "next";
import Link from "next/link";
import hw from "../hardware/hardware.module.css";
import { ArrowIcon, SiteFooter } from "../landing-art";
import { Navbar, Reveal } from "../landing-interactions";
import landing from "../page.module.css";
import { PhoneShowcase, Screenshot } from "./plataforma-interactions";
import styles from "./plataforma.module.css";
import { PageTransition } from "../page-transition";

export const metadata: Metadata = {
  title: "Plataforma | TechSoil Systems",
  description:
    "O painel TechSoil: leituras do solo a cada minuto, mapa de satélite com talhões, alertas configuráveis e acesso por perfil para a equipe.",
};

// Prints reais do painel com dados demo (Fazenda Boa Vista), capturados com o backend interceptado.
const highlights = [
  { value: "1 min", label: "entre cada atualização" },
  { value: "6", label: "regras de alerta ajustáveis" },
  { value: "3", label: "perfis de acesso" },
];

const screens = [
  {
    id: "visao-geral",
    label: "01 — Visão geral",
    title: "A propriedade em um relance",
    text: "Médias das últimas leituras, sensores com sinal recente e os alertas que pedem atenção agora.",
    url: "app.techsoil.com.br/dashboard",
    src: "/plataforma/visao-geral-v2.png",
    alt: "Visão geral do painel com médias de umidade, temperatura, pH e condutividade, mapa de satélite e alertas ativos",
    points: [
      { name: "Médias do solo", text: "Umidade, temperatura, pH e condutividade, com a faixa ideal ao lado." },
      { name: "Status do monitoramento", text: "Quantos sensores enviaram leitura recentemente." },
      { name: "Pontos no satélite", text: "Cada sensor aparece na posição informada pelo GPS." },
    ],
  },
  {
    id: "mapa",
    label: "02 — Mapa da lavoura",
    title: "Talhões e sensores no satélite",
    text: "Desenhe o perímetro da propriedade, divida em talhões e veja onde cada sensor está.",
    url: "app.techsoil.com.br/dashboard/mapa",
    src: "/plataforma/mapa-v2.png",
    alt: "Mapa da plantação com quatro talhões delimitados e oito sensores sobre a imagem de satélite",
    points: [
      { name: "Perímetro", text: "Traçado direto no mapa, com a área calculada em hectares." },
      { name: "Talhões", text: "Cada um com nome, cor e área própria, para separar o que é diferente." },
      { name: "Sensores", text: "Toque no ponto para ver a última leitura daquele local." },
    ],
  },
  {
    id: "sensores",
    label: "03 — Sensores",
    title: "Cada sonda, leitura por leitura",
    text: "A lista mostra quem está online, quem precisa de atenção e quem parou de enviar. Ao abrir um sensor, você vê o agora e o histórico.",
    url: "app.techsoil.com.br/dashboard/sensores",
    src: "/plataforma/sensores-v2.png",
    alt: "Tela de sensores com a lista de dispositivos e o detalhe do Sensor 01: umidade, temperatura, pH, condutividade e bateria",
    points: [
      { name: "Agora", text: "Os sete parâmetros da última leitura, com a faixa recomendada." },
      { name: "Histórico", text: "Gráficos de umidade, temperatura e pH ao longo do tempo." },
      { name: "Bateria", text: "Carga e se o painel solar está carregando." },
    ],
  },
];

const rules = [
  {
    group: "Operacionais",
    items: [
      { name: "Sensor sem dados", text: "Dispositivo cadastrado que ainda não enviou nenhuma leitura." },
      { name: "Sensor offline", text: "Sem leituras novas depois do tempo que você definir." },
      { name: "Bateria baixa", text: "Carga abaixo do limite, quando o sensor não está carregando." },
    ],
  },
  {
    group: "Agronômicas",
    items: [
      { name: "Umidade do solo", text: "Fora da faixa mínima e máxima definida para a cultura." },
      { name: "Temperatura do solo", text: "Abaixo ou acima dos limites escolhidos." },
      { name: "pH do solo", text: "Fora da faixa validada com orientação agronômica." },
    ],
  },
];

// Mesmas descrições que o painel mostra na tela de Equipe.
const roles = [
  {
    name: "Proprietário",
    text: "Administra a organização, a equipe, as plantações e os dispositivos.",
    can: ["Convida pessoas e define o perfil", "Cadastra plantações, talhões e sensores", "Configura os alertas"],
  },
  {
    name: "Operador",
    text: "Trabalha nas plantações que recebeu do proprietário.",
    can: ["Consulta leituras, mapa e alertas", "Ajusta as regras de alerta", "Não altera equipe nem cadastros"],
  },
  {
    name: "Visualizador",
    text: "Acompanha sem mexer em nada.",
    can: ["Consulta leituras, alertas e mapa", "Só vê as plantações atribuídas", "Não altera configurações"],
  },
];

const specs = [
  { label: "Acesso", value: "Navegador do computador e do celular, com as mesmas telas e dados" },
  { label: "Atualização", value: "Automática a cada 1 minuto, ou na hora pelo botão “Atualizar agora”" },
  { label: "Dados", value: "Umidade, temperatura, pH, condutividade, nitrogênio, fósforo, potássio, bateria e posição GPS" },
  { label: "Organização", value: "Organização → plantações → talhões → sensores", note: "Uma conta pode participar de mais de uma organização e alternar entre elas." },
  { label: "Notificações", value: "No sino do painel e, se a pessoa quiser, também por e-mail" },
  { label: "Acesso por pessoa", value: "Cada pessoa só vê as plantações atribuídas a ela", note: "Quem sai da equipe perde o acesso na hora." },
];

export default function PlataformaPage() {
  return (
    <PageTransition>
      <main className={`${landing.page} ${hw.page}`} id="top">
        <Navbar />

        {/* No desktop a abertura fica parada enquanto os cards saem do celular */}
        <div className={styles.heroTrack} data-pin-track>
          <header className={`${hw.hero} ${styles.heroPinned}`}>
            <Reveal className={hw.heroCopy}>
              <p className={landing.sectionLabel}>Plataforma</p>
              <h1>
                O campo inteiro,
                <br />
                <mark>numa tela só.</mark>
              </h1>
              <p className={hw.lead}>
                As leituras dos sensores chegam organizadas por propriedade, talhão e dispositivo,
                com mapa de satélite e alertas que mostram o que precisa de atenção.
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
            <Reveal delay={120}>
              <PhoneShowcase />
            </Reveal>
          </header>
        </div>

        {screens.map((screen) => (
          <section className={hw.section} id={screen.id} key={screen.id}>
            <Reveal className={hw.sectionHead}>
              <p className={landing.sectionLabel}>{screen.label}</p>
              <h2>{screen.title}</h2>
              <p className={hw.sectionText}>{screen.text}</p>
            </Reveal>
            <Reveal delay={100} className={styles.screen}>
              <Screenshot url={screen.url} src={screen.src} alt={screen.alt} />
              <ul className={styles.points}>
                {screen.points.map((point) => (
                  <li key={point.name}>
                    <strong>{point.name}</strong>
                    <span>{point.text}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </section>
        ))}

        <section className={`${hw.section} ${hw.powerSection}`} id="alertas">
          <Reveal className={hw.sectionHead}>
            <p className={landing.sectionLabel}>04 — Alertas</p>
            <h2>Você decide o que é problema</h2>
            <p className={`${hw.sectionText} ${styles.darkText}`}>
              Nenhum limite agronômico é ligado automaticamente: cada regra é ativada pela
              fazenda, com os valores validados para a cultura.
            </p>
          </Reveal>
          <Reveal delay={100} className={styles.screen}>
            <div className={styles.rules}>
              {rules.map((rule) => (
                <div key={rule.group}>
                  <h3>{rule.group}</h3>
                  <ul>
                    {rule.items.map((item) => (
                      <li key={item.name}>
                        <strong>{item.name}</strong>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Screenshot
              url="app.techsoil.com.br/dashboard/alertas"
              src="/plataforma/alertas-v2.png"
              alt="Tela de alertas ativos com contagem de críticos e de atenção e cartões de umidade baixa e pH fora da faixa"
            />
            <p className={styles.channels}>
              Cada alerta aparece no painel com o que verificar e gera uma notificação no sino.
              Quem quiser recebe também por e-mail.
            </p>
          </Reveal>
        </section>

        <section className={hw.section} id="equipe">
          <Reveal className={hw.sectionHead}>
            <p className={landing.sectionLabel}>05 — Equipe</p>
            <h2>Cada pessoa vê o que precisa</h2>
            <p className={hw.sectionText}>
              O proprietário convida por e-mail, escolhe o perfil e quais plantações cada pessoa enxerga.
            </p>
          </Reveal>
          <div className={hw.layout}>
            {roles.map((role, index) => (
              <Reveal key={role.name} delay={index * 100} className={hw.group}>
                <h3>{role.name}</h3>
                <p className={styles.roleText}>{role.text}</p>
                <ul>
                  {role.can.map((item) => (
                    <li key={item}>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </section>

        <section className={hw.section}>
          <Reveal className={hw.sectionHead}>
            <p className={landing.sectionLabel}>06 — Ficha técnica</p>
            <h2>Em resumo</h2>
          </Reveal>
          <Reveal delay={100}>
            <dl className={hw.specs}>
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

        <section className={hw.cta}>
          <h2>Quer ver a sua propriedade no painel?</h2>
          <Link className={landing.primaryButton} href="/#orcamento">
            Solicitar proposta <ArrowIcon />
          </Link>
        </section>

        <SiteFooter />
      </main>
    </PageTransition>
  );
}
