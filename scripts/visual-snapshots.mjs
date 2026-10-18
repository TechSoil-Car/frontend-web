// Prints de referência do painel e das telas de acesso para a refatoração (P1-06).
// Backend, mapa e satélite são simulados e o relógio é fixo, para que duas capturas
// do mesmo código sejam iguais. Nenhum email ou banco real é usado.
//
// Inicie `pnpm build` e `pnpm start --port 3300` antes. Depois:
//   node scripts/visual-snapshots.mjs capture .visual/antes
//   node scripts/visual-snapshots.mjs compare .visual/antes .visual/depois
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { crc32, deflateSync } from "node:zlib";
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.TECHSOIL_PLAYWRIGHT_MODULE || "playwright",
);
const origin = process.env.TECHSOIL_TEST_ORIGIN || "http://localhost:3300";
const api = "http://localhost:3001";
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname), "A captura exige frontend local.");

const launch = () => chromium.launch({
  headless: true,
  ...(process.env.TECHSOIL_BROWSER_CHANNEL ? { channel: process.env.TECHSOIL_BROWSER_CHANNEL } : {}),
});

// 15/10/2026 12:00 em Brasília.
const NOW = Date.UTC(2026, 9, 15, 15, 0, 0);
const iso = (msAgo = 0) => new Date(NOW - msAgo).toISOString();

const owner = { id: "u1", name: "Carlos Mendes", email: "carlos@boavista.agr.br", systemRole: "USER" };
const superadmin = { id: "u0", name: "Admin TechSoil", email: "admin@techsoil.test", systemRole: "SUPERADMIN" };
const org = { id: "org-1", name: "Agro Boa Vista", createdAt: iso(9e9) };

