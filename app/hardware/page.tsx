import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, SiteFooter } from "../landing-art";
import { Navbar, Reveal } from "../landing-interactions";
import landing from "../page.module.css";
import { CASE_OUTLINE } from "./case-outline";
import { CaseViewer } from "./case-viewer";
import styles from "./hardware.module.css";
import { ModelExplorer, type ExplorerGroup } from "./model-explorer";
import { PageTransition } from "../page-transition";

export const metadata: Metadata = {
  title: "Hardware | TechSoil Systems",
  description:
    "O sensor de solo TechSoil: sonda NPK 7 em 1, ESP32, GPS e energia solar em uma caixa impressa em 3D. E o carrinho de inspeção do vinhedo, em desenvolvimento.",
};

// Conteúdo conforme o guia "TechSoil — Hardware + Firmware" (rev. 16/10/2026).
const highlights = [
  { value: "7", label: "parâmetros por leitura" },
  { value: "GPS", label: "posição de cada ponto" },
  { value: "Solar", label: "recarga pela tampa" },
];

const layout: ExplorerGroup[] = [
  {
    title: "Dentro da caixa",
    items: [
      { id: "esp32", name: "ESP32-WROOM-32", text: "Controlador encaixado no shield de expansão, com USB acessível para gravação." },
      { id: "gps", name: "GPS NEO-6M", text: "Com antena voltada para o céu, longe dos fios de potência." },
      { id: "rs485", name: "Conversor RS485", text: "Módulo MAX3485 de 3,3 V que conversa com a sonda." },
      { id: "carga", name: "TP4056 + MT3608", text: "Carga protegida da bateria e saída ajustada em 5,0 V." },
      { id: "bateria", name: "Bateria 18650", text: "Uma célula no holder, com polaridade marcada." },
    ],
  },
  {
    title: "Fora da caixa",
    items: [
      { id: "sonda", name: "Sonda NPK 7 em 1", text: "Fica enterrada no solo; só o cabo entra na caixa." },
      { id: "painel", name: "Painel solar", text: "6 V / 6 W preso à tampa, com saída USB regulada de 5 V." },
    ],
  },
  {
    title: "Na própria caixa",
    items: [
      { id: "prensa", name: "Prensa-cabos PG7", text: "Entradas vedadas para o cabo do sensor e o do painel." },
      { id: "caixa", name: "Junta e dobradiça", text: "Tampa articulada com vedação, aberta sem tracionar os fios." },
    ],
  },
];

// Carrinho: lista de componentes do MVP (29/06/2026). O veículo ainda não foi construído.
const cartLayout: ExplorerGroup[] = [
  {
    title: "Visão e comunicação",
    items: [
      { id: "camera", name: "ESP32-CAM", text: "Tira as fotos, ajuda a achar o centro da fileira e envia as capturas por MQTT na base." },
      { id: "sd", name: "Cartão microSD 16 GB", text: "Guarda as fotos até o servidor confirmar o recebimento de cada uma." },
      { id: "gps", name: "GPS NEO-6M", text: "Posição aproximada de cada foto." },
    ],
  },
  {
    title: "Controle e movimento",
    items: [
      { id: "esp32", name: "ESP32 de controle", text: "Motores, encoders, obstáculos e parada segura." },
      { id: "imu", name: "IMU MPU-6050", text: "Mede giro e inclinação para manter o rumo na fileira." },
      { id: "motores", name: "4 motores GA25 com encoder", text: "Tração 4×4; o encoder mede a distância que decide cada foto." },
      { id: "drivers", name: "2 drivers BTS7960", text: "Potência dos motores, um driver por lado." },
      { id: "rodas", name: "Rodas off-road", text: "Cravos para terra, grama e cascalho entre as fileiras." },
      { id: "chassi", name: "Chassi 4WD de alumínio", text: "Base com dois andares para a eletrônica." },
    ],
  },
  {
    title: "Segurança",
    items: [
      { id: "ultrassom", name: "2 ultrassônicos JSN-SR04T", text: "À prova d’água, disparam alternadamente para detectar obstáculos." },
      { id: "parachoque", name: "Para-choque com micro-switches", text: "Encostou em algo, o carrinho para." },
      { id: "emergencia", name: "Botão de emergência", text: "Corta os motores mesmo se os ESP32 travarem." },
    ],
  },
  {
    title: "Energia",
    items: [
      { id: "bateria", name: "Bateria LiPo 3S 5000 mAh", text: "11,1 V, recarregada na base com carregador balanceador." },
      { id: "conversores", name: "2 conversores XL4015", text: "Reduzem a tensão da bateria para a eletrônica." },
      { id: "painel", name: "Painel traseiro", text: "Chave geral, fusível, conector XT60 de carga e monitor de bateria." },
    ],
  },
  {
    title: "Carcaça",
    items: [
      { id: "carcaca", name: "Carcaça com a logo", text: "Proposta de design para impressão 3D, na cor da caixa do sensor." },
    ],
  },
];

