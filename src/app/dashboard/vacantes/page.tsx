import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { searchEmployers } from "@/services/empresa-search.service";
import { EmployerSearch } from "../empleadores/components/EmployerSearch";
export const metadata = { title: "Vacantes | Vacantes" };
export default async function VacanciesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string }>;
}) {
  await requireSession();
  const params = await searchParams;
  const query =
    typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const results = query
    ? await searchEmployers(query, Number(params.pagina) || 1)
    : null;
  return (
    <main className="px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight">Vacantes</h1>
        <p className="mt-3 mb-8 text-secondary">
          Busca y selecciona al empleador para consultar o registrar sus
          vacantes.
        </p>
        <EmployerSearch query={query} />
        {results ? (
          <>
            <p className="mb-4 text-sm text-muted">
              {results.total} coincidencias. Selecciona al empleador correcto.
            </p>
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
              {results.employers.map((e) => (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-5"
                >
                  <div>
                    <h2 className="font-semibold">
                      {e.nombreComercial || e.razonSocial}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      RFC: {e.rfc} · Folio: {e.folio || "Sin folio"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {e.contacto.nombres} {e.contacto.apellidos} ·{" "}
                      {e.domicilio.municipio || "Sin municipio"}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/vacantes/empresa/${e.id}`}
                    className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white"
                  >
                    Ver vacantes →
                  </Link>
                </div>
              ))}
              {!results.total && (
                <div className="p-8">
                  <p>No encontramos al empleador.</p>
                  <Link
                    href="/dashboard/empleadores/nuevo"
                    className="mt-4 inline-block text-sm underline underline-offset-4"
                  >
                    Registrar empleador
                  </Link>
                </div>
              )}
            </div>
            {results.pages > 1 && (
              <nav
                aria-label="Resultados de empleadores"
                className="mt-5 flex items-center gap-4"
              >
                <span className="text-sm text-muted">
                  Página {results.page} de {results.pages}
                </span>
                {results.page > 1 && (
                  <Link
                    href={`?q=${encodeURIComponent(query)}&pagina=${results.page - 1}`}
                    className="text-sm underline"
                  >
                    Anterior
                  </Link>
                )}
                {results.page < results.pages && (
                  <Link
                    href={`?q=${encodeURIComponent(query)}&pagina=${results.page + 1}`}
                    className="text-sm underline"
                  >
                    Siguiente
                  </Link>
                )}
              </nav>
            )}
          </>
        ) : (
          <section className="rounded-2xl border border-dashed border-input-line bg-panel p-8">
            <h2 className="font-semibold">Primero elige un empleador</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Puedes buscar por folio, RFC, correo, nombre o teléfono. También
              puedes abrir las vacantes desde el registro de un empleador.
            </p>
            <Link
              href="/dashboard/empleadores"
              className="mt-5 inline-block text-sm underline underline-offset-4"
            >
              Ir a Empleadores
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
