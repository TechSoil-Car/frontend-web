import { apiRequest } from "@/shared/api/api-client";
import type { AlertSettings, Device, PaginatedSensorReadings, SensorAlert, SensorLatest, UpdateAlertSettingsInput } from "../types/sensor.types";

export function getLatestSensors(plantationId: string) {
  return apiRequest<SensorLatest[]>(`/plantations/${plantationId}/sensors/latest`);
}

export function getAlerts(plantationId: string) {
  return apiRequest<SensorAlert[]>(`/plantations/${plantationId}/alerts`);
}

export function getAlertSettings(plantationId: string) {
  return apiRequest<AlertSettings>(`/plantations/${plantationId}/alerts/settings`);
}

export function updateAlertSettings(plantationId: string, input: UpdateAlertSettingsInput) {
  return apiRequest<AlertSettings>(`/plantations/${plantationId}/alerts/settings`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getSensorHistory(plantationId: string, deviceId: string, limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  return apiRequest<PaginatedSensorReadings>(`/plantations/${plantationId}/sensors/${encodeURIComponent(deviceId)}/readings?${params}`);
}

export function createSensor(plantationId: string, input: { deviceId: string; name: string }) {
  return apiRequest<Device>(`/plantations/${plantationId}/devices`, {
    method: "POST",
    body: JSON.stringify({ ...input, type: "SENSOR" }),
  });
}
