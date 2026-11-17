"use client";
import { useActionState, useState } from "react";
import { deleteEmployerAction } from "@/actions/empresa.actions";

export function DeleteEmployer({
  id,
  name,
  vacancies,
}: {
  id: string;
  name: string;
  vacancies: number;
}) {
  const [confirm, setConfirm] = useState(false);
  const [state, action, pending] = useActionState(
    deleteEmployerAction.bind(null, id),
    {},
  );
  if (vacancies > 0)
    return (
      <p className="text-sm text-muted">
        Este empleador tiene {vacancies} vacante(s) asociada(s) y no se puede
        eliminar.
      </p>
    );
  return (
    <div>
      {!confirm ? (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="rounded-xl border border-red-200 bg-panel px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Eliminar empleador
        </button>
      ) : (
        <form
          action={action}
          className="rounded-xl border border-red-200 bg-red-50 p-5"
          aria-busy={pending}
        >
          <h2 className="font-semibold text-red-900">¿Eliminar a {name}?</h2>
          <p className="mt-2 text-sm text-red-800">
            Se eliminarán el registro, su contacto y su domicilio. Esta acción
            no se puede deshacer.
          </p>
          <input type="hidden" name="confirmar" value="si" />
          {state.error && (
            <p role="alert" className="mt-3 text-sm text-red-800">
              {state.error}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirm(false)}
              className="rounded-lg border border-input-line bg-panel px-4 py-2 text-sm disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Eliminando…" : "Sí, eliminar empleador"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
