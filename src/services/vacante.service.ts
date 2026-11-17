import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type {
  Sexo,
  TipoDiscapacidad,
  Escolaridad,
  ExperienciaRequerida,
  TiempoReclutamiento,
} from "@/generated/prisma/enums";
import {
  vacancySections,
  contactTypes,
  monthAfter,
  todayInMexico,
} from "@/lib/vacancy-form";

type VacancyRecord = Prisma.VacanteGetPayload<{
  include: { mediosContacto: true };
}>;
export function vacancyValues(
  v: VacancyRecord,
  recycle = false,
): Record<string, string> {
  const data = v as unknown as Record<string, unknown>;
  const values = Object.fromEntries(
    vacancySections.flatMap((section) =>
      section.fields.map((field) => {
        const raw = data[field.name];
        return [
          field.name,
          raw == null
            ? ""
            : raw instanceof Date
              ? raw.toISOString().slice(0, 10)
              : typeof raw === "boolean"
                ? raw
                  ? "SI"
                  : "NO"
                : String(raw),
        ];
      }),
    ),
  );
  values.fechaFin ||= monthAfter(values.fechaReinicio);
  const previous = v.datosAnteriores;
  if (previous && typeof previous === "object" && !Array.isArray(previous)) {
    for (const key of ["escolaridad", "tiempoReclutamiento"])
      if (!values[key] && typeof previous[key] === "string")
        values[key] = previous[key];
  }
  for (const [key] of contactTypes) {
    const medio = v.mediosContacto.find((m) => m.tipo === key);
    values[`medio_${key}`] = medio ? "SI" : "NO";
    values[`horario_${key}`] = medio?.horario ?? "";
  }
  if (recycle) {
    values.idSilap = "";
    values.fechaReinicio = todayInMexico();
    values.fechaFin = monthAfter(values.fechaReinicio);
  }
  return values;
}
function vacancyData(v: Record<string, string>) {
  return {
    idSilap: v.idSilap || null,
    puesto: v.puesto,
    plazas: Number(v.plazas),
    edadMinima: v.edadMinima ? Number(v.edadMinima) : null,
    edadMaxima: v.edadMaxima ? Number(v.edadMaxima) : null,
    escolaridad: (v.escolaridad || null) as Escolaridad | null,
    sexo: v.sexo as Sexo,
    sueldoMensual: v.sueldoMensual,
    diasTrabajo: v.diasTrabajo ? Number(v.diasTrabajo) : null,
    horarioTrabajo: v.horarioTrabajo || null,
    experiencia: v.experiencia as ExperienciaRequerida,
    aceptaDiscapacidad: v.aceptaDiscapacidad === "SI",
    tipoDiscapacidad: (v.tipoDiscapacidad || null) as TipoDiscapacidad | null,
    descripcionPuesto: v.descripcionPuesto,
    conocimientos: v.conocimientos,
    prestaciones: v.prestaciones,
    tiempoReclutamiento: v.tiempoReclutamiento as TiempoReclutamiento,
    fechaReinicio: new Date(`${v.fechaReinicio}T00:00:00Z`),
    fechaFin: new Date(`${v.fechaFin}T00:00:00Z`),
    jornada: v.jornada || null,
    turno: v.turno || null,
    horaInicio: v.horaInicio || null,
    horaFin: v.horaFin || null,
    observaciones: v.observaciones || null,
    situacionAcademica: v.situacionAcademica || null,
    carrera: v.carrera || null,
    tipoContratacion: v.tipoContratacion || null,
    instruccionesGenerales: v.instruccionesGenerales || null,
    municipio: v.municipio || null,
    direccion: v.direccion || null,
  };
}
export type VacancyContext = {
  empresaId: string;
  id?: string;
  origenId?: string;
};
export async function saveVacancy(
  context: VacancyContext,
  values: Record<string, string>,
  usuarioId: string,
  allowDuplicate: boolean,
) {
  return prisma.$transaction(
    async (tx) => {
      const employer = await tx.empresa.findUnique({
        where: { id: context.empresaId },
        select: { id: true },
      });
      if (!employer)
        return { error: "El empleador ya no existe. Vuelve a seleccionarlo." };
      const current = context.id
        ? await tx.vacante.findFirst({
            where: { id: context.id, empresaId: context.empresaId },
            include: { mediosContacto: true },
          })
        : null;
      if (context.id && !current)
        return {
          error: "La vacante ya no existe o pertenece a otro empleador.",
        };
      if (
        context.origenId &&
        !(await tx.vacante.findFirst({
          where: { id: context.origenId, empresaId: context.empresaId },
          select: { id: true },
        }))
      )
        return {
          error:
            "La vacante original ya no está disponible para este empleador.",
        };
      const data = vacancyData(values);
      if (!allowDuplicate) {
        const duplicate = await tx.vacante.findFirst({
          where: {
            empresaId: context.empresaId,
            ...(current ? { id: { not: current.id } } : {}),
            puesto: { equals: values.puesto, mode: "insensitive" },
            archivada: false,
            cubierta: false,
            fechaFin: { gte: data.fechaReinicio },
            fechaReinicio: {
              lte: new Date(`${values.fechaFin}T23:59:59.999Z`),
            },
          },
          select: { id: true },
        });
        if (duplicate)
          return {
            error:
              "Ya hay una vacante del mismo puesto con fechas coincidentes. Revísala o confirma que deseas crear otra oferta independiente.",
            duplicateId: duplicate.id,
          };
      }
      const medios = contactTypes
        .filter(([key]) => values[`medio_${key}`] === "SI")
        .map(([tipo]) => ({
          tipo,
          horario: values[`horario_${tipo}`] || null,
        }));
      const history = {
        accion: current
          ? "EDICION"
          : context.origenId
            ? "RECICLADA"
            : "REGISTRO",
        datos: {
          usuarioId,
          ...(current ? { antes: vacancyValues(current) } : {}),
          despues: values,
          ...(context.origenId ? { origenId: context.origenId } : {}),
        },
      };
      const saved = current
        ? await tx.vacante.update({
            where: { id: current.id },
            data: {
              ...data,
              mediosContacto: { deleteMany: {}, create: medios },
              historial: { create: history },
            },
            select: { id: true },
          })
        : await tx.vacante.create({
            data: {
              ...data,
              empresaId: employer.id,
              origenVacanteId: context.origenId || null,
              mediosContacto: { create: medios },
              historial: { create: history },
            },
            select: { id: true },
          });
      return { savedId: saved.id };
    },
    { maxWait: 15000, timeout: 20000 },
  );
}

