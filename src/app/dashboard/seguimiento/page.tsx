import Link from "next/link";
import { requireSession } from "@/lib/auth";
import {
  searchTracking,
  trackingFilters,
} from "@/services/seguimiento.service";
import { vacancyStatus } from "@/lib/vacancy-form";
export const metadata = { title: "Seguimiento | Vacantes" };
export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; pagina?: string }>;
}) {
  await requireSession();
  const params = await searchParams;
  const query =
    typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const filter =
    typeof params.estado === "string" &&
    trackingFilters.some(([key]) => key === params.estado)
      ? params.estado
      : "activas";
  const { rows, total, page, pages } = await searchTracking(
    query,
    filter,
    Number(params.pagina) || 1,
  );
  const pageUrl = (n: number) =>
    `?${new URLSearchParams({ q: query, estado: filter, pagina: String(n) })}`;
  const labels: Record<string, string> = {
    PENDIENTE: "Pendiente",
    VIGENTE: "Disponible",
    CUBIERTA: "Cubierta",
  };
  return (
    <main className="px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight">Seguimiento</h1>
        <p className="mt-3 mb-7 text-secondary">
          Consulta las vacantes y registra el resultado de cada contacto con el
          empleador.
        </p>
        <form
          role="search"
          aria-label="Buscar vacantes para seguimiento"
          className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-panel p-5"
        >
          <div className="min-w-44 flex-1">
            <label
              htmlFor="tracking-search"
              className="mb-2 block text-sm font-medium"
            >
              Buscar vacante o empleador
            </label>
            <input
              id="tracking-search"
              type="search"
              name="q"
              defaultValue={query}
              maxLength={200}
              placeholder="Puesto, folio, RFC, empresa, correo o teléfono…"
              className="min-h-12 w-full rounded-xl border border-input-line px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="tracking-filter"
              className="mb-2 block text-sm font-medium"
            >
              Mostrar
            </label>
            <select
              id="tracking-filter"
              name="estado"
              defaultValue={filter}
              className="min-h-12 rounded-xl border border-input-line bg-panel px-4 py-3 text-sm"
            >
              {trackingFilters.map(([key, label]) => (
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
            Buscar
          </button>
          <Link
            href="/dashboard/seguimiento"
            className="px-3 py-3 text-sm underline"
          >
            Limpiar
          </Link>
        </form>
        <p className="mb-4 text-sm text-muted">
          {total} {total === 1 ? "vacante encontrada" : "vacantes encontradas"}
        </p>
        {rows.length ? (
          <div className="overflow-x-auto rounded-2xl border border-line bg-panel">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Vacantes para seguimiento</caption>
              <thead className="border-b bg-muted-surface text-secondary">
                <tr>
                  {[
                    "Vacante / Empleador",
                    "Estado",
                    "Fecha final",
                    "Último contacto",
                    "Resultado",
                    "Acción",
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
                      <p className="font-medium">{v.puesto}</p>
                      <p className="mt-1 text-xs text-muted">
                        {v.empresa.nombreComercial || v.empresa.razonSocial}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {v.idSilap || "Sin folio"} · {v.empresa.rfc}
                      </p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {vacancyStatus(v)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {v.fechaFin?.toLocaleDateString("es-MX", {
                        timeZone: "UTC",
                      }) || "—"}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {v.seguimientos[0]?.fecha.toLocaleDateString("es-MX", {
                        timeZone: "America/Mexico_City",
                      }) || "Sin seguimiento"}
                    </td>
                    <td className="px-5 py-4">
                      {v.seguimientos[0]
                        ? labels[v.seguimientos[0].resultado]
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/seguimiento/${v.id}`}
                        className="whitespace-nowrap underline underline-offset-4"
                        aria-label={`Dar seguimiento a ${v.puesto}`}
                      >
                        {v.archivada ? "Ver historial" : "Dar seguimiento"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <section className="rounded-2xl border border-dashed border-input-line bg-panel p-8">
            <h2 className="font-semibold">No hay vacantes con estos filtros</h2>
            <p className="mt-2 text-sm text-muted">
              Prueba otra búsqueda o cambia el filtro para consultar cubiertas y
              archivadas.
            </p>
            <Link
              href="/dashboard/vacantes"
              className="mt-5 inline-block text-sm underline underline-offset-4"
            >
              Ir a Vacantes
            </Link>
          </section>
        )}
        {pages > 1 && (
          <nav
            aria-label="Páginas de seguimiento"
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
