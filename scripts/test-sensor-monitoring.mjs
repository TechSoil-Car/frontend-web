import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../features/sensors/hooks/use-sensor-monitoring.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

// Isolate the hook's asynchronous logic with mocked React lifecycle primitives.
// No browser, database, timers or external API is used by these regression tests.
function mount(plantationId) {
  const states = [];
  const cleanups = [];
  const calls = [];
  const latest = [];
  const alerts = [];
  const exports = {};
  const react = {
    useRef: (value) => ({ current: value }),
    useCallback: (callback) => callback,
    useState: (initial) => {
      const index = states.push(initial) - 1;
      return [initial, (next) => { states[index] = next; }];
    },
    useEffect: (effect) => { cleanups.push(effect()); },
  };
  const api = {
    getLatestSensors: (id) => { calls.push(id); const request = deferred(); latest.push(request); return request.promise; },
    getAlerts: () => { const request = deferred(); alerts.push(request); return request.promise; },
  };
  runInNewContext(code, {
    exports, Date,
    require: (name) => {
      if (name === "react") return react;
      if (name === "../services/sensors-api") return api;
      throw new Error(`Unexpected dependency: ${name}`);
    },
    window: { setTimeout: () => 1, setInterval: () => 2, clearTimeout: () => {}, clearInterval: () => {} },
  });
  const hook = exports.useSensorMonitoring(plantationId);
  return { hook, states, calls, latest, alerts, unmount: () => cleanups.forEach((cleanup) => cleanup?.()) };
}

test("uma resposta antiga não substitui a atualização mais recente", async () => {
  const harness = mount("plantation-a");
  const older = harness.hook.reload();
  const newer = harness.hook.reload();
  const fresh = [{ device: { id: "fresh" } }];
  harness.latest[1].resolve(fresh);
  harness.alerts[1].resolve([]);
  await newer;
  harness.latest[0].resolve([{ device: { id: "stale" } }]);
  harness.alerts[0].resolve([]);
  await older;
  assert.equal(harness.states[0], fresh);
  assert.equal(harness.states[2], "ready");
});

test("falha de uma requisição antiga não sobrescreve o sucesso atual", async () => {
  const harness = mount("plantation-a");
  const older = harness.hook.reload();
  const newer = harness.hook.reload();
  harness.latest[1].resolve([]);
  harness.alerts[1].resolve([]);
  await newer;
  harness.latest[0].reject(new Error("Old request failed"));
  harness.alerts[0].resolve([]);
  await older;
  assert.equal(harness.states[2], "ready");
  assert.equal(harness.states[4], false);
});

test("resposta da plantação anterior é ignorada após desmontar a tela", async () => {
  const previous = mount("plantation-a");
  const pending = previous.hook.reload();
  previous.unmount();
  const current = mount("plantation-b");
  const request = current.hook.reload();
  const fresh = [{ device: { id: "sensor-b" } }];
  current.latest[0].resolve(fresh);
  current.alerts[0].resolve([]);
  await request;
  previous.latest[0].resolve([{ device: { id: "sensor-a" } }]);
  previous.alerts[0].resolve([]);
  await pending;
  assert.equal(previous.states[0].length, 0);
  assert.equal(current.states[0], fresh);
  assert.deepEqual(current.calls, ["plantation-b"]);
});
