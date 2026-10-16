import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(
  new URL(
    "../features/plantations/context/PlantationContext.tsx",
    import.meta.url,
  ),
  "utf8",
);
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const key = "techsoil:active-plantation";
const first = {
  id: "a",
  name: "Primeira",
  role: "OWNER",
  location: "Local",
  centerLatitude: -22,
  boundaryGeoJson: { type: "Polygon" },
};
const second = { ...first, id: "b", name: "Segunda" };

function mount(items = [first, second], selected = "a", fail = false) {
  const states = [items, selected, "ready"];
  let cursor = 0;
  const storage = new Map([[key, selected]]);
  const calls = [];
  const jsx = (type, props) => ({ type, props });
  const react = {
    createContext: () => ({ Provider: "provider" }),
    useEffect: () => {},
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useState: (initial) => {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [
        states[index],
        (next) => {
          states[index] =
            typeof next === "function" ? next(states[index]) : next;
        },
      ];
    },
  };
  const api = {
    updatePlantation: async (id, input) => {
      calls.push(["update", id, input]);
      if (fail) throw new Error("Forbidden");
      return { ...items.find((item) => item.id === id), ...input };
    },
    removePlantation: async (id) => {
      calls.push(["remove", id]);
      if (fail) throw new Error("Conflict");
    },
  };
  const exports = {};
  runInNewContext(code, {
    exports,
    require: (name) => {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "@/features/auth")
        return {
          useAuth: () => ({
            status: "authenticated",
            user: { systemRole: "USER" },
          }),
        };
      if (name === "../services/plantations-api") return api;
      if (name === "@/features/organizations/OrganizationContext") return { useOrganizations: () => ({ selected: { organization: { id: "org-a" } }, status: "ready" }) };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    window: {
      localStorage: {
        getItem: (name) => storage.get(name) ?? null,
        setItem: (name, value) => storage.set(name, value),
        removeItem: (name) => storage.delete(name),
      },
    },
  });
  const render = () => {
    cursor = 0;
    const root = exports.PlantationProvider({ children: null });
    return root.type(root.props).props.value;
  };
  return { render, storage, calls };
}

test("editar atualiza a plantação ativa preservando a geometria e as demais propriedades", async () => {
  const harness = mount();
  await harness
    .render()
    .updatePlantation("a", { name: "Novo nome", location: null });
  assert.equal(harness.render().selectedPlantation.name, "Novo nome");
  assert.equal(harness.render().selectedPlantation.location, null);
  assert.equal(
    harness.render().selectedPlantation.boundaryGeoJson,
    first.boundaryGeoJson,
  );
  assert.equal(harness.render().selectedPlantation.centerLatitude, -22);
});

test("remover a plantação ativa seleciona a próxima e atualiza o armazenamento", async () => {
  const harness = mount();
  await harness.render().removePlantation("a");
  assert.equal(harness.render().plantations.length, 1);
  assert.equal(harness.render().selectedPlantation.id, "b");
  assert.equal(harness.storage.get(key), "b");
});

test("remover a última plantação limpa a seleção e o armazenamento", async () => {
  const harness = mount([first]);
  await harness.render().removePlantation("a");
  assert.equal(harness.render().plantations.length, 0);
  assert.equal(harness.render().selectedPlantation, null);
  assert.equal(harness.storage.has(key), false);
});

test("remover outra plantação mantém a seleção atual", async () => {
  const harness = mount();
  await harness.render().removePlantation("b");
  assert.equal(harness.render().selectedPlantation.id, "a");
  assert.equal(harness.storage.get(key), "a");
});

test("erro na API não altera o cadastro nem a seleção local", async () => {
  const harness = mount([first, second], "a", true);
  await assert.rejects(harness.render().removePlantation("a"));
  await assert.rejects(
    harness
      .render()
      .updatePlantation("a", { name: "Não deve salvar", location: null }),
  );
  assert.equal(harness.render().plantations.length, 2);
  assert.equal(harness.render().selectedPlantation.name, "Primeira");
  assert.equal(harness.storage.get(key), "a");
});
