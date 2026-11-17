"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { logoutAction } from "@/actions/auth.actions";
import { Icon, type IconName } from "@/components/Icon";

const navigation: { label: string; href: string; icon: IconName }[] = [
  { label: "Inicio", href: "/dashboard", icon: "home" },
  { label: "Empleadores", href: "/dashboard/empleadores", icon: "company" },
  { label: "Vacantes", href: "/dashboard/vacantes", icon: "vacancy" },
  { label: "Seguimiento", href: "/dashboard/seguimiento", icon: "tracking" },
  { label: "Reportes", href: "/dashboard/reportes", icon: "report" },
];
export function DashboardNav({ correo }: { correo: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  function link(item: (typeof navigation)[number]) {
    const active =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-12 items-center gap-3 rounded-lg border-l-4 px-4 py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${active ? "border-brand bg-brand-soft font-semibold text-ink [&>svg]:text-brand-ink" : "border-transparent text-ink hover:bg-muted-surface"}`}
      >
        <Icon name={item.icon} />
        {item.label}
      </Link>
    );
  }
  return (
    <aside className="border-b border-line bg-panel lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0 xl:w-72">
      <div className="flex shrink-0 items-center justify-between px-6 py-6 lg:min-h-24 lg:px-8">
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className="rounded text-xl font-extrabold tracking-tight text-ink focus-visible:outline-2 focus-visible:outline-brand"
        >
          SNE ALTAMIRA
        </Link>
        <button
          ref={toggle}
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="dashboard-navigation"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          title={open ? "Cerrar menú" : "Abrir menú"}
          className="flex size-10 items-center justify-center rounded-xl border border-line text-ink lg:hidden"
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
      <div
        id="dashboard-navigation"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            toggle.current?.focus();
          }
        }}
        className={`${open ? "flex" : "hidden"} flex-col gap-5 px-3 pb-5 lg:flex lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-4`}
      >
        <nav aria-label="Navegación principal" className="space-y-2">
          <p className="px-5 pt-2 pb-4 text-xs font-semibold tracking-wide text-muted uppercase">
            Principal
          </p>
          {navigation.map(link)}
        </nav>
        <div className="mt-5 space-y-4 lg:mt-auto">
          <nav
            aria-label="Administración"
            className="border-t border-line pt-4"
          >
            {link({
              label: "Usuarios",
              href: "/dashboard/usuarios",
              icon: "users",
            })}
          </nav>
          <details className="group relative border-t border-line pt-4">
            <summary className="flex list-none items-center gap-3 rounded-xl px-3 py-2 focus-visible:outline-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {correo.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">
                  Mi cuenta
                </span>
                <span
                  className="block truncate text-[11px] text-muted"
                  title={correo}
                >
                  {correo}
                </span>
              </span>
              <Icon
                name="chevron"
                className="size-4 text-secondary transition-transform group-open:rotate-180"
              />
            </summary>
            <form
              action={logoutAction}
              className="absolute right-0 bottom-full left-0 mb-2 rounded-xl border border-line bg-panel p-2 shadow-lg"
            >
              <button
                type="submit"
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-muted-surface"
              >
                <Icon name="logout" />
                Cerrar sesión
              </button>
            </form>
          </details>
        </div>
      </div>
    </aside>
  );
}
