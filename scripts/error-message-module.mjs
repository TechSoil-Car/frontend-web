// Carrega o helper real shared/api/error-message.ts nos testes, com o ApiError simulado do teste.
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const code = ts.transpileModule(
  readFileSync(new URL("../shared/api/error-message.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

export function errorMessageModule(ApiError) {
  const exports = {};
  runInNewContext(code, {
    exports,
    require: (name) => {
      if (name === "./api-client") return { ApiError };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  return exports;
}
