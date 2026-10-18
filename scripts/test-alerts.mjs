import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const exports = {};
runInNewContext(
  ts.transpileModule(
    readFileSync(
      new URL("../features/alerts/utils/alert-view.ts", import.meta.url),
      "utf8",
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  { exports },
);
const { defaultFilters, filterAlerts, summarizeAlerts } = exports;
const alerts = [
  {
    id: "battery",
    kind: "low_battery",
    severity: "warning",
    title: "Bateria baixa",
    message: "Carga de 15%",
    occurredAt: "2026-10-06T15:00:00Z",
    device: { id: "a", deviceId: "sensor_01", name: "Estação Norte" },
  },
  {
    id: "offline",
    kind: "offline",
    severity: "critical",
    title: "Sensor sem conexão",
    message: "Última leitura antiga",
    occurredAt: "2026-10-05T12:00:00Z",
    device: { id: "b", deviceId: "sensor_02", name: "Estação Sul" },
  },
  {
    id: "moisture",
    kind: "low_moisture",
    severity: "warning",
    title: "Umidade baixa",
    message: "Leitura de 10%",
    occurredAt: "2026-10-06T12:00:00Z",
    device: { id: "a", deviceId: "sensor_01", name: "Estação Norte" },
  },
];

test("alertas: resumo distingue ocorrências e sensores afetados", () => {
  assert.equal(summarizeAlerts(alerts).total, 3);
  assert.equal(summarizeAlerts(alerts).critical, 1);
  assert.equal(summarizeAlerts(alerts).warning, 2);
  assert.equal(summarizeAlerts(alerts).affectedSensors, 2);
});
test("alertas: críticos aparecem primeiro sem alterar a lista original", () => {
  const result = filterAlerts(alerts, defaultFilters);
  assert.equal(
    result.map((item) => item.id).join(","),
    "offline,battery,moisture",
  );
  assert.equal(alerts[0].id, "battery");
});
test("alertas: sensor, gravidade, tipo e busca são combinados", () => {
  const result = filterAlerts(alerts, {
    ...defaultFilters,
    sensor: "a",
    severity: "warning",
    kind: "low_battery",
    search: " SENSOR_01 ",
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "battery");
  assert.equal(
    filterAlerts(alerts, {
      ...defaultFilters,
      sensor: "b",
      severity: "warning",
    }).length,
    0,
  );
});
test("alertas: busca aceita maiúsculas e ausência de acentos", () => {
  assert.equal(
    filterAlerts(alerts, { ...defaultFilters, search: " ESTACAO NORTE " })
      .length,
    2,
  );
  assert.equal(
    filterAlerts(alerts, { ...defaultFilters, search: "conexao" }).length,
    1,
  );
  assert.equal(
    filterAlerts(alerts, { ...defaultFilters, search: "15%" }).length,
    1,
  );
});
test("alertas: busca vazia e lista sem alertas não geram resultados artificiais", () => {
  assert.equal(
    filterAlerts(alerts, { ...defaultFilters, search: "  " }).length,
    3,
  );
  assert.equal(filterAlerts([], defaultFilters).length, 0);
  assert.equal(summarizeAlerts([]).affectedSensors, 0);
});
test("alertas: datas nulas ou inválidas não quebram a ordenação", () => {
  const result = filterAlerts(
    [
      { ...alerts[0], id: "no-time", occurredAt: null },
      { ...alerts[0], id: "bad-time", occurredAt: "inválido" },
      alerts[0],
    ],
    defaultFilters,
  );
  assert.equal(result[0].id, "battery");
  assert.equal(result.length, 3);
});

function renderScreen(
  monitoring,
  selected = { id: "farm", name: "Fazenda" },
  systemRole = "USER",
) {
  const jsx = (type, props) => ({ type, props });
  // Tela e subcomponentes da pasta são carregados de verdade; o resto é simulado.
  const component = (file) => {
    const moduleExports = {};
    runInNewContext(
      ts.transpileModule(
        readFileSync(
          new URL(`../features/alerts/components/alerts-screen/${file}.tsx`, import.meta.url),
          "utf8",
        ),
        {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            jsx: ts.JsxEmit.ReactJSX,
          },
        },
      ).outputText,
      { exports: moduleExports, require },
    );
    return moduleExports;
  };
  const require = (name) => {
    if (name.startsWith("./") && !name.endsWith(".css"))
      return component(name.slice(2));
    if (name === "react")
      return { useState: (initial) => [initial, () => {}] };
    if (name === "react/jsx-runtime")
      return { jsx, jsxs: jsx, Fragment: "fragment" };
    if (name === "next/link") return { default: "a" };
    if (name.endsWith(".module.css")) return { default: {} };
    if (name === "../../utils/alert-view") return exports;
    if (name === "@/features/auth/context/AuthContext")
      return { useAuth: () => ({ user: { systemRole } }) };
    if (name === "@/features/plantations/context/PlantationContext")
      return { usePlantations: () => ({ selectedPlantation: selected }) };
    if (
      name ===
      "@/features/dashboard/components/dashboard-icons/DashboardIcon"
    )
      return { DashboardIcon: "icon" };
    if (name === "@/features/sensors/hooks/use-sensor-monitoring")
      return { useSensorMonitoring: () => monitoring };
    // Estados vazios/carregamento: só o texto importa para as verificações.
    if (name === "@/shared/components/empty-state/EmptyState")
      return {
        EmptyState: ({ title, text, children }) => ({
          type: "section",
          props: { children: [title, text, children] },
        }),
        LoadingState: ({ title, text }) => ({
          type: "div",
          props: { children: [title, text] },
        }),
          };
        throw new Error(`Unexpected import ${name}`);
  };
  const screenExports = component("AlertsScreen");
  function text(node) {
    if (node == null || typeof node === "boolean") return "";
    if (typeof node === "string" || typeof node === "number")
      return String(node);
    if (Array.isArray(node)) return node.map(text).join(" ");
    if (typeof node.type === "function") return text(node.type(node.props));
    return text(node.props?.children);
  }
  return text(screenExports.AlertsScreen());
}
const monitoring = {
  sensors: [{ device: alerts[0].device }],
  alerts: [],
  status: "ready",
  lastUpdatedAt: new Date(),
  refreshFailed: false,
  reload() {},
};
test("alertas: falha inicial não informa ausência de alertas", () => {
  const text = renderScreen({
    ...monitoring,
    status: "error",
    refreshFailed: true,
    lastUpdatedAt: null,
  });
  assert.match(text, /Não foi possível atualizar/);
  assert.doesNotMatch(text, /Nenhum alerta ativo/);
});
test("alertas: falha no polling mantém dados e identifica que estão desatualizados", () => {
  const text = renderScreen({ ...monitoring, alerts, refreshFailed: true });
  assert.match(text, /dados podem estar desatualizados/);
  assert.match(text, /Bateria baixa/);
});
test("alertas: ausência de sensores difere de nenhuma regra disparada", () => {
  assert.match(
    renderScreen({ ...monitoring, sensors: [] }),
    /Nenhum sensor cadastrado/,
  );
  assert.match(renderScreen(monitoring), /Nenhum alerta ativo/);
});
test("alertas: sem plantação e superadmin não renderizam dados operacionais", () => {
  assert.match(renderScreen(monitoring, null), /Selecione uma plantação/);
  assert.match(
    renderScreen(monitoring, null, "SUPERADMIN"),
    /Acesso operacional restrito/,
  );
});
