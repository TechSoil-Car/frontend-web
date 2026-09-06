"use client";

import { FormEvent, useState } from "react";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import * as geocodingApi from "../../services/geocoding-api";
import type { GeocodingResult } from "../../types/geocoding.types";
import type { MapPoint } from "../../types/plantation-row.types";
import { polygonAreaHectares } from "../../utils/geo";
import styles from "./FarmLocationSetup.module.css";

type Props = {
  center: MapPoint | null;
  points: MapPoint[];
  drawing: boolean;
  saving: boolean;
  error: string | null;
  canCancel: boolean;
  onSelectLocation: (point: MapPoint, label: string) => void;
  onStartDrawing: () => void;
  onUndo: () => void;
  onRestartDrawing: () => void;
  onClearLocation: () => void;
  onSave: () => void;
  onCancel: () => void;
};

export function FarmLocationSetup({ center, points, drawing, saving, error, canCancel, onSelectLocation, onStartDrawing, onUndo, onRestartDrawing, onClearLocation, onSave, onCancel }: Props) {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const area = polygonAreaHectares(points);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("location") ?? "").trim();
    if (query.length < 3) return;
    setSearching(true);
    setSearchError(null);
    try {
      const nextResults = await geocodingApi.searchLocations(query);
      setResults(nextResults);
      if (!nextResults.length) setSearchError("Nenhum local encontrado. Tente incluir cidade e estado.");
    } catch {
      setSearchError("A busca está indisponível agora. Você ainda pode usar sua localização.");
    } finally {
      setSearching(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setSearchError("Este navegador não oferece acesso à localização.");
      return;
    }
    setLocating(true);
    setSearchError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onSelectLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }, "Localização atual da propriedade");
        setResults([]);
        setLocating(false);
      },
      () => {
        setSearchError("Não foi possível acessar sua localização. Verifique a permissão do navegador.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  return <div className={styles.setup}>
    <div className={styles.progress}><span className={center ? styles.done : styles.current}>1</span><i /><span className={points.length >= 3 ? styles.done : center ? styles.current : ""}>2</span></div>
    <p className={styles.kicker}>{center ? "ETAPA 2 DE 2" : "ETAPA 1 DE 2"}</p>
    <h2>{center ? "Desenhe o perímetro" : "Encontre sua fazenda"}</h2>
    <p className={styles.intro}>{center ? "Marque os limites do terreno no mapa. Use pelo menos três pontos." : "Busque pelo endereço ou centralize usando sua localização atual."}</p>

    {!center ? <>
      <form className={styles.search} onSubmit={handleSearch}>
        <label htmlFor="farm-location">Endereço, cidade ou propriedade</label>
        <div><DashboardIcon name="search" size={16} /><input id="farm-location" name="location" minLength={3} placeholder="Ex.: Holambra, São Paulo" required /><button type="submit" disabled={searching}>{searching ? "Buscando..." : "Buscar"}</button></div>
      </form>
      <button className={styles.locationButton} type="button" onClick={useCurrentLocation} disabled={locating}><DashboardIcon name="location" size={17} />{locating ? "Obtendo localização..." : "Usar minha localização"}</button>
      {searchError && <p className={styles.message} role="alert">{searchError}</p>}
      {results.length > 0 && <div className={styles.results}>{results.map((result) => <button type="button" key={result.id} onClick={() => { onSelectLocation({ latitude: result.latitude, longitude: result.longitude }, result.label); setResults([]); }}><span><DashboardIcon name="location" size={15} /></span><strong>{result.label}</strong><DashboardIcon name="chevron" size={14} /></button>)}</div>}
      <small className={styles.attribution}>Busca por © OpenStreetMap contributors</small>
    </> : <>
      <div className={styles.instructions}>
        <span><DashboardIcon name="map" size={19} /></span>
        <div><strong>{drawing ? `${points.length} ${points.length === 1 ? "ponto marcado" : "pontos marcados"}` : points.length >= 3 ? "Perímetro pronto para salvar" : "Comece a demarcação"}</strong><small>{drawing ? "Continue clicando ao redor da propriedade" : points.length >= 3 ? `${area.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} hectares aproximadamente` : "Clique no botão e marque os limites"}</small></div>
      </div>
      {!drawing && points.length === 0 && <button className={styles.primary} type="button" onClick={onStartDrawing}>Começar a desenhar</button>}
      {drawing && <div className={styles.editActions}><button type="button" onClick={onUndo} disabled={!points.length}>Desfazer ponto</button><button type="button" onClick={onRestartDrawing} disabled={!points.length}>Recomeçar</button></div>}
      {drawing && points.length >= 3 && <button className={styles.primary} type="button" onClick={onSave} disabled={saving}>{saving ? "Salvando perímetro..." : "Finalizar e salvar"}</button>}
      {!drawing && points.length >= 3 && <button className={styles.primary} type="button" onClick={onSave} disabled={saving}>{saving ? "Salvando perímetro..." : "Salvar perímetro"}</button>}
      {!drawing && points.length >= 3 && <button className={styles.changeLocation} type="button" onClick={onRestartDrawing}>Redesenhar perímetro</button>}
      <button className={styles.changeLocation} type="button" onClick={onClearLocation}>Escolher outro local</button>
      {error && <p className={styles.message} role="alert">{error}</p>}
    </>}
    {canCancel && <button className={styles.cancel} type="button" onClick={onCancel}>Cancelar edição</button>}
  </div>;
}
