"use client";

import { useEffect, useState } from "react";
import * as sensorsApi from "../services/sensors-api";
import type { SensorLatest, SensorReading } from "../types/sensor.types";

export type HistoryStatus = "idle" | "loading" | "ready" | "error";

/**
 * Últimas 100 leituras do sensor enquanto a aba Histórico está aberta. Recarrega
 * quando o monitoramento traz um novo retrato do sensor (a cada consulta).
 */
export function useSensorHistory(
  plantation: { id: string } | null,
  sensor: SensorLatest | null,
  enabled: boolean,
) {
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [status, setStatus] = useState<HistoryStatus>("idle");

  useEffect(() => {
    if (!enabled || !plantation || !sensor) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setStatus("loading");
      sensorsApi
        .getSensorHistory(plantation.id, sensor.device.deviceId, 100)
        .then((response) => {
          if (!cancelled) {
            setHistory(response.data);
            setStatus("ready");
          }
        })
        .catch(() => {
          if (!cancelled) setStatus("error");
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [sensor, plantation, enabled]);

  const clearHistory = () => setHistory([]);
  return { history, status, clearHistory };
}
