"use client";

import { useCallback, useEffect, useState } from "react";
import * as sensorsApi from "../services/sensors-api";
import type { MonitoringStatus, SensorAlert, SensorLatest } from "../types/sensor.types";

const POLLING_INTERVAL_MS = 30_000;

export function useSensorMonitoring(plantationId: string | undefined) {
  const [sensors, setSensors] = useState<SensorLatest[]>([]);
  const [alerts, setAlerts] = useState<SensorAlert[]>([]);
  const [status, setStatus] = useState<MonitoringStatus>(plantationId ? "loading" : "idle");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const reload = useCallback(async (silent = false) => {
    if (!plantationId) return;
    if (!silent) setStatus("loading");

    try {
      const [latest, activeAlerts] = await Promise.all([
        sensorsApi.getLatestSensors(plantationId),
        sensorsApi.getAlerts(plantationId),
      ]);
      setSensors(latest);
      setAlerts(activeAlerts);
      setLastUpdatedAt(new Date());
      setStatus("ready");
    } catch {
      if (!silent) setStatus("error");
    }
  }, [plantationId]);

  useEffect(() => {
    if (!plantationId) return;
    const initialTimer = window.setTimeout(() => void reload(), 0);
    const pollingTimer = window.setInterval(() => void reload(true), POLLING_INTERVAL_MS);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(pollingTimer);
    };
  }, [plantationId, reload]);

  return { sensors, alerts, status, lastUpdatedAt, reload };
}
