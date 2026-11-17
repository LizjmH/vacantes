import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth";
import { DashboardNav } from "./components/DashboardNav";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();
  return (
    <div className="min-h-screen bg-canvas text-ink lg:flex">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-lg bg-brand p-3 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Ir al contenido
      </a>
      <DashboardNav correo={session.usuario.correo} />
      <div className="min-w-0 flex-1">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-line bg-panel px-5 py-3 sm:px-8">
          <p className="text-sm text-muted">Sistema de gestión de empleo</p>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span
              title={session.usuario.correo}
              aria-label={`Cuenta: ${session.usuario.correo}`}
              className="flex size-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
            >
              {session.usuario.correo.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>
        <div id="contenido" tabIndex={-1} className="outline-none">
          {children}
        </div>
      </div>
    </div>
  );
}
