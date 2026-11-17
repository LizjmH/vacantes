import Link from "next/link";
import { requireSession } from "@/lib/auth";
export const metadata = { title: "Inicio | Vacantes" };
export default async function DashboardPage() {
  await requireSession();
  return (
    <main className="px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-sm font-medium text-muted">Inicio</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Resumen de actividad
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-secondary">
          Administra la información de empleadores y organiza el registro y
          seguimiento de sus vacantes.
        </p>
        <section className="mt-10 overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="border-b border-line px-6 py-5">
            <h2 className="text-lg font-semibold">Empleadores</h2>
            <p className="mt-1 text-sm text-muted">
              Directorio de empresas e instituciones.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-5 px-6 py-6">
            <p className="max-w-md text-sm leading-6 text-secondary">
              Consulta los registros existentes o captura los datos de un nuevo
              empleador, su contacto y domicilio.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/empleadores"
                className="rounded-xl border border-input-line px-4 py-3 text-sm font-medium hover:bg-muted-surface"
              >
                Ver empleadores
              </Link>
              <Link
                href="/dashboard/empleadores/nuevo"
                className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                Registrar empleador
              </Link>
            </div>
          </div>
        </section>
        <section className="mt-8 rounded-2xl border border-line bg-panel p-6">
          <h2 className="text-lg font-semibold">Vacantes</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Selecciona un empleador para consultar, registrar o reciclar sus
            ofertas de trabajo.
          </p>
          <Link
            href="/dashboard/vacantes"
            className="mt-5 inline-block rounded-xl border border-input-line px-4 py-3 text-sm font-medium"
          >
            Buscar empleador y ver vacantes →
          </Link>
        </section>
        <section className="mt-8 rounded-2xl border border-line p-6">
          <h2 className="font-semibold">Seguimiento</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Registra el resultado de cada contacto y consulta las vacantes
            pendientes, por vencer o cubiertas.
          </p>
          <Link
            href="/dashboard/seguimiento"
            className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
          >
            Abrir seguimiento →
          </Link>
        </section>
      </div>
    </main>
  );
}
