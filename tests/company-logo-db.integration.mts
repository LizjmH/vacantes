import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { prisma } from "../src/lib/prisma";
import { normalizeCompanyLogo } from "../src/lib/company-logo";
const rollback = new Error("ROLLBACK_TEST");
let employerId: string | undefined;
try {
  await prisma.$transaction(
    async (tx) => {
      const employer = await tx.empresa.create({
        data: {
          rfc: `ZZZ010101${randomBytes(2).toString("hex").slice(0, 3).toUpperCase()}`,
          nombreComercial: "PRUEBA LOGO TRANSACCIONAL",
          tipoEmpleador: "PRIVADA",
          cantidadEempleados: 1,
          ramaActividad: "Prueba",
          correoGeneral: "logo@example.test",
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
      const original = await normalizeCompanyLogo(
        await sharp({
          create: { width: 40, height: 20, channels: 4, background: "#224488" },
        })
          .png()
          .toBuffer(),
      );
      await tx.logoEmpresa.upsert({
        where: { empresaId: employer.id },
        create: { empresaId: employer.id, contenido: original },
        update: { contenido: original },
      });
      assert.deepEqual(
        (
          await tx.logoEmpresa.findUniqueOrThrow({
            where: { empresaId: employer.id },
          })
        ).contenido,
        original,
      );
      const replacement = await normalizeCompanyLogo(
        await sharp({
          create: { width: 32, height: 32, channels: 4, background: "#227744" },
        })
          .png()
          .toBuffer(),
      );
      await tx.logoEmpresa.upsert({
        where: { empresaId: employer.id },
        create: { empresaId: employer.id, contenido: replacement },
        update: { contenido: replacement },
      });
      assert.equal(
        await tx.logoEmpresa.count({ where: { empresaId: employer.id } }),
        1,
      );
      assert.deepEqual(
        (
          await tx.logoEmpresa.findUniqueOrThrow({
            where: { empresaId: employer.id },
          })
        ).contenido,
        replacement,
      );
      await tx.empresa.delete({ where: { id: employer.id } });
      assert.equal(
        await tx.logoEmpresa.count({ where: { empresaId: employer.id } }),
        0,
      );
      throw rollback;
    },
    { maxWait: 20000, timeout: 15000 },
  );
} catch (error) {
  if (error !== rollback) throw error;
} finally {
  if (employerId)
    assert.equal(await prisma.empresa.count({ where: { id: employerId } }), 0);
  await prisma.$disconnect();
}
console.log(
  "PASS: logo storage, replacement without duplication and automatic cleanup with employer; test transaction rolled back.",
);
