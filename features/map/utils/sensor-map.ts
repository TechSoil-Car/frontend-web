import type { SensorAlert, SensorLatest } from "@/features/sensors/types/sensor.types";

export function sensorCoordinates(sensor: SensorLatest): [number, number] | null {
  const latitude = sensor.reading?.latitude;
  const longitude = sensor.reading?.longitude;
  if (typeof latitude !== "number" || typeof longitude !== "number"
    || !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return [longitude, latitude];
}

export function sensorMapStatus(sensor: SensorLatest, alerts: SensorAlert[]) {
  const active = alerts.filter((alert) => alert.device.id === sensor.device.id);
  if (!sensor.reading || active.some((alert) => alert.kind === "no_data" || alert.kind === "offline")) {
    return { key: "offline", label: "Sem comunicação" } as const;
  }
  if (active.length) return { key: "attention", label: "Com alerta" } as const;
  return { key: "normal", label: "Sem alertas ativos" } as const;
}

export function sensorMapDetails(sensor: SensorLatest): string[] {
  const reading = sensor.reading;
  if (!reading) return ["Ainda não recebeu leituras"];
  const timestamp = new Date(reading.timestamp);
  return [
    `Bateria: ${reading.batteryPercentage == null ? "não informada" : `${reading.batteryPercentage}%`}`,
    `Tensão: ${reading.batteryVoltage == null ? "não informada" : `${reading.batteryVoltage.toLocaleString("pt-BR")} V`}`,
    reading.charging == null ? "Carregamento não informado" : reading.charging ? "Bateria carregando" : "Não está carregando",
    `Última leitura: ${Number.isNaN(timestamp.getTime()) ? "data inválida" : timestamp.toLocaleString("pt-BR")}`,
  ];
}
