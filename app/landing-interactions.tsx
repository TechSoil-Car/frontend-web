"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  ViewTransition,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { ArrowIcon, Brand } from "./landing-art";
import styles from "./page.module.css";

// Como no site da Owlloc, o menu leva só a outras páginas; as seções da landing ficam no rodapé.
const navItems = [
  { label: "Plataforma", href: "/plataforma" },
  { label: "Hardware", href: "/hardware" },
  { label: "Sobre", href: "/sobre" },
];

export const clamp = (value: number) => Math.min(1, Math.max(0, value));
export const easeOut = (value: number) => 1 - (1 - value) ** 3;

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Chama `update` no máximo uma vez por frame enquanto a página rola.
export function useScrollFrame(update: () => void) {
  const updateRef = useRef(update);

  useEffect(() => {
    updateRef.current = update;
  });

  useEffect(() => {
    let frame = 0;
    const run = () => {
      frame = 0;
      updateRef.current();
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(run);
    };

    run();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
}

function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useScrollFrame(() => setScrolled(window.scrollY > 24));

  return (
    // O nome "site-header" deixa o menu parado enquanto o conteúdo troca (ver globals.css).
    <header
      className={`${styles.navWrap} ${scrolled ? styles.navScrolled : ""}`}
      style={{ viewTransitionName: "site-header" }}
    >
      <nav className={styles.nav} aria-label="Navegação principal">
        <Link href="/#inicio" aria-label="TechSoil Systems — início">
          <Brand />
        </Link>
        <div className={styles.navLinks}>
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? styles.navLinkActive : undefined}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
                {/* Mesmo nome em todas as páginas: na troca de aba a linha desliza até a nova. */}
                {active && (
                  <ViewTransition name="nav-indicator" share="nav-slide" default="none">
                    <span className={styles.navIndicator} aria-hidden="true" />
                  </ViewTransition>
                )}
              </Link>
            );
          })}
        </div>
        <div className={styles.navActions}>
          <Link className={styles.navLogin} href="/login">Entrar</Link>
          <Link className={styles.navCta} href="/#orcamento">
            <span className={styles.navCtaLong}>Solicitar proposta</span>
            <span className={styles.navCtaShort}>Proposta</span>
            <ArrowIcon />
          </Link>
        </div>
      </nav>
    </header>
  );
}

// Cada etapa aponta para a altura (fração do print) em que o bloco aparece no app.
const phoneStops = [
  { at: 0.1, label: "Status ao vivo", text: "Quantos sensores estão enviando sinal, atualizado a cada minuto." },
  { at: 0.17, label: "Leituras do solo", text: "Umidade, temperatura, pH e condutividade com a faixa ideal ao lado." },
  { at: 0.26, label: "Mapa de satélite", text: "Cada sensor posicionado sobre a imagem real da sua propriedade." },
  { at: 0.47, label: "Alertas ativos", text: "O que precisa de atenção, em qual sensor e há quanto tempo." },
  { at: 0.65, label: "Nutrientes", text: "Nitrogênio, fósforo e potássio pela média das últimas leituras." },
];

const SCREENSHOT_RATIO = 5076 / 780;
// Altura da barra de status desenhada no topo da tela do celular.
const STATUS_BAR = 40;

