// Run explicitly: pnpm dlx tsx --conditions=react-server tests/empresa-db.integration.mts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { validateEmployer } from "../src/lib/empresa-form";

const rollback = new Error("ROLLBACK_TEST");
let ids: { company: string; contact: string; address: string } | undefined;
try {
  await prisma.$transaction(
    async (tx) => {
      const source = readFileSync(
        new URL("../src/services/empresa.service.ts", import.meta.url),
        "utf8",
      );
      const { outputText } = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      });
      const exports: {
        createEmployer?: (v: Record<string, string>) => Promise<{ id: string }>;
      } = {};
      runInNewContext(outputText, {
        exports,
        require(name: string) {
          if (name === "server-only") return {};
          if (name === "@/lib/prisma") return { prisma: tx };
          throw new Error(`Unexpected dependency: ${name}`);
        },
      });
      const form = new FormData();
      for (const [key, value] of Object.entries({
        nombreComercial: "PRUEBA TRANSACCIONAL TEMPORAL",
        rfc: "ABC010101AB1",
        tipoEmpleador: "PRIVADA",
        cantidadEempleados: "0",
        ramaActividad: "Servicios",
        correoGeneral: "prueba@example.test",
        registroPortal: "NO",
        nombres: "Prueba",
        apellidos: "Temporal",
        cargo: "Contacto",
        codigoPostal: "01234",
        municipio: "Altamira",
      }))
        form.set(key, value);
      const { values, errors } = validateEmployer(form);
      assert.equal(Object.keys(errors).length, 0);
      const created = await exports.createEmployer!(values);
      const row = await tx.empresa.findUniqueOrThrow({
        where: { id: created.id },
        include: { contacto: true, domicilio: true },
      });
      assert.equal(row.rfc, "ABC010101AB1");
      assert.equal(row.cantidadEempleados, 0);
      assert.equal(row.folio, null);
      assert.equal(row.contacto.nombres, "Prueba");
      assert.equal(row.domicilio.codigoPostal, "01234");
      ids = {
        company: row.id,
        contact: row.contactoId,
        address: row.domicilioId,
      };
      throw rollback;
    },
    { timeout: 15000 },
  );
} catch (error) {
  if (error !== rollback) throw error;
} finally {
  if (ids) {
    assert.equal(await prisma.empresa.count({ where: { id: ids.company } }), 0);
    assert.equal(
      await prisma.contactoEmpresa.count({ where: { id: ids.contact } }),
      0,
    );
    assert.equal(
      await prisma.domicilioEmpresa.count({ where: { id: ids.address } }),
      0,
    );
  }
  await prisma.$disconnect();
}
assert.ok(ids, "The registration must have been exercised");
console.log(
  "PASS: employer, contact and address saved together; test transaction rolled back without leaving records.",
);
