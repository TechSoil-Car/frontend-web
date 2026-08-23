import type { SensorLatest } from "../types/sensor.types";

const OFFLINE_AFTER_MS = 15 * 60 * 1_000;

export type SensorOperationalState = "online" | "attention" | "offline";

export function getSensorState(sensor: SensorLatest, alertCount: number): SensorOperationalState {
  if (!sensor.reading || Date.now() - new Date(sensor.reading.timestamp).getTime() > OFFLINE_AFTER_MS) return "offline";
  return alertCount > 0 ? "attention" : "online";
}

export function formatRelativeTime(timestamp: string | null | undefined) {
  if (!timestamp) return "sem leituras";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 60_000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `há ${hours} ${hours === 1 ? "hora" : "horas"}`;
}

export function formatSensorNumber(value: number | undefined, digits = 1) {
  return value === undefined ? "—" : value.toFixed(digits).replace(".", ",");
}
