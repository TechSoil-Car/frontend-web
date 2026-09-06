"use client";

import { FormEvent, useState } from "react";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import type {
  CreatePlantationPlotInput,
  PlantationPlot,
  PlantationPlotsStatus,
  UpdatePlantationPlotInput,
} from "../../types/plantation-plot.types";
import type { MapPoint } from "../../types/plantation-row.types";
import styles from "./PlotsPanel.module.css";

const COLORS = ["#6FA84F", "#D99B45", "#4D8B78", "#6687B5", "#9A6FB0", "#C65D55"];

type PlotsPanelProps = {
  plots: PlantationPlot[];
  status: PlantationPlotsStatus;
  error: string | null;
  isOwner: boolean;
  selectedPlotId: string | null;
  drawing: boolean;
  draftPoints: MapPoint[];
  saving: boolean;
  onReload: () => void;
  onSelect: (plotId: string) => void;
  onStartDrawing: () => void;
  onUndo: () => void;
  onRestart: () => void;
  onCancelDrawing: () => void;
  onCreate: (input: CreatePlantationPlotInput) => Promise<void>;
  onUpdate: (plotId: string, input: UpdatePlantationPlotInput) => Promise<void>;
  onDelete: (plotId: string) => Promise<void>;
};

export function PlotsPanel(props: PlotsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function createPlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (props.draftPoints.length < 3) return;
    const form = new FormData(event.currentTarget);
    const ring = props.draftPoints.map((point) => [point.longitude, point.latitude]);
    ring.push(ring[0]);
    setActionError(null);
    try {
      await props.onCreate({
        name: String(form.get("name")),
        color: String(form.get("color")),
        boundaryGeoJson: { type: "Polygon", coordinates: [ring] },
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Não foi possível salvar o talhão.");
    }
  }

  async function updatePlot(event: FormEvent<HTMLFormElement>, plotId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setActionError(null);
    try {
      await props.onUpdate(plotId, {
        name: String(form.get("name")),
        color: String(form.get("color")),
      });
      setEditingId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Não foi possível atualizar o talhão.");
    }
  }

  async function deletePlot(plotId: string) {
    setActionError(null);
    try {
      await props.onDelete(plotId);
      setPendingDeleteId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Não foi possível excluir o talhão.");
    }
  }

  if (props.drawing) {
    return <div className={styles.drawingPanel}>
      <div className={styles.eyebrow}>NOVO TALHÃO</div>
      <h2>Desenhe o setor no mapa</h2>
      <p>Clique nos limites do talhão. Use pelo menos três pontos para fechar a área.</p>
      <div className={styles.pointCount}><strong>{props.draftPoints.length}</strong><span>pontos marcados</span></div>
      <div className={styles.drawingActions}>
        <button type="button" onClick={props.onUndo} disabled={!props.draftPoints.length}>Desfazer ponto</button>
        <button type="button" onClick={props.onRestart} disabled={!props.draftPoints.length}>Recomeçar</button>
      </div>
      <form className={styles.form} onSubmit={createPlot}>
        <label>Nome do talhão<input name="name" minLength={2} maxLength={80} placeholder="Ex.: Talhão Norte" required /></label>
        <ColorPicker defaultColor={COLORS[1]} />
        {actionError && <p className={styles.error} role="alert">{actionError}</p>}
        <div className={styles.formActions}>
          <button type="button" onClick={props.onCancelDrawing} disabled={props.saving}>Cancelar</button>
          <button type="submit" disabled={props.draftPoints.length < 3 || props.saving}>{props.saving ? "Salvando..." : "Salvar talhão"}</button>
        </div>
      </form>
    </div>;
  }

  return <>
    <div className={styles.header}>
      <div><p>TALHÕES DA PROPRIEDADE</p><h2>Áreas de manejo</h2></div>
      <button type="button" aria-label="Atualizar talhões" onClick={props.onReload} disabled={props.status === "loading"}><DashboardIcon name="refresh" size={17} /></button>
    </div>
    {props.isOwner && <button className={styles.addButton} type="button" onClick={props.onStartDrawing}><span>+</span><div><strong>Criar novo talhão</strong><small>Desenhe uma nova área no mapa</small></div></button>}
    {props.status === "loading" && <div className={styles.state}>Carregando talhões...</div>}
    {props.status === "error" && <div className={styles.state}><strong>Não foi possível carregar</strong><p>{props.error}</p><button type="button" onClick={props.onReload}>Tentar novamente</button></div>}
    {props.status === "ready" && !props.plots.length && <div className={styles.state}><strong>Nenhum talhão criado</strong><p>Divida a propriedade em áreas para organizar linhas, sensores e análises.</p></div>}
    <div className={styles.list}>
      {props.plots.map((plot) => {
        const selected = plot.id === props.selectedPlotId;
        if (editingId === plot.id) {
          return <form className={styles.editForm} key={plot.id} onSubmit={(event) => void updatePlot(event, plot.id)}>
            <label>Nome<input name="name" defaultValue={plot.name} minLength={2} maxLength={80} required autoFocus /></label>
            <ColorPicker defaultColor={plot.color} />
            {actionError && <p className={styles.error}>{actionError}</p>}
            <div className={styles.formActions}><button type="button" onClick={() => setEditingId(null)}>Cancelar</button><button type="submit">Salvar</button></div>
          </form>;
        }
        return <article className={`${styles.card} ${selected ? styles.selected : ""}`} key={plot.id}>
          <button className={styles.cardMain} type="button" onClick={() => props.onSelect(plot.id)}>
            <i style={{ backgroundColor: plot.color }} />
            <div><strong>{plot.name}</strong><small>{plot.areaHectares.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ha</small></div>
            <DashboardIcon name="focus" size={17} />
          </button>
          {props.isOwner && <div className={styles.cardActions}>
            {pendingDeleteId === plot.id ? <><span>Excluir este talhão?</span><button type="button" onClick={() => setPendingDeleteId(null)}>Não</button><button className={styles.danger} type="button" onClick={() => void deletePlot(plot.id)}>Excluir</button></> : <><button type="button" onClick={() => { setEditingId(plot.id); setActionError(null); }}>Editar nome e cor</button><button type="button" onClick={() => setPendingDeleteId(plot.id)}><DashboardIcon name="trash" size={14} /></button></>}
          </div>}
        </article>;
      })}
    </div>
    {actionError && <p className={styles.error} role="alert">{actionError}</p>}
    <footer className={styles.footer}><span><i /> Clique em um talhão para destacá-lo</span></footer>
  </>;
}

function ColorPicker({ defaultColor }: { defaultColor: string }) {
  const [color, setColor] = useState(defaultColor);
  return <fieldset className={styles.colors}>
    <legend>Cor de identificação</legend>
    <div>{COLORS.map((option) => <label key={option} title={option}><input type="radio" name="color-option" value={option} checked={color === option} onChange={() => setColor(option)} /><i style={{ backgroundColor: option }} /></label>)}<label className={styles.customColor} title="Cor personalizada"><input type="color" value={color} onChange={(event) => setColor(event.target.value.toUpperCase())} /><i style={{ backgroundColor: color }} /></label></div>
    <input type="hidden" name="color" value={color} />
  </fieldset>;
}