// Fazenda em Rio Verde (GO). Polígonos em [lng, lat].
const C = { lat: -17.955, lng: -51.105 };
const box = (x0, y0, x1, y1) => ({
  type: "Polygon",
  coordinates: [[
    [C.lng + x0, C.lat + y0], [C.lng + x1, C.lat + y0],
    [C.lng + x1, C.lat + y1], [C.lng + x0, C.lat + y1], [C.lng + x0, C.lat + y0],
  ]],
});
const farmFor = (role) => ({
  id: "farm-1", organizationId: org.id, role, name: "Fazenda Boa Vista",
  location: "Rio Verde, GO", createdAt: iso(9e9),
  centerLatitude: C.lat, centerLongitude: C.lng, mapZoom: 15,
  boundaryGeoJson: box(-0.0085, -0.006, 0.0085, 0.006), areaHectares: 236,
});
const plots = [
  ["Talhão 01 · Soja", "#a6dd62", box(-0.008, 0.0005, -0.0005, 0.0055), 62],
  ["Talhão 02 · Soja", "#73b640", box(0.0005, 0.0005, 0.008, 0.0055), 61],
  ["Talhão 03 · Milho", "#e8b04a", box(-0.008, -0.0055, -0.0005, -0.0005), 58],
  ["Talhão 04 · Milho", "#4f9dde", box(0.0005, -0.0055, 0.008, -0.0005), 55],
].map(([name, color, boundaryGeoJson, areaHectares], i) => ({
  id: `plot-${i + 1}`, name, color, boundaryGeoJson, areaHectares,
  plantationId: "farm-1", createdAt: iso(8e9), updatedAt: iso(8e9),
}));
const sensorSpots = [
  [-0.006, 0.004], [-0.0025, 0.0018], [0.003, 0.0042], [0.0062, 0.0016],
  [-0.0058, -0.0021], [-0.002, -0.0044], [0.0028, -0.0019], [0.0064, -0.0043],
];
const devices = sensorSpots.map((_, i) => ({
  id: `dev-${i + 1}`, deviceId: `TS-${101 + i}`, type: "SENSOR",
  name: `Sensor ${String(i + 1).padStart(2, "0")}`, plantationId: "farm-1", createdAt: iso(8e9),
}));
const reading = (i, msAgo = 0, jitter = 0) => ({
  id: `r-${i}-${msAgo}`, readingId: `r-${i}-${msAgo}`, deviceId: devices[i].deviceId,
  timestamp: iso(msAgo + 60_000 * (i + 1)),
  moisture: +(i === 5 ? 17.8 : 58 + ((i * 7) % 9) + jitter).toFixed(1),
  temperature: +(23.5 + ((i * 3) % 4) * 0.6 + jitter * 0.3).toFixed(1),
  ph: +(i === 2 ? 5.2 : 6.0 + ((i * 5) % 6) * 0.1).toFixed(1),
  electricalConductivity: +(1.1 + ((i * 2) % 5) * 0.08).toFixed(2),
  nitrogen: 38 + ((i * 11) % 14) + Math.round(jitter * 2),
  phosphorus: 16 + ((i * 5) % 7),
  potassium: 140 + ((i * 13) % 30),
  batteryPercentage: i === 7 ? 18 : 64 + ((i * 9) % 30),
  batteryVoltage: 3.9, charging: i % 3 === 0,
  latitude: C.lat + sensorSpots[i][1], longitude: C.lng + sensorSpots[i][0], createdAt: iso(msAgo),
});
const latest = devices.map((device, i) => ({ device, reading: reading(i) }));
const history = (i) => ({
  data: Array.from({ length: 48 }, (_, k) => reading(i, k * 3600_000, Math.sin(k / 5) * 2)),
  nextCursor: null,
});
const alerts = [
  { id: "a1", kind: "ph_out_of_range", severity: "warning", title: "pH fora da faixa",
    message: "pH 5,2 abaixo do mínimo configurado (5,5).", occurredAt: iso(26 * 60_000),
    readingId: "r-2-0", device: devices[2] },
  { id: "a2", kind: "low_moisture", severity: "critical", title: "Umidade baixa",
    message: "Umidade 17,8% abaixo do mínimo configurado (20%).", occurredAt: iso(52 * 60_000),
    readingId: "r-5-0", device: devices[5] },
  { id: "a3", kind: "low_battery", severity: "warning", title: "Bateria baixa",
    message: "Bateria em 18%. Programe a troca.", occurredAt: iso(3 * 3600_000),
    readingId: "r-7-0", device: devices[7] },
];
const settings = {
  plantationId: "farm-1", noDataEnabled: true, offlineEnabled: true, offlineAfterMinutes: 15,
  lowBatteryEnabled: true, lowBatteryPercentage: 20, moistureEnabled: true, moistureMin: 20,
  moistureMax: 45, temperatureEnabled: false, temperatureMin: null, temperatureMax: null,
  phEnabled: true, phMin: 5.5, phMax: 7, updatedAt: iso(9e8),
};
const notifications = alerts.map((alert, i) => ({
  id: `n${i + 1}`, createdAt: alert.occurredAt, readAt: i === 2 ? iso(2 * 3600_000) : null,
  emailStatus: i === 1 ? "sent" : "disabled", emailSentAt: i === 1 ? alert.occurredAt : null,
  event: {
    id: alert.id, deviceId: alert.device.deviceId, deviceName: alert.device.name, kind: alert.kind,
    severity: alert.severity, title: alert.title, message: alert.message, detectedAt: alert.occurredAt,
    readingAt: alert.occurredAt, resolvedAt: null,
  },
}));
const members = [
  [owner, "OWNER"],
  [{ id: "u2", name: "Juliana Prado", email: "juliana@boavista.agr.br" }, "OPERATOR"],
  [{ id: "u3", name: "Rafael Souza", email: "rafael@boavista.agr.br" }, "VIEWER"],
].map(([user, role], i) => ({
  id: `m${i + 1}`, role, joinedAt: iso(8e9 - i * 1e9),
  user: { id: user.id, name: user.name, email: user.email, plantations: [{ plantationId: "farm-1" }] },
}));
const invites = [
  { id: "i1", name: "Marcos Lima", email: "marcos@boavista.agr.br", role: "OPERATOR", expiresAt: iso(-5 * 86_400_000) },
];
const page1 = (data) => ({ data, total: data.length, page: 1, pageSize: 20 });
const admin = {
  overview: { users: 4, activeUsers: 3, plantations: 1, pendingInvites: 1 },
  users: page1([owner, superadmin].map((user) => ({
    ...user, activatedAt: iso(9e9), blockedAt: null,
    plantations: user.systemRole === "USER" ? [{ role: "OWNER", plantation: { id: "farm-1", name: "Fazenda Boa Vista" } }] : [],
  }))),
  plantations: page1([{ id: "farm-1", name: "Fazenda Boa Vista", location: "Rio Verde, GO", _count: { members: 3, devices: 8 } }]),
  invites: page1([{ ...invites[0], acceptedAt: null, plantation: { id: "farm-1", name: "Fazenda Boa Vista" } }]),
};

// Cada persona define quem está logado (ou ninguém) e o papel na organização.
const personas = {
  owner: { user: owner, role: "OWNER" },
  viewer: { user: { ...owner, id: "u3", name: "Rafael Souza", email: "rafael@boavista.agr.br" }, role: "VIEWER" },
  superadmin: { user: superadmin, role: null },
  anonymous: { user: null, role: null },
};

