"use client";

import Image from "next/image";
import { useRef, type PointerEvent } from "react";
import { clamp, prefersReducedMotion, useScrollFrame } from "../landing-interactions";
import styles from "./plataforma.module.css";

// Distância de scroll em que a tela fica parada; igual ao espaçador do CSS.
const PIN_DISTANCE = 420;

// Os cards começam encaixados sobre o próprio print e saem do celular enquanto a tela está parada.
// Posições e tamanhos no CSS seguem o print (780 px de largura exibido em 250 px).
export function PhoneShowcase() {
  const trackRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useScrollFrame(() => {
    const stage = ref.current;
    if (!stage || !trackRef.current) return;
    if (prefersReducedMotion()) {
      stage.style.setProperty("--out", "1");
      return;
    }
    // No desktop a abertura inteira fica parada; no celular, só o aparelho.
    const mobile = window.matchMedia("(max-width: 900px)").matches;
    const track = mobile ? trackRef.current : stage.closest<HTMLElement>("[data-pin-track]");
    const pinned = track?.firstElementChild;
    if (!track || !pinned) return;
    const pinnedTop = parseFloat(getComputedStyle(pinned).top) || 0;
    const travel = pinnedTop - track.getBoundingClientRect().top;
    // Acelera e desacelera ao longo do trecho parado; termina um pouco antes de a tela voltar a rolar.
    const t = clamp(travel / (PIN_DISTANCE * 0.85));
    const out = t * t * (3 - 2 * t);
    stage.style.setProperty("--out", out.toFixed(4));
  });

  return (
    <div className={styles.phoneTrack} ref={trackRef}>
      <div className={styles.phoneStage} ref={ref}>
        <div className={styles.device}>
          <div className={styles.deviceScreen}>
            <div className={styles.deviceStatus} aria-hidden="true">
              <span>9:41</span>
              <i />
            </div>
            <Image
              className={styles.deviceShot}
              src="/landing/dashboard-mobile-full-v2.png"
              alt="Visão geral do painel TechSoil no celular: status dos sensores e médias do solo"
              width={780}
              height={5076}
              sizes="260px"
              preload
            />
            <span className={`${styles.slot} ${styles.slotStatus}`} aria-hidden="true" />
            <span className={`${styles.slot} ${styles.slotMoisture}`} aria-hidden="true" />
          </div>

          {/* Valores iguais aos do print (Fazenda Boa Vista) */}
          <div className={`${styles.chip} ${styles.chipStatus}`} aria-hidden="true">
            <i />
            <div>
              <small>Status do monitoramento</small>
              <strong>8 de 8 sensores com sinal recente</strong>
            </div>
            <span>→</span>
          </div>
          <div className={`${styles.chip} ${styles.chipMoisture}`} aria-hidden="true">
            <div>
              <small>Umidade média</small>
              <span>Atual</span>
            </div>
            <strong>
              56,2<em>%</em>
            </strong>
            <small>Faixa ideal: 55–70%</small>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inclina a janela em direção ao mouse, com um reflexo que acompanha o ponteiro.
export function Screenshot({ url, src, alt }: { url: string; src: string; alt: string }) {
  const ref = useRef<HTMLElement>(null);

  const move = (event: PointerEvent<HTMLElement>) => {
    const element = ref.current;
    if (!element || event.pointerType !== "mouse" || prefersReducedMotion()) return;
    const bounds = element.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    element.style.setProperty("--rx", `${((0.5 - y) * 6).toFixed(2)}deg`);
    element.style.setProperty("--ry", `${((x - 0.5) * 8).toFixed(2)}deg`);
    element.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    element.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    element.dataset.hover = "";
  };

  const leave = () => {
    const element = ref.current;
    if (!element) return;
    element.style.removeProperty("--rx");
    element.style.removeProperty("--ry");
    delete element.dataset.hover;
  };

  return (
    <figure className={styles.shot} ref={ref} onPointerMove={move} onPointerLeave={leave}>
      <div className={styles.shotBar} aria-hidden="true">
        <i /><i /><i />
        <span>{url}</span>
      </div>
      <Image src={src} alt={alt} width={2376} height={1486} sizes="(max-width: 900px) 92vw, 760px" />
    </figure>
  );
}
