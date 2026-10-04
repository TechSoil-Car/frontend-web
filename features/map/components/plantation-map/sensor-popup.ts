import type { SensorAlert, SensorLatest } from "@/features/sensors/types/sensor.types";
import { sensorMapStatus } from "../../utils/sensor-map";
import styles from "./PlantationMap.module.css";

function element(tag: string, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createSensorPopup(sensor: SensorLatest, alerts: SensorAlert[], coordinates: [number, number]) {
  const reading = sensor.reading;
  const state = sensorMapStatus(sensor, alerts);
  const content = element("div", styles.sensorPopup);
  const header = element("header", styles.popupHeader);
  header.append(
    element("span", styles.popupEyebrow, "SENSOR DE SOLO"),
    element("strong", styles.popupName, sensor.device.name),
    element("span", styles.popupDevice, sensor.device.deviceId),
  );
  const badge = element("span", `${styles.popupStatus} ${styles[`status_${state.key}`]}`);
  const dot = element("i", styles.statusDot);
  dot.setAttribute("aria-hidden", "true");
  badge.append(dot, document.createTextNode(state.label));
  header.append(badge);
  content.append(header);

  const body = element("div", styles.popupBody);
  const battery = element("section", styles.popupBattery);
  const batteryHeading = element("div", styles.batteryHeading);
  const percentage = reading?.batteryPercentage;
  const hasPercentage = typeof percentage === "number" && Number.isFinite(percentage);
  batteryHeading.append(
    element("span", styles.popupLabel, "NÍVEL DA BATERIA"),
    element("strong", styles.batteryValue, hasPercentage ? `${percentage.toLocaleString("pt-BR")}%` : "—"),
  );
  battery.append(batteryHeading);
  if (hasPercentage) {
    const track = element("div", styles.batteryTrack);
    track.setAttribute("role", "meter");
    track.setAttribute("aria-label", "Nível da bateria");
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    const level = Math.max(0, Math.min(100, percentage));
    track.setAttribute("aria-valuenow", String(level));
    const fill = element("div", styles.batteryFill);
    fill.style.width = `${level}%`;
    track.append(fill);
    battery.append(track);
  } else battery.append(element("small", styles.popupMuted, "Percentual não informado"));
  body.append(battery);

  const metrics = element("div", styles.popupMetrics);
  const voltage = element("div", styles.popupMetric);
  voltage.append(element("span", styles.popupLabel, "TENSÃO"), element("strong", styles.metricValue,
    reading?.batteryVoltage == null ? "Não informada" : `${reading.batteryVoltage.toLocaleString("pt-BR")} V`));
  const charging = element("div", styles.popupMetric);
  charging.append(element("span", styles.popupLabel, "CARREGAMENTO"), element("strong", styles.metricValue,
    reading?.charging == null ? "Não informado" : reading.charging ? "Carregando" : "Inativo"));
  metrics.append(voltage, charging);
  body.append(metrics);

  const update = element("div", styles.popupUpdate);
  const timestamp = reading ? new Date(reading.timestamp) : null;
  update.append(element("span", styles.popupLabel, "ÚLTIMA LEITURA"), element("span", styles.updateValue,
    !timestamp ? "Ainda sem leituras" : Number.isNaN(timestamp.getTime()) ? "Data inválida" : timestamp.toLocaleString("pt-BR")));
  body.append(update);
  content.append(body);
  const location = element("footer", styles.popupLocation);
  location.append(element("span", styles.popupLabel, "LOCALIZAÇÃO GPS"), element("span", styles.locationValue,
    `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`));
  content.append(location);
  return content;
}
