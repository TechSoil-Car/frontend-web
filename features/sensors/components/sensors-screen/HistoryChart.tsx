"use client";

import { KeyboardEvent, PointerEvent, useMemo, useState } from "react";
import type { SensorReading } from "../../types/sensor.types";
import { formatSensorNumber } from "../../utils/sensor-status";
import styles from "./SensorsScreen.module.css";

const WIDTH = 660;
const TICKS = 4;

export type HistoryMetric = {
  key: "moisture" | "temperature" | "ph" | "electricalConductivity" | "nitrogen" | "phosphorus" | "potassium";
  /** Button text. */
  label: string;
  /** Full name, shown in the tooltip. */
  name: string;
  title: string;
  unit: string;
  /** Unit shown next to the axis labels; long units stay only in the tooltip. */
  axisUnit: string;
  digits: number;
  /** Fixed scale; without it the scale follows the readings. */
  range?: [number, number];
  /** Smallest span of a following scale, so sensor noise doesn't look like a swing. */
  minSpan?: number;
};

export const HISTORY_METRICS: HistoryMetric[] = [
  { key: "moisture", label: "Umidade", name: "Umidade", title: "Variação da umidade", unit: "%", axisUnit: "%", digits: 1, range: [0, 100] },
  { key: "temperature", label: "Temperatura", name: "Temperatura", title: "Variação da temperatura", unit: " °C", axisUnit: "°", digits: 1, minSpan: 4 },
  { key: "ph", label: "pH", name: "pH do solo", title: "Variação do pH", unit: " pH", axisUnit: "", digits: 1, minSpan: 2 },
  { key: "electricalConductivity", label: "Condutividade", name: "Condutividade", title: "Variação da condutividade", unit: " mS/cm", axisUnit: "", digits: 1, minSpan: 1 },
  { key: "nitrogen", label: "N", name: "Nitrogênio", title: "Variação do nitrogênio", unit: " mg/kg", axisUnit: "", digits: 0, minSpan: 20 },
  { key: "phosphorus", label: "P", name: "Fósforo", title: "Variação do fósforo", unit: " mg/kg", axisUnit: "", digits: 0, minSpan: 20 },
  { key: "potassium", label: "K", name: "Potássio", title: "Variação do potássio", unit: " mg/kg", axisUnit: "", digits: 0, minSpan: 20 },
];

/** Smallest 1, 2, 2.5 or 5 × 10^n that is at least `value`. */
function niceStep(value: number) {
  const power = 10 ** Math.floor(Math.log10(value));
  return ([1, 2, 2.5, 5, 10].find((factor) => factor * power >= value) ?? 10) * power;
}

/** Round scale that fits every reading in `TICKS` equal steps. */
function scaleFor(values: number[], metric: HistoryMetric) {
  if (metric.range) {
    const [min, max] = metric.range;
    return { min, max, step: (max - min) / TICKS };
  }
  let low = Math.min(...values);
  let high = Math.max(...values);
  const minSpan = metric.minSpan ?? 1;
  if (high - low < minSpan) {
    const center = (low + high) / 2;
    // The readings are never negative, so the widened scale stops at zero.
    low = Math.max(0, center - minSpan / 2);
    high = low + minSpan;
  }
  let step = niceStep((high - low) / TICKS);
  let min = Math.floor(low / step) * step;
  while (min + TICKS * step < high) {
    step = niceStep(step * 1.0001);
    min = Math.floor(low / step) * step;
  }
  return { min, max: min + TICKS * step, step };
}

function stepDigits(step: number) {
  if (Number.isInteger(step)) return 0;
  return Number.isInteger(step * 10) ? 1 : 2;
}

/** History of one metric; hovering (or arrow keys) shows the exact reading at that point. */
export function HistoryChart({ readings, metric }: { readings: SensorReading[]; metric: HistoryMetric }) {
  // The API returns newest first; the chart reads left (oldest) to right.
  const ordered = useMemo(() => [...readings].reverse(), [readings]);
  const [active, setActive] = useState<number | null>(null);
  const last = ordered.length - 1;
  const scale = scaleFor(ordered.map((reading) => reading[metric.key]), metric);
  const points = ordered.map((reading, index) => ({
    x: last === 0 ? 50 : (index / last) * 100,
    y: 100 - Math.max(0, Math.min(100, ((reading[metric.key] - scale.min) / (scale.max - scale.min)) * 100)),
  }));
  const labels = Array.from({ length: TICKS + 1 }, (_, index) => scale.max - index * scale.step);
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
        {labels.map((value, index) => (
          <span key={index}>
            {formatSensorNumber(value, stepDigits(scale.step))}
            {metric.axisUnit}
          </span>
        ))}
      </div>
      <div
        className={styles.chartPlot}
        tabIndex={0}
        role="group"
        aria-label={`Histórico de ${metric.label}. Passe o mouse ou use as setas para ver cada leitura.`}
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
              <strong>
                {formatSensorNumber(current[metric.key], metric.digits)}
                {metric.unit}
              </strong>
              <span>{metric.name}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
