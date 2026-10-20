"use client";

import { useState } from "react";
import type { SensorReading } from "../../types/sensor.types";
import type { HistoryStatus } from "../../hooks/use-sensor-history";
import { HISTORY_METRICS, HistoryChart } from "./HistoryChart";
import styles from "./SensorsScreen.module.css";

/** Aba Histórico: gráfico das leituras recentes, uma métrica por vez. */
export function SensorHistoryPanel({
  history,
  status,
}: {
  history: SensorReading[];
  status: HistoryStatus;
}) {
  const [metric, setMetric] = useState(HISTORY_METRICS[0]);

  return (
    <div className={styles.historyCard}>
      <div className={styles.historyHead}>
        <div>
          <p>LEITURAS RECENTES</p>
          <h3>{metric.title}</h3>
        </div>
        <span>
          {status === "ready" && (
            <>
              <i /> {history.length} registros
            </>
          )}
        </span>
      </div>
      <div className={styles.metricTabs} role="group" aria-label="Métrica do gráfico">
        {HISTORY_METRICS.map((item) => (
          <button
            className={item.key === metric.key ? styles.metricActive : ""}
            type="button"
            key={item.key}
            aria-pressed={item.key === metric.key}
            title={item.name}
            onClick={() => setMetric(item)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {status === "loading" ? (
        <div className={styles.inlineState}>
          Carregando histórico...
        </div>
      ) : status === "error" ? (
        <div className={styles.inlineState}>
          Não foi possível carregar o histórico.
        </div>
      ) : history.length ? (
        <>
          {/* key: remonta o gráfico para repetir a animação ao trocar de métrica. */}
          <HistoryChart key={metric.key} readings={history} metric={metric} />
          <div className={styles.historyRange}>
            <span>
              {new Date(
                history.at(-1)!.timestamp,
              ).toLocaleDateString("pt-BR")}
            </span>
            <span>
              {new Date(history[0].timestamp).toLocaleDateString(
                "pt-BR",
              )}
            </span>
          </div>
        </>
      ) : (
        <div className={styles.inlineState}>
          Ainda não há histórico para este sensor.
        </div>
      )}
    </div>
  );
}
