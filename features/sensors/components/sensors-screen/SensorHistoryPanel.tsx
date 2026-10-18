import type { SensorReading } from "../../types/sensor.types";
import type { HistoryStatus } from "../../hooks/use-sensor-history";
import { HistoryChart } from "./HistoryChart";
import styles from "./SensorsScreen.module.css";

/** Aba Histórico: gráfico de umidade das leituras recentes. */
export function SensorHistoryPanel({
  history,
  status,
}: {
  history: SensorReading[];
  status: HistoryStatus;
}) {
  return (
    <div className={styles.historyCard}>
      <div className={styles.historyHead}>
        <div>
          <p>LEITURAS RECENTES</p>
          <h3>Variação da umidade</h3>
        </div>
        <span>
          {status === "ready" && (
            <>
              <i /> {history.length} registros
            </>
          )}
        </span>
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
          <HistoryChart readings={history} />
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
