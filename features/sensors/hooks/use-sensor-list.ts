"use client";

import { useMemo, useState } from "react";
import type { SensorAlert, SensorLatest } from "../types/sensor.types";
import { getSensorState } from "../utils/sensor-status";

export type SensorFilter = "all" | "online" | "attention" | "offline";

export const sensorFilters: Array<{ label: string; value: SensorFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Online", value: "online" },
  { label: "Atenção", value: "attention" },
  { label: "Offline", value: "offline" },
];

/** Busca e filtro por estado da lista de sensores, com as contagens do resumo. */
export function useSensorList(sensors: SensorLatest[], alerts: SensorAlert[]) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SensorFilter>("all");

  const visibleSensors = useMemo(
    () =>
      sensors.filter((sensor) => {
        const state = getSensorState(sensor, alerts);
        const term = query.trim().toLocaleLowerCase("pt-BR");
        return (
          (filter === "all" || filter === state) &&
          (!term ||
            `${sensor.device.name} ${sensor.device.deviceId}`
              .toLocaleLowerCase("pt-BR")
              .includes(term))
        );
      }),
    [alerts, filter, query, sensors],
  );

  const onlineCount = sensors.filter(
    (sensor) => getSensorState(sensor, alerts) !== "offline",
  ).length;
  const attentionCount = sensors.filter(
    (sensor) => getSensorState(sensor, alerts) === "attention",
  ).length;
  const offlineCount = sensors.length - onlineCount;

  return {
    query,
    setQuery,
    filter,
    setFilter,
    visibleSensors,
    onlineCount,
    attentionCount,
    offlineCount,
  };
}
