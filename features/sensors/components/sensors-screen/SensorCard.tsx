import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import type { SensorLatest } from "../../types/sensor.types";
import {
  formatRelativeTime,
  formatSensorNumber,
  type SensorOperationalState,
} from "../../utils/sensor-status";
import styles from "./SensorsScreen.module.css";

/** Sensor na lista, com estado, leituras principais e bateria. */
export function SensorCard({
  sensor,
  state,
  selected,
  onSelect,
}: {
  sensor: SensorLatest;
  state: SensorOperationalState;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`${styles.sensorCard} ${selected ? styles.cardSelected : ""}`}
      type="button"
      onClick={onSelect}
    >
      <span
        className={`${styles.sensorGlyph} ${styles[state]}`}
      >
        <DashboardIcon name="sensor" size={22} />
      </span>
      <span className={styles.sensorInfo}>
        <span className={styles.sensorTitle}>
          <span>
            <strong>{sensor.device.name}</strong>
            <small>{sensor.device.deviceId}</small>
          </span>
          <i className={styles[state]}>
            <b />
            {state === "online"
              ? "Online"
              : state === "attention"
                ? "Atenção"
                : "Offline"}
          </i>
        </span>
        {sensor.reading ? (
          <span className={styles.sensorReadings}>
            <span>
              <small>UMIDADE</small>
              <strong>
                {formatSensorNumber(sensor.reading.moisture)}%
              </strong>
            </span>
            <span>
              <small>TEMPERATURA</small>
              <strong>
                {formatSensorNumber(sensor.reading.temperature)}
                °C
              </strong>
            </span>
            <span>
              <small>pH</small>
              <strong>
                {formatSensorNumber(sensor.reading.ph)}
              </strong>
            </span>
          </span>
        ) : (
          <span className={styles.noReading}>
            Aguardando a primeira leitura
          </span>
        )}
        <span className={styles.sensorFoot}>
          <small>
            Atualizado{" "}
            {formatRelativeTime(sensor.reading?.timestamp)}
            {sensor.reading?.batteryPercentage !== null &&
            sensor.reading?.batteryPercentage !== undefined
              ? ` · bateria ${formatSensorNumber(sensor.reading.batteryPercentage, 0)}%${sensor.reading.charging ? " carregando" : ""}`
              : ""}
          </small>
        </span>
      </span>
    </button>
  );
}
