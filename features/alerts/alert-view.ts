import type { SensorAlert } from "@/features/sensors/types/sensor.types";

export type AlertFilters = {
  search: string;
  sensor: string;
  severity: "all" | SensorAlert["severity"];
  kind: "all" | SensorAlert["kind"];
};
export const defaultFilters: AlertFilters = {
  search: "",
  sensor: "all",
  severity: "all",
  kind: "all",
};
export const kindLabels: Record<SensorAlert["kind"], string> = {
  no_data: "Sem leituras",
  offline: "Sem conexão",
  low_battery: "Bateria baixa",
  low_moisture: "Umidade baixa",
  high_moisture: "Umidade alta",
  ph_out_of_range: "pH fora da faixa",
  temperature_out_of_range: "Temperatura fora da faixa",
};
export const recommendations: Record<SensorAlert["kind"], string> = {
  no_data:
    "Confira o cadastro, a alimentação e o envio da primeira leitura do sensor.",
  offline:
    "Verifique a alimentação, a conectividade e o envio de novas leituras.",
  low_battery:
    "Confira a bateria, as conexões e as condições de carregamento das placas solares.",
  low_moisture:
    "Avalie a leitura e as condições do solo antes de decidir sobre a irrigação.",
  high_moisture:
    "Verifique as condições do solo e a drenagem antes de ajustar a irrigação.",
  ph_out_of_range:
    "Valide a medição e a faixa configurada com orientação agronômica.",
  temperature_out_of_range:
    "Confira a medição e os limites adequados para a cultura.",
};
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const timestamp = (value: string | null) => {
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : 0;
};
export function filterAlerts(alerts: SensorAlert[], filters: AlertFilters) {
  const search = normalize(filters.search);
  return alerts
    .filter(
      (alert) =>
        (filters.sensor === "all" || alert.device.id === filters.sensor) &&
        (filters.severity === "all" || alert.severity === filters.severity) &&
        (filters.kind === "all" || alert.kind === filters.kind) &&
        (!search ||
          normalize(
            `${alert.title} ${alert.message} ${alert.device.name} ${alert.device.deviceId} ${kindLabels[alert.kind]}`,
          ).includes(search)),
    )
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
      return (
        timestamp(b.occurredAt) - timestamp(a.occurredAt) ||
        a.id.localeCompare(b.id)
      );
    });
}
export function summarizeAlerts(alerts: SensorAlert[]) {
  return {
    total: alerts.length,
    critical: alerts.filter((alert) => alert.severity === "critical").length,
    warning: alerts.filter((alert) => alert.severity === "warning").length,
    affectedSensors: new Set(alerts.map((alert) => alert.device.id)).size,
  };
}
