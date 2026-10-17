// Start `pnpm build` and `pnpm start --port 3300` first.
// The browser intercepts every Backend Web request. No email or real database is used.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.TECHSOIL_PLAYWRIGHT_MODULE || "playwright",
);
const origin = process.env.TECHSOIL_TEST_ORIGIN || "http://localhost:3300";
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname), "O ensaio exige frontend local.");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.TECHSOIL_BROWSER_CHANNEL
    ? { channel: process.env.TECHSOIL_BROWSER_CHANNEL }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const calls = [];
page.setDefaultTimeout(10_000);
page.setDefaultNavigationTimeout(20_000);
const now = new Date().toISOString();
const user = {
  id: "owner-user",
  name: "Proprietário Teste",
  email: "owner@example.test",
  systemRole: "USER",
};
const organizations = [
  "Cliente A",
  "Cliente B",
  "Cliente C",
  "Cliente sem atribuições",
].map((name, index) => ({
  role: ["OWNER", "VIEWER", "OPERATOR", "VIEWER"][index],
  organization: { id: `org-${index}`, name, createdAt: now },
}));
const farms = [0, 0, 1, 2].map((index, position) => ({
  id: `farm-${position}`,
  organizationId: `org-${index}`,
  role: ["OWNER", "VIEWER", "OPERATOR"][index],
  name: ["Fazenda A1", "Fazenda A2", "Fazenda B", "Fazenda C"][position],
  location: "Local de teste",
  createdAt: now,
  centerLatitude: null,
  centerLongitude: null,
  mapZoom: null,
  boundaryGeoJson: null,
  areaHectares: null,
}));
const members = [
  {
    id: "member-owner",
    role: "OWNER",
    joinedAt: now,
    user: {
      ...user,
      plantations: [{ plantationId: "farm-0" }, { plantationId: "farm-1" }],
    },
  },
  {
    id: "member-colleague",
    role: "VIEWER",
    joinedAt: now,
    user: {
      id: "colleague",
      name: "Colega Teste",
      email: "colleague@example.test",
      plantations: [{ plantationId: "farm-0" }],
    },
  },
];
const settings = {
  plantationId: "farm-3",
  noDataEnabled: true,
  offlineEnabled: true,
  offlineAfterMinutes: 15,
  lowBatteryEnabled: true,
  lowBatteryPercentage: 20,
  moistureEnabled: false,
  moistureMin: null,
  moistureMax: null,
  temperatureEnabled: false,
  temperatureMin: null,
  temperatureMax: null,
  phEnabled: false,
  phMin: null,
  phMax: null,
  updatedAt: null,
};
page.on("dialog", (dialog) => dialog.accept());
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.route("**/*", async (route) => {
  const request = route.request();
  const requestOrigin = new URL(request.url()).origin;
  if (requestOrigin === origin) return route.continue();
  if (requestOrigin !== "http://localhost:3001") { errors.push(`Blocked unexpected external origin: ${requestOrigin}`); return route.abort(); }
  const path = new URL(request.url()).pathname;
  const method = request.method();
  const body = request.postData() ? request.postDataJSON() : null;
  calls.push({ method, path, body });
  let status = 200;
  let data = {};
  if (path === "/auth/refresh")
    data = { access_token: "local-browser-fixture", user };
  else if (path === "/users/me") data = user;
  else if (path === "/organizations") data = organizations;
  else if (path === "/plantations" && method === "GET") data = farms;
  else if (path === "/plantations" && method === "POST") {
    data = { ...farms[0], ...body, id: "created-farm" };
    farms.push(data);
  } else if (
    path === "/organizations/org-0/members/owner-user" &&
    method === "PATCH"
  ) {
    status = 409;
    data = {
      message: "A organização deve manter pelo menos um proprietário ativo",
    };
  } else if (path.endsWith("/members") && method === "GET") data = members;
  else if (path.endsWith("/members/colleague") && method === "PATCH") {
    members[1].role = body.role;
    members[1].user.plantations = body.plantationIds.map((plantationId) => ({
      plantationId,
    }));
    data = body;
  } else if (path.endsWith("/invites")) data = [];
  else if (/^\/organizations\/org-\d+$/.test(path)) {
    const item = organizations.find(
      (item) => item.organization.id === path.split("/").at(-1),
    );
    data = {
      ...item.organization,
      role: item.role,
      plantations: farms
        .filter((farm) => farm.organizationId === item.organization.id)
        .map(({ id, name }) => ({ id, name })),
    };
  } else if (path.endsWith("/alerts/settings")) {
    if (method === "PATCH") Object.assign(settings, body);
    data = settings;
  }
  else if (path.includes("/notifications"))
    data = { data: [], unread: 0, total: 0, page: 1, limit: 20, totalPages: 0 };
  else if (path.endsWith("/sensors/latest") || path.endsWith("/alerts"))
    data = [];
  else if (method !== "OPTIONS")
    throw new Error(`Unexpected fixture request: ${method} ${path}`);
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "authorization,content-type",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    },
    body: JSON.stringify(data),
  });
});
const visible = async (locator) => {
  await locator.waitFor({ state: "visible" });
  assert.equal(await locator.isVisible(), true);
};
// The sidebar switcher lists organizations by name.
const selectOrganization = async (id) => {
  const name = organizations.find((item) => item.organization.id === id).organization.name;
  await page.getByRole("button", { name: /^Selecionar organização/ }).click();
  await page.locator("li").getByRole("button", { name: new RegExp(`^${name} `) }).click();
};
try {
  await page.goto(`${origin}/dashboard/equipe`);
  await visible(page.getByRole("heading", { name: "Equipe", exact: true }));
  const colleague = page
    .locator("form")
    .filter({
      has: page.getByRole("heading", { name: "Colega Teste", exact: true }),
    });
  await colleague
    .getByRole("combobox", { name: "Papel" })
    .selectOption("OPERATOR");
  await colleague.getByLabel("Fazenda A1").uncheck();
  await colleague.getByLabel("Fazenda A2").check();
  await colleague.getByRole("button", { name: "Salvar acesso" }).click();
  await visible(page.getByText("Alteração concluída.", { exact: true }));
  const saved = calls.find(
    (call) =>
      call.method === "PATCH" && call.path.endsWith("/members/colleague"),
  );
  assert.deepEqual(saved.body, { role: "OPERATOR", plantationIds: ["farm-1"] });
  const self = page
    .locator("form")
    .filter({
      has: page.getByRole("heading", {
        name: "Proprietário Teste (você)",
        exact: true,
      }),
    });
  await self.getByRole("combobox", { name: "Papel" }).selectOption("VIEWER");
  await self.getByRole("button", { name: "Salvar acesso" }).click();
  await visible(
    page.getByText(
      "A organização deve manter pelo menos um proprietário ativo",
      { exact: true },
    ),
  );
  assert.equal(
    await page.getByText("Alteração concluída.", { exact: true }).count(),
    0,
  );
  await page.getByRole("link", { name: "Plantações", exact: true }).click();
  await page.getByRole("button", { name: "Nova plantação" }).click();
  await page.getByLabel("Nome da plantação").fill("Plantação criada no teste");
  await page
    .getByRole("button", { name: "Criar plantação", exact: true })
    .click();
  await visible(
    page.getByRole("button", { name: /Plantação criada no teste/ }).last(),
  );
  assert.equal(
    calls.find((call) => call.method === "POST" && call.path === "/plantations")
      .body.organizationId,
    "org-0",
  );
  await selectOrganization("org-1");
  await visible(page.getByRole("button", { name: /Fazenda B/ }).last());
  assert.equal(
    await page.getByRole("button", { name: "Nova plantação" }).isDisabled(),
    true,
  );
  assert.equal(
    await page.getByRole("button", { name: /Fazenda A1/ }).count(),
    0,
  );
  await page.goto(`${origin}/dashboard/equipe`);
  await visible(page.getByText("Seu acesso: Visualizador.", { exact: true }));
  assert.equal(
    await page.getByRole("heading", { name: "Convidar participante" }).count(),
    0,
  );
  assert.equal(
    await page.getByRole("button", { name: "Salvar acesso" }).count(),
    0,
  );
  await page.goto(`${origin}/dashboard/configuracoes/alertas`);
  await visible(
    page.getByText("Seu perfil pode consultar estas regras.", { exact: false }),
  );
  assert.equal(
    await page.getByRole("button", { name: /Salvar/ }).count(),
    0,
  );
  await selectOrganization("org-2");
  await page.getByRole("button", { name: /Salvar/ }).waitFor();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (button) => /Salvar/.test(button.textContent) && !button.disabled,
    ),
  );
  await page.getByLabel("Tempo sem leitura").fill("20");
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await visible(page.getByText("Configurações salvas. As próximas leituras usarão estes limites.", { exact: true }));
  assert.equal(calls.find(call => call.method === "PATCH" && call.path === "/plantations/farm-3/alerts/settings").body.offlineAfterMinutes, 20);
  await page.goto(`${origin}/dashboard/equipe`);
  await selectOrganization("org-3");
  await visible(
    page.getByText(
      "Nenhuma plantação atribuída. Solicite acesso ao proprietário.",
      { exact: true },
    ),
  );
  assert.equal(new URL(page.url()).pathname, "/dashboard/equipe");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: team roles/assignments, last-owner conflict, scoped farm creation, tenant selection, viewer restrictions, operator alert editing, empty organization and mobile viewport. Backend responses are fixtures.",
  );
} catch (error) {
  console.error("Fixture browser diagnostic:", page.url(), (await page.locator("body").innerText()).slice(-7000), errors, calls.slice(-8));
  throw error;
} finally {
  await browser.close();
}