export async function manageVacancy(
  id: string,
  action: "CUBRIR" | "ARCHIVAR" | "ELIMINAR",
  usuarioId: string,
) {
  return prisma.$transaction(
    async (tx) => {
      // Serialize state changes and protect against a concurrent follow-up insertion/deletion.
      await tx.$queryRaw`SELECT id FROM "Vacante" WHERE id = ${id} FOR UPDATE`;
      const row = await tx.vacante.findUnique({
        where: { id },
        include: {
          _count: { select: { seguimientos: true, recicladas: true } },
        },
      });
      if (!row) return { error: "La vacante ya no existe." };
      if (action === "ELIMINAR") {
        if (row._count.seguimientos || row._count.recicladas)
          return {
            error:
              "No se puede eliminar porque tiene seguimientos o vacantes recicladas. Puedes archivarla para conservar el historial.",
          };
        await tx.vacante.delete({ where: { id } });
      } else if (action === "CUBRIR") {
        if (row.archivada) return { error: "La vacante está archivada." };
        if (!row.cubierta)
          await tx.vacante.update({
            where: { id },
            data: {
              cubierta: true,
              seguimientos: {
                create: {
                  resultado: "CUBIERTA",
                  comentario: "Vacante marcada como cubierta.",
                },
              },
              historial: {
                create: { accion: "CUBIERTA", datos: { usuarioId } },
              },
            },
          });
      } else if (!row.archivada) {
        await tx.vacante.update({
          where: { id },
          data: {
            archivada: true,
            historial: {
              create: { accion: "ARCHIVADA", datos: { usuarioId } },
            },
          },
        });
      }
      return { empresaId: row.empresaId };
    },
    { maxWait: 15000, timeout: 15000 },
  );
}
