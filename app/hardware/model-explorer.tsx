"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../landing-interactions";
import type { MissionHud } from "./cart-model";
import styles from "./hardware.module.css";
import type { ViewName, Viewer } from "./viewer-core";

export type ExplorerGroup = { title: string; items: { id: string; name: string; text: string }[] };

type Props = {
  model: "sensor" | "cart";
  label: string;
  groups: ExplorerGroup[];
};

const VIEWS: { id: ViewName; label: string }[] = [
  { id: "iso", label: "3/4" },
  { id: "front", label: "Frente" },
  { id: "side", label: "Lado" },
  { id: "back", label: "Trás" },
  { id: "top", label: "Cima" },
];

const STATUS_LABEL = { accepted: "aceita", running: "em execução", completed: "concluída" };

// Modelo 3D que o visitante explora: gira, troca de vista, deixa a carcaça transparente
// e clica nas peças. O carrinho também simula uma missão na fileira.
export function ModelExplorer({ model, label, groups }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const shotRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const actionsRef = useRef<{ setLidOpen?: (open: boolean) => void; mission?: { start: () => void; stop: () => void } }>({});
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [selected, setSelected] = useState<string | null>(null);
  const [inside, setInside] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [lidOpen, setLidOpen] = useState(false);
  const [hud, setHud] = useState<MissionHud | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};
    const names = new Map(groups.flatMap((group) => group.items.map((item) => [item.id, item.name] as const)));

    (async () => {
      const { createViewer } = await import("./viewer-core");
      const options = {
        reducedMotion: prefersReducedMotion(),
        onSelect: setSelected,
        onInsideChange: setInside,
        onSpinChange: setSpinning,
        onHover: (id: string | null, x: number, y: number) => {
          const tip = tipRef.current;
          if (!tip) return;
          tip.hidden = !id;
          if (!id) return;
          tip.textContent = names.get(id) ?? "";
          tip.style.left = `${x}px`;
          tip.style.top = `${y}px`;
        },
      };
      if (model === "sensor") {
        const { buildSensor } = await import("./sensor-model");
        const build = await buildSensor();
        if (disposed) return;
        const viewer = createViewer(host, build, options);
        viewer.onFrame(build.lidHook);
        viewerRef.current = viewer;
        actionsRef.current = { setLidOpen: build.setLidOpen };
        cleanup = viewer.dispose;
      } else {
        const { buildCart, createMission } = await import("./cart-model");
        const build = await buildCart();
        const shot = shotRef.current;
        if (disposed || !shot) return;
        const viewer = createViewer(host, build, options);
        const mission = createMission(viewer, build, shot, setHud);
        viewerRef.current = viewer;
        actionsRef.current = { mission };
        cleanup = () => {
          mission.dispose();
          viewer.dispose();
        };
      }
      setStatus("ready");
    })().catch(() => {
      if (!disposed) setStatus("failed");
    });

    return () => {
      disposed = true;
      viewerRef.current = null;
      cleanup();
    };
  }, [model, groups]);

  const viewer = () => viewerRef.current;
  const toggleLid = () => {
    actionsRef.current.setLidOpen?.(!lidOpen);
    setLidOpen(!lidOpen);
  };
  const toggleMission = () => {
    const mission = actionsRef.current.mission;
    if (!mission) return;
    if (hud) {
      mission.stop();
      setHud(null);
    } else {
      mission.start();
    }
  };
  const showView = (id: ViewName) => {
    const current = viewer();
    if (!current) return;
    if (hud) current.setView(id, current.controls.target.clone(), 1.6);
    else current.setView(id);
  };
  const pick = (id: string) => viewer()?.select(selected === id ? null : id, true);

  return (
    <div className={styles.explorer}>
      <div className={styles.stage} data-field={hud ? "" : undefined} data-ready={status === "ready" ? "" : undefined}>
        <div className={styles.stageCanvas} ref={hostRef} />
        <span className={styles.stageLabel} aria-hidden="true">{label}</span>
        {status === "loading" && <p className={styles.stageMessage}>Carregando o modelo 3D…</p>}
        {status === "failed" && <p className={styles.stageMessage}>Não foi possível abrir o modelo 3D neste navegador.</p>}
        <div className={styles.tip} ref={tipRef} hidden />

        {status === "ready" && (
          <>
            <div className={styles.views} role="group" aria-label="Vistas">
              {VIEWS.map((view) => (
                <button key={view.id} type="button" onClick={() => showView(view.id)}>
                  {view.label}
                </button>
              ))}
            </div>
            <div className={styles.zoom} role="group" aria-label="Aproximar">
              <button type="button" aria-label="Aproximar" onClick={() => viewer()?.zoom(0.75)}>+</button>
              <button type="button" aria-label="Afastar" onClick={() => viewer()?.zoom(1.33)}>−</button>
            </div>
            <div className={styles.stageControls}>
              <button type="button" aria-pressed={inside} onClick={() => viewer()?.setInside(!inside)}>
                <span className={styles.dot} />Ver por dentro
              </button>
              {model === "sensor" && (
                <button type="button" aria-pressed={lidOpen} onClick={toggleLid}>
                  <span className={styles.dot} />Abrir tampa
                </button>
              )}
              <button type="button" aria-pressed={spinning} onClick={() => viewer()?.setAutoRotate(!spinning)}>
                <span className={styles.dot} />Girar
              </button>
              {model === "cart" && (
                <button type="button" className={styles.primaryControl} aria-pressed={Boolean(hud)} onClick={toggleMission}>
                  {hud ? "Voltar ao modelo" : "Simular missão na fileira"}
                </button>
              )}
            </div>
          </>
        )}

        {model === "cart" && (
          <div className={styles.hud} hidden={!hud}>
            <div className={styles.hudHead}>
              <strong>Missão · fileira 3</strong>
              {hud && <span className={styles.pill} data-state={hud.status} title={STATUS_LABEL[hud.status]}>{hud.status}</span>}
            </div>
            <dl>
              <dt>Modo</dt><dd>distância · 1 m</dd>
              <dt>Percorrido</dt><dd>{hud ? hud.distance.toFixed(1).replace(".", ",") : "0,0"} m</dd>
              <dt>Fotos no SD</dt><dd>{hud?.shots ?? 0}</dd>
              <dt>Envio MQTT</dt><dd>{hud?.upload ?? "—"}</dd>
            </dl>
            <p className={styles.topic}>{hud?.topic}</p>
            <figure className={styles.shot}>
              <canvas ref={shotRef} width={320} height={240} />
              <figcaption>{hud?.caption}</figcaption>
            </figure>
          </div>
        )}
      </div>

      <div className={styles.partGroups}>
        {groups.map((group) => (
          <div key={group.title} className={styles.group}>
            <h3>{group.title}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item.id}>
                  <button type="button" className={styles.partButton} aria-pressed={selected === item.id} disabled={status !== "ready"} onClick={() => pick(item.id)}>
                    <strong>{item.name}</strong>
                    <span>{item.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