export function HeroShowcase({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const [activeStop, setActiveStop] = useState(-1);

  useScrollFrame(() => {
    const track = trackRef.current;
    const screen = screenRef.current;
    if (!track || !screen) return;

    if (prefersReducedMotion()) {
      track.style.setProperty("--rise", "0");
      track.style.setProperty("--shift", "0px");
      setActiveStop(-1);
      return;
    }

    const bounds = track.getBoundingClientRect();
    const travel = Math.max(1, bounds.height - window.innerHeight);
    const progress = clamp(-bounds.top / travel);

    // Fase 1 (0–28%): o celular sobe e centraliza. Fase 2 (30–95%): o app rola dentro dele.
    const rise = easeOut(clamp(progress / 0.28));
    const scroll = clamp((progress - 0.3) / 0.65);
    const screenHeight = screen.clientHeight;
    const imageHeight = screen.clientWidth * SCREENSHOT_RATIO;
    const maxShift = Math.max(0, imageHeight + STATUS_BAR - screenHeight);
    const shift = scroll * maxShift;

    track.style.setProperty("--progress", progress.toFixed(4));
    track.style.setProperty("--rise", rise.toFixed(4));
    track.style.setProperty("--shift", `${(-shift).toFixed(1)}px`);
    track.dataset.stage = rise > 0.5 ? "phone" : "copy";

    const visibleLine = (shift - STATUS_BAR + screenHeight * 0.5) / imageHeight;
    let stop = -1;
    if (rise > 0.85) {
      phoneStops.forEach((item, index) => {
        if (visibleLine >= item.at) stop = index;
      });
    }
    setActiveStop(stop);
  });

  return (
    <section className={styles.heroTrack} id="inicio" ref={trackRef}>
      <div className={styles.heroSticky}>
        <div className={styles.heroPanel}>
          <Image
            src="/hero-vineyard.png"
            alt="Vinhedo ao amanhecer com uma estação de sensor de solo e o carrinho de inspeção entre as fileiras"
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            preload
          />
        </div>
        <div className={styles.heroSticker} aria-hidden="true">
          <span>● ao vivo</span>
          <strong>24h</strong>
          <small>de visão contínua</small>
        </div>

        <div className={styles.heroCopy}>{children}</div>

        <ol className={styles.phoneStops} aria-label="O que você vê no app">
          {phoneStops.map((item, index) => (
            <li key={item.label} className={index === activeStop ? styles.phoneStopActive : undefined}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className={styles.phone}>
          <div className={styles.phoneScreen} ref={screenRef}>
            <div className={styles.phoneStatus} aria-hidden="true">
              <span>9:41</span>
              <i />
            </div>
            <Image
              className={styles.phoneShot}
              src="/landing/dashboard-mobile-full-v2.png"
              alt="Visão geral da TechSoil no celular: status dos sensores, leituras do solo, mapa de satélite, alertas e nutrientes"
              width={780}
              height={5076}
              sizes="(max-width: 900px) 260px, 320px"
              preload
            />
          </div>
        </div>

        <a className={styles.scrollCue} href="#plataforma">
          <span aria-hidden="true">↓</span> Role e veja o seu talhão
        </a>
      </div>
    </section>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "article" | "li";
}) {
  const [ref, inView] = useInView<HTMLDivElement>(0.15);

  return (
    <Tag
      ref={ref as never}
      className={`${styles.reveal} ${inView ? styles.revealIn : ""} ${className}`}
      style={{ "--delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

const showcaseScreens = [
  {
    id: "visao-geral",
    tab: "Visão geral",
    url: "app.techsoil.com.br/dashboard",
    src: "/landing/dashboard-desktop-v2.png",
    alt: "Visão geral do painel TechSoil com médias de umidade, temperatura, pH e condutividade, mapa de satélite e alertas ativos",
  },
  {
    id: "mapa",
    tab: "Mapa da plantação",
    url: "app.techsoil.com.br/dashboard/mapa",
    src: "/landing/mapa-desktop-v2.png",
    alt: "Mapa da plantação com quatro talhões delimitados e oito sensores",
  },
];

export function ProductShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const swapTimer = useRef(0);
  const [active, setActive] = useState(0);
  const [swapping, setSwapping] = useState(false);

  useEffect(() => () => window.clearTimeout(swapTimer.current), []);

  // A transição só fica ligada durante a troca, para não atrasar a inclinação ligada ao scroll.
  const show = (index: number) => {
    if (index === active) return;
    setActive(index);
    setSwapping(true);
    window.clearTimeout(swapTimer.current);
    swapTimer.current = window.setTimeout(() => setSwapping(false), 750);
  };

  useScrollFrame(() => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion()) {
      element.style.setProperty("--tilt", "1");
      return;
    }
    const bounds = element.getBoundingClientRect();
    // 0 quando o topo entra pela base da tela; 1 quando chega a 15% do topo.
    const tilt = easeOut(clamp((window.innerHeight - bounds.top) / (window.innerHeight * 0.85)));
    element.style.setProperty("--tilt", tilt.toFixed(4));
  });

  return (
    <div className={styles.showcase} ref={ref}>
      <div className={styles.showcaseTabs} role="tablist" aria-label="Telas da plataforma">
        {showcaseScreens.map((screen, index) => (
          <button
            key={screen.id}
            type="button"
            role="tab"
            id={`tela-${screen.id}-aba`}
            aria-selected={index === active}
            aria-controls={`tela-${screen.id}`}
            className={index === active ? styles.showcaseTabActive : undefined}
            onClick={() => show(index)}
          >
            {screen.tab}
          </button>
        ))}
      </div>
      <div className={`${styles.showcaseStage} ${swapping ? styles.showcaseSwapping : ""}`}>
        {showcaseScreens.map((screen, index) => {
          const isFront = index === active;
          return (
            <figure
              key={screen.id}
              id={`tela-${screen.id}`}
              role="tabpanel"
              aria-labelledby={`tela-${screen.id}-aba`}
              aria-hidden={!isFront}
              className={`${styles.browser} ${isFront ? styles.browserFront : styles.browserBack}`}
            >
              <div className={styles.browserBar} aria-hidden="true">
                <i /><i /><i />
                <span>{screen.url}</span>
              </div>
              <Image src={screen.src} alt={screen.alt} width={2880} height={1800} sizes="(max-width: 1100px) 94vw, 1040px" />
              {!isFront && (
                <button type="button" className={styles.browserBackTrigger} onClick={() => show(index)} tabIndex={-1}>
                  <span>Ver {screen.tab.toLowerCase()} ↗</span>
                </button>
              )}
            </figure>
          );
        })}
      </div>
    </div>
  );
}

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
}

// Avança um contador enquanto o elemento está na tela (e o usuário aceita animações).
function useTicker<T extends Element>(intervalMs: number) {
  const [ref, inView] = useInView<T>(0.3);
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const timer = window.setInterval(() => setTick((current) => current + 1), intervalMs);
    return () => window.clearInterval(timer);
  }, [inView, reduced, intervalMs]);

  return [ref, tick, inView && !reduced] as const;
}

// Valores iguais aos das prints reais (Sensor 01 da Fazenda Boa Vista).
const sensorReadings = [
  { label: "Umidade", value: "58,0", unit: "%", line: "M0 30 C 18 26, 30 14, 52 18 S 92 34, 116 24 S 150 8, 176 12" },
  { label: "pH", value: "6,1", unit: "", line: "M0 22 C 22 20, 34 24, 58 21 S 96 16, 118 19 S 152 23, 176 18" },
  { label: "Temperatura", value: "24,4", unit: "°C", line: "M0 34 C 20 30, 36 22, 60 20 S 100 10, 124 14 S 156 26, 176 22" },
  { label: "Nitrogênio", value: "45", unit: "mg/kg", line: "M0 28 C 24 32, 40 20, 64 22 S 104 30, 126 18 S 160 10, 176 14" },
];

export function SensorLive() {
  const [ref, tick] = useTicker<HTMLDivElement>(2400);
  const reading = sensorReadings[tick % sensorReadings.length];

  return (
    <div className={styles.liveSensor} ref={ref} aria-hidden="true">
      <div className={styles.liveWidget}>
        <div className={styles.liveWidgetHead}>
          <div>
            <strong>Sensor 01</strong>
            <small>TS-101 · há 1 min</small>
          </div>
          <span className={styles.livePill}>Online</span>
        </div>
        <div className={styles.liveReading} key={reading.label}>
          <small>{reading.label}</small>
          <p>
            {reading.value}
            {reading.unit && <span>{reading.unit}</span>}
          </p>
          <svg viewBox="0 0 176 40" preserveAspectRatio="none">
            <path d={reading.line} pathLength={1} />
          </svg>
        </div>
        <div className={styles.liveDots}>
          {sensorReadings.map((item) => (
            <i key={item.label} className={item === reading ? styles.liveDotActive : undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Trajeto em zigue-zague pelas fileiras; os pins de foto aparecem quando o carrinho passa.
const ROVER_PATH = "M60 92 H374 V140 H60 V188 H374 V236 H60";
const ROVER_SECONDS = 9;
const roverPhotos = [
  { x: 200, y: 92, at: 0.1 },
  { x: 330, y: 140, at: 0.29 },
  { x: 120, y: 188, at: 0.56 },
  { x: 260, y: 236, at: 0.86 },
];

export function RoverMission() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const reduced = useReducedMotion();
  const animate = inView && !reduced;
  const loop = { dur: `${ROVER_SECONDS}s`, repeatCount: "indefinite" };

  // Tudo em SMIL no mesmo SVG: carrinho, rastro, pins e progresso compartilham o mesmo relógio.
  return (
    <div className={styles.liveRover} ref={ref} aria-hidden="true">
      <svg viewBox="0 0 434 300">
        <rect x="34" y="44" width="366" height="4" rx="2" fill="#172018" fillOpacity="0.12" />
        <rect x="34" y="44" width={animate ? 0 : 366} height="4" rx="2" fill="#172018">
          {animate && <animate attributeName="width" values="0;366" {...loop} />}
        </rect>
        <rect x="34" y="64" width="366" height="200" rx="6" fill="#f6f2e7" stroke="#183b2a" strokeWidth="2" />
        <rect x="44" y="74" width="168" height="84" fill="#a6dd62" fillOpacity="0.35" stroke="#a6dd62" strokeWidth="2" />
        <rect x="222" y="74" width="168" height="84" fill="#73b640" fillOpacity="0.3" stroke="#73b640" strokeWidth="2" />
        <rect x="44" y="170" width="168" height="84" fill="#e8b04a" fillOpacity="0.3" stroke="#e8b04a" strokeWidth="2" />
        <rect x="222" y="170" width="168" height="84" fill="#4f9dde" fillOpacity="0.22" stroke="#4f9dde" strokeWidth="2" />
        <path d={ROVER_PATH} fill="none" stroke="#183b2a" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="4 6" />
        <path d={ROVER_PATH} fill="none" stroke="#183b2a" strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={animate ? 1 : 0}>
          {animate && <animate attributeName="stroke-dashoffset" values="1;0" {...loop} />}
        </path>
        {roverPhotos.map((photo) => (
          <g key={photo.at} transform={`translate(${photo.x} ${photo.y - 14})`} opacity={animate ? 0 : 1}>
            <path d="M0 -12 c -7 0 -11 5 -11 11 c 0 9 11 18 11 18 s 11 -9 11 -18 c 0 -6 -4 -11 -11 -11 Z" fill="#172018" />
            <circle cy="-1" r="4" fill="#e8b04a" />
            {animate && (
              <animate attributeName="opacity" values="0;0;1;1;0" keyTimes={`0;${photo.at};${photo.at + 0.02};0.94;1`} {...loop} />
            )}
          </g>
        ))}
        <g transform={animate ? undefined : "translate(60 236)"}>
          <circle r="22" fill="#a6dd62" fillOpacity="0.35" />
          <rect x="-13" y="-9" width="26" height="18" rx="5" fill="#172018" />
          <rect x="-7" y="-4" width="9" height="5" rx="1.5" fill="#a6dd62" />
          {animate && <animateMotion path={ROVER_PATH} {...loop} />}
        </g>
      </svg>
      <span className={styles.roverChip}>Missão de inspeção</span>
    </div>
  );
}

const alertFeed = [
  { tone: "warning", title: "pH fora da faixa", meta: "Sensor 03 · há 26 min" },
  { tone: "critical", title: "Umidade baixa", meta: "Sensor 06 · há 52 min" },
  { tone: "warning", title: "Bateria baixa", meta: "Sensor 08 · há 3 horas" },
  { tone: "ok", title: "Leituras recebidas", meta: "8 de 8 sensores · agora" },
];

export function AlertFeed() {
  const [ref, tick, running] = useTicker<HTMLDivElement>(2600);
  // O mais novo fica no topo; um quarto item sai por baixo durante a entrada.
  const visible = [0, 1, 2, 3].map((offset) => alertFeed[(tick - offset + alertFeed.length * 100) % alertFeed.length]);

  return (
    <div className={styles.liveAlerts} ref={ref} aria-hidden="true">
      <div className={styles.liveAlertsHead}>
        <strong>Alertas ativos</strong>
        <span>3</span>
      </div>
      <div className={styles.liveAlertsWindow}>
        <ul key={tick} className={running ? styles.liveAlertsEnter : undefined}>
          {visible.map((alert, index) => (
            <li key={`${alert.title}-${index}`} className={styles[`alert_${alert.tone}`]}>
              <i />
              <div>
                <strong>{alert.title}</strong>
                <small>{alert.meta}</small>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const steps = [
  { label: "Solo", title: "Instalamos os dispositivos na sua área.", text: "Sensores e carrinho são associados à propriedade e preparados para a rotina da plantação." },
  { label: "Dados", title: "A plataforma organiza tudo num só lugar.", text: "Leituras, mapa e alertas no computador ou no celular, atualizados a cada minuto." },
  { label: "Decisão", title: "Você decide com clareza — e colhe resultados.", text: "O painel destaca o que mudou para apoiar decisões rápidas e responsáveis." },
];

export function Steps() {
  const [ref, inView] = useInView<HTMLDivElement>(0.4);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!inView || paused || prefersReducedMotion()) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % steps.length), 2800);
    return () => window.clearInterval(timer);
  }, [inView, paused]);

  return (
    <div className={styles.steps} ref={ref} onMouseLeave={() => setPaused(false)}>
      {steps.map((step, index) => (
        <article
          key={step.label}
          className={index === active ? styles.stepActive : undefined}
          onMouseEnter={() => {
            setPaused(true);
            setActive(index);
          }}
        >
          <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <small>{step.label}</small>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </div>
          <i className={styles.stepTimer} aria-hidden="true" />
        </article>
      ))}
    </div>
  );
}

export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [ref, inView] = useInView<HTMLSpanElement>(0.6);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = clamp((now - start) / 1200);
      setShown(Math.round(easeOut(progress) * value));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [inView, value]);

  return <span ref={ref}>{shown}{suffix}</span>;
}

const CONTACT_EMAIL = "contato@techsoil.com.br";

export function QuoteForm() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (name: string) => String(data.get(name) ?? "").trim() || "—";
    const body = [
      `Nome: ${field("nome")}`,
      `Contato: ${field("contato")}`,
      `Cultura: ${field("cultura")}`,
      `Área (ha): ${field("area")}`,
    ].join("\n");
    const params = new URLSearchParams({ subject: "Solicitação de proposta TechSoil", body });
    window.location.href = `mailto:${CONTACT_EMAIL}?${params.toString().replace(/\+/g, "%20")}`;
  };

  return (
    <form className={styles.quoteForm} onSubmit={handleSubmit}>
      <label>
        Nome
        <input name="nome" required autoComplete="name" placeholder="Como podemos te chamar?" />
      </label>
      <label>
        WhatsApp ou e-mail
        <input name="contato" required placeholder="(00) 00000-0000" />
      </label>
      <div className={styles.quoteRow}>
        <label>
          Cultura
          <input name="cultura" placeholder="Soja, milho, uva…" />
        </label>
        <label>
          Área (ha)
          <input name="area" inputMode="decimal" placeholder="Ex.: 120" />
        </label>
      </div>
      <button type="submit">
        Solicitar proposta <ArrowIcon />
      </button>
      <small>Abre o seu e-mail com os dados preenchidos. A criação da conta acontece somente após a contratação.</small>
    </form>
  );
}
