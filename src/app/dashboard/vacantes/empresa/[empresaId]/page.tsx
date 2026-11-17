import Link from "next/link";
import { Icon } from "@/components/Icon";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";
import { todayInMexico, vacancyStatus } from "@/lib/vacancy-form";

const statuses = [
  ["", "Todas"],
  ["vigentes", "Vigentes"],
  ["proximas", "Por vencer"],
  ["vencidas", "Vencidas"],
  ["programadas", "Programadas"],
  ["cubiertas", "Cubiertas"],
  ["archivadas", "Archivadas"],
];
export default async function EmployerVacanciesPage({
  params,
  searchParams,
}: {
  params: Promise<{ empresaId: string }>;
  searchParams: Promise<{ q?: string; estado?: string; pagina?: string }>;
}) {
  await requireSession();
  const { empresaId } = await params;
  const filters = await searchParams;
  const employer = await prisma.empresa.findUnique({
    where: { id: empresaId },
    include: { contacto: true },
  });
  if (!employer) notFound();
  const query =
    typeof filters.q === "string" ? filters.q.trim().slice(0, 200) : "";
  const status =
    typeof filters.estado === "string" &&
    statuses.some(([key]) => key === filters.estado)
      ? filters.estado
      : "";
  const today = new Date(`${todayInMexico()}T00:00:00Z`);
  const todayEnd = new Date(today.getTime() + 86400000 - 1);
  const weekEnd = new Date(today.getTime() + 7 * 86400000);
  const statusWhere: Record<string, Prisma.VacanteWhereInput> = {
    vigentes: {
      archivada: false,
      cubierta: false,
      fechaReinicio: { lte: todayEnd },
      fechaFin: { gte: today },
    },
    proximas: {
      archivada: false,
      cubierta: false,
      fechaReinicio: { lte: todayEnd },
      fechaFin: { gte: today, lte: weekEnd },
    },
    vencidas: { archivada: false, cubierta: false, fechaFin: { lt: today } },
    programadas: {
      archivada: false,
      cubierta: false,
      fechaReinicio: { gt: todayEnd },
    },
    cubiertas: { cubierta: true, archivada: false },
    archivadas: { archivada: true },
  };
  const where: Prisma.VacanteWhereInput = {
    empresaId,
    ...statusWhere[status],
    ...(query
      ? {
          OR: [
            { puesto: { contains: query, mode: "insensitive" } },
            { idSilap: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const total = await prisma.vacante.count({ where });
  const pages = Math.max(1, Math.ceil(total / 20));
  const requested = Number(filters.pagina);
  const page = Math.max(
    1,
    Math.min(pages, Number.isSafeInteger(requested) ? requested : 1),
  );
  const rows = await prisma.vacante.findMany({
    where,
    orderBy: [{ creadoEl: "desc" }, { id: "desc" }],
    take: 20,
    skip: (page - 1) * 20,
    select: {
      id: true,
      idSilap: true,
      puesto: true,
      plazas: true,
      fechaReinicio: true,
      fechaFin: true,
      cubierta: true,
      archivada: true,
      origenVacanteId: true,
    },
  });
  const pageUrl = (n: number) =>
    `?${new URLSearchParams({ q: query, estado: status, pagina: String(n) })}`;
  return (
    <main className="px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard/vacantes"
          className="text-sm underline underline-offset-4"
        >
          ← Buscar otro empleador
        </Link>
        <header className="my-7 flex flex-wrap justify-between gap-4">
          <div>
            <p className="mb-2 text-sm text-muted">Vacantes del empleador</p>
            <h1 className="text-3xl font-bold tracking-tight">
              {employer.nombreComercial || employer.razonSocial}
            </h1>
            <p className="mt-3 text-sm text-muted">
              RFC: {employer.rfc} · Folio: {employer.folio || "Sin folio"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {employer.contacto.nombres} {employer.contacto.apellidos} ·{" "}
              {employer.contacto.correo || employer.correoGeneral}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Link
              href={`/dashboard/empleadores/${empresaId}`}
              className="rounded-xl border border-input-line bg-panel px-4 py-3 text-sm"
            >
              Ver empleador
            </Link>
            <Link
              href={`/dashboard/vacantes/nuevo?empresa=${empresaId}`}
              className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white"
            >
              + Registrar vacante
            </Link>
          </div>
        </header>
        <form className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-panel p-5">
          <div className="min-w-40 flex-1">
            <label htmlFor="puesto" className="mb-2 block text-sm font-medium">
              Puesto o folio
            </label>
            <input
              id="puesto"
              name="q"
              defaultValue={query}
              maxLength={200}
              className="min-h-12 w-full rounded-xl border border-input-line px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="estado" className="mb-2 block text-sm font-medium">
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              defaultValue={status}
              className="min-h-12 rounded-xl border border-input-line bg-panel px-4 py-3 text-sm"
            >
              {statuses.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white"
          >
            Filtrar
          </button>
          {(query || status) && (
            <Link
              href={`/dashboard/vacantes/empresa/${empresaId}`}
              className="px-3 py-3 text-sm underline"
            >
              Limpiar
            </Link>
          )}
        </form>
        <p className="mb-4 text-sm text-muted">
          {total} {total === 1 ? "vacante" : "vacantes"}
        </p>
        {rows.length ? (
          <div className="overflow-x-auto rounded-2xl border border-line bg-panel">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Vacantes de {employer.nombreComercial || employer.razonSocial}
              </caption>
              <thead className="border-b bg-muted-surface text-secondary">
                <tr>
                  {[
                    "Puesto / Folio",
                    "Plazas",
                    "Inicio",
                    "Fecha final",
                    "Estado",
                    "Acciones",
                  ].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="px-5 py-4 font-medium"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((v) => (
                  <tr key={v.id}>
                    <td className="px-5 py-4">
                      <span className="font-medium">{v.puesto}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {v.idSilap || "Sin folio"}
                        {v.origenVacanteId ? " · Reciclada" : ""}
                      </span>
                    </td>
                    <td className="px-5 py-4">{v.plazas}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {v.fechaReinicio.toLocaleDateString("es-MX", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {v.fechaFin?.toLocaleDateString("es-MX", {
                        timeZone: "UTC",
                      }) || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="whitespace-nowrap rounded-full border border-line px-3 py-1 text-xs">
                        {vacancyStatus(v)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <Link
                          href={`/dashboard/vacantes/${v.id}`}
                          className="flex size-9 items-center justify-center rounded-lg border border-input-line text-ink hover:bg-muted-surface focus-visible:outline-2 focus-visible:outline-brand"
                          title="Ver vacante"
                          aria-label={`Ver ${v.puesto}`}
                        >
                          <Icon name="eye" />
                        </Link>
                        <Link
                          href={`/dashboard/vacantes/${v.id}/editar`}
                          className="flex size-9 items-center justify-center rounded-lg border border-input-line text-ink hover:bg-muted-surface focus-visible:outline-2 focus-visible:outline-brand"
                          title="Editar vacante"
                          aria-label={`Editar ${v.puesto}`}
                        >
                          <Icon name="edit" />
                        </Link>
                        <Link
                          href={`/dashboard/vacantes/nuevo?empresa=${empresaId}&reciclar=${v.id}`}
                          className="flex size-9 items-center justify-center rounded-lg border border-input-line text-ink hover:bg-muted-surface focus-visible:outline-2 focus-visible:outline-brand"
                          title="Reciclar vacante"
                          aria-label={`Reciclar ${v.puesto}`}
                        >
                          <Icon name="recycle" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <section className="rounded-2xl border border-dashed border-input-line bg-panel p-8">
            <h2 className="font-semibold">
              {query || status
                ? "No hay vacantes con estos filtros"
                : "Este empleador todavía no tiene vacantes"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {query || status
                ? "Prueba otro puesto o estado."
                : "Registra la primera oferta con el botón de arriba."}
            </p>
          </section>
        )}
        {pages > 1 && (
          <nav
            aria-label="Páginas de vacantes"
            className="mt-5 flex items-center gap-4"
          >
            <span className="text-sm text-muted">
              Página {page} de {pages}
            </span>
            {page > 1 && (
              <Link href={pageUrl(page - 1)} className="text-sm underline">
                Anterior
              </Link>
            )}
            {page < pages && (
              <Link href={pageUrl(page + 1)} className="text-sm underline">
                Siguiente
              </Link>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
