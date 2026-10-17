"use client";

import { KeyboardEvent, PointerEvent, useMemo, useState } from "react";
import type { SensorReading } from "../../types/sensor.types";
import { formatSensorNumber } from "../../utils/sensor-status";
import styles from "./SensorsScreen.module.css";

const WIDTH = 660;

/** Moisture history; hovering (or arrow keys) shows the exact reading at that point. */
export function HistoryChart({ readings }: { readings: SensorReading[] }) {
  // The API returns newest first; the chart reads left (oldest) to right.
  const ordered = useMemo(() => [...readings].reverse(), [readings]);
  const [active, setActive] = useState<number | null>(null);
  const last = ordered.length - 1;
  const points = ordered.map((reading, index) => ({
    x: last === 0 ? 50 : (index / last) * 100,
    y: 100 - Math.max(0, Math.min(100, reading.moisture)),
  }));
  const line = points.map((point) => `${((point.x / 100) * WIDTH).toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const current = active === null ? null : ordered[active];
  const point = active === null ? null : points[active];

  function pick(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
    setActive(Math.round(ratio * last));
  }

  function move(event: KeyboardEvent<HTMLDivElement>) {
    const next = { ArrowLeft: (active ?? last) - 1, ArrowRight: (active ?? 0) + 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setActive(Math.max(0, Math.min(last, next)));
  }

  return (
    <div className={styles.chart}>
      <div className={styles.chartLabels}>
        <span>100%</span>
        <span>75%</span>
        <span>50%</span>
        <span>25%</span>
        <span>0%</span>
      </div>
      <div
        className={styles.chartPlot}
        tabIndex={0}
        role="group"
        aria-label="Histórico de umidade. Passe o mouse ou use as setas para ver cada leitura."
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((value) => value ?? last)}
        onBlur={() => setActive(null)}
        onKeyDown={move}
      >
        <svg viewBox={`0 0 ${WIDTH} 100`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="sensorHistoryFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#75ad4c" stopOpacity=".28" />
              <stop offset="1" stopColor="#75ad4c" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M ${line} L ${last === 0 ? 330 : WIDTH} 100 L ${last === 0 ? 330 : 0} 100 Z`} />
          <polyline points={line} />
        </svg>
        <span className={styles.chartSweep} aria-hidden="true" />
        {current && point && (
          <>
            <span className={styles.chartGuide} style={{ left: `${point.x}%` }} aria-hidden="true" />
            <span className={styles.chartDot} style={{ left: `${point.x}%`, top: `${point.y}%` }} aria-hidden="true" />
            <div
              className={`${styles.chartTooltip} ${point.x > 65 ? styles.tooltipLeft : ""} ${point.y < 45 ? styles.tooltipBelow : ""}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              role="status"
            >
              <small>
                {new Date(current.timestamp).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </small>
              <strong>{formatSensorNumber(current.moisture)}% de umidade</strong>
              <span>
                {formatSensorNumber(current.temperature)} °C · pH {formatSensorNumber(current.ph)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
