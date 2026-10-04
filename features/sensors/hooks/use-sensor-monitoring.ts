"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as sensorsApi from "../services/sensors-api";
import type { MonitoringStatus, SensorAlert, SensorLatest } from "../types/sensor.types";

const POLLING_INTERVAL_MS = 30_000;

export function useSensorMonitoring(plantationId: string | undefined) {
  const requestVersion = useRef(0);
  const [sensors, setSensors] = useState<SensorLatest[]>([]);
  const [alerts, setAlerts] = useState<SensorAlert[]>([]);
  const [status, setStatus] = useState<MonitoringStatus>(plantationId ? "loading" : "idle");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);

  const reload = useCallback(async (silent = false) => {
    if (!plantationId) return;
    const version = ++requestVersion.current;
    if (!silent) setStatus("loading");

    try {
      const [latest, activeAlerts] = await Promise.all([
        sensorsApi.getLatestSensors(plantationId),
        sensorsApi.getAlerts(plantationId),
      ]);
      if (version !== requestVersion.current) return;
      setSensors(latest);
      setAlerts(activeAlerts);
      setLastUpdatedAt(new Date());
      setRefreshFailed(false);
      setStatus("ready");
    } catch {
      if (version !== requestVersion.current) return;
      setRefreshFailed(true);
      if (!silent) setStatus("error");
    }
  }, [plantationId]);

  useEffect(() => {
    if (!plantationId) return;
    const initialTimer = window.setTimeout(() => void reload(), 0);
    const pollingTimer = window.setInterval(() => void reload(true), POLLING_INTERVAL_MS);
    return () => {
      requestVersion.current += 1;
      window.clearTimeout(initialTimer);
      window.clearInterval(pollingTimer);
    };
  }, [plantationId, reload]);

  return { sensors, alerts, status, lastUpdatedAt, refreshFailed, reload };
}
