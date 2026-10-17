import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const code = ts.transpileModule(
  readFileSync(new URL("../shared/api/api-client.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const user = { id: "u1", name: "Ana", email: "a@x.test", systemRole: "USER" };
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};

/** Loads the client with a fake server answering by path. */
function client(routes) {
  const exports = {};
  const calls = [];
  const events = [];
  runInNewContext(code, {
    exports,
    process: { env: {} },
    Headers,
    Event: class { constructor(type) { this.type = type; } },
    window: { dispatchEvent: (event) => events.push(event.type) },
    fetch: async (url, init = {}) => {
      const path = new URL(url).pathname;
      const authorization = new Headers(init.headers).get("Authorization");
      calls.push({ path, authorization });
      const [status, body] = await routes[path]({ authorization });
      if (status === 0) throw new TypeError("Failed to fetch");
      return new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
    },
  });
  return { ...exports, calls, events, count: (path) => calls.filter((c) => c.path === path).length };
}
const protectedRoute = ({ authorization }) => authorization === "Bearer new" ? [200, { ok: true }] : [401, { message: "Unauthorized" }];

test("401 concorrentes compartilham uma renovação e repetem com o novo token", async () => {
  const gate = deferred();
  const c = client({
    "/plantations": protectedRoute,
    "/organizations": protectedRoute,
    "/auth/refresh": async () => { await gate.promise; return [200, { access_token: "new", user }]; },
  });
  c.setAccessToken("old");
  const pending = Promise.all([c.apiRequest("/plantations"), c.apiRequest("/organizations"), c.refreshSession()]);
  await new Promise((r) => setTimeout(r, 10));
  gate.resolve();
  const [a, b, restored] = await pending;
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.equal(restored.status, "renewed");
  assert.equal(c.count("/auth/refresh"), 1);
  assert.deepEqual(c.events, []);
});

test("renovação recusada encerra a sessão", async () => {
  const c = client({ "/plantations": protectedRoute, "/auth/refresh": () => [401, {}] });
  c.setAccessToken("revoked");
  await assert.rejects(c.apiRequest("/plantations"), (error) => error.status === 401);
  assert.deepEqual(c.events, ["techsoil:session-expired"]);
  // The stale token is not sent again.
  await assert.rejects(c.apiRequest("/plantations"));
  assert.equal(c.calls.at(-1).path, "/auth/refresh");
});

for (const [label, status] of [["limite (429)", 429], ["erro do servidor (503)", 503], ["falha de rede", 0]]) {
  test(`${label} na renovação não desloga e informa indisponibilidade`, async () => {
    const c = client({ "/plantations": protectedRoute, "/auth/refresh": () => [status, {}] });
    c.setAccessToken("old");
    assert.equal((await c.refreshSession()).status, "unavailable");
    await assert.rejects(c.apiRequest("/plantations"), (error) => error.status === 503 && /indisponível/.test(error.message));
    assert.deepEqual(c.events, []);
  });
}

test("requisição repetida após renovação não renova de novo", async () => {
  const c = client({ "/plantations": () => [401, {}], "/auth/refresh": () => [200, { access_token: "new", user }] });
  c.setAccessToken("old");
  await assert.rejects(c.apiRequest("/plantations"), (error) => error.status === 401);
  assert.equal(c.count("/auth/refresh"), 1);
  assert.equal(c.count("/plantations"), 2);
});
