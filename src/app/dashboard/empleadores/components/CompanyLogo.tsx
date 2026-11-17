"use client";
import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { saveCompanyLogoAction } from "@/actions/company-logo.actions";
import { Button } from "@/components/Button";

export function CompanyLogo({
  empresaId,
  name,
  version,
}: {
  empresaId: string;
  name: string;
  version: string | null;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(
    saveCompanyLogoAction.bind(null, empresaId),
    {},
  );
  const currentVersion = state.version || version;
  const imageUrl = `/api/empleadores/${empresaId}/logo?v=${encodeURIComponent(currentVersion || "")}`;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    else if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  const image = (large = false) =>
    currentVersion ? (
      <Image
        src={imageUrl}
        unoptimized
        width={large ? 480 : 112}
        height={large ? 480 : 112}
        alt={`Logo de ${name}`}
        className={
          large
            ? "max-h-[45dvh] w-full object-contain"
            : "size-28 object-contain p-2"
        }
      />
    ) : (
      <span
        aria-hidden="true"
        className={`flex items-center justify-center bg-muted-surface font-semibold text-subtle ${large ? "h-48 w-full rounded-xl text-5xl" : "size-28 text-3xl"}`}
      >
        {initials || "E"}
      </span>
    );
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Abrir logo de ${name}`}
        title="Abrir imagen"
        className="group relative shrink-0 overflow-hidden rounded-2xl border border-line bg-panel shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {image()}
        <span
          aria-hidden="true"
          className="absolute right-1.5 bottom-1.5 flex size-7 items-center justify-center rounded-full border border-line bg-panel text-secondary shadow-sm"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="size-4"
          >
            <path d="M4 6h4l2-3h4l2 3h4v14H4Z" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </span>
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        aria-labelledby={`logo-title-${empresaId}`}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl border border-line bg-panel p-6 shadow-2xl backdrop:bg-black/40 sm:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              id={`logo-title-${empresaId}`}
              className="text-xl font-semibold"
            >
              Logo del empleador
            </h2>
            <p className="mt-1 break-words text-sm text-muted">{name}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar imagen"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xl text-muted hover:bg-muted-surface"
          >
            ×
          </button>
        </div>
        <div className="mb-6 flex min-h-48 items-center justify-center overflow-hidden rounded-xl border border-line bg-canvas p-4">
          {image(true)}
        </div>
        <form action={action} aria-busy={pending} className="space-y-4">
          <div>
            <label
              htmlFor={`logo-file-${empresaId}`}
              className="mb-2 block text-sm font-medium"
            >
              {currentVersion ? "Cambiar imagen" : "Agregar imagen"}
            </label>
            <input
              id={`logo-file-${empresaId}`}
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp"
              required
              disabled={pending}
              className="block w-full rounded-xl border border-input-line p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted-surface file:px-3 file:py-2"
              aria-describedby={`logo-help-${empresaId}`}
            />
            <p
              id={`logo-help-${empresaId}`}
              className="mt-2 text-xs text-muted"
            >
              PNG, JPG o WebP, hasta 2 MB.
            </p>
          </div>
          {state.error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
            >
              {state.error}
            </p>
          )}
          {state.success && (
            <p
              role="status"
              className="rounded-xl bg-green-50 p-3 text-sm text-green-800"
            >
              {state.success}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-end gap-3">
            {currentVersion && (
              <a
                href={`${imageUrl}&descargar=1`}
                download="logo-empleador.png"
                className="rounded-xl border border-input-line px-4 py-3 text-sm font-medium"
              >
                Descargar imagen
              </a>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar imagen"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
