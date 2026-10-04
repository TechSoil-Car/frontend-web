import type { SensorAlert, SensorLatest } from "../types/sensor.types";

export type SensorOperationalState = "online" | "attention" | "offline";

export function getSensorState(sensor: SensorLatest, alerts: SensorAlert[]): SensorOperationalState {
  const active = alerts.filter((alert) => alert.device.id === sensor.device.id);
  if (!sensor.reading || active.some((alert) => alert.kind === "offline" || alert.kind === "no_data")) return "offline";
  return active.length > 0 ? "attention" : "online";
}

export function formatRelativeTime(timestamp: string | null | undefined) {
  if (!timestamp) return "sem leituras";
  if (!Number.isFinite(new Date(timestamp).getTime())) return "data inválida";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 60_000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `há ${hours} ${hours === 1 ? "hora" : "horas"}`;
}

export function formatSensorNumber(value: number | undefined, digits = 1) {
  return value === undefined ? "—" : value.toFixed(digits).replace(".", ",");
}
