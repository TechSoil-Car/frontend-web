import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import type { Plantation } from "@/features/plantations/types/plantation.types";
import type { HistoryStatus } from "../../hooks/use-sensor-history";
import type { SensorAlert, SensorLatest, SensorReading } from "../../types/sensor.types";
import {
  formatRelativeTime,
  formatSensorNumber,
  type SensorOperationalState,
} from "../../utils/sensor-status";
import { SensorAlertsPanel } from "./SensorAlertsPanel";
import { SensorHistoryPanel } from "./SensorHistoryPanel";
import { SensorReadingPanel } from "./SensorReadingPanel";
import styles from "./SensorsScreen.module.css";

export type SensorTab = "now" | "history" | "alerts";

const tabs: Array<{ label: string; value: SensorTab }> = [
  { label: "Agora", value: "now" },
  { label: "Histórico", value: "history" },
  { label: "Alertas", value: "alerts" },
];

/** Sensor selecionado: identificação, telemetria e abas Agora/Histórico/Alertas. */
export function SensorDetails({
  plantation,
  sensor,
  state,
  alerts,
  tab,
  onTab,
  history,
  historyStatus,
  onMaintenance,
}: {
  plantation: Plantation;
  sensor: SensorLatest;
  state: SensorOperationalState;
  alerts: SensorAlert[];
  tab: SensorTab;
  onTab: (tab: SensorTab) => void;
  history: SensorReading[];
  historyStatus: HistoryStatus;
  onMaintenance: (action: "edit" | "remove") => void;
}) {
  const reading = sensor.reading;
  return (
    <section
      className={styles.details}
      aria-label={`Detalhes de ${sensor.device.name}`}
    >
      {plantation.role === "OWNER" && (
        <div className={styles.maintenanceActions}>
          <button
            type="button"
            onClick={() => onMaintenance("edit")}
          >
            <DashboardIcon name="settings" size={15} /> Editar sensor
          </button>
          <button
            type="button"
            className={styles.removeButton}
            onClick={() => onMaintenance("remove")}
          >
            <DashboardIcon name="trash" size={15} /> Remover sensor
          </button>
        </div>
      )}
      <div className={styles.detailHeader}>
        <div className={styles.detailIdentity}>
          <span
            className={`${styles.sensorGlyph} ${styles[state]}`}
          >
            <DashboardIcon name="sensor" size={23} />
          </span>
          <div>
            <small>{sensor.device.deviceId}</small>
            <h2>{sensor.device.name}</h2>
            <p>{plantation.name}</p>
          </div>
        </div>
        <div className={styles.connection}>
          <span className={styles[state]}>
            <i />
            {state === "online"
              ? "Online"
              : state === "attention"
                ? "Atenção"
                : "Offline"}
          </span>
        </div>
      </div>
      <div className={styles.metaStrip}>
        <span>
          <DashboardIcon name="sensor" size={16} />
          <small>IDENTIFICADOR</small>
          <strong>{sensor.device.deviceId}</strong>
        </span>
        <span>
          <DashboardIcon name="calendar" size={16} />
          <small>ÚLTIMA LEITURA</small>
          <strong>{formatRelativeTime(reading?.timestamp)}</strong>
        </span>
        <span>
          <DashboardIcon name="battery" size={16} />
          <small>BATERIA</small>
          <strong>
            {reading?.batteryPercentage !== null &&
            reading?.batteryPercentage !== undefined
              ? `${formatSensorNumber(reading.batteryPercentage, 0)}%${reading.charging ? " · carregando" : ""}`
              : "Sem telemetria"}
          </strong>
        </span>
        <span>
          <DashboardIcon name="alert" size={16} />
          <small>ALERTAS ATIVOS</small>
          <strong>{alerts.length}</strong>
        </span>
      </div>
      <div className={styles.tabs}>
        {tabs.map((item) => (
          <button
            className={tab === item.value ? styles.tabActive : ""}
            type="button"
            key={item.value}
            onClick={() => onTab(item.value)}
          >
            {item.label}
            {item.value === "alerts" && alerts.length > 0 && (
              <span>{alerts.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "alerts" ? (
      <SensorAlertsPanel alerts={alerts} />
      ) : tab === "history" ? (
      <SensorHistoryPanel history={history} status={historyStatus} />
      ) : reading ? (
      <SensorReadingPanel reading={reading} state={state} />
      ) : (
        <div className={styles.noData}>
          <DashboardIcon name="sensor" size={25} />
          <strong>Aguardando a primeira leitura</strong>
          <p>
            O dispositivo está cadastrado, mas ainda não enviou dados ao
            Backend IoT.
          </p>
        </div>
      )}
    </section>
  );
}
