import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Transpila um arquivo do projeto e o executa com as dependências resolvidas por `resolve`.
function load(path, resolve) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  runInNewContext(code, { exports, encodeURIComponent, require: (name) => {
    const dependency = resolve(name);
    if (!dependency) throw new Error(`Unexpected dependency: ${name}`);
    return dependency;
  }});
  return exports;
}

function mount(action, fail = false) {
  const states = [], calls = [], successes = [];
  let cursor = 0;
  class ApiError extends Error {}
  const jsx = (type, props) => ({type, props});
  const apiClient = {ApiError, apiRequest: async (...args) => {calls.push(args); if (fail) throw new ApiError("A conta foi alterada."); return {message: "Ação concluída"}; }};
  // Serviço e mensagem de erro reais; só a chamada HTTP é simulada.
  const service = load("../features/admin/services/admin-api.ts", name => name === "@/shared/api/api-client" && apiClient);
  const errors = load("../shared/api/error-message.ts", name => name === "./api-client" && apiClient);
  const exports = load("../features/admin/components/account-action-dialog/AccountActionDialog.tsx", name => {
    if (name === "react") return {useState: initial => { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], next => {states[index] = next;}]; }};
    if (name === "react/jsx-runtime") return {jsx, jsxs: jsx};
    if (name === "@/shared/components/modal/Modal") return {Modal: "modal"};
    if (name.endsWith(".module.css")) return {default: {}};
    if (name === "@/shared/api/error-message") return errors;
    if (name === "../../services/admin-api") return service;
  });
  const render = () => {cursor = 0; return exports.AccountActionDialog({account: {id: "account-id", name: "Equipe", email: "equipe@example.test"}, action, onClose: () => {}, onSuccess: message => successes.push(message)});};
  function find(node, type) {
    if (!node || typeof node !== "object") return null;
    if (node.type === type) return node;
    for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, type); if (result) return result; }
    return null;
  }
  const confirm = value => find(render(), "input").props.onChange({target: {value}});
  const submit = () => find(render(), "form").props.onSubmit({preventDefault() {}});
  return {confirm, submit, states, calls, successes};
}

for (const action of ["block", "unblock", "revoke-sessions"]) {
  test(`${action}: exige confirmação do e-mail correto`, async () => {
    const h = mount(action);
    h.confirm("outro@example.test");
    await h.submit();
    assert.equal(h.calls.length, 0);
    h.confirm(" EQUIPE@example.test ");
    await h.submit();
    assert.equal(h.calls[0][0], `/admin/users/account-id/${action}`);
    assert.equal(h.calls[0][1].method, "POST");
    assert.equal(h.calls[0][1].body, undefined);
    assert.deepEqual(h.successes, ["Ação concluída"]);
  });
  test(`${action}: falha mantém o diálogo sem informar sucesso`, async () => {
    const h = mount(action, true);
    h.confirm("equipe@example.test");
    await h.submit();
    assert.equal(h.successes.length, 0);
    assert.equal(h.states[1], false);
    assert.equal(h.states[2], "A conta foi alterada.");
  });
}
