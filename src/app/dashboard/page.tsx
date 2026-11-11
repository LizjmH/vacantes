import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { logoutAction } from "@/actions/auth.actions";
import { Button } from "@/components/Button";
export default async function DashboardPage() {
  const session = await requireSession();
  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4 sm:px-10">
        <span className="text-xl font-extrabold tracking-tight">Vacantes</span>
        <form action={logoutAction}>
          <Button type="submit">Cerrar sesión</Button>
        </form>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-14">
        <p className="mb-3 text-sm text-neutral-500">Acceso al sistema</p>
        <h1 className="text-3xl font-bold tracking-tight">Sesión iniciada</h1>
        <p className="mt-4 break-words text-neutral-600">
          Ingresaste con {session.usuario.correo}.
        </p>
        <Link
          href="/dashboard/usuarios"
          className="mt-6 inline-block rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium hover:bg-neutral-100"
        >
          Agregar usuario →
        </Link>
        <p className="mt-6 text-sm text-neutral-500">
          Aquí se integrarán las pantallas de empleadores, vacantes, seguimiento
          y reportes.
        </p>
      </section>
    </main>
  );
}
