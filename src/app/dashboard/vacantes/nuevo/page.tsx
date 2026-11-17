import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { vacancyValues } from "@/services/vacante.service";
import { todayInMexico, monthAfter } from "@/lib/vacancy-form";
import { VacancyForm } from "../components/VacancyForm";
export default async function NewVacancyPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string; reciclar?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  if (typeof params.empresa !== "string") notFound();
  const employer = await prisma.empresa.findUnique({
    where: { id: params.empresa },
    include: { contacto: true, domicilio: true },
  });
  if (!employer) notFound();
  const sourceId =
    typeof params.reciclar === "string" ? params.reciclar : undefined;
  const source = sourceId
    ? await prisma.vacante.findFirst({
        where: { id: sourceId, empresaId: employer.id },
        include: { mediosContacto: true },
      })
    : null;
  if (sourceId && !source) notFound();
  const today = todayInMexico();
  const initial = source
    ? vacancyValues(source, true)
    : {
        fechaReinicio: today,
        fechaFin: monthAfter(today),
        plazas: "1",
        sexo: "INDISTINTO",
        experiencia: "NINGUNA",
        aceptaDiscapacidad: "NO",
        municipio: employer.domicilio.municipio ?? "",
        direccion: [
          employer.domicilio.calle,
          employer.domicilio.numeroExterior,
          employer.domicilio.colonia,
          employer.domicilio.municipio,
        ]
          .filter(Boolean)
          .join(", "),
        medio_CORREO:
          employer.contacto.correo || employer.correoGeneral ? "SI" : "NO",
      };
  return (
    <main className="px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/dashboard/vacantes/empresa/${employer.id}`}
          className="text-sm underline underline-offset-4"
        >
          ← Vacantes del empleador
        </Link>
        <header className="my-8">
          <p className="mb-2 text-sm text-muted">
            {employer.nombreComercial || employer.razonSocial} · RFC:{" "}
            {employer.rfc}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {source ? "Reciclar vacante" : "Registrar vacante"}
          </h1>
          {source && (
            <p className="mt-3 text-sm leading-6 text-secondary">
              Revisa las plazas, el sueldo y las fechas. Al guardar se creará
              una nueva oferta y se conservará la original.
            </p>
          )}
        </header>
        <VacancyForm
          key={`${employer.id}:${sourceId || "nueva"}`}
          context={{ empresaId: employer.id, origenId: sourceId }}
          initialValues={initial}
          draftKey={`vacante:${session.usuario.id}:${employer.id}:nueva:${sourceId || "original"}`}
        />
      </div>
    </main>
  );
}
