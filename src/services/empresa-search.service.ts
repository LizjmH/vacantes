import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { searchTerms } from "@/lib/employer-search";

export async function searchEmployers(query: string, requestedPage: number) {
  const terms = searchTerms(query);
  const text = Prisma.sql`translate(lower(concat_ws(' ',
    e.folio, e.rfc, e.curp, e."razonSocial", e."nombreComercial", e."correoGeneral", e."ramaActividad", e.descripcion, e."paginaWeb", e."tipoSociedad",
    c.nombres, c.apellidos, c.cargo, c.correo, c."telefonoFijo", c.celular, c.telsne, c.extension,
    d.calle, d."numeroExterior", d."numeroInterior", d.colonia, d.municipio, d.localidad, d.entidad, d."codigoPostal", d."entreCalles",
    regexp_replace(coalesce(c."telefonoFijo", ''), '[^0-9]', '', 'g'),
    regexp_replace(coalesce(c.celular, ''), '[^0-9]', '', 'g'),
    regexp_replace(coalesce(c.telsne, ''), '[^0-9]', '', 'g')
  )), 'áéíóúüñ', 'aeiouun')`;
  // Each word may match a different field. Values are always parameterized.
  const where = terms.length
    ? Prisma.sql`WHERE ${Prisma.join(
        terms.map((term) => Prisma.sql`strpos(${text}, ${term}) > 0`),
        " AND ",
      )}`
    : Prisma.empty;
  const from = Prisma.sql`FROM "Empresa" e JOIN "ContactoEmpresa" c ON c.id=e."contactoId" JOIN "DomicilioEmpresa" d ON d.id=e."domicilioId" ${where}`;
  const [count] = await prisma.$queryRaw<{ total: bigint }[]>(
    Prisma.sql`SELECT count(*) AS total ${from}`,
  );
  const total = Number(count.total);
  const pages = Math.max(1, Math.ceil(total / 20));
  const page = Math.min(
    pages,
    Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1),
  );
  const ids = await prisma.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT e.id ${from} ORDER BY e."creadoEl" DESC, e.id DESC LIMIT 20 OFFSET ${(page - 1) * 20}`,
  );
  const employers = await prisma.empresa.findMany({
    where: { id: { in: ids.map((row) => row.id) } },
    orderBy: [{ creadoEl: "desc" }, { id: "desc" }],
    select: {
      id: true,
      folio: true,
      rfc: true,
      razonSocial: true,
      nombreComercial: true,
      tipoPersona: true,
      correoGeneral: true,
      logo: { select: { actualizadoEl: true } },
      domicilio: { select: { municipio: true } },
      contacto: {
        select: {
          nombres: true,
          apellidos: true,
          telefonoFijo: true,
          celular: true,
          correo: true,
        },
      },
    },
  });
  return { employers, total, page, pages };
}
