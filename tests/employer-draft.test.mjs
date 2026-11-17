import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { employerSections } from "../src/lib/empresa-form.ts";

const source = readFileSync(
  new URL("../src/lib/employer-draft.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});
const exports = {};
runInNewContext(outputText, {
  exports,
  require() {
    return { employerSections };
  },
});
const { readEmployerDraft, writeEmployerDraft, removeEmployerDraft } = exports;
function storage() {
  const items = new Map();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
  };
}

test("restores partially entered information, including empty edited fields, after reload", () => {
  const tab = storage();
  assert.equal(
    writeEmployerDraft(tab, "user:company", {
      nombres: "José",
      nombreComercial: "Sin terminar",
      codigoPostal: "01234",
      correoGeneral: "",
      descripcion: "Línea 1\nLínea 2",
    }),
    true,
  );
  const restored = readEmployerDraft(tab, "user:company");
  assert.equal(restored.nombres, "José");
  assert.equal(restored.codigoPostal, "01234");
  assert.equal(restored.correoGeneral, "");
  assert.equal(restored.descripcion, "Línea 1\nLínea 2");
});
test("drafts are separate for each account and employer; successful save removes only its draft", () => {
  const tab = storage();
  writeEmployerDraft(tab, "user1:new", { nombres: "Nuevo" });
  writeEmployerDraft(tab, "user1:company1", { nombres: "Edición" });
  assert.equal(readEmployerDraft(tab, "user2:new"), null);
  removeEmployerDraft(tab, "user1:new");
  assert.equal(readEmployerDraft(tab, "user1:new"), null);
  assert.equal(readEmployerDraft(tab, "user1:company1").nombres, "Edición");
});
test("ignores corrupt or obsolete drafts and never stores fields outside the employer form", () => {
  const tab = storage();
  tab.setItem("bad", "not-json");
  assert.equal(readEmployerDraft(tab, "bad"), null);
  tab.setItem(
    "bad",
    JSON.stringify({ version: 99, values: { nombres: "Viejo" } }),
  );
  assert.equal(readEmployerDraft(tab, "bad"), null);
  writeEmployerDraft(tab, "safe", {
    nombres: "Prueba",
    password: "do-not-store",
    token: "do-not-store",
  });
  assert.equal(tab.getItem("safe").includes("do-not-store"), false);
});
test("unavailable browser storage does not crash the form", () => {
  const blocked = {
    getItem() {
      throw new Error();
    },
    setItem() {
      throw new Error();
    },
    removeItem() {
      throw new Error();
    },
  };
  assert.equal(readEmployerDraft(blocked, "test"), null);
  assert.equal(writeEmployerDraft(blocked, "test", {}), false);
  assert.equal(removeEmployerDraft(blocked, "test"), false);
});
