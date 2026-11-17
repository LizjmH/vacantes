"use client";
import { useActionState, useState } from "react";
import { manageVacancyAction } from "@/actions/vacante.actions";

export function VacancyActions({
  id,
  cubierta,
  archivada,
  hasHistory,
}: {
  id: string;
  cubierta: boolean;
  archivada: boolean;
  hasHistory: boolean;
}) {
  const [confirm, setConfirm] = useState<
    "CUBRIR" | "ARCHIVAR" | "ELIMINAR" | null
  >(null);
  const [state, action, pending] = useActionState(
    manageVacancyAction.bind(null, id),
    {},
  );
  const labels = {
    CUBRIR: "Marcar como cubierta",
    ARCHIVAR: "Archivar vacante",
    ELIMINAR: "Eliminar vacante",
  };
  return (
    <section className="rounded-2xl border border-line bg-panel p-6">
      <h2 className="mb-4 text-lg font-semibold">Administrar vacante</h2>
      {confirm ? (
        <form action={action} aria-busy={pending}>
          <p className="font-medium">¿{labels[confirm]}?</p>
          <p className="mt-2 text-sm text-secondary">
            {confirm === "ELIMINAR"
              ? "La eliminación no se puede deshacer. Para conservar el registro, elige archivar."
              : confirm === "CUBRIR"
                ? "Se cerrará la oferta y se registrará la fecha en su seguimiento."
                : "Dejará de mostrarse entre las vigentes y conservará su historial."}
          </p>
          <input type="hidden" name="accion" value={confirm} />
          <input type="hidden" name="confirmar" value="SI" />
          {state.error && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {state.error}
            </p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirm(null)}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${confirm === "ELIMINAR" ? "bg-red-700" : "bg-brand"}`}
            >
              {pending ? "Procesando…" : "Confirmar"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-3">
          {!cubierta && !archivada && (
            <button
              onClick={() => setConfirm("CUBRIR")}
              type="button"
              className="rounded-xl border px-4 py-3 text-sm"
            >
              Marcar como cubierta
            </button>
          )}
          {!archivada && (
            <button
              onClick={() => setConfirm("ARCHIVAR")}
              type="button"
              className="rounded-xl border px-4 py-3 text-sm"
            >
              Archivar
            </button>
          )}
          {!hasHistory && (
            <button
              onClick={() => setConfirm("ELIMINAR")}
              type="button"
              className="rounded-xl border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              Eliminar
            </button>
          )}
          {hasHistory && (
            <p className="text-sm text-muted">
              La vacante tiene seguimientos o copias recicladas. Se conserva su
              historial y puede archivarse.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