function respond(persona, path, method, url) {
  const { user, role } = personas[persona];
  if (path === "/auth/refresh")
    return user ? [200, { access_token: "visual-fixture", user }] : [401, { statusCode: 401, message: "Sessão expirada" }];
  if (path === "/invites/preview")
    return [200, { name: "Marcos Lima", email: "marcos@boavista.agr.br", plantationName: "Fazenda Boa Vista", requiresActivation: true }];
  if (!user) return [401, { statusCode: 401, message: "Sessão expirada" }];
  if (path === "/users/me") return [200, user];
  if (path.startsWith("/admin/")) return [200, admin[path.split("/")[2]]];
  const farms = role ? [farmFor(role)] : [];
  if (path === "/organizations") return [200, role ? [{ role, organization: org }] : []];
  if (path === `/organizations/${org.id}`) return [200, { ...org, role, plantations: farms.map(({ id, name }) => ({ id, name })) }];
  if (path.endsWith("/members")) return [200, members];
  if (path.endsWith("/invites")) return [200, invites];
  if (path === "/plantations") return [200, farms];
  if (path === "/plantations/farm-1") return [200, farms[0]];
  if (path.endsWith("/sensors/latest")) return [200, latest];
  if (path.endsWith("/alerts/settings")) return [200, settings];
  if (path.endsWith("/alerts")) return [200, alerts];
  if (path.endsWith("/plots")) return [200, plots];
  if (path.endsWith("/rows")) return [200, []];
  const sensor = path.match(/\/sensors\/([^/]+)\/readings$/);
  if (sensor) return [200, history(Math.max(0, devices.findIndex((d) => d.deviceId === decodeURIComponent(sensor[1]))))];
  if (path.endsWith("/notifications/preferences")) return [200, { alertEmailsEnabled: true }];
  if (path.includes("/notifications")) {
    const unread = notifications.filter((n) => !n.readAt);
    const list = url.searchParams.get("filter") === "unread" ? unread : notifications;
    return [200, { data: list, total: list.length, unread: unread.length, page: 1, pageSize: 20, asOf: iso() }];
  }
  return null;
}

// Mapa vetorial e satélite substituídos por conteúdo fixo: a captura não depende da rede.
const mapStyle = {
  version: 8, sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#e7e3d6" } }],
};
function solidPng(size, [r, g, b]) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: size }, () => [r, g, b]).flat())]);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header), chunk("IDAT", deflateSync(Buffer.concat(Array(size).fill(row)))), chunk("IEND", Buffer.alloc(0)),
  ]);
}
const satelliteTile = solidPng(256, [74, 104, 62]);

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };
const screens = [
  ["visao-geral", "owner", "/dashboard"],
  ["mapa", "owner", "/dashboard/mapa"],
  ["mapa-satelite", "owner", "/dashboard/mapa", (page) => page.getByRole("button", { name: "Satélite" }).click()],
  ["sensores", "owner", "/dashboard/sensores"],
  ["sensores-historico", "owner", "/dashboard/sensores", (page) => page.getByRole("button", { name: "Histórico", exact: true }).click()],
  ["sensores-alertas", "owner", "/dashboard/sensores", (page) => page.getByRole("button", { name: "Alertas", exact: true }).click()],
  ["alertas", "owner", "/dashboard/alertas"],
  ["alertas-configuracao", "owner", "/dashboard/configuracoes/alertas"],
  ["notificacoes", "owner", "/dashboard/notificacoes"],
  ["plantacoes", "owner", "/dashboard/plantacoes"],
  ["equipe", "owner", "/dashboard/equipe"],
  ["perfil", "owner", "/dashboard/perfil"],
  ["equipe-visualizador", "viewer", "/dashboard/equipe"],
  ["alertas-configuracao-visualizador", "viewer", "/dashboard/configuracoes/alertas"],
  ["admin", "superadmin", "/dashboard/admin"],
  ["login", "anonymous", "/login"],
  ["convite", "anonymous", "/accept-invite?token=visual-fixture"],
  ["esqueci-senha", "anonymous", "/forgot-password"],
  ["redefinir-senha", "anonymous", "/reset-password#token=visual-fixture"],
];

