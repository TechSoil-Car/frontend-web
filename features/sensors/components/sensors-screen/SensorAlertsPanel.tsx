import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import type { SensorAlert } from "../../types/sensor.types";
import { formatRelativeTime } from "../../utils/sensor-status";
import styles from "./SensorsScreen.module.css";

/** Aba Alertas: alertas ativos do sensor selecionado. */
export function SensorAlertsPanel({ alerts }: { alerts: SensorAlert[] }) {
  return (
    <div className={styles.alertPanel}>
      {alerts.length ? (
        <div className={styles.alertStack}>
          {alerts.map((alert) => (
            <article key={alert.id}>
              <span>
                <DashboardIcon name="alert" size={20} />
              </span>
              <div>
                <small>
                  {alert.severity === "critical"
                    ? "ALERTA CRÍTICO"
                    : "ATENÇÃO"}
                </small>
                <strong>{alert.title}</strong>
                <p>
                  {alert.message}{" "}
                  {alert.occurredAt
                    ? `Registrado ${formatRelativeTime(alert.occurredAt)}.`
                    : ""}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.noAlerts}>
          <span>✓</span>
          <strong>Tudo certo por aqui</strong>
          <p>Nenhum alerta ativo para este sensor.</p>
        </div>
      )}
    </div>
  );
}
