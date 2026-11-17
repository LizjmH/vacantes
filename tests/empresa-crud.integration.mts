// All test data is created inside a transaction that is rolled back.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { prisma } from "../src/lib/prisma";
import { Prisma } from "../src/generated/prisma/client";
import { searchTerms } from "../src/lib/employer-search";
import { validateEmployer } from "../src/lib/empresa-form";

type Crud = {
  createEmployer(v: Record<string, string>): Promise<{ id: string }>;
  updateEmployer(
    id: string,
    v: Record<string, string>,
  ): Promise<{ id: string }>;
  deleteEmployer(id: string): Promise<void>;
  findEmployerConflict(
    v: Record<string, string>,
    excludingId?: string,
  ): Promise<{ field: string; id: string } | null>;
  searchEmployers(
    query: string,
    page: number,
  ): Promise<{ employers: { id: string }[]; total: number; page: number }>;
};
const rollback = new Error("ROLLBACK_TEST");
const marker = `test-${randomUUID()}`;
try {
  await prisma.$transaction(
    async (tx) => {
      const database = new Proxy(tx, {
        get(target, property) {
          if (property === "$transaction")
            return (callback: (db: typeof tx) => unknown) => callback(tx);
          return Reflect.get(target, property);
        },
      });
      function load(file: string) {
        const exports = {};
        const source = readFileSync(
          new URL(`../src/services/${file}.ts`, import.meta.url),
          "utf8",
        );
        const { outputText } = ts.transpileModule(source, {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
          },
        });
        runInNewContext(outputText, {
          exports,
          require(name: string) {
            if (name === "server-only") return {};
            if (name === "@/lib/prisma") return { prisma: database };
            if (name === "@/generated/prisma/client") return { Prisma };
            if (name === "@/lib/employer-search") return { searchTerms };
            throw new Error(`Unexpected dependency: ${name}`);
          },
        });
        return exports;
      }
      const service = {
        ...load("empresa.service"),
        ...load("empresa-search.service"),
      } as Crud;
      const form = new FormData();
      for (const [key, value] of Object.entries({
        folio: marker,
        nombreComercial: "Compañía Águila",
        razonSocial: "Empresa de prueba",
        rfc: "ABC010101AB1",
        tipoEmpleador: "PRIVADA",
        cantidadEempleados: "10",
        ramaActividad: "Servicios",
        correoGeneral: "test@example.test",
        registroPortal: "NO",
        nombres: "José",
        apellidos: "Pérez García",
        cargo: "Contacto",
        telefonoFijo: "(833) 123-45-67",
        codigoPostal: "01234",
        municipio: "Altamira",
      }))
        form.set(key, value);
      const { values, errors } = validateEmployer(form);
      assert.equal(Object.keys(errors).length, 0);
      const company = await service.createEmployer(values);
      const initial = await tx.empresa.findUniqueOrThrow({
        where: { id: company.id },
      });
      for (const term of [
        "compania aguila",
        "jose perez garcia",
        "8331234567",
        "(833) 123-45-67",
        marker,
        "abc010101ab1",
        "aguila perez",
        "01234",
      ]) {
        const results = await service.searchEmployers(term, 1);
        assert.ok(
          results.employers.some((row) => row.id === company.id),
          `Missing match: ${term}`,
        );
      }
      assert.equal(
        (await service.searchEmployers(`${marker} nomatch`, 1)).total,
        0,
      );
      assert.equal((await service.searchEmployers("%' OR 1=1 --", 1)).total, 0);
      assert.equal((await service.searchEmployers(marker, 99999)).page, 1);
      const edited = {
        ...values,
        nombreComercial: "Compañía Editada",
        nombres: "María",
        municipio: "Tampico",
        celular: "833-765-4321",
      };
      await service.updateEmployer(company.id, edited);
      const row = await tx.empresa.findUniqueOrThrow({
        where: { id: company.id },
        include: { contacto: true, domicilio: true },
      });
      assert.equal(row.contactoId, initial.contactoId);
      assert.equal(row.domicilioId, initial.domicilioId);
      assert.equal(row.contacto.nombres, "María");
      assert.equal(row.domicilio.municipio, "Tampico");
      const other = await service.createEmployer({
        ...values,
        rfc: "ABC010101AB2",
        folio: `${marker}2`,
      });
      assert.equal(
        await service.findEmployerConflict(edited, company.id),
        null,
      );
      assert.equal(
        (await service.findEmployerConflict(edited))?.id,
        company.id,
      );
      await tx.$executeRawUnsafe("SAVEPOINT duplicate_rfc_create");
      await assert.rejects(
        service.createEmployer({
          ...values,
          rfc: " abc010101ab1 ",
          folio: `${marker}3`,
        }),
        (error: unknown) =>
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002",
      );
      await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT duplicate_rfc_create");
      await tx.$executeRawUnsafe("SAVEPOINT duplicate_rfc_edit");
      await assert.rejects(
        service.updateEmployer(other.id, { ...values, folio: `${marker}2` }),
        (error: unknown) =>
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002",
      );
      await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT duplicate_rfc_edit");
      assert.equal(
        (await tx.empresa.findUniqueOrThrow({ where: { id: other.id } })).rfc,
        "ABC010101AB2",
      );
      await tx.$executeRawUnsafe("SAVEPOINT duplicate_folio");
      await assert.rejects(
        service.updateEmployer(company.id, {
          ...edited,
          folio: `${marker}2`,
          nombres: "No debe guardarse",
        }),
        (error: unknown) =>
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002",
      );
      await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT duplicate_folio");
      assert.equal(
        (
          await tx.contactoEmpresa.findUniqueOrThrow({
            where: { id: initial.contactoId },
          })
        ).nombres,
        "María",
      );
      await service.deleteEmployer(other.id);

      const pagingMarker = `page-${randomUUID()}`;
      const batch = Array.from({ length: 21 }, (_, index) => ({
        company: `${pagingMarker}-e${index}`,
        contact: `${pagingMarker}-c${index}`,
        address: `${pagingMarker}-d${index}`,
      }));
      await tx.contactoEmpresa.createMany({
        data: batch.map((item) => ({
          id: item.contact,
          nombres: "Temporal",
          apellidos: "Paginación",
          cargo: "Contacto",
        })),
      });
      await tx.domicilioEmpresa.createMany({
        data: batch.map((item) => ({ id: item.address })),
      });
      await tx.empresa.createMany({
        data: batch.map((item, index) => ({
          id: item.company,
          nombreComercial: pagingMarker,
          rfc: `TST010101${String(index).padStart(3, "0")}`,
          tipoEmpleador: "PRIVADA",
          cantidadEempleados: 0,
          ramaActividad: "Prueba",
          correoGeneral: "test@example.test",
          registroPortal: "NO",
          contactoId: item.contact,
          domicilioId: item.address,
        })),
      });
      const pageOne = await service.searchEmployers(pagingMarker, 1);
      const pageTwo = await service.searchEmployers(pagingMarker, 2);
      assert.equal(pageOne.total, 21);
      assert.equal(pageOne.employers.length, 20);
      assert.equal(pageTwo.employers.length, 1);
      assert.ok(
        !pageOne.employers.some((item) => item.id === pageTwo.employers[0].id),
      );
      assert.equal((await service.searchEmployers(pagingMarker, 999)).page, 2);
      assert.ok(
        (
          await service.searchEmployers("editada maria 8337654321", 1)
        ).employers.some((e) => e.id === company.id),
      );
      const vacancy = await tx.vacante.create({
        data: {
          empresaId: company.id,
          puesto: "PRUEBA TEMPORAL",
          sexo: "INDISTINTO",
          sueldoMensual: "10000",
          experiencia: "NINGUNA",
          descripcionPuesto: "Prueba",
          conocimientos: "Prueba",
          prestaciones: "Prueba",
          tiempoReclutamiento: "INMEDIATO",
          fechaReinicio: new Date(),
        },
      });
      await tx.$executeRawUnsafe("SAVEPOINT delete_guard");
      await assert.rejects(
        service.deleteEmployer(company.id),
        (error: unknown) =>
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2003",
      );
      await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT delete_guard");
      assert.equal(await tx.empresa.count({ where: { id: company.id } }), 1);
      assert.equal(
        await tx.contactoEmpresa.count({ where: { id: initial.contactoId } }),
        1,
      );
      assert.equal(
        await tx.domicilioEmpresa.count({ where: { id: initial.domicilioId } }),
        1,
      );
      await tx.vacante.delete({ where: { id: vacancy.id } });
      await service.deleteEmployer(company.id);
      assert.equal(await tx.empresa.count({ where: { id: company.id } }), 0);
      const recreated = await service.createEmployer(values);
      assert.notEqual(recreated.id, company.id);
      assert.equal(
        (await tx.empresa.findUniqueOrThrow({ where: { id: recreated.id } }))
          .rfc,
        values.rfc,
      );
      await service.deleteEmployer(recreated.id);
      assert.equal(
        await tx.contactoEmpresa.count({ where: { id: initial.contactoId } }),
        0,
      );
      assert.equal(
        await tx.domicilioEmpresa.count({ where: { id: initial.domicilioId } }),
        0,
      );
      throw rollback;
    },
    { timeout: 60000, maxWait: 20000 },
  );
} catch (error) {
  if (error !== rollback) throw error;
} finally {
  assert.equal(await prisma.empresa.count({ where: { folio: marker } }), 0);
  await prisma.$disconnect();
}
console.log(
  "PASS: partial/accent/phone/contact searches, editing related records, vacancy deletion guard and orphan-free deletion. Test transaction rolled back.",
);
