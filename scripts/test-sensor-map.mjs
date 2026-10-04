import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../features/map/utils/sensor-map.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { sensorCoordinates, sensorMapStatus, sensorMapDetails } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const sensor = (reading) => ({ device: { id: "sensor-1", name: "Sensor 1" }, reading });
const alert = (kind, deviceId = "sensor-1") => ({ kind, device: { id: deviceId } });

test("GPS usa longitude primeiro e aceita coordenadas zero e limites", () => {
  assert.deepEqual(sensorCoordinates(sensor({ latitude: -22, longitude: -47 })), [-47, -22]);
  assert.deepEqual(sensorCoordinates(sensor({ latitude: 0, longitude: 0 })), [0, 0]);
  assert.deepEqual(sensorCoordinates(sensor({ latitude: 90, longitude: -180 })), [-180, 90]);
});
test("GPS ausente ou inválido nunca gera marcador", () => {
  for (const reading of [null, {}, { latitude: null, longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }, { latitude: NaN, longitude: 0 }, { latitude: 0, longitude: Infinity }, { latitude: "0", longitude: 0 }]) {
    assert.equal(sensorCoordinates(sensor(reading)), null);
  }
});
test("estado respeita alertas do backend, inclusive limiar configurável de offline", () => {
  const item = sensor({ timestamp: "2020-01-01" });
  assert.equal(sensorMapStatus(item, []).key, "normal");
  assert.equal(sensorMapStatus(item, [alert("low_battery")]).key, "attention");
  assert.equal(sensorMapStatus(item, [alert("offline"), alert("low_battery")]).key, "offline");
  assert.equal(sensorMapStatus(item, [alert("no_data")]).key, "offline");
  assert.equal(sensorMapStatus(item, [alert("offline", "other-device")]).key, "normal");
  assert.equal(sensorMapStatus(sensor(null), []).key, "offline");
});
test("detalhes preservam bateria zero, carregamento e valores não informados", () => {
  assert.ok(sensorMapDetails(sensor({ batteryPercentage: 0, batteryVoltage: 3.7, charging: true, timestamp: "2026-10-04T12:00:00Z" })).includes("Bateria: 0%"));
  assert.ok(sensorMapDetails(sensor({ charging: true })).includes("Bateria carregando"));
  assert.ok(sensorMapDetails(sensor({ charging: false })).includes("Não está carregando"));
  assert.ok(sensorMapDetails(sensor({})).includes("Carregamento não informado"));
  assert.ok(sensorMapDetails(sensor({})).includes("Última leitura: data inválida"));
  assert.deepEqual(sensorMapDetails(sensor(null)), ["Ainda não recebeu leituras"]);
});
