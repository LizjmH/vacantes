import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { vacancyValues } from "@/services/vacante.service";
import {
  vacancySections,
  contactTypes,
  vacancyStatus,
  workDaysLabel,
} from "@/lib/vacancy-form";

export default async function VacancyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const v = await prisma.vacante.findUnique({
    where: { id },
    include: {
      empresa: { include: { contacto: true } },
      mediosContacto: true,
    },
  });
  if (!v) notFound();
  const values = vacancyValues(v);
  return (
    <main className="px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/dashboard/vacantes/empresa/${v.empresaId}`}
          className="text-sm underline underline-offset-4"
        >
          ← Vacantes del empleador
        </Link>
        <header className="my-8">
          <p className="mb-2 text-sm text-muted">
            {v.empresa.nombreComercial || v.empresa.razonSocial}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{v.puesto}</h1>
          <p className="mt-3 text-sm text-muted">
            {vacancyStatus(v)} · {v.plazas} plazas ·{" "}
            {v.idSilap || "Sin folio externo"}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/seguimiento/${id}`}
              className="rounded-xl border border-input-line bg-panel px-5 py-3 text-sm font-medium"
            >
              Dar seguimiento
            </Link>
            <Link
              href={`/dashboard/vacantes/${id}/editar`}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white"
            >
              Editar
            </Link>
            <Link
              href={`/dashboard/vacantes/nuevo?empresa=${v.empresaId}&reciclar=${id}`}
              className="rounded-xl border border-input-line bg-panel px-5 py-3 text-sm font-medium"
            >
              Reciclar vacante
            </Link>
            {v.origenVacanteId && (
              <Link
                href={`/dashboard/vacantes/${v.origenVacanteId}`}
                className="px-4 py-3 text-sm underline"
              >
                Ver vacante original
              </Link>
            )}
          </div>
        </header>
        <div className="space-y-6">
          {vacancySections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-line bg-panel p-6"
            >
              <h2 className="mb-5 text-lg font-semibold">{section.title}</h2>
              <dl className="grid gap-5 sm:grid-cols-2">
                {section.fields.map((field) => {
                  if (
                    field.name === "tipoDiscapacidad" &&
                    !v.aceptaDiscapacidad
                  )
                    return null;
                  const raw = values[field.name];
                  const value =
                    field.name === "diasTrabajo"
                      ? workDaysLabel(raw)
                      : (field.options?.find(([key]) => key === raw)?.[1] ??
                        raw);
                  return (
                    <div
                      key={field.name}
                      className={
                        field.type === "textarea" ? "sm:col-span-2" : ""
                      }
                    >
                      <dt className="text-sm text-muted">{field.label}</dt>
                      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium">
                        {field.type === "date" && value
                          ? value.split("-").reverse().join("/")
                          : value || "Sin capturar"}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
          <section className="rounded-2xl border border-line bg-panel p-6">
            <h2 className="mb-4 text-lg font-semibold">Contacto</h2>
            <p className="text-sm">
              {v.empresa.contacto.nombres} {v.empresa.contacto.apellidos} ·{" "}
              {v.empresa.contacto.correo || v.empresa.correoGeneral}
            </p>
            <p className="mt-2 text-sm text-secondary">
              {[v.empresa.contacto.telefonoFijo, v.empresa.contacto.celular]
                .filter(Boolean)
                .join(" · ") || "Sin teléfono capturado"}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {v.mediosContacto.map((m) => (
                <li key={m.id}>
                  {contactTypes.find(([key]) => key === m.tipo)?.[1] || m.tipo}:{" "}
                  {m.horario || "Sin horario adicional"}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
