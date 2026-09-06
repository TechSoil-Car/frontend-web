"use client";

import { FormEvent, useMemo, useState } from "react";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { usePlantations } from "@/features/plantations";
import type { BoundaryPolygon, Plantation } from "@/features/plantations";
import { ApiError } from "@/shared/api/api-client";
import { usePlantationPlots } from "../../hooks/use-plantation-plots";
import { usePlantationRows } from "../../hooks/use-plantation-rows";
import type { CreatePlantationPlotInput, UpdatePlantationPlotInput } from "../../types/plantation-plot.types";
import type { MapPoint } from "../../types/plantation-row.types";
import { hasCoordinates } from "../../types/plantation-row.types";
import { distanceInMeters, formatDistance, rowLength } from "../../utils/geo";
import { FarmLocationSetup } from "../farm-location-setup/FarmLocationSetup";
import { PlantationMap } from "../plantation-map/PlantationMap";
import { PlotsPanel } from "../plots-panel/PlotsPanel";
import styles from "./PlantationMapScreen.module.css";

function getBoundaryPoints(boundary: BoundaryPolygon | null): MapPoint[] {
  const ring = boundary?.type === "Polygon" ? boundary.coordinates[0] : null;
  if (!ring || ring.length < 4) return [];
  return ring.slice(0, -1).map(([longitude, latitude]) => ({ longitude, latitude }));
}

export function PlantationMapScreen() {
  const { selectedPlantation } = usePlantations();
  if (!selectedPlantation) {
    return <main className={styles.statePage}><span><DashboardIcon name="map" size={25} /></span><strong>Selecione uma plantação</strong><p>Escolha uma propriedade para abrir o mapa e visualizar suas linhas.</p></main>;
  }
  return <PlantationMapContent key={selectedPlantation.id} plantation={selectedPlantation} />;
}

