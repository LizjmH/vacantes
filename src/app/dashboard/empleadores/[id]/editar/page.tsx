import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { employerSections } from "@/lib/empresa-form";
import { EmployerForm } from "../../components/EmployerForm";

export const metadata = { title: "Editar empleador | Vacantes" };
export default async function EditEmployerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const employer = await prisma.empresa.findUnique({
    where: { id },
    include: { contacto: true, domicilio: true },
  });
  if (!employer) notFound();
  const data: Record<string, unknown> = {
    ...employer,
    ...employer.contacto,
    ...employer.domicilio,
  };
  const initialValues = Object.fromEntries(
    employerSections.flatMap((section) =>
      section.fields.map((field) => [
        field.name,
        data[field.name] == null ? "" : String(data[field.name]),
      ]),
    ),
  );
  return (
    <main className="bg-canvas px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/dashboard/empleadores/${id}`}
          className="text-sm underline underline-offset-4"
        >
          ← Volver al registro
        </Link>
        <header className="my-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Editar empleador
          </h1>
          <p className="mt-3 text-secondary">
            {employer.nombreComercial || employer.razonSocial}
          </p>
        </header>
        <EmployerForm
          employerId={id}
          initialValues={initialValues}
          draftKey={`empleador:${session.usuario.id}:${id}`}
        />
      </div>
    </main>
  );
}
