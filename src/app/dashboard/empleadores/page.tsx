import Link from "next/link";
import Image from "next/image";
import { requireSession } from "@/lib/auth";
import { searchEmployers } from "@/services/empresa-search.service";
import { EmployerSearch } from "./components/EmployerSearch";
import { EmployerRowActions } from "./components/EmployerRowActions";
import { Icon } from "@/components/Icon";
export const metadata = { title: "Empleadores | SNE Altamira" };
export default async function EmployersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; pagina?: string | string[] }>;
}) {
  await requireSession();
  const params = await searchParams;
  const query =
    typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const requested =
    typeof params.pagina === "string" ? Number(params.pagina) : 1;
  const { employers, total, page, pages } = await searchEmployers(
    query,
    requested,
  );
  const pageLink = (number: number) =>
    `/dashboard/empleadores?${new URLSearchParams({ ...(query ? { q: query } : {}), pagina: String(number) })}`;
  return (
    <main className="px-5 py-7 sm:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <p className="mb-6 flex items-center gap-3 text-sm text-muted">
          <span>Directorio</span>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-ink">Empleadores</span>
        </p>
        <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Empleadores
            </h1>
            <p className="mt-2 text-base text-muted">
              Consulta y administra la información de tus empleadores.
            </p>
          </div>
          <Link
            href="/dashboard/empleadores/nuevo"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Icon name="plus" />
            Registrar empleador
          </Link>
        </header>
        <EmployerSearch query={query} />
        <section className="rounded-2xl border border-line bg-panel p-3 shadow-sm shadow-black/[0.02] sm:p-5">
          <div className="flex flex-wrap items-center gap-3 px-1 pt-1 pb-6 sm:px-1">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              Directorio de empleadores
            </h2>
            <span
              role="status"
              className="rounded-lg bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-ink"
            >
              {total} {total === 1 ? "registro" : "registros"}
            </span>
          </div>
          {employers.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-210 text-left text-sm">
                <caption className="sr-only">
                  Directorio de empleadores{query ? ` para ${query}` : ""}
                </caption>
                <thead className="bg-muted-surface text-secondary">
                  <tr>
                    {[
                      "Empleador",
                      "RFC / Folio",
                      "Municipio",
                      "Contacto",
                      "Acciones",
                    ].map((label, index) => (
                      <th
                        key={label}
                        scope="col"
                        className={`px-4 py-4 font-semibold first:rounded-l-lg last:rounded-r-lg ${index === 4 ? "text-right" : ""}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {employers.map((e) => {
                    const name = e.nombreComercial || e.razonSocial || e.rfc;
                    const initials = name
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join("")
                      .toUpperCase();
                    const email = e.contacto.correo || e.correoGeneral;
                    const phone = e.contacto.celular || e.contacto.telefonoFijo;
                    return (
                      <tr
                        key={e.id}
                        className="transition-colors hover:bg-muted-surface/40"
                      >
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-3">
                            {e.logo ? (
                              <Image
                                src={`/api/empleadores/${e.id}/logo?v=${encodeURIComponent(e.logo.actualizadoEl.toISOString())}`}
                                unoptimized
                                width={44}
                                height={44}
                                alt={`Logo de ${name}`}
                                className="size-11 shrink-0 rounded-xl border border-line bg-panel object-contain p-1"
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-sm font-bold text-brand-ink"
                              >
                                {initials}
                              </span>
                            )}
                            <div className="min-w-40">
                              <Link
                                href={`/dashboard/empleadores/${e.id}`}
                                className="font-semibold text-ink hover:underline"
                              >
                                {name}
                              </Link>
                              <p className="mt-1 text-xs text-muted">
                                {e.tipoPersona === "MORAL"
                                  ? "Persona moral"
                                  : e.tipoPersona === "FISICA"
                                    ? "Persona física"
                                    : "Empleador"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <p className="whitespace-nowrap font-semibold text-ink">
                            {e.rfc}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            Folio: {e.folio || "Sin folio"}
                          </p>
                        </td>
                        <td className="px-4 py-5 text-ink">
                          {e.domicilio.municipio || "Sin capturar"}
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-ink">{email}</p>
                          <p className="mt-1 text-xs text-muted">
                            {phone ? `Tel. ${phone}` : "Sin teléfono"}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {e.contacto.nombres} {e.contacto.apellidos}
                          </p>
                        </td>
                        <td className="px-4 py-5">
                          <EmployerRowActions id={e.id} name={name} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
              <h3 className="font-semibold text-ink">
                {query
                  ? "No encontramos coincidencias"
                  : "Todavía no hay empleadores"}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {query
                  ? "Prueba con otra parte del nombre, RFC, folio o teléfono."
                  : "Registra el primero para después asociar sus vacantes."}
              </p>
              {query && (
                <Link
                  href="/dashboard/empleadores"
                  className="mt-5 inline-block text-sm text-brand-ink underline underline-offset-4"
                >
                  Ver todos los empleadores
                </Link>
              )}
            </div>
          )}
          <footer className="mt-2 flex flex-wrap items-center justify-between gap-4 border-t border-line px-2 pt-5 pb-2">
            <p className="text-sm text-muted">
              Mostrando{" "}
              {employers.length
                ? `${(page - 1) * 20 + 1}–${(page - 1) * 20 + employers.length}`
                : "0"}{" "}
              de {total} {query ? "coincidencias" : "empleadores"}
            </p>
            {pages > 1 && (
              <nav
                aria-label="Páginas de empleadores"
                className="flex items-center gap-3"
              >
                <span className="text-xs text-muted">
                  {page} / {pages}
                </span>
                {page > 1 && (
                  <Link
                    href={pageLink(page - 1)}
                    className="rounded-lg border border-line px-3 py-2 text-sm text-ink hover:bg-muted-surface"
                  >
                    Anterior
                  </Link>
                )}
                {page < pages && (
                  <Link
                    href={pageLink(page + 1)}
                    className="rounded-lg border border-line px-3 py-2 text-sm text-ink hover:bg-muted-surface"
                  >
                    Siguiente
                  </Link>
                )}
              </nav>
            )}
          </footer>
        </section>
      </div>
    </main>
  );
}
