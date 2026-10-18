import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import type { SensorLatest } from "@/features/sensors/types/sensor.types";
import { kindLabels, type AlertFilters } from "../../utils/alert-view";
import styles from "./AlertsScreen.module.css";

/** Busca, sensor, tipo e gravidade dos alertas. */
export function AlertFiltersBar({
  filters,
  selectedSensor,
  sensors,
  onChange,
}: {
  filters: AlertFilters;
  selectedSensor: string;
  sensors: SensorLatest[];
  onChange: <K extends keyof AlertFilters>(key: K, value: AlertFilters[K]) => void;
}) {
  return (
    <section className={styles.filters} aria-label="Filtrar alertas">
      <label className={styles.search}>
        <DashboardIcon name="search" size={17} />
        <input
          type="search"
          aria-label="Buscar alertas por sensor ou descrição"
          placeholder="Buscar sensor, identificador ou alerta..."
          value={filters.search}
          onChange={(event) => onChange("search", event.target.value)}
        />
      </label>
      <label className={styles.select}>
        Sensor
        <select
          value={selectedSensor}
          onChange={(event) => onChange("sensor", event.target.value)}
        >
          <option value="all">Todos os sensores</option>
          {sensors.map((sensor) => (
            <option key={sensor.device.id} value={sensor.device.id}>
              {sensor.device.name} · {sensor.device.deviceId}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.select}>
        Tipo de alerta
        <select
          value={filters.kind}
          onChange={(event) =>
            onChange("kind", event.target.value as AlertFilters["kind"])
          }
        >
          <option value="all">Todos os tipos</option>
          {Object.entries(kindLabels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.severity} role="group" aria-label="Gravidade">
        {(["all", "critical", "warning"] as const).map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={filters.severity === value}
            onClick={() => onChange("severity", value)}
          >
            {value === "all"
              ? "Todos"
              : value === "critical"
                ? "Críticos"
                : "Atenção"}
          </button>
        ))}
      </div>
    </section>
  );
}
