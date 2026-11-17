import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  TipoEmpleador,
  TipoPersona,
  MedioConocimiento,
  RegistroPortal,
} from "@/generated/prisma/enums";

function employerData(v: Record<string, string>) {
  return {
    folio: v.folio || null,
    rfc: v.rfc.trim().toUpperCase(),
    curp: v.curp || null,
    tipoEmpleador: v.tipoEmpleador as TipoEmpleador,
    tipoPersona: (v.tipoPersona || null) as TipoPersona | null,
    razonSocial: v.razonSocial || null,
    nombreComercial: v.nombreComercial || null,
    tipoSociedad: v.tipoSociedad || null,
    cantidadEempleados: Number(v.cantidadEempleados),
    ramaActividad: v.ramaActividad,
    descripcion: v.descripcion || null,
    correoGeneral: v.correoGeneral,
    paginaWeb: v.paginaWeb || null,
    medioConocimiento: (v.medioConocimiento ||
      null) as MedioConocimiento | null,
    registroPortal: v.registroPortal as RegistroPortal,
    contacto: {
      create: {
        nombres: v.nombres,
        apellidos: v.apellidos,
        cargo: v.cargo,
        telefonoFijo: v.telefonoFijo || null,
        extension: v.extension || null,
        celular: v.celular || null,
        correo: v.correo || null,
        telsne: v.telsne || null,
      },
    },
    domicilio: {
      create: {
        calle: v.calle || null,
        numeroExterior: v.numeroExterior || null,
        numeroInterior: v.numeroInterior || null,
        colonia: v.colonia || null,
        municipio: v.municipio || null,
        localidad: v.localidad || null,
        entidad: v.entidad || null,
        codigoPostal: v.codigoPostal || null,
        entreCalles: v.entreCalles || null,
      },
    },
  };
}

export async function createEmployer(v: Record<string, string>) {
  return prisma.empresa.create({ data: employerData(v), select: { id: true } });
}

export async function findEmployerConflict(
  v: Record<string, string>,
  excludingId?: string,
) {
  const rows = await prisma.empresa.findMany({
    where: {
      ...(excludingId ? { id: { not: excludingId } } : {}),
      OR: [
        { rfc: v.rfc.trim().toUpperCase() },
        ...(v.folio ? [{ folio: v.folio }] : []),
      ],
    },
    select: { id: true, rfc: true, folio: true },
    take: 2,
  });
  const rfc = rows.find((row) => row.rfc === v.rfc.trim().toUpperCase());
  if (rfc) return { field: "rfc" as const, id: rfc.id };
  const folio = rows.find((row) => row.folio === v.folio);
  return folio ? { field: "folio" as const, id: folio.id } : null;
}

export async function updateEmployer(id: string, v: Record<string, string>) {
  const data = employerData(v);
  return prisma.empresa.update({
    where: { id },
    data: {
      ...data,
      contacto: { update: data.contacto.create },
      domicilio: { update: data.domicilio.create },
    },
    select: { id: true },
  });
}

export async function deleteEmployer(id: string) {
  return prisma.$transaction(async (tx) => {
    // Delete the company first: the vacancy foreign key prevents deletion if it is in use,
    // including vacancies created concurrently. Related records are removed only on success.
    const company = await tx.empresa.delete({
      where: { id },
      select: { contactoId: true, domicilioId: true },
    });
    await tx.contactoEmpresa.delete({ where: { id: company.contactoId } });
    await tx.domicilioEmpresa.delete({ where: { id: company.domicilioId } });
  });
}
