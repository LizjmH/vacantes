import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { EmployerForm } from "../components/EmployerForm";
export const metadata = { title: "Registrar empleador | Vacantes" };
export default async function NewEmployerPage() {
  const session = await requireSession();
  return (
    <main className="min-h-screen bg-canvas px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard/empleadores"
          className="text-sm text-secondary underline underline-offset-4"
        >
          ← Empleadores
        </Link>
        <div className="my-8">
          <p className="mb-2 text-sm font-medium text-muted">
            Vacantes / Empleadores
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Registrar empleador
          </h1>
          <p className="mt-3 text-secondary">
            Captura sus datos, persona de contacto y domicilio.
          </p>
        </div>
        <EmployerForm draftKey={`empleador:${session.usuario.id}:nuevo`} />
      </div>
    </main>
  );
}
