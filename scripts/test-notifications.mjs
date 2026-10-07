import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const code = ts.transpileModule(
  readFileSync(
    new URL("../features/notifications/use-notifications.ts", import.meta.url),
    "utf8",
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
const result = (unread, asOf = "2026-10-06T12:00:00.000Z") => ({
  data: [],
  unread,
  total: unread,
  page: 1,
  pageSize: 20,
  asOf,
});

function mount(...args) {
  const plantationId = args.length ? args[0] : "farm-a";
  const values = [],
    requests = [],
    reads = [],
    listeners = new Map(),
    cleanups = [],
    events = [];
  let cursor = 0,
    first = true,
    failure = null,
    hold = null;
  class ApiError extends Error {}
  const jsxExports = {};
  const window = {
    setTimeout: () => 1,
    setInterval: () => 2,
    clearTimeout() {},
    clearInterval() {},
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: (name) => listeners.delete(name),
    dispatchEvent: (event) => {
      events.push(event.type);
      listeners.get(event.type)?.();
    },
  };
  const react = {
    useState: (initial) => {
      const index = cursor++;
      if (!(index in values)) values[index] = initial;
      return [
        values[index],
        (next) => {
          values[index] =
            typeof next === "function" ? next(values[index]) : next;
        },
      ];
    },
    useRef: (initial) => {
      const index = cursor++;
      if (!(index in values)) values[index] = { current: initial };
      return values[index];
    },
    useCallback: (callback) => callback,
    useEffect: (effect) => {
      if (first) cleanups.push(effect());
    },
  };
  const read = async (...args) => {
    reads.push(args);
    if (hold) await hold.promise;
    if (failure) throw new ApiError(failure);
  };
  runInNewContext(code, {
    exports: jsxExports,
    window,
    Event: class {
      constructor(type) {
        this.type = type;
      }
    },
    require: (name) => {
      if (name === "react") return react;
      if (name === "@/shared/api/api-client") return { ApiError };
      if (name === "./notifications-api")
        return {
          listNotifications: (...args) => {
            const d = deferred();
            requests.push({ ...d, args });
            return d.promise;
          },
          readNotification: (...args) => read("one", ...args),
          readAllNotifications: (...args) => read("all", ...args),
        };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  const render = (id = plantationId, page = 1, filter = "all") => {
    cursor = 0;
    const hook = jsxExports.useNotifications(id, page, filter);
    first = false;
    return hook;
  };
  render();
  const load = async (data = result(2)) => {
    const promise = render().reload();
    requests.at(-1).resolve(data);
    await promise;
    return render();
  };
  return {
    render,
    load,
    requests,
    reads,
    events,
    fail: (message) => {
      failure = message;
    },
    hold: () => {
      hold = deferred();
      return hold;
    },
    unmount: () => cleanups.forEach((cleanup) => cleanup?.()),
  };
}

test("notificações: resposta antiga não sobrescreve uma atualização mais recente", async () => {
  const h = mount();
  const old = h.render().reload();
  const fresh = h.render().reload();
  h.requests[1].resolve(result(1));
  await fresh;
  h.requests[0].resolve(result(9));
  await old;
  assert.equal(h.render().data.unread, 1);
});
test("notificações: falha antiga não substitui sucesso atual", async () => {
  const h = mount();
  const old = h.render().reload();
  const fresh = h.render().reload();
  h.requests[1].resolve(result(1));
  await fresh;
  h.requests[0].reject(new Error("antiga"));
  await old;
  assert.equal(h.render().error, null);
});
test("notificações: troca de plantação, página ou filtro não exibe dados do contexto anterior", async () => {
  const h = mount();
  await h.load();
  assert.equal(h.render("farm-b").data, null);
  assert.equal(h.render("farm-a", 2).data, null);
  assert.equal(h.render("farm-a", 1, "unread").data, null);
});
test("notificações: desmontar invalida respostas pendentes", async () => {
  const h = mount();
  const pending = h.render().reload();
  h.unmount();
  h.requests[0].resolve(result(4));
  await pending;
  assert.equal(h.render().data, null);
});
test("notificações: marcar todas usa referência do servidor e atualiza o sino", async () => {
  const h = mount();
  const hook = await h.load(result(2));
  assert.equal(await hook.markRead(), true);
  assert.deepEqual(h.reads[0], ["all", "farm-a", "2026-10-06T12:00:00.000Z"]);
  assert.deepEqual(h.events, ["techsoil:notifications-updated"]);
});
test("notificações: falha ao marcar não informa sucesso nem altera contador", async () => {
  const h = mount();
  const hook = await h.load();
  h.fail("Sem permissão");
  assert.equal(await hook.markRead("personal-id"), false);
  assert.equal(h.render().data.unread, 2);
  assert.equal(h.render().error, "Sem permissão");
  assert.equal(h.events.length, 0);
  assert.equal(h.render().busy, false);
});
test("notificações: evita marcação duplicada e polling durante uma alteração", async () => {
  const h = mount();
  const hook = await h.load();
  const hold = h.hold();
  const first = hook.markRead("personal-id");
  assert.equal(await hook.markRead("personal-id"), false);
  const count = h.requests.length;
  await h.render().reload();
  assert.equal(h.requests.length, count);
  hold.resolve();
  await first;
  assert.equal(h.reads.length, 1);
});
test("notificações: sem plantação não consulta API nem marca notificações", async () => {
  const h = mount(undefined);
  await h.render(undefined).reload();
  assert.equal(await h.render(undefined).markRead(), false);
  assert.equal(h.requests.length, 0);
});
