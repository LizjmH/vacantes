import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { vacancyValues } from "@/services/vacante.service";
import { VacancyForm } from "../../components/VacancyForm";
export default async function EditVacancyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const vacancy = await prisma.vacante.findUnique({
    where: { id },
    include: {
      mediosContacto: true,
      empresa: { select: { nombreComercial: true, razonSocial: true } },
    },
  });
  if (!vacancy) notFound();
  return (
    <main className="px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/dashboard/vacantes/${id}`}
          className="text-sm underline underline-offset-4"
        >
          ← Volver a la vacante
        </Link>
        <header className="my-8">
          <p className="mb-2 text-sm text-muted">
            {vacancy.empresa.nombreComercial || vacancy.empresa.razonSocial}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Editar vacante</h1>
        </header>
        <VacancyForm
          key={id}
          context={{ empresaId: vacancy.empresaId, id }}
          initialValues={vacancyValues(vacancy)}
          draftKey={`vacante:${session.usuario.id}:${id}:editar`}
        />
      </div>
    </main>
  );
}
