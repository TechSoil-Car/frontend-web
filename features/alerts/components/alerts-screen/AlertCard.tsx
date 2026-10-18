import Link from "next/link";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import type { SensorAlert } from "@/features/sensors/types/sensor.types";
import { kindLabels, recommendations } from "../../utils/alert-view";
import styles from "./AlertsScreen.module.css";

/** Um alerta ativo, com o que verificar e a leitura relacionada. */
export function AlertCard({ alert }: { alert: SensorAlert }) {
  return (
    <article
      className={`${styles.card} ${alert.severity === "critical" ? styles.criticalCard : styles.warningCard}`}
    >
      <div className={styles.cardTop}>
        <span
          className={`${styles.badge} ${alert.severity === "critical" ? styles.critical : styles.warning}`}
        >
          <DashboardIcon name="alert" size={14} />
          {alert.severity === "critical" ? "Crítico" : "Atenção"}
        </span>
        <small>{kindLabels[alert.kind]}</small>
      </div>
      <h2>{alert.title}</h2>
      <p className={styles.device}>
        <DashboardIcon name="sensor" size={16} />
        <strong>{alert.device.name}</strong>
        <span>{alert.device.deviceId}</span>
      </p>
      <p className={styles.message}>{alert.message}</p>
      <div className={styles.recommendation}>
        <small>O QUE VERIFICAR</small>
        <p>{recommendations[alert.kind]}</p>
      </div>
      <footer>
        <span>
          {alert.occurredAt && Number.isFinite(Date.parse(alert.occurredAt)) ? (
            <>
              Leitura relacionada
              <br />
              <time dateTime={alert.occurredAt}>
                {new Date(alert.occurredAt).toLocaleString("pt-BR")}
              </time>
            </>
          ) : (
            "Sem leitura recebida"
          )}
        </span>
        <Link href="/dashboard/sensores">
          Ver sensores <DashboardIcon name="arrow" size={15} />
        </Link>
      </footer>
    </article>
  );
}
