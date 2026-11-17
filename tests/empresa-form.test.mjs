import { test } from "node:test";
import assert from "node:assert/strict";
import { validateEmployer } from "../src/lib/empresa-form.ts";

function validForm() {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    rfc: "abc010101ab1",
    tipoEmpleador: "PRIVADA",
    nombreComercial: "Empresa de prueba",
    cantidadEempleados: "0",
    ramaActividad: "Servicios",
    correoGeneral: " contacto@example.test ",
    registroPortal: "NO",
    nombres: "Ana",
    apellidos: "Prueba",
    cargo: "Recursos humanos",
    codigoPostal: "01234",
  }))
    form.set(key, value);
  return form;
}

test("accepts zero employees, optional fields and preserves postal code leading zeros", () => {
  const result = validateEmployer(validForm());
  assert.deepEqual(result.errors, {});
  assert.equal(result.values.rfc, "ABC010101AB1");
  assert.equal(result.values.codigoPostal, "01234");
  assert.equal(result.values.correoGeneral, "contacto@example.test");
  assert.equal(result.values.folio, "");
});

test("rejects invalid enum values, fractions and unsafe URLs on the server", () => {
  const form = validForm();
  form.set("tipoEmpleador", "ADMIN");
  form.set("cantidadEempleados", "1.5");
  form.set("paginaWeb", "javascript:alert(1)");
  const { errors } = validateEmployer(form);
  assert.ok(errors.tipoEmpleador);
  assert.ok(errors.cantidadEempleados);
  assert.ok(errors.paginaWeb);
});

test("requires an employer name and mandatory contact information", () => {
  const form = validForm();
  form.set("nombreComercial", " ");
  form.delete("nombres");
  form.set("correoGeneral", "invalid");
  const { errors, values } = validateEmployer(form);
  assert.ok(errors.razonSocial);
  assert.ok(errors.nombres);
  assert.ok(errors.correoGeneral);
  assert.equal(values.cargo, "Recursos humanos");
});

test("accepts 12- and 13-character RFCs and explains a wrong structure separately from length", () => {
  const form = validForm();
  for (const rfc of ["ABC010101AB1", "ABCD010101AB1"]) {
    form.set("rfc", rfc);
    assert.equal(validateEmployer(form).errors.rfc, undefined);
  }
  form.set("rfc", "ABCDEFGHIJKL");
  assert.match(validateEmployer(form).errors.rfc, /longitud correcta/);
  assert.match(validateEmployer(form).errors.rfc, /6 números/);
  form.set("rfc", "ABC123");
  assert.match(validateEmployer(form).errors.rfc, /12 o 13 caracteres/);
});
