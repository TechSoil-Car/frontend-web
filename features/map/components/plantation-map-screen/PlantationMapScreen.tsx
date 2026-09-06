"use client";

import { FormEvent, useMemo, useState } from "react";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import { usePlantations } from "@/features/plantations";
import { ApiError } from "@/shared/api/api-client";
import { usePlantationRows } from "../../hooks/use-plantation-rows";
import type { MapPoint } from "../../types/plantation-row.types";
import { hasCoordinates } from "../../types/plantation-row.types";
import { distanceInMeters, formatDistance, rowLength } from "../../utils/geo";
import { PlantationMap } from "../plantation-map/PlantationMap";
import styles from "./PlantationMapScreen.module.css";

export function PlantationMapScreen() {
  const { selectedPlantation } = usePlantations();
  const { rows, status, error, reload, createRow, deleteRow } = usePlantationRows(selectedPlantation?.id);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [draftStart, setDraftStart] = useState<MapPoint | null>(null);
  const [draftEnd, setDraftEnd] = useState<MapPoint | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mappedRows = useMemo(() => rows.filter(hasCoordinates), [rows]);
  const totalDistance = useMemo(() => mappedRows.reduce((total, row) => total + rowLength(row), 0), [mappedRows]);
  const nextRowNumber = useMemo(() => Math.max(0, ...rows.map((row) => row.rowNumber)) + 1, [rows]);
  const isOwner = selectedPlantation?.role === "OWNER";

  function resetDraft() {
    setDrawing(false);
    setDraftStart(null);
    setDraftEnd(null);
    setFormError(null);
  }

  function startDrawing() {
    setSelectedRowId(null);
    setDraftStart(null);
    setDraftEnd(null);
    setFormError(null);
    setDrawing(true);
  }

  function handleMapClick(point: MapPoint) {
    if (!drawing) return;
    if (!draftStart) {
      setDraftStart(point);
      return;
    }
    if (!draftEnd) {
      setDraftEnd(point);
      setDrawing(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftStart || !draftEnd) return;
    setSaving(true);
    setFormError(null);

    const form = new FormData(event.currentTarget);
    try {
      const created = await createRow({
        rowNumber: Number(form.get("rowNumber")),
        startLatitude: draftStart.latitude,
        startLongitude: draftStart.longitude,
        endLatitude: draftEnd.latitude,
        endLongitude: draftEnd.longitude,
      });
      resetDraft();
      setSelectedRowId(created.id);
    } catch (requestError) {
      setFormError(requestError instanceof ApiError ? requestError.message : "Não foi possível salvar esta linha.");
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

  if (!selectedPlantation) {
    return <main className={styles.statePage}><span><DashboardIcon name="map" size={25} /></span><strong>Selecione uma plantação</strong><p>Escolha uma propriedade para abrir o mapa e visualizar suas linhas.</p></main>;
  }

  const draftDistance = draftStart && draftEnd ? distanceInMeters(draftStart, draftEnd) : 0;

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div><p>PLANEJAMENTO DA LAVOURA</p><h1>Mapa da plantação</h1><span>Desenhe linhas de plantio e organize a base das próximas missões.</span></div>
        {isOwner && <button className={styles.addButton} type="button" onClick={startDrawing} disabled={drawing || Boolean(draftEnd)}><b>+</b> Nova linha</button>}
      </header>

      <section className={styles.summary} aria-label="Resumo do mapeamento">
        <article><span><DashboardIcon name="field" /></span><div><small>LINHAS CADASTRADAS</small><strong>{rows.length}</strong><p>{mappedRows.length} com traçado no mapa</p></div></article>
        <article><span><DashboardIcon name="map" /></span><div><small>EXTENSÃO MAPEADA</small><strong>{formatDistance(totalDistance)}</strong><p>Soma aproximada das linhas</p></div></article>
        <article><span><DashboardIcon name="location" /></span><div><small>PROPRIEDADE ATIVA</small><strong>{selectedPlantation.name}</strong><p>{selectedPlantation.location ?? "Localização não informada"}</p></div></article>
      </section>

      <section className={styles.workspace}>
        <div className={styles.mapCard}>
          <PlantationMap rows={rows} selectedRowId={selectedRowId} draftStart={draftStart} draftEnd={draftEnd} drawing={drawing} onMapClick={handleMapClick} onSelectRow={setSelectedRowId} />
          <div className={styles.mapBadge}><i /> Base cartográfica interativa</div>
          {drawing && <div className={styles.drawingGuide}><span>{draftStart ? "2" : "1"}</span><div><strong>{draftStart ? "Agora marque o ponto final" : "Marque o início da linha"}</strong><small>Clique diretamente no mapa</small></div><button type="button" onClick={resetDraft}>Cancelar</button></div>}
          {draftStart && draftEnd && <form className={styles.savePanel} onSubmit={handleSave}>
            <div><small>NOVO TRAÇADO</small><strong>{formatDistance(draftDistance)}</strong></div>
            <label htmlFor="row-number">Número da linha</label>
            <input id="row-number" name="rowNumber" type="number" min="1" max="10000" defaultValue={nextRowNumber} required />
            {formError && <p role="alert">{formError}</p>}
            <div><button type="button" onClick={resetDraft} disabled={saving}>Descartar</button><button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar linha"}</button></div>
          </form>}
          {!drawing && !draftEnd && rows.length === 0 && status === "ready" && <div className={styles.emptyMap}><span><DashboardIcon name="map" size={25} /></span><strong>O mapa está pronto para receber a primeira linha</strong><p>Use dois pontos para representar o início e o fim de uma fileira.</p>{isOwner && <button type="button" onClick={startDrawing}>Desenhar primeira linha</button>}</div>}
        </div>

        <aside className={styles.rowsPanel}>
          <div className={styles.panelHeader}><div><p>LINHAS DE PLANTIO</p><h2>Traçados da lavoura</h2></div><button type="button" aria-label="Atualizar linhas" onClick={() => void reload()} disabled={status === "loading"}><DashboardIcon name="refresh" size={17} /></button></div>
          {status === "loading" && <div className={styles.loading}><span />Carregando traçados...</div>}
          {status === "error" && <div className={styles.panelError}><strong>Não foi possível carregar</strong><p>{error}</p><button type="button" onClick={() => void reload()}>Tentar novamente</button></div>}
          {status === "ready" && rows.length === 0 && <div className={styles.emptyList}><strong>Nenhuma linha cadastrada</strong><p>Os traçados aparecerão aqui em ordem numérica.</p></div>}
          {status === "ready" && rows.length > 0 && <div className={styles.rowList}>
            {rows.map((row) => {
              const mapped = hasCoordinates(row);
              const selected = selectedRowId === row.id;
              return <article className={`${styles.rowCard} ${selected ? styles.rowSelected : ""}`} key={row.id}>
                <button className={styles.rowMain} type="button" onClick={() => mapped && setSelectedRowId(row.id)} disabled={!mapped}>
                  <span>{String(row.rowNumber).padStart(2, "0")}</span>
                  <div><strong>Linha {row.rowNumber}</strong><small>{mapped ? `${formatDistance(rowLength(row))} mapeados` : "Sem coordenadas"}</small></div>
                  {mapped && <DashboardIcon name="focus" size={17} />}
                </button>
                {isOwner && <div className={styles.rowActions}>
                  {pendingDeleteId === row.id ? <><button type="button" onClick={() => setPendingDeleteId(null)} disabled={deletingId === row.id}>Cancelar</button><button className={styles.confirmDelete} type="button" onClick={() => void handleDelete(row.id)} disabled={deletingId === row.id}>{deletingId === row.id ? "Excluindo..." : "Confirmar"}</button></> : <button type="button" aria-label={`Excluir linha ${row.rowNumber}`} onClick={() => setPendingDeleteId(row.id)}><DashboardIcon name="trash" size={15} /> Excluir</button>}
                </div>}
              </article>;
            })}
          </div>}
          <footer><span><i /> Linha mapeada</span><span><i /> Traçado selecionado</span></footer>
        </aside>
      </section>
    </main>
  );
}
