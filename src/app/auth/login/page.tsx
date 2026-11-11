import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "./components/LoginForm";
export const metadata = { title: "Iniciar sesión | Vacantes" };
export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");
  const count = await prisma.usuario.count().catch(() => null);
  const hasUsers = count !== null && count > 0;
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="flex w-full max-w-lg flex-col items-center gap-9 rounded-3xl border border-neutral-200 bg-white px-6 py-10 shadow-2xl shadow-neutral-200/60 sm:p-14">
        <div className="flex items-center gap-3 self-start">
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-xl bg-neutral-900 text-xl font-bold text-white"
          >
            SNE
          </span>
          <span className="text-2xl font-extrabold tracking-tight">
            SERVICIO NACIONAL DEL EMPLEO
          </span>
        </div>
        {count === null && (
          <p
            role="status"
            className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
          >
            El sistema no está disponible en este momento. Inténtalo de nuevo
            más tarde.
          </p>
        )}
        <LoginForm />
        {count !== null && !hasUsers && (
          <Link
            href="/auth/setup"
            className="text-sm underline underline-offset-4"
          >
            Configurar primera cuenta
          </Link>
        )}
      </div>
    </main>
  );
}
