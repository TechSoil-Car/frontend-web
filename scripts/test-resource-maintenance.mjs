import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { errorMessageModule } from "./error-message-module.mjs";

const device = {
  id: "sensor-internal",
  deviceId: "sensor_01",
  name: "Sensor Norte",
  plantationId: "plantation-a",
};
const plantation = {
  id: "plantation-a",
  name: "Fazenda Norte",
  role: "OWNER",
  location: "Paraná",
};

function mount(kind, action, fail = false, role = "OWNER") {
  const path =
    kind === "sensor"
      ? "../features/sensors/components/sensors-screen/SensorMaintenanceDialog.tsx"
      : "../features/plantations/components/plantations-screen/PlantationMaintenanceDialog.tsx";
  const code = ts.transpileModule(
    readFileSync(new URL(path, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  const states = [];
  const calls = [];
  const successes = [];
  let cursor = 0;
  class ApiError extends Error {}
  const record = async (...args) => {
    calls.push(args);
    if (fail) throw new ApiError("Cadastro protegido");
  };
  const sensorApi = {
    updateSensor: async (...args) => {
      await record("update", ...args);
      return { ...device, name: args[2] };
    },
    removeSensor: (...args) => record("remove", ...args),
  };
  const plantationApi = {
    updatePlantation: (...args) => record("update", ...args),
    removePlantation: (...args) => record("remove", ...args),
  };
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  runInNewContext(code, {
    exports,
    FormData: class {
      constructor(values) {
        this.values = values;
      }
      get(name) {
        return this.values[name] ?? null;
      }
    },
    require: (name) => {
      if (name === "react")
        return {
          useState: (initial) => {
            const index = cursor++;
            if (!(index in states)) states[index] = initial;
            return [
              states[index],
              (next) => {
                states[index] = next;
              },
            ];
          },
        };
      if (name === "react/jsx-runtime")
        return { jsx, jsxs: jsx, Fragment: "fragment" };
      if (name === "@/shared/components/modal/Modal") return { Modal: "modal" };
      if (name.endsWith(".module.css")) return { default: {} };
      if (name === "@/shared/api/error-message") return errorMessageModule(ApiError);
      if (name === "../../services/sensors-api") return sensorApi;
      if (name === "../../context/PlantationContext")
        return { usePlantations: () => plantationApi };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const props = {
    device,
    plantation: { ...plantation, role },
    action,
    onClose: () => {},
    onUpdated: (result) => successes.push(result),
    onRemoved: (result) => successes.push(result),
    onSuccess: (message) => successes.push(message),
  };
  const render = () => {
    cursor = 0;
    return kind === "sensor"
      ? exports.SensorMaintenanceDialog(props)
      : exports.PlantationMaintenanceDialog(props);
  };
  function find(node, predicate) {
    if (!node || typeof node !== "object") return null;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      const match = find(child, predicate);
      if (match) return match;
    }
    return null;
  }
  const submit = (values = {}) =>
    find(render(), (node) => node.type === "form").props.onSubmit({
      preventDefault() {},
      currentTarget: values,
    });
  const confirm = (value) =>
    find(
      render(),
      (node) => node.type === "input" && node.props.id.startsWith("confirm-"),
    ).props.onChange({ target: { value } });
  return { render, find, submit, confirm, calls, successes, states };
}

for (const kind of ["sensor", "plantation"]) {
  test(`${kind}: confirmação incorreta nunca envia DELETE`, async () => {
    const harness = mount(kind, "remove");
    harness.confirm("incorreto");
    await harness.submit();
    assert.equal(harness.calls.length, 0);
    const button = harness.find(
      harness.render(),
      (node) => node.type === "button" && node.props.type === "submit",
    );
    assert.equal(button.props.disabled, true);
  });
  test(`${kind}: confirmação correta envia DELETE somente para o recurso escolhido`, async () => {
    const harness = mount(kind, "remove");
    harness.confirm(kind === "sensor" ? device.deviceId : plantation.name);
    await harness.submit();
    assert.deepEqual(
      harness.calls[0],
      kind === "sensor"
        ? ["remove", "plantation-a", "sensor_01"]
        : ["remove", "plantation-a"],
    );
    assert.equal(harness.successes.length, 1);
  });
  test(`${kind}: conflito preserva o diálogo e não comunica remoção bem-sucedida`, async () => {
    const harness = mount(kind, "remove", true);
    harness.confirm(kind === "sensor" ? device.deviceId : plantation.name);
    await harness.submit();
    assert.equal(harness.successes.length, 0);
    assert.equal(harness.states[0], false);
    assert.equal(harness.states[1], "Cadastro protegido");
  });
  test(`${kind}: nome vazio é rejeitado antes da API`, async () => {
    const harness = mount(kind, "edit");
    await harness.submit({ name: "   " });
    assert.equal(harness.calls.length, 0);
  });
}

test("sensor: edição envia nome aparado sem modificar identificação", async () => {
  const harness = mount("sensor", "edit");
  await harness.submit({ name: "  Sensor Sul  ", deviceId: "injetado" });
  assert.deepEqual(harness.calls[0], [
    "update",
    "plantation-a",
    "sensor_01",
    "Sensor Sul",
  ]);
});

test("plantação: edição limpa a localização e envia somente dados descritivos", async () => {
  const harness = mount("plantation", "edit");
  await harness.submit({ name: "  Fazenda Sul  ", location: "  " });
  assert.equal(harness.calls[0][0], "update");
  assert.equal(harness.calls[0][1], "plantation-a");
  assert.equal(
    JSON.stringify(harness.calls[0][2]),
    JSON.stringify({ name: "Fazenda Sul", location: null }),
  );
});

test("plantação: membro não pode disparar manutenção pelo formulário", async () => {
  const harness = mount("plantation", "edit", false, "MEMBER");
  await harness.submit({ name: "Nome válido" });
  assert.equal(harness.calls.length, 0);
});
