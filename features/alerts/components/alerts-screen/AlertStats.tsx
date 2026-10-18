import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import type { summarizeAlerts } from "../../utils/alert-view";
import styles from "./AlertsScreen.module.css";

/** Cartões de resumo; "—" enquanto não há consulta concluída. */
export function AlertStats({
  stats,
  sensorCount,
  hasSnapshot,
}: {
  stats: ReturnType<typeof summarizeAlerts>;
  sensorCount: number;
  hasSnapshot: boolean;
}) {
  return (
    <section
      className={styles.stats}
      aria-label="Resumo de todos os alertas da plantação"
    >
      {(
        [
          {
            label: "Alertas ativos",
            value: stats.total,
            icon: "bell",
            tone: "neutral",
          },
          {
            label: "Críticos",
            value: stats.critical,
            icon: "alert",
            tone: "critical",
          },
          {
            label: "Atenção",
            value: stats.warning,
            icon: "alert",
            tone: "warning",
          },
          {
            label: "Sensores afetados",
            value: stats.affectedSensors,
            icon: "sensor",
            tone: "neutral",
          },
        ] as const
      ).map((item) => (
        <article key={item.label}>
          <span className={`${styles.statIcon} ${styles[item.tone]}`}>
            <DashboardIcon name={item.icon} />
          </span>
          <div>
            <small>{item.label}</small>
            <strong>{hasSnapshot ? item.value : "—"}</strong>
            <small>
              {item.label === "Sensores afetados" && hasSnapshot
                ? `de ${sensorCount} cadastrados`
                : "na plantação selecionada"}
            </small>
          </div>
        </article>
      ))}
    </section>
  );
}
