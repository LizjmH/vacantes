import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { employerSections } from "@/lib/empresa-form";
import { DeleteEmployer } from "../components/DeleteEmployer";
import { CompanyLogo } from "../components/CompanyLogo";
export default async function EmployerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const { guardado } = await searchParams;
  const employer = await prisma.empresa.findUnique({
    where: { id },
    include: {
      contacto: true,
      domicilio: true,
      logo: { select: { actualizadoEl: true } },
      _count: { select: { vacantes: true } },
    },
  });
  if (!employer) notFound();
  const values = {
    ...employer,
    ...employer.contacto,
    ...employer.domicilio,
  } as Record<string, unknown>;
  return (
    <main className="min-h-screen bg-canvas px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard/empleadores"
          className="text-sm underline underline-offset-4"
        >
          ← Empleadores
        </Link>
        {(guardado === "registro" || guardado === "cambios") && (
          <p
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {guardado === "registro"
              ? "Registro completado. El empleador se guardó correctamente."
              : "Cambios guardados correctamente."}
          </p>
        )}
        <header className="my-8 flex flex-col gap-6 rounded-2xl border border-line bg-panel p-6 sm:flex-row sm:p-8">
          <CompanyLogo
            empresaId={id}
            name={
              employer.nombreComercial || employer.razonSocial || employer.rfc
            }
            version={employer.logo?.actualizadoEl.toISOString() || null}
          />
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-sm text-muted">Registro de empleador</p>
            <h1 className="break-words text-3xl font-bold tracking-tight">
              {employer.nombreComercial || employer.razonSocial}
            </h1>
            <p className="mt-3 text-secondary">RFC: {employer.rfc}</p>
            <Link
              href={`/dashboard/vacantes/empresa/${id}`}
              className="mt-5 mr-3 inline-block rounded-xl border border-input-line bg-panel px-5 py-3 text-sm font-semibold"
            >
              Ver vacantes
            </Link>
            <Link
              href={`/dashboard/empleadores/${id}/editar`}
              className="mt-5 inline-block rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white"
            >
              Editar empleador
            </Link>
          </div>
        </header>
        <div className="space-y-6">
          {employerSections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-line bg-panel p-6 sm:p-8"
            >
              <h2 className="mb-6 text-lg font-semibold">{section.title}</h2>
              <dl className="grid gap-6 sm:grid-cols-2">
                {section.fields.map((field) => {
                  const raw = values[field.name];
                  const value =
                    field.options?.find(([key]) => key === raw)?.[1] ?? raw;
                  return (
                    <div
                      key={field.name}
                      className={
                        field.type === "textarea" ? "sm:col-span-2" : ""
                      }
                    >
                      <dt className="text-sm text-muted">{field.label}</dt>
                      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium">
                        {value === null || value === undefined || value === ""
                          ? "Sin capturar"
                          : String(value)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
        </div>
        <div id="eliminar" className="my-8 scroll-mt-6">
          <DeleteEmployer
            id={id}
            name={
              employer.nombreComercial || employer.razonSocial || employer.rfc
            }
            vacancies={employer._count.vacantes}
          />
        </div>
        <Link
          href="/dashboard/empleadores/nuevo"
          className="my-8 inline-block rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white"
        >
          Registrar otro empleador
        </Link>
      </div>
    </main>
  );
}
