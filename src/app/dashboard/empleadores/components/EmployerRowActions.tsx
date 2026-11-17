"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
const iconClass =
  "flex size-9 items-center justify-center rounded-lg border border-input-line bg-panel text-ink transition-colors hover:bg-muted-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
export function EmployerRowActions({ id, name }: { id: string; name: string }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popover = `employer-actions-${id}`;
  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/dashboard/empleadores/${id}`}
        title="Ver empleador"
        aria-label={`Ver ${name}`}
        className={iconClass}
      >
        <Icon name="eye" />
      </Link>
      <Link
        href={`/dashboard/empleadores/${id}/editar`}
        title="Editar empleador"
        aria-label={`Editar ${name}`}
        className={iconClass}
      >
        <Icon name="edit" />
      </Link>
      <button
        type="button"
        popoverTarget={popover}
        title="Más opciones"
        aria-label={`Más opciones de ${name}`}
        className={iconClass}
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          setPosition({
            left: Math.max(
              8,
              Math.min(box.right - 216, window.innerWidth - 224),
            ),
            top:
              box.bottom + 132 > window.innerHeight
                ? Math.max(8, box.top - 124)
                : box.bottom + 8,
          });
        }}
      >
        <Icon name="more" />
      </button>
      <div
        id={popover}
        popover="auto"
        aria-label={`Opciones de ${name}`}
        style={position}
        className="fixed inset-auto m-0 w-54 rounded-xl border border-line bg-panel p-2 text-sm text-ink shadow-xl"
      >
        <Link
          href={`/dashboard/vacantes/empresa/${id}`}
          className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted-surface"
        >
          <Icon name="vacancy" />
          Ver vacantes
        </Link>
        <Link
          href={`/dashboard/empleadores/${id}#eliminar`}
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-red-700 hover:bg-red-50"
        >
          <Icon name="trash" />
          Eliminar empleador
        </Link>
      </div>
    </div>
  );
}