async function capture(outDir) {
  mkdirSync(outDir, { recursive: true });
  const browser = await launch();
  const problems = [];
  try {
    for (const [name, persona, route, action] of screens) {
      for (const [suffix, viewport] of [["desktop", desktop], ["celular", mobile]]) {
        const context = await browser.newContext({
          viewport, deviceScaleFactor: 1, locale: "pt-BR",
          timezoneId: "America/Sao_Paulo", reducedMotion: "reduce",
        });
        await context.clock.setFixedTime(NOW);
        await context.route("**/*", async (r) => {
          const request = r.request();
          const url = new URL(request.url());
          if (url.origin === origin) return r.continue();
          const cors = {
            "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "authorization,content-type",
            "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
          };
          if (url.origin === api) {
            if (request.method() === "OPTIONS") return r.fulfill({ status: 204, headers: cors });
            const result = respond(persona, url.pathname, request.method(), url);
            if (!result) problems.push(`${name}: rota sem fixture ${request.method()} ${url.pathname}`);
            const [status, data] = result ?? [404, { statusCode: 404 }];
            return r.fulfill({ status, contentType: "application/json", headers: cors, body: JSON.stringify(data) });
          }
          if (url.hostname === "tiles.openfreemap.org") return r.fulfill({ contentType: "application/json", body: JSON.stringify(mapStyle) });
          if (url.hostname === "server.arcgisonline.com") return r.fulfill({ contentType: "image/png", body: satelliteTile });
          if (url.hostname === "nominatim.openstreetmap.org") return r.fulfill({ contentType: "application/json", body: "[]" });
          problems.push(`${name}: origem externa bloqueada ${url.origin}`);
          return r.abort();
        });
        const page = await context.newPage();
        page.on("pageerror", (error) => problems.push(`${name}: ${error.message}`));
        await page.goto(origin + route, { waitUntil: "networkidle", timeout: 60_000 });
        if (action) {
          await action(page);
          await page.waitForLoadState("networkidle");
        }
        await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
        await page.evaluate(() => document.fonts.ready);
        // Tempo para o MapLibre desenhar e o painel trocar o estado de carregamento.
        await page.waitForTimeout(2500);
        await page.screenshot({ path: join(outDir, `${name}-${suffix}.png`), fullPage: true, animations: "disabled" });
        await context.close();
      }
      console.log("salvo", name);
    }
  } finally {
    await browser.close();
  }
  if (problems.length) console.log("Avisos:\n" + [...new Set(problems)].join("\n"));
}

// Compara pixel a pixel no próprio navegador, sem dependência nova; grava as diferenças em vermelho.
async function compare(beforeDir, afterDir) {
  const diffDir = join(afterDir, "diferencas");
  mkdirSync(diffDir, { recursive: true });
  const browser = await launch();
  const page = await browser.newPage();
  const changed = [];
  try {
    for (const file of readdirSync(beforeDir).filter((name) => name.endsWith(".png")).sort()) {
      let after;
      try { after = readFileSync(join(afterDir, file)); } catch { changed.push(`${file}: não existe na nova captura`); continue; }
      const before = readFileSync(join(beforeDir, file));
      if (before.equals(after)) continue;
      const result = await page.evaluate(async ([a, b]) => {
        const load = async (data) => { const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode(); return image; };
        const [x, y] = await Promise.all([load(a), load(b)]);
        if (x.width !== y.width || x.height !== y.height)
          return { size: `${x.width}x${x.height} → ${y.width}x${y.height}` };
        const pixels = (image) => {
          const canvas = new OffscreenCanvas(image.width, image.height);
          const context = canvas.getContext("2d"); context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, image.width, image.height);
        };
        const p = pixels(x); const q = pixels(y);
        const canvas = new OffscreenCanvas(x.width, x.height);
        const context = canvas.getContext("2d");
        const out = context.createImageData(x.width, x.height);
        let count = 0;
        for (let i = 0; i < p.data.length; i += 4) {
          const delta = Math.abs(p.data[i] - q.data[i]) + Math.abs(p.data[i + 1] - q.data[i + 1]) + Math.abs(p.data[i + 2] - q.data[i + 2]);
          const gray = (p.data[i] + p.data[i + 1] + p.data[i + 2]) / 3;
          if (delta > 24) { count++; out.data.set([255, 0, 0, 255], i); }
          else out.data.set([gray, gray, gray, 64], i);
        }
        context.putImageData(out, 0, 0);
        const blob = await canvas.convertToBlob();
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte);
        return { count, total: p.data.length / 4, diff: btoa(binary) };
      }, [before.toString("base64"), after.toString("base64")]);
      if (result.size) changed.push(`${file}: tamanho mudou (${result.size})`);
      else if (result.count) {
        writeFileSync(join(diffDir, file), Buffer.from(result.diff, "base64"));
        changed.push(`${file}: ${result.count} pixels diferentes (${(100 * result.count / result.total).toFixed(3)}%)`);
      }
    }
  } finally {
    await browser.close();
  }
  if (changed.length) {
    console.log(`DIFERENTE: ${changed.length} print(s)\n${changed.join("\n")}\nImagens em ${diffDir}`);
    process.exitCode = 1;
  } else console.log("IGUAL: nenhuma diferença visual.");
}

const [mode, first, second] = process.argv.slice(2);
if (mode === "capture" && first) await capture(first);
else if (mode === "compare" && first && second) await compare(first, second);
else {
  console.error("Uso: node scripts/visual-snapshots.mjs capture <pasta> | compare <antes> <depois>");
  process.exitCode = 2;
}