type PowerStep = { name: string; detail: string };
type Spec = { label: string; value: string; note?: string };

const power: PowerStep[] = [
  { name: "Painel solar", detail: "5 V USB" },
  { name: "TP4056", detail: "carga protegida" },
  { name: "Bateria 18650", detail: "uma célula" },
  { name: "MT3608", detail: "5,0 V" },
  { name: "ESP32 e sonda", detail: "medição e envio" },
];

const specs: Spec[] = [
  { label: "Parâmetros", value: "Umidade, temperatura, condutividade elétrica, pH, nitrogênio, fósforo e potássio" },
  { label: "Sonda", value: "Sensor de solo 7 em 1 com saída RS485 (Modbus), alimentação de 3,3 a 24 V" },
  { label: "Controlador", value: "ESP32-WROOM-32 com shield de expansão" },
  { label: "Comunicação", value: "Wi-Fi com envio por MQTT", note: "Cada leitura sai com horário, identificação da sonda, unidades e posição." },
  { label: "Localização", value: "GPS NEO-6M", note: "A posição só é publicada com sinal válido, junto com a idade da leitura." },
  { label: "Energia", value: "Bateria 18650 com TP4056 protegido, conversor MT3608 em 5,0 V e painel solar 6 V / 6 W" },
  { label: "Gabinete", value: "Caixa própria projetada pela equipe e impressa em 3D, com tampa articulada, junta e prensa-cabos PG7" },
  { label: "Dimensões", value: "Corpo de 350 × 250 mm em planta; 402 mm com as abas de fixação", note: "Abas laterais com furo de 9 mm. Medidas do arquivo do Tinkercad." },
];

// Carrinho: energia e ficha técnica a partir da lista de componentes do MVP e do contrato de missão.
const cartPower: PowerStep[] = [
  { name: "Carregador", detail: "balanceador, na base" },
  { name: "Painel traseiro", detail: "XT60, fusível e chave geral" },
  { name: "LiPo 3S", detail: "11,1 V · 5000 mAh" },
  { name: "2× XL4015", detail: "tensão reduzida" },
  { name: "Eletrônica", detail: "ESP32, câmera e sensores" },
];

const cartSpecs: Spec[] = [
  { label: "Função", value: "Percorre sozinho uma fileira do vinhedo e fotografa as plantas ao longo do caminho", note: "Captura por distância (em metros) ou por tempo (em segundos), definida na missão." },
  { label: "Câmera", value: "ESP32-CAM com cartão microSD de 16 GB", note: "Cada foto fica no cartão até o servidor confirmar o recebimento." },
  { label: "Controle", value: "ESP32 dedicado a motores, encoders, obstáculos e parada segura, com IMU MPU-6050 para manter o rumo" },
  { label: "Tração", value: "4×4 com quatro motores GA25 com encoder, dois drivers BTS7960 e rodas off-road", note: "O encoder mede a distância percorrida desde o início da fileira." },
  { label: "Segurança", value: "Dois ultrassônicos JSN-SR04T à prova d’água, para-choque com micro-switches e botão de emergência", note: "O botão corta os motores mesmo se os ESP32 travarem." },
  { label: "Comunicação", value: "Wi-Fi na base, com missões e fotos enviadas por MQTT", note: "Uma foto reenviada não vira duplicata na plataforma." },
  { label: "Localização", value: "GPS NEO-6M", note: "Posição aproximada de cada foto." },
  { label: "Energia", value: "Bateria LiPo 3S 5000 mAh (11,1 V), dois conversores XL4015 e painel traseiro com chave geral, fusível, XT60 e monitor de bateria" },
  { label: "Estrutura", value: "Chassi 4WD de alumínio com dois andares para a eletrônica" },
  { label: "Carcaça", value: "Proposta de design para impressão 3D, na cor da caixa do sensor e com a logo", note: "O veículo ainda não foi construído; as medidas do modelo 3D são aproximadas." },
];

