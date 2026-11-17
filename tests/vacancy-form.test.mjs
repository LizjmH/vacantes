import { test } from "node:test";
import assert from "node:assert/strict";
import {
  monthAfter,
  validDate,
  vacancyStatus,
  validateVacancy,
  workDaysLabel,
  changeVacancyValue,
} from "../src/lib/vacancy-form.ts";

test("monthly expiration clamps to the last valid day, including leap years and year changes", () => {
  assert.equal(monthAfter("2026-01-31"), "2026-02-28");
  assert.equal(monthAfter("2028-01-31"), "2028-02-29");
  assert.equal(monthAfter("2026-12-12"), "2027-01-12");
  assert.equal(monthAfter("bad"), "");
  assert.equal(validDate("2026-02-29"), false);
});

test("workday mask preserves selected weekdays and rejects invalid numbers", () => {
  const data = form();
  data.set("diasTrabajo", "45");
  assert.equal(workDaysLabel("45"), "Lunes, Miércoles, Jueves, Sábado");
  assert.equal(
    workDaysLabel("63"),
    "Lunes, Martes, Miércoles, Jueves, Viernes, Sábado",
  );
  assert.deepEqual(validateVacancy(data).errors, {});
  for (const bad of ["128", "-1", "1.5", "abc"]) {
    data.set("diasTrabajo", bad);
    assert.ok(validateVacancy(data).errors.diasTrabajo);
  }
});

test("catalog values and whole hours are validated on the server", () => {
  const data = form();
  for (const key of ["escolaridad", "experiencia", "tiempoReclutamiento"])
    data.set(key, "INVALID");
  data.set("horaInicio", "07:42");
  const { errors } = validateVacancy(data);
  for (const key of [
    "escolaridad",
    "experiencia",
    "tiempoReclutamiento",
    "horaInicio",
  ])
    assert.ok(errors[key]);
  data.set("aceptaDiscapacidad", "SI");
  data.set("tipoDiscapacidad", "VISUAL");
  assert.equal(validateVacancy(data).values.tipoDiscapacidad, "VISUAL");
});

test("start dates update automatic expiration and preserve manual expiration", () => {
  const initial = { fechaReinicio: "2026-01-31", fechaFin: "2026-02-28" };
  assert.equal(
    changeVacancyValue(initial, "fechaReinicio", "2026-03-31").fechaFin,
    "2026-04-30",
  );
  const manual = changeVacancyValue(initial, "fechaFin", "2026-05-10");
  assert.equal(
    changeVacancyValue(manual, "fechaReinicio", "2026-02-01").fechaFin,
    "2026-05-10",
  );
});
test("expiration includes the final day and distinguishes scheduled, covered and archived offers", () => {
  const row = {
    archivada: false,
    cubierta: false,
    fechaReinicio: new Date("2026-11-01T00:00:00Z"),
    fechaFin: new Date("2026-11-12T00:00:00Z"),
  };
  assert.equal(vacancyStatus(row, "2026-11-12"), "Por vencer");
  assert.equal(vacancyStatus(row, "2026-11-13"), "Vencida");
  assert.equal(vacancyStatus(row, "2026-10-31"), "Programada");
  assert.equal(
    vacancyStatus({ ...row, cubierta: true }, "2026-11-13"),
    "Cubierta",
  );
  assert.equal(
    vacancyStatus({ ...row, archivada: true }, "2026-11-13"),
    "Archivada",
  );
});
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    puesto: "Auxiliar",
    plazas: "2",
    sueldoMensual: "10000.50",
    fechaReinicio: "2026-11-12",
    fechaFin: "2026-12-12",
    sexo: "INDISTINTO",
    experiencia: "NINGUNA",
    descripcionPuesto: "Atención",
    conocimientos: "Básicos",
    prestaciones: "De ley",
    tiempoReclutamiento: "UN_MES",
  }))
    data.set(key, value);
  return data;
}
test("validates manual dates, whole plazas, precise salary, ages and enum values", () => {
  const data = form();
  assert.deepEqual(validateVacancy(data).errors, {});
  data.set("fechaFin", "2026-11-11");
  data.set("plazas", "1.5");
  data.set("sueldoMensual", "1e4");
  data.set("sexo", "INVALID");
  data.set("edadMinima", "40");
  data.set("edadMaxima", "20");
  const { errors } = validateVacancy(data);
  for (const key of [
    "fechaFin",
    "plazas",
    "sueldoMensual",
    "sexo",
    "edadMaxima",
  ])
    assert.ok(errors[key]);
});
test("overnight schedules are valid and unchecked contact options stay unselected", () => {
  const data = form();
  data.set("horaInicio", "22:00");
  data.set("horaFin", "06:00");
  data.set("tipoDiscapacidad", "MOTORA");
  data.set("aceptaDiscapacidad", "NO");
  const { values, errors } = validateVacancy(data);
  assert.deepEqual(errors, {});
  assert.equal(values.tipoDiscapacidad, "");
  assert.equal(values.medio_CORREO, "NO");
});
