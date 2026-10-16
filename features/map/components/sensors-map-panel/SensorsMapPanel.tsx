import type { MonitoringStatus, SensorAlert, SensorLatest } from "@/features/sensors/types/sensor.types";
import { sensorCoordinates, sensorMapDetails, sensorMapStatus } from "../../utils/sensor-map";
import styles from "./SensorsMapPanel.module.css";

type Props = {
  sensors: SensorLatest[];
  alerts: SensorAlert[];
  status: MonitoringStatus;
  refreshFailed: boolean;
  lastUpdatedAt: Date | null;
  disabled: boolean;
  onReload: () => void;
  onFocus: (sensor: SensorLatest) => void;
};

export function SensorsMapPanel({ sensors, alerts, status, refreshFailed, lastUpdatedAt, disabled, onReload, onFocus }: Props) {
  const located = sensors.filter((sensor) => sensorCoordinates(sensor)).length;
  return <section className={styles.panel} aria-label="Sensores da plantação">
    <header><div><h2>Sensores no mapa</h2><p>{located} com GPS · {sensors.length - located} sem GPS válido</p></div><button type="button" onClick={onReload} disabled={status === "loading"}>Atualizar</button></header>
    {status === "loading" && <p role="status">Carregando sensores...</p>}
    {(status === "error" || refreshFailed) && <p role="alert">Não foi possível atualizar os sensores. Os dados exibidos podem estar desatualizados. <button type="button" onClick={onReload}>Tentar novamente</button></p>}
    {status === "ready" && !sensors.length && <p>Nenhum sensor cadastrado nesta plantação.</p>}
    <div className={styles.list}>{sensors.map((sensor) => {
      const coordinates = sensorCoordinates(sensor);
      const state = sensorMapStatus(sensor, alerts);
      return <article key={sensor.device.id}>
        <strong>{sensor.device.name}</strong><small>{sensor.device.deviceId}</small>
        <span className={styles[state.key]}>{state.label}</span>
        {sensorMapDetails(sensor).map((detail) => <small key={detail}>{detail}</small>)}
        <button type="button" disabled={!coordinates || disabled} onClick={() => onFocus(sensor)}>{coordinates ? "Localizar no mapa" : "Sem GPS válido na última leitura"}</button>
      </article>;
    })}</div>
    <footer>Atualização automática a cada 1 minuto.{lastUpdatedAt && <small>Consulta: {lastUpdatedAt.toLocaleTimeString("pt-BR")}</small>}<small>Verde: sem alertas · Amarelo: alerta · Cinza: sem comunicação</small></footer>
  </section>;
}
