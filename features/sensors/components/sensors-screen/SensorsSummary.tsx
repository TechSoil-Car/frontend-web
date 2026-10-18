import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import styles from "./SensorsScreen.module.css";

/** Totais de sensores: com sinal recente, em atenção e sem conexão. */
export function SensorsSummary({
  plantationName,
  total,
  onlineCount,
  attentionCount,
  offlineCount,
  alertCount,
}: {
  plantationName: string;
  total: number;
  onlineCount: number;
  attentionCount: number;
  offlineCount: number;
  alertCount: number;
}) {
  return (
    <section className={styles.summary} aria-label="Resumo dos sensores">
      <article>
        <span className={styles.summaryIcon}>
          <DashboardIcon name="sensor" />
        </span>
        <div>
          <small>TOTAL DE SENSORES</small>
          <strong>{total}</strong>
          <p>em {plantationName}</p>
        </div>
      </article>
      <article>
        <span className={styles.summaryIcon}>
          <i />
        </span>
        <div>
          <small>COM SINAL RECENTE</small>
          <strong>{onlineCount}</strong>
          <p>leitura nos últimos 15 min</p>
        </div>
      </article>
      <article>
        <span className={`${styles.summaryIcon} ${styles.attentionIcon}`}>
          <DashboardIcon name="alert" />
        </span>
        <div>
          <small>PRECISA DE ATENÇÃO</small>
          <strong>{attentionCount}</strong>
          <p>{alertCount} alertas ativos</p>
        </div>
      </article>
      <article>
        <span className={`${styles.summaryIcon} ${styles.offlineIcon}`}>
          <span>×</span>
        </span>
        <div>
          <small>SEM CONEXÃO</small>
          <strong>{offlineCount}</strong>
          <p>sem leitura recente</p>
        </div>
      </article>
    </section>
  );
}
