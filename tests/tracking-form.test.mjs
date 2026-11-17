import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { validateTracking } from "../src/lib/tracking-form.ts";
function form() {
  const data = new FormData();
  data.set("solicitudId", randomUUID());
  data.set("resultado", "PENDIENTE");
  return data;
}
test("accepts a pending contact without requiring placement information", () => {
  const { errors, values } = validateTracking(form());
  assert.deepEqual(errors, {});
  assert.equal(values.nombre, "");
});
test("validates results, request identity, maximum lengths and expiration dates", () => {
  const data = form();
  data.set("resultado", "INVALID");
  data.set("solicitudId", "invalid");
  data.set("comentario", "a".repeat(4001));
  let result = validateTracking(data);
  for (const key of ["resultado", "solicitudId", "comentario"])
    assert.ok(result.errors[key]);
  data.set("resultado", "VIGENTE");
  data.set("fechaFin", "2026-02-30");
  assert.ok(validateTracking(data).errors.fechaFin);
});
test("placement information is optional, normalizes CURP and only accompanies covered outcomes", () => {
  const data = form();
  data.set("resultado", "CUBIERTA");
  data.set("nombre", " Persona de prueba ");
  data.set("curp", "gode561231hdfrrn09");
  let result = validateTracking(data);
  assert.equal(result.values.nombre, "Persona de prueba");
  assert.equal(result.values.curp, "GODE561231HDFRRN09");
  assert.deepEqual(result.errors, {});
  data.set("resultado", "VIGENTE");
  result = validateTracking(data);
  assert.equal(result.values.curp, "");
  assert.equal(result.values.nombre, "");
});
test("only available outcomes can change expiration or explicitly reopen a covered vacancy", () => {
  const data = form();
  data.set("fechaFin", "2026-12-31");
  data.set("reabrir", "SI");
  let result = validateTracking(data);
  assert.equal(result.values.fechaFin, "");
  assert.equal(result.values.reabrir, "");
  data.set("resultado", "VIGENTE");
  result = validateTracking(data);
  assert.equal(result.values.fechaFin, "2026-12-31");
  assert.equal(result.values.reabrir, "SI");
});
