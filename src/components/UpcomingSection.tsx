import Link from "next/link";
export function UpcomingSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-sm text-muted">Gestión de empleo</p>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 max-w-2xl leading-7 text-secondary">{description}</p>
        <section className="mt-8 rounded-2xl border border-line bg-panel p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Sección pendiente</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Esta sección ya tiene un lugar en el menú. Sus funciones todavía no
            están disponibles.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block text-sm font-medium underline underline-offset-4"
          >
            Volver a Inicio
          </Link>
        </section>
      </div>
    </main>
  );
}