function PowerChain({ steps }: { steps: PowerStep[] }) {
  return (
    <ol className={styles.power}>
      {steps.map((step, index) => (
        <li key={step.name} style={{ "--step": index } as CSSProperties}>
          <strong>{step.name}</strong>
          <span>{step.detail}</span>
        </li>
      ))}
    </ol>
  );
}

function SpecList({ specs }: { specs: Spec[] }) {
  return (
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
  );
}

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
    <PageTransition>
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
            <span aria-hidden="true">Gabinete · modelo 3D</span>
            <CaseViewer />
          </Reveal>
        </header>

        <section className={styles.section} id="sensor-de-solo">
          <Reveal className={styles.sectionHead}>
            <p className={landing.sectionLabel}>01 — Componentes</p>
            <h2>Dentro e fora da caixa</h2>
            <p className={styles.sectionText}>
              Gire a caixa, abra a tampa ou deixe o gabinete transparente. Clique em uma peça, no
              modelo ou na lista, para ver onde ela fica.
            </p>
            <p className={styles.sectionNote}>
              Gabinete do arquivo do Tinkercad. A posição dos componentes dentro dele é ilustrativa.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <ModelExplorer model="sensor" label="Sensor de solo · modelo 3D" groups={layout} />
          </Reveal>
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
            <PowerChain steps={power} />
          </Reveal>
        </section>

        <section className={styles.section}>
          <Reveal className={styles.sectionHead}>
            <p className={landing.sectionLabel}>04 — Ficha técnica</p>
            <h2>Especificações</h2>
          </Reveal>
          <Reveal delay={100}>
            <SpecList specs={specs} />
          </Reveal>
        </section>

        <section className={styles.section} id="carrinho">
          <Reveal className={styles.sectionHead}>
            <p className={landing.sectionLabel}>05 — Em desenvolvimento</p>
            <h2>O carrinho de inspeção</h2>
            <p className={styles.sectionText}>
              Ele percorre uma fileira do vinhedo sozinho, tira uma foto a cada metro e guarda tudo no
              cartão. Na base, com Wi-Fi, envia as fotos para a plataforma, onde elas ajudam a encontrar
              impurezas nas plantas.
            </p>
            <p className={styles.sectionNote}>
              Modelo conceitual da versão final, feito a partir da lista de componentes. O sistema de
              missões já existe na plataforma; o veículo ainda não foi construído.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <ModelExplorer model="cart" label="Carrinho cart_01 · conceito" groups={cartLayout} />
          </Reveal>
        </section>

        <section className={`${styles.section} ${styles.powerSection}`}>
          <Reveal className={styles.sectionHead}>
            <p className={landing.sectionLabel}>06 — Energia do carrinho</p>
            <h2>Da base até a fileira</h2>
          </Reveal>
          <Reveal delay={100}>
            <PowerChain steps={cartPower} />
          </Reveal>
        </section>

        <section className={styles.section}>
          <Reveal className={styles.sectionHead}>
            <p className={landing.sectionLabel}>07 — Ficha técnica do carrinho</p>
            <h2>Especificações do cart_01</h2>
          </Reveal>
          <Reveal delay={100}>
            <SpecList specs={cartSpecs} />
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
    </PageTransition>
  );
}
