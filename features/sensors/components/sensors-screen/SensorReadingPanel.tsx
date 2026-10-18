import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import type { SensorReading } from "../../types/sensor.types";
import { formatSensorNumber, type SensorOperationalState } from "../../utils/sensor-status";
import styles from "./SensorsScreen.module.css";

/** Aba Agora: última leitura completa, localização e nutrientes. */
export function SensorReadingPanel({
  reading,
  state,
}: {
  reading: SensorReading;
  state: SensorOperationalState;
}) {
  return (
    <>
      <div className={styles.readingGrid}>
        <article className={styles.moistureCard}>
          <div className={styles.gauge}>
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" />
              <circle
                className={
                  state === "attention"
                    ? styles.gaugeWarning
                    : ""
                }
                cx="50"
                cy="50"
                r="45"
                style={{
                  strokeDashoffset:
                    283 - (reading.moisture / 100) * 283,
                }}
              />
            </svg>
            <span>
              <strong>
                {formatSensorNumber(reading.moisture)}%
              </strong>
              <small>Umidade</small>
            </span>
          </div>
          <div>
            <small>FAIXA RECOMENDADA</small>
            <strong>55% – 70%</strong>
            <p
              className={
                reading.moisture < 55 || reading.moisture > 70
                  ? styles.textWarning
                  : ""
              }
            >
              {reading.moisture < 55
                ? "Abaixo do ideal"
                : reading.moisture > 70
                  ? "Acima do ideal"
                  : "Dentro do ideal"}
            </p>
          </div>
        </article>
        <article>
          <small>TEMPERATURA</small>
          <strong>
            {formatSensorNumber(reading.temperature)}
            <span>°C</span>
          </strong>
          <p>Temperatura do solo</p>
        </article>
        <article>
          <small>pH DO SOLO</small>
          <strong>
            {formatSensorNumber(reading.ph)}
            <span> pH</span>
          </strong>
          <p>Faixa recomendada: 5,5–7</p>
        </article>
        <article>
          <small>CONDUTIVIDADE</small>
          <strong>
            {formatSensorNumber(reading.electricalConductivity)}
            <span> mS/cm</span>
          </strong>
          <p>Disponibilidade iônica</p>
        </article>
        <article>
          <small>BATERIA</small>
          <strong>
            {reading.batteryPercentage !== null
              ? formatSensorNumber(reading.batteryPercentage, 0)
              : "—"}
            <span>%</span>
          </strong>
          <p>
            {reading.charging
              ? "Carregando por energia solar"
              : reading.batteryVoltage !== null
                ? `${formatSensorNumber(reading.batteryVoltage)} V`
                : "Sem telemetria"}
          </p>
        </article>
      </div>
      {reading.latitude !== null && reading.longitude !== null && (
        <div className={styles.locationTelemetry}>
          <DashboardIcon name="location" size={16} />
          <span>
            <small>LOCALIZAÇÃO ATUAL</small>
            <strong>
              {reading.latitude.toFixed(6)},{" "}
              {reading.longitude.toFixed(6)}
            </strong>
          </span>
        </div>
      )}
      <div className={styles.nutrients}>
        <div>
          <p>NUTRIENTES DO SOLO</p>
          <h3>Nitrogênio, fósforo e potássio</h3>
        </div>
        <article>
          <span>N</span>
          <div>
            <small>Nitrogênio</small>
            <strong>
              {formatSensorNumber(reading.nitrogen, 0)} mg/kg
            </strong>
          </div>
        </article>
        <article>
          <span>P</span>
          <div>
            <small>Fósforo</small>
            <strong>
              {formatSensorNumber(reading.phosphorus, 0)} mg/kg
            </strong>
          </div>
        </article>
        <article>
          <span>K</span>
          <div>
            <small>Potássio</small>
            <strong>
              {formatSensorNumber(reading.potassium, 0)} mg/kg
            </strong>
          </div>
        </article>
      </div>
    </>
  );
}
