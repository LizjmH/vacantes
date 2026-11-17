import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { todayInMexico, monthAfter } from "@/lib/vacancy-form";
import { searchTerms } from "@/lib/employer-search";
import type { ResultadoSeguimiento } from "@/generated/prisma/enums";

export async function recordTracking(
  vacanteId: string,
  values: Record<string, string>,
  usuarioId: string,
  version: string,
) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Vacante" WHERE id=${vacanteId} FOR UPDATE`;
      const previous = await tx.seguimientoVacante.findUnique({
        where: { id: values.solicitudId },
        select: { id: true, vacanteId: true },
      });
      if (previous)
        return previous.vacanteId === vacanteId
          ? { savedId: previous.id }
          : { error: "Recarga la página para iniciar otro seguimiento." };
      const vacancy = await tx.vacante.findUnique({ where: { id: vacanteId } });
      if (!vacancy) return { error: "La vacante ya no existe." };
      if (vacancy.archivada)
        return {
          error:
            "La vacante está archivada. Puedes consultar el historial, pero no registrar nuevos contactos.",
        };
      if (vacancy.actualizadoEl.toISOString() !== version)
        return {
          error:
            "La vacante cambió mientras capturabas. Recarga para revisar su estado actual; lo capturado se conservará.",
        };
      const today = todayInMexico();
      const currentEnd =
        vacancy.fechaFin?.toISOString().slice(0, 10) ??
        monthAfter(vacancy.fechaReinicio.toISOString().slice(0, 10));
      const end = values.fechaFin || currentEnd;
      if (values.resultado === "VIGENTE") {
        if (vacancy.cubierta && values.reabrir !== "SI")
          return { error: "Confirma que deseas reabrir la vacante cubierta." };
        if (vacancy.fechaReinicio.toISOString().slice(0, 10) > today)
          return {
            error:
              "La vacante está programada para una fecha futura. Revisa la fecha de inicio antes de marcarla como vigente.",
          };
        if (end < today)
          return {
            error:
              "La vacante está vencida. Indica una nueva fecha final para dejarla vigente.",
          };
        if (end < vacancy.fechaReinicio.toISOString().slice(0, 10))
          return { error: "La fecha final no puede ser anterior al inicio." };
      }
      const covered =
        values.resultado === "CUBIERTA"
          ? true
          : values.resultado === "VIGENTE"
            ? false
            : vacancy.cubierta;
      const result = await tx.seguimientoVacante.create({
        data: {
          id: values.solicitudId,
          vacanteId,
          resultado: values.resultado as ResultadoSeguimiento,
          comentario: values.comentario || null,
          curp: values.curp || null,
          nombre: values.nombre || null,
          puesto: values.puesto || null,
        },
        select: { id: true },
      });
      await tx.vacante.update({
        where: { id: vacanteId },
        data: {
          cubierta: covered,
          ...(values.fechaFin
            ? { fechaFin: new Date(`${values.fechaFin}T00:00:00Z`) }
            : {}),
          historial: {
            create: {
              accion:
                !vacancy.cubierta && covered
                  ? "CUBIERTA"
                  : vacancy.cubierta && !covered
                    ? "REABIERTA"
                    : "SEGUIMIENTO",
              datos: {
                usuarioId,
                seguimientoId: result.id,
                resultado: values.resultado,
                fechaFinAnterior: currentEnd,
                fechaFinNueva: end,
                cubiertaAnterior: vacancy.cubierta,
                cubiertaNueva: covered,
              },
            },
          },
        },
      });
      return { savedId: result.id };
    },
    { maxWait: 20000, timeout: 15000 },
  );
}

export const trackingFilters = [
  ["activas", "Por revisar"],
  ["todas", "Todas"],
  ["sin", "Sin seguimiento"],
  ["pendientes", "Último contacto pendiente"],
  ["proximas", "Por vencer"],
  ["vencidas", "Vencidas"],
  ["cubiertas", "Cubiertas"],
  ["archivadas", "Archivadas"],
] as const;
export async function searchTracking(
  query: string,
  filter: string,
  requestedPage: number,
) {
  const today = todayInMexico();
  const filters: Record<string, Prisma.Sql> = {
    activas: Prisma.sql`NOT v.archivada AND NOT v.cubierta`,
    todas: Prisma.sql`true`,
    sin: Prisma.sql`NOT v.archivada AND NOT v.cubierta AND ultimo.id IS NULL`,
    pendientes: Prisma.sql`NOT v.archivada AND NOT v.cubierta AND ultimo.resultado::text='PENDIENTE'`,
    proximas: Prisma.sql`NOT v.archivada AND NOT v.cubierta AND v."fechaReinicio" < ${today}::date + interval '1 day' AND v."fechaFin" BETWEEN ${today}::date AND ${today}::date + interval '7 days'`,
    vencidas: Prisma.sql`NOT v.archivada AND NOT v.cubierta AND v."fechaFin" < ${today}::date`,
    cubiertas: Prisma.sql`NOT v.archivada AND v.cubierta`,
    archivadas: Prisma.sql`v.archivada`,
  };
  const text = Prisma.sql`translate(lower(concat_ws(' ',v.puesto,v."idSilap",e.rfc,e.folio,e."razonSocial",e."nombreComercial",e."correoGeneral",c.nombres,c.apellidos,c.correo,c."telefonoFijo",c.celular,regexp_replace(coalesce(c."telefonoFijo",''),'[^0-9]','','g'),regexp_replace(coalesce(c.celular,''),'[^0-9]','','g'))),'áéíóúüñ','aeiouun')`;
  const conditions = [
    filters[filter] || filters.activas,
    ...searchTerms(query).map(
      (term) => Prisma.sql`strpos(${text},${term}) > 0`,
    ),
  ];
  const from = Prisma.sql`FROM "Vacante" v JOIN "Empresa" e ON e.id=v."empresaId" JOIN "ContactoEmpresa" c ON c.id=e."contactoId" LEFT JOIN LATERAL (SELECT s.id,s.resultado FROM "SeguimientoVacante" s WHERE s."vacanteId"=v.id ORDER BY s.fecha DESC,s.id DESC LIMIT 1) ultimo ON true WHERE ${Prisma.join(conditions, " AND ")}`;
  const [count] = await prisma.$queryRaw<{ total: bigint }[]>(
    Prisma.sql`SELECT count(*) AS total ${from}`,
  );
  const total = Number(count.total),
    pages = Math.max(1, Math.ceil(total / 20));
  const page = Math.min(
    pages,
    Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1),
  );
  const ids = await prisma.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT v.id ${from} ORDER BY v."fechaFin" ASC NULLS LAST,v.id ASC LIMIT 20 OFFSET ${(page - 1) * 20}`,
  );
  const rows = await prisma.vacante.findMany({
    where: { id: { in: ids.map((row) => row.id) } },
    select: {
      id: true,
      puesto: true,
      idSilap: true,
      plazas: true,
      archivada: true,
      cubierta: true,
      fechaReinicio: true,
      fechaFin: true,
      empresa: {
        select: { nombreComercial: true, razonSocial: true, rfc: true },
      },
      seguimientos: {
        orderBy: [{ fecha: "desc" }, { id: "desc" }],
        take: 1,
        select: { fecha: true, resultado: true },
      },
    },
  });
  const positions = new Map(ids.map((row, index) => [row.id, index]));
  rows.sort((a, b) => positions.get(a.id)! - positions.get(b.id)!);
  return { rows, total, page, pages };
}
