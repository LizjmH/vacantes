// All test data is rolled back. Run with tsx --conditions=react-server.
import "dotenv/config";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { prisma } from "../src/lib/prisma";
import { Prisma } from "../src/generated/prisma/client";
import * as helpers from "../src/lib/vacancy-form";
import type * as Service from "../src/services/vacante.service";

const rollback = new Error("ROLLBACK_TEST");
let employerId: string | undefined;
try {
  await prisma.$transaction(
    async (tx) => {
      const proxy = new Proxy(tx, {
        get(target, key) {
          if (key === "$transaction")
            return (callback: (db: typeof tx) => unknown) => callback(tx);
          return Reflect.get(target, key);
        },
      });
      const exports = {};
      const { outputText } = ts.transpileModule(
        readFileSync(
          new URL("../src/services/vacante.service.ts", import.meta.url),
          "utf8",
        ),
        {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
          },
        },
      );
      runInNewContext(outputText, {
        exports,
        Date,
        require(name: string) {
          if (name === "server-only") return {};
          if (name === "@/lib/prisma") return { prisma: proxy };
          if (name === "@/generated/prisma/client") return { Prisma };
          if (name === "@/lib/vacancy-form") return helpers;
          throw new Error(name);
        },
      });
      const api = exports as typeof Service;
      const employer = await tx.empresa.create({
        data: {
          rfc: `ZZZ010101${randomBytes(2).toString("hex").slice(0, 3).toUpperCase()}`,
          tipoEmpleador: "PRIVADA",
          nombreComercial: "PRUEBA VACANTES TEMPORAL",
          cantidadEempleados: 1,
          ramaActividad: "Prueba",
          correoGeneral: "prueba@example.test",
          registroPortal: "NO",
          contacto: {
            create: {
              nombres: "Temporal",
              apellidos: "Prueba",
              cargo: "Contacto",
            },
          },
          domicilio: { create: {} },
        },
      });
      employerId = employer.id;
      const data = new FormData();
      const today = helpers.todayInMexico();
      for (const [key, value] of Object.entries({
        puesto: "Auxiliar temporal",
        plazas: "2",
        sueldoMensual: "10000.50",
        fechaReinicio: today,
        fechaFin: helpers.monthAfter(today),
        sexo: "INDISTINTO",
        experiencia: "NINGUNA",
        descripcionPuesto: "Prueba",
        conocimientos: "Prueba",
        prestaciones: "Prueba",
        tiempoReclutamiento: "UN_MES",
        escolaridad: "BACHILLERATO",
        diasTrabajo: "45",
        horaInicio: "07:00",
        horaFin: "15:00",
        medio_CORREO: "SI",
        horario_CORREO: "9 a 14",
      }))
        data.set(key, value);
      const { values, errors } = helpers.validateVacancy(data);
      assert.equal(Object.keys(errors).length, 0);
      const created = await api.saveVacancy(
        { empresaId: employer.id },
        values,
        "test-user",
        false,
      );
      assert.ok(created.savedId);
      const original = await tx.vacante.findUniqueOrThrow({
        where: { id: created.savedId },
        include: { mediosContacto: true },
      });
      assert.equal(original.plazas, 2);
      assert.equal(original.escolaridad, "BACHILLERATO");
      assert.equal(original.experiencia, "NINGUNA");
      assert.equal(original.tiempoReclutamiento, "UN_MES");
      assert.equal(original.diasTrabajo, 45);
      assert.equal(api.vacancyValues(original).diasTrabajo, "45");
      assert.equal(original.sueldoMensual.toString(), "10000.5");
      assert.equal(original.mediosContacto.length, 1);
      assert.equal(
        await tx.historialVacante.count({ where: { vacanteId: original.id } }),
        1,
      );
      const warning = await api.saveVacancy(
        { empresaId: employer.id },
        values,
        "test-user",
        false,
      );
      assert.equal(warning.duplicateId, original.id);
      const wrongEmployer = await api.saveVacancy(
        { empresaId: "missing", origenId: original.id },
        values,
        "test-user",
        true,
      );
      assert.ok(wrongEmployer.error);
      await api.saveVacancy(
        { empresaId: employer.id, id: original.id },
        { ...values, plazas: "3", sueldoMensual: "11000" },
        "test-user",
        false,
      );
      const edited = await tx.vacante.findUniqueOrThrow({
        where: { id: original.id },
        include: { mediosContacto: true },
      });
      assert.equal(edited.plazas, 3);
      assert.equal(edited.mediosContacto.length, 1);
      assert.equal(
        await tx.historialVacante.count({ where: { vacanteId: original.id } }),
        2,
      );
      await api.manageVacancy(original.id, "CUBRIR", "test-user");
      await api.manageVacancy(original.id, "CUBRIR", "test-user");
      assert.equal(
        await tx.seguimientoVacante.count({
          where: { vacanteId: original.id },
        }),
        1,
      );
      const copyValues = api.vacancyValues(edited, true);
      assert.equal(copyValues.idSilap, "");
      assert.equal(copyValues.fechaReinicio, today);
      const recycled = await api.saveVacancy(
        { empresaId: employer.id, origenId: original.id },
        { ...copyValues, puesto: "Puesto revisado" },
        "test-user",
        true,
      );
      assert.ok(recycled.savedId);
      assert.notEqual(recycled.savedId, original.id);
      const copy = await tx.vacante.findUniqueOrThrow({
        where: { id: recycled.savedId },
        include: { mediosContacto: true },
      });
      assert.equal(copy.origenVacanteId, original.id);
      assert.equal(copy.cubierta, false);
      assert.equal(copy.archivada, false);
      assert.equal(copy.diasTrabajo, 45);
      assert.equal(copy.horaInicio, "07:00");
      assert.equal(
        await tx.seguimientoVacante.count({ where: { vacanteId: copy.id } }),
        0,
      );
      assert.equal(
        (await tx.vacante.findUniqueOrThrow({ where: { id: original.id } }))
          .puesto,
        "Auxiliar temporal",
      );
      assert.ok(
        (await api.manageVacancy(original.id, "ELIMINAR", "test-user")).error,
      );
      await api.manageVacancy(original.id, "ARCHIVAR", "test-user");
      assert.equal(
        (await tx.vacante.findUniqueOrThrow({ where: { id: original.id } }))
          .archivada,
        true,
      );
      await api.manageVacancy(copy.id, "ELIMINAR", "test-user");
      assert.equal(await tx.vacante.count({ where: { id: copy.id } }), 0);
      assert.equal(
        await tx.medioContactoVacante.count({ where: { vacanteId: copy.id } }),
        0,
      );
      assert.equal(
        await tx.historialVacante.count({ where: { vacanteId: copy.id } }),
        0,
      );
      throw rollback;
    },
    { maxWait: 20000, timeout: 60000 },
  );
} catch (error) {
  if (error !== rollback) throw error;
} finally {
  if (employerId)
    assert.equal(await prisma.empresa.count({ where: { id: employerId } }), 0);
  await prisma.$disconnect();
}
console.log(
  "PASS: vacancy registration, duplicate warning, edits, idempotent coverage, independent recycling, protected deletion and archival; transaction rolled back.",
);
