import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { prisma } from "../src/lib/prisma";
import { Prisma } from "../src/generated/prisma/client";
import * as helpers from "../src/lib/vacancy-form";
import { searchTerms } from "../src/lib/employer-search";
import type * as Service from "../src/services/seguimiento.service";
const rollback = new Error("ROLLBACK_TEST");
let employerId: string | undefined;
try {
  await prisma.$transaction(
    async (tx) => {
      const database = new Proxy(tx, {
        get(target, key) {
          if (key === "$transaction")
            return (callback: (db: typeof tx) => unknown) => callback(tx);
          return Reflect.get(target, key);
        },
      });
      const exports = {};
      const { outputText } = ts.transpileModule(
        readFileSync(
          new URL("../src/services/seguimiento.service.ts", import.meta.url),
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
        Map,
        require(name: string) {
          if (name === "server-only") return {};
          if (name === "@/lib/prisma") return { prisma: database };
          if (name === "@/generated/prisma/client") return { Prisma };
          if (name === "@/lib/vacancy-form") return helpers;
          if (name === "@/lib/employer-search") return { searchTerms };
          throw new Error(name);
        },
      });
      const api = exports as typeof Service;
      const marker = `seguimiento-${randomUUID()}`;
      const employer = await tx.empresa.create({
        data: {
          rfc: `ZZZ010101${randomBytes(2).toString("hex").slice(0, 3).toUpperCase()}`,
          nombreComercial: marker,
          tipoEmpleador: "PRIVADA",
          cantidadEempleados: 1,
          ramaActividad: "Prueba",
          correoGeneral: "test@example.test",
          registroPortal: "NO",
          contacto: {
            create: {
              nombres: "José",
              apellidos: "Pérez",
              cargo: "Contacto",
              celular: "833-111-2233",
            },
          },
          domicilio: { create: {} },
        },
      });
      employerId = employer.id;
      const today = helpers.todayInMexico();
      const future = helpers.monthAfter(today);
      const vacancy = await tx.vacante.create({
        data: {
          empresaId: employer.id,
          puesto: "Auxiliar temporal",
          plazas: 2,
          sexo: "INDISTINTO",
          sueldoMensual: "10000",
          experiencia: "NINGUNA",
          descripcionPuesto: "Prueba",
          conocimientos: "Prueba",
          prestaciones: "Prueba",
          tiempoReclutamiento: "UN_MES",
          fechaReinicio: new Date(`${today}T00:00:00Z`),
          fechaFin: new Date(`${future}T00:00:00Z`),
        },
      });
      const version = async () =>
        (
          await tx.vacante.findUniqueOrThrow({ where: { id: vacancy.id } })
        ).actualizadoEl.toISOString();
      const values = (resultado: string) => ({
        solicitudId: randomUUID(),
        resultado,
        comentario: "Contacto de prueba",
        curp: "",
        nombre: "",
        puesto: "",
        fechaFin: "",
        reabrir: "",
      });
      assert.equal((await api.searchTracking(marker, "sin", 1)).total, 1);
      const pending = values("PENDIENTE");
      const initialVersion = await version();
      const first = await api.recordTracking(
        vacancy.id,
        pending,
        "test-user",
        initialVersion,
      );
      assert.ok(first.savedId);
      assert.equal(
        (
          await api.recordTracking(
            vacancy.id,
            pending,
            "test-user",
            initialVersion,
          )
        ).savedId,
        first.savedId,
      );
      assert.equal(
        await tx.seguimientoVacante.count({ where: { vacanteId: vacancy.id } }),
        1,
      );
      assert.equal(
        (await api.searchTracking(marker, "pendientes", 1)).total,
        1,
      );
      assert.equal((await api.searchTracking(marker, "sin", 1)).total, 0);
      assert.ok(
        (
          await api.recordTracking(
            vacancy.id,
            values("VIGENTE"),
            "test-user",
            "stale-version",
          )
        ).error,
      );
      const covered = await api.recordTracking(
        vacancy.id,
        values("CUBIERTA"),
        "test-user",
        await version(),
      );
      assert.ok(covered.savedId);
      assert.equal(
        (await tx.vacante.findUniqueOrThrow({ where: { id: vacancy.id } }))
          .cubierta,
        true,
      );
      assert.equal((await api.searchTracking(marker, "cubiertas", 1)).total, 1);
      assert.ok(
        (
          await api.recordTracking(
            vacancy.id,
            values("VIGENTE"),
            "test-user",
            await version(),
          )
        ).error,
      );
      const reopen = { ...values("VIGENTE"), reabrir: "SI" };
      assert.ok(
        (
          await api.recordTracking(
            vacancy.id,
            reopen,
            "test-user",
            await version(),
          )
        ).savedId,
      );
      assert.equal(
        (await tx.vacante.findUniqueOrThrow({ where: { id: vacancy.id } }))
          .cubierta,
        false,
      );
      await tx.vacante.update({
        where: { id: vacancy.id },
        data: { fechaFin: new Date("2020-01-01T00:00:00Z") },
      });
      assert.ok(
        (
          await api.recordTracking(
            vacancy.id,
            values("VIGENTE"),
            "test-user",
            await version(),
          )
        ).error,
      );
      assert.ok(
        (
          await api.recordTracking(
            vacancy.id,
            { ...values("VIGENTE"), fechaFin: future },
            "test-user",
            await version(),
          )
        ).savedId,
      );
      await tx.vacante.update({
        where: { id: vacancy.id },
        data: { archivada: true },
      });
      const before = await tx.seguimientoVacante.count({
        where: { vacanteId: vacancy.id },
      });
      assert.ok(
        (
          await api.recordTracking(
            vacancy.id,
            values("PENDIENTE"),
            "test-user",
            await version(),
          )
        ).error,
      );
      assert.equal(
        await tx.seguimientoVacante.count({ where: { vacanteId: vacancy.id } }),
        before,
      );
      assert.equal(
        (await api.searchTracking(marker, "archivadas", 1)).total,
        1,
      );
      assert.equal(
        (await api.searchTracking(`${marker} 8331112233`, "todas", 1)).total,
        1,
      );
      assert.equal(
        (await api.searchTracking("%' OR 1=1 --", "todas", 1)).total,
        0,
      );
      assert.equal(
        await tx.historialVacante.count({ where: { vacanteId: vacancy.id } }),
        4,
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
  "PASS: follow-up creation, idempotent retries, filters, stale-edit protection, explicit reopening, expiration renewal and archived-vacancy protection; test transaction rolled back.",
);