function PlantationMapContent({ plantation }: { plantation: Plantation }) {
  const { updatePlantationMap } = usePlantations();
  const { rows, status, error, reload, createRow, deleteRow } = usePlantationRows(plantation.id);
  const plotsState = usePlantationPlots(plantation.id);
  const { plots } = plotsState;
  const [panelTab, setPanelTab] = useState<"plots" | "rows">("plots");
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [drawingPlot, setDrawingPlot] = useState(false);
  const [plotDraft, setPlotDraft] = useState<MapPoint[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [drawingRow, setDrawingRow] = useState(false);
  const [draftStart, setDraftStart] = useState<MapPoint | null>(null);
  const [draftEnd, setDraftEnd] = useState<MapPoint | null>(null);
  const [setupOpen, setSetupOpen] = useState(plantation.centerLatitude === null || plantation.centerLongitude === null || !plantation.boundaryGeoJson);
  const [center, setCenter] = useState<MapPoint | null>(plantation.centerLatitude !== null && plantation.centerLongitude !== null ? { latitude: plantation.centerLatitude, longitude: plantation.centerLongitude } : null);
  const [locationLabel, setLocationLabel] = useState(plantation.location ?? "");
  const [perimeterPoints, setPerimeterPoints] = useState<MapPoint[]>(getBoundaryPoints(plantation.boundaryGeoJson));
  const [drawingBoundary, setDrawingBoundary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mappedRows = useMemo(() => rows.filter(hasCoordinates), [rows]);
  const totalDistance = useMemo(() => mappedRows.reduce((total, row) => total + rowLength(row), 0), [mappedRows]);
  const nextRowNumber = useMemo(() => Math.max(0, ...rows.map((row) => row.rowNumber)) + 1, [rows]);
  const isOwner = plantation.role === "OWNER";
  const savedBoundary = plantation.boundaryGeoJson;

  function resetRowDraft() {
    setDrawingRow(false);
    setDraftStart(null);
    setDraftEnd(null);
    setFormError(null);
  }

  function startDrawingRow() {
    setSetupOpen(false);
    setSelectedRowId(null);
    setDraftStart(null);
    setDraftEnd(null);
    setFormError(null);
    setDrawingPlot(false);
    setPlotDraft([]);
    setPanelTab("rows");
    setDrawingRow(true);
  }

  function startDrawingPlot() {
    resetRowDraft();
    setSetupOpen(false);
    setSelectedRowId(null);
    setSelectedPlotId(null);
    setPlotDraft([]);
    setFormError(null);
    setPanelTab("plots");
    setDrawingPlot(true);
  }

  function openSetup() {
    resetRowDraft();
    setDrawingPlot(false);
    setPlotDraft([]);
    setCenter(plantation.centerLatitude !== null && plantation.centerLongitude !== null ? { latitude: plantation.centerLatitude, longitude: plantation.centerLongitude } : null);
    setLocationLabel(plantation.location ?? "");
    setPerimeterPoints(getBoundaryPoints(savedBoundary));
    setDrawingBoundary(false);
    setSetupOpen(true);
  }

  function handleMapClick(point: MapPoint) {
    if (drawingBoundary) {
      setPerimeterPoints((current) => current.length < 500 ? [...current, point] : current);
      return;
    }
    if (drawingPlot) {
      setPlotDraft((current) => current.length < 500 ? [...current, point] : current);
      return;
    }
    if (!drawingRow) return;
    if (!draftStart) setDraftStart(point);
    else if (!draftEnd) {
      setDraftEnd(point);
      setDrawingRow(false);
    }
  }

  async function handleSaveRow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftStart || !draftEnd) return;
    setSaving(true);
    setFormError(null);
    const form = new FormData(event.currentTarget);
    try {
      const plotId = String(form.get("plotId") ?? "");
      const created = await createRow({ rowNumber: Number(form.get("rowNumber")), plotId: plotId || undefined, startLatitude: draftStart.latitude, startLongitude: draftStart.longitude, endLatitude: draftEnd.latitude, endLongitude: draftEnd.longitude });
      resetRowDraft();
      setSelectedRowId(created.id);
    } catch (requestError) {
      setFormError(requestError instanceof ApiError ? requestError.message : "Não foi possível salvar esta linha.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBoundary() {
    if (!center || perimeterPoints.length < 3) return;
    setSaving(true);
    setFormError(null);
    const ring = [...perimeterPoints.map((point) => [point.longitude, point.latitude]), [perimeterPoints[0].longitude, perimeterPoints[0].latitude]];
    try {
      await updatePlantationMap({ location: (locationLabel || "Localização definida pelo mapa").slice(0, 240), centerLatitude: center.latitude, centerLongitude: center.longitude, mapZoom: 16, boundaryGeoJson: { type: "Polygon", coordinates: [ring] } });
      await plotsState.reload();
      setDrawingBoundary(false);
      setSetupOpen(false);
    } catch (requestError) {
      setFormError(requestError instanceof ApiError ? requestError.message : "Não foi possível salvar o perímetro.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rowId: string) {
    setDeletingId(rowId);
    try {
      await deleteRow(rowId);
      if (selectedRowId === rowId) setSelectedRowId(null);
      setPendingDeleteId(null);
    } catch {
      setFormError("Não foi possível excluir esta linha. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreatePlot(input: CreatePlantationPlotInput) {
    setSaving(true);
    try {
      const created = await plotsState.createPlot(input);
      setSelectedPlotId(created.id);
      setPlotDraft([]);
      setDrawingPlot(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePlot(plotId: string, input: UpdatePlantationPlotInput) {
    setSaving(true);
    try {
      await plotsState.updatePlot(plotId, input);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePlot(plotId: string) {
    setSaving(true);
    try {
      await plotsState.deletePlot(plotId);
      if (selectedPlotId === plotId) setSelectedPlotId(null);
    } finally {
      setSaving(false);
    }
  }

  const draftDistance = draftStart && draftEnd ? distanceInMeters(draftStart, draftEnd) : 0;
  const interactionMode = drawingBoundary ? "boundary" as const : drawingPlot ? "plot" as const : drawingRow ? "row" as const : null;

  return <main className={styles.page}>
    <header className={styles.heading}>
      <div><p>PLANEJAMENTO DA LAVOURA</p><h1>Mapa da plantação</h1><span>Localize sua propriedade, delimite o terreno e organize as linhas de plantio.</span></div>
      {isOwner && <div className={styles.headingActions}>{savedBoundary && <button className={styles.editMapButton} type="button" onClick={openSetup}><DashboardIcon name="map" size={16} /> Editar perímetro</button>}<button className={styles.addButton} type="button" onClick={startDrawingRow} disabled={setupOpen || drawingRow || Boolean(draftEnd) || !savedBoundary}><b>+</b> Nova linha</button></div>}
    </header>

    <section className={styles.summary} aria-label="Resumo do mapeamento">
      <article><span><DashboardIcon name="field" /></span><div><small>TALHÕES CADASTRADOS</small><strong>{plots.length}</strong><p>{rows.length} linhas distribuídas</p></div></article>
      <article><span><DashboardIcon name="map" /></span><div><small>ÁREA DELIMITADA</small><strong>{plantation.areaHectares !== null ? `${plantation.areaHectares.toLocaleString("pt-BR")} ha` : "Pendente"}</strong><p>{formatDistance(totalDistance)} em linhas</p></div></article>
      <article><span><DashboardIcon name="location" /></span><div><small>PROPRIEDADE ATIVA</small><strong>{plantation.name}</strong><p>{plantation.location ?? "Localização não informada"}</p></div></article>
    </section>

    <section className={styles.workspace}>
      <div className={styles.mapCard}>
        <PlantationMap rows={rows} plots={plots} selectedRowId={selectedRowId} selectedPlotId={selectedPlotId} draftStart={draftStart} draftEnd={draftEnd} center={center} zoom={plantation.mapZoom ?? 16} boundary={savedBoundary} boundaryDraft={setupOpen ? perimeterPoints : []} plotDraft={plotDraft} interactionMode={interactionMode} onMapClick={handleMapClick} onSelectRow={(rowId) => { setSelectedRowId(rowId); setPanelTab("rows"); }} onSelectPlot={(plotId) => { setSelectedPlotId(plotId); setPanelTab("plots"); }} />
        <div className={styles.mapBadge}><i /> {setupOpen ? "Configuração da propriedade" : "Mapa operacional"}</div>
        {drawingBoundary && <div className={styles.drawingGuide}><span>{perimeterPoints.length + 1}</span><div><strong>Marque os limites da propriedade</strong><small>Clique nos cantos do terreno para formar o contorno</small></div></div>}
        {drawingPlot && <div className={styles.drawingGuide}><span>{plotDraft.length + 1}</span><div><strong>Marque os limites do talhão</strong><small>Clique nos cantos da área; o polígono fecha ao salvar</small></div></div>}
        {drawingRow && <div className={styles.drawingGuide}><span>{draftStart ? "2" : "1"}</span><div><strong>{draftStart ? "Agora marque o ponto final" : "Marque o início da linha"}</strong><small>Clique diretamente no mapa</small></div><button type="button" onClick={resetRowDraft}>Cancelar</button></div>}
        {draftStart && draftEnd && <form className={styles.savePanel} onSubmit={handleSaveRow}><div><small>NOVO TRAÇADO</small><strong>{formatDistance(draftDistance)}</strong></div><div className={styles.rowFormFields}><label htmlFor="row-number">Número da linha<input id="row-number" name="rowNumber" type="number" min="1" max="10000" defaultValue={nextRowNumber} required /></label><label htmlFor="row-plot">Talhão<select id="row-plot" name="plotId" defaultValue={selectedPlotId ?? plots[0]?.id ?? ""}><option value="">Sem talhão</option>{plots.map((plot) => <option value={plot.id} key={plot.id}>{plot.name}</option>)}</select></label></div>{formError && <p role="alert">{formError}</p>}<div><button type="button" onClick={resetRowDraft} disabled={saving}>Descartar</button><button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar linha"}</button></div></form>}
      </div>

      <aside className={styles.rowsPanel}>
        {setupOpen ? <FarmLocationSetup center={center} points={perimeterPoints} drawing={drawingBoundary} saving={saving} error={formError} canCancel={Boolean(savedBoundary)} onSelectLocation={(point, label) => { setCenter(point); setLocationLabel(label); setPerimeterPoints([]); }} onStartDrawing={() => setDrawingBoundary(true)} onUndo={() => setPerimeterPoints((current) => current.slice(0, -1))} onRestartDrawing={() => { setPerimeterPoints([]); setDrawingBoundary(true); }} onClearLocation={() => { setCenter(null); setLocationLabel(""); setPerimeterPoints([]); setDrawingBoundary(false); }} onSave={() => void handleSaveBoundary()} onCancel={() => { setSetupOpen(false); setDrawingBoundary(false); setPerimeterPoints(getBoundaryPoints(savedBoundary)); }} /> : <>
          {!drawingPlot && <div className={styles.panelTabs} role="tablist"><button type="button" role="tab" aria-selected={panelTab === "plots"} onClick={() => setPanelTab("plots")}>Talhões <span>{plots.length}</span></button><button type="button" role="tab" aria-selected={panelTab === "rows"} onClick={() => setPanelTab("rows")}>Linhas <span>{rows.length}</span></button></div>}
          {panelTab === "plots" ? <PlotsPanel plots={plots} status={plotsState.status} error={plotsState.error} isOwner={isOwner} selectedPlotId={selectedPlotId} drawing={drawingPlot} draftPoints={plotDraft} saving={saving} onReload={() => void plotsState.reload()} onSelect={setSelectedPlotId} onStartDrawing={startDrawingPlot} onUndo={() => setPlotDraft((current) => current.slice(0, -1))} onRestart={() => setPlotDraft([])} onCancelDrawing={() => { setDrawingPlot(false); setPlotDraft([]); }} onCreate={handleCreatePlot} onUpdate={handleUpdatePlot} onDelete={handleDeletePlot} /> : <>
            <div className={styles.panelHeader}><div><p>LINHAS DE PLANTIO</p><h2>Traçados da lavoura</h2></div><button type="button" aria-label="Atualizar linhas" onClick={() => void reload()} disabled={status === "loading"}><DashboardIcon name="refresh" size={17} /></button></div>
            {status === "loading" && <div className={styles.loading}><span />Carregando traçados...</div>}
            {status === "error" && <div className={styles.panelError}><strong>Não foi possível carregar</strong><p>{error}</p><button type="button" onClick={() => void reload()}>Tentar novamente</button></div>}
            {status === "ready" && rows.length === 0 && <div className={styles.emptyList}><strong>Nenhuma linha cadastrada</strong><p>Use “Nova linha” para marcar o primeiro traçado dentro da propriedade.</p></div>}
            {status === "ready" && rows.length > 0 && <div className={styles.rowList}>{rows.map((row) => { const mapped = hasCoordinates(row); const selected = selectedRowId === row.id; const plot = plots.find((item) => item.id === row.plotId); return <article className={`${styles.rowCard} ${selected ? styles.rowSelected : ""}`} key={row.id}><button className={styles.rowMain} type="button" onClick={() => mapped && setSelectedRowId(row.id)} disabled={!mapped}><span>{String(row.rowNumber).padStart(2, "0")}</span><div><strong>Linha {row.rowNumber}</strong><small>{mapped ? `${formatDistance(rowLength(row))} · ${plot?.name ?? "Sem talhão"}` : "Sem coordenadas"}</small></div>{mapped && <DashboardIcon name="focus" size={17} />}</button>{isOwner && <div className={styles.rowActions}>{pendingDeleteId === row.id ? <><button type="button" onClick={() => setPendingDeleteId(null)} disabled={deletingId === row.id}>Cancelar</button><button className={styles.confirmDelete} type="button" onClick={() => void handleDelete(row.id)} disabled={deletingId === row.id}>{deletingId === row.id ? "Excluindo..." : "Confirmar"}</button></> : <button type="button" aria-label={`Excluir linha ${row.rowNumber}`} onClick={() => setPendingDeleteId(row.id)}><DashboardIcon name="trash" size={15} /> Excluir</button>}</div>}</article>; })}</div>}
            <footer><span><i /> Linha mapeada</span><span><i /> Traçado selecionado</span></footer>
          </>}
        </>}
      </aside>
    </section>
  </main>;
}
