export type Device = {
  id: string;
  deviceId: string;
  type: "SENSOR" | "CART";
  name: string;
  plantationId: string;
  createdAt: string;
};

export type SensorReading = {
  id: string;
  readingId: string;
  deviceId: string;
  timestamp: string;
  moisture: number;
  temperature: number;
  ph: number;
  electricalConductivity: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  batteryPercentage: number | null;
  batteryVoltage: number | null;
  charging: boolean | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

export type SensorLatest = { device: Device; reading: SensorReading | null };

export type SensorAlert = {
  id: string;
  kind: "no_data" | "offline" | "low_moisture" | "high_moisture" | "ph_out_of_range" | "temperature_out_of_range" | "low_battery";
  severity: "warning" | "critical";
  title: string;
  message: string;
  occurredAt: string | null;
  readingId: string | null;
  device: Device;
};

export type PaginatedSensorReadings = { data: SensorReading[]; nextCursor: string | null };
export type MonitoringStatus = "idle" | "loading" | "ready" | "error";
