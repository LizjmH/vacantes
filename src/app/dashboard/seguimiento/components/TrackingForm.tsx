"use client";
import {
  useActionState,
  useEffect,
  useState,
  type SyntheticEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  trackingNames,
  trackingResults,
  type TrackingState,
} from "@/lib/tracking-form";
import { recordTrackingAction } from "@/actions/seguimiento.actions";
import { Button } from "@/components/Button";

const inputClass =
  "min-h-12 w-full rounded-xl border border-input-line bg-panel px-4 py-3 text-sm outline-offset-4 focus-visible:outline-2 aria-invalid:border-red-500";
export function TrackingForm({
  vacanteId,
  version,
  requestId,
  userId,
  cubierta,
  puesto,
}: {
  vacanteId: string;
  version: string;
  requestId: string;
  userId: string;
  cubierta: boolean;
  puesto: string;
}) {
  const router = useRouter();
  const key = `seguimiento:${userId}:${vacanteId}`;
  const [ready, setReady] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({
    resultado: "PENDIENTE",
    comentario: "",
    nombre: "",
    curp: "",
    puesto,
    fechaFin: "",
    reabrir: "NO",
    solicitudId: requestId,
  });
  const [state, action, pending] = useActionState(
    async (previous: TrackingState, data: FormData) => {
      const result = await recordTrackingAction(
        vacanteId,
        version,
        previous,
        data,
      );
      if (result.savedId) {
        try {
          sessionStorage.removeItem(key);
        } catch {
          /* Optional local storage. */
        }
        router.push(
          `/dashboard/seguimiento/${vacanteId}?guardado=${result.savedId}`,
        );
      }
      return result;
    },
    {},
  );
  useEffect(() => {
    let active = true;
    let restored: Record<string, string> = {};
    try {
      const raw = sessionStorage.getItem(key);
      const data = raw && raw.length < 20000 ? JSON.parse(raw) : null;
      if (data?.version === 1 && data.values) {
        restored = Object.fromEntries(
          trackingNames
            .filter((name) => typeof data.values[name] === "string")
            .map((name) => [name, data.values[name].slice(0, 4000)]),
        );
      }
    } catch {
      /* Keep the form available when storage is blocked. */
    }
    queueMicrotask(() => {
      if (active) {
        setValues((current) => ({ ...current, ...restored }));
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, [key]);
  function change(event: SyntheticEvent<HTMLFormElement>) {
    const el = event.target;
    if (!(
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement
    ))
      return;
    const value =
      el instanceof HTMLInputElement && el.type === "checkbox"
        ? el.checked
          ? "SI"
          : "NO"
        : el.value;
    const next = { ...values, [el.name]: value };
    setValues(next);
    try {
      sessionStorage.setItem(key, JSON.stringify({ version: 1, values: next }));
    } catch {
      /* Keep editing. */
    }
  }
  function keyboard(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || event.altKey)
      return;
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      if (ready && !pending && !event.repeat)
        event.currentTarget.requestSubmit();
      return;
    }
    if (
      !(event.target instanceof HTMLInputElement) ||
      event.target.type === "checkbox"
    )
      return;
    event.preventDefault();
    const fields = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]),select,textarea,button[type="submit"]',
      ),
    ).filter((el) => !el.matches(":disabled") && el.getClientRects().length);
    const index = fields.indexOf(event.target);
    if (index >= 0 && !event.repeat)
      fields[index + (event.shiftKey ? -1 : 1)]?.focus();
  }
  function field(name: string, label: string, type = "text", max = 200) {
    return (
      <div>
        <label
          htmlFor={`tracking-${name}`}
          className="mb-2 block text-sm font-medium"
        >
          {label}
        </label>
        {type === "textarea" ? (
          <textarea
            id={`tracking-${name}`}
            name={name}
            value={values[name] || ""}
            onChange={() => {}}
            rows={4}
            maxLength={max}
            className={inputClass}
          />
        ) : (
          <input
            id={`tracking-${name}`}
            name={name}
            value={values[name] || ""}
            onChange={() => {}}
            type={type}
            maxLength={max}
            className={inputClass}
          />
        )}
        {state.errors?.[name] && (
          <p className="mt-2 text-sm text-red-700">{state.errors[name]}</p>
        )}
      </div>
    );
  }
  return (
    <form
      action={action}
      onInput={change}
      onChange={change}
      onKeyDown={keyboard}
      aria-busy={pending}
      className="rounded-2xl border border-line bg-panel p-5 sm:p-8"
    >
      <h2 className="mb-6 text-lg font-semibold">Registrar seguimiento</h2>
      {state.error && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {state.error}
        </p>
      )}
      <fieldset disabled={pending || !ready} className="space-y-5">
        <input type="hidden" name="solicitudId" value={values.solicitudId} />
        <div>
          <label
            htmlFor="tracking-resultado"
            className="mb-2 block text-sm font-medium"
          >
            Resultado *
          </label>
          <select
            id="tracking-resultado"
            name="resultado"
            value={values.resultado}
            onChange={() => {}}
            required
            className={inputClass}
          >
            {trackingResults.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          {state.errors?.resultado && (
            <p className="mt-2 text-sm text-red-700">
              {state.errors.resultado}
            </p>
          )}
        </div>
        {field("comentario", "Observaciones del contacto", "textarea", 4000)}
        {values.resultado === "VIGENTE" && (
          <>
            {field("fechaFin", "Nueva fecha final (opcional)", "date")}
            {cubierta && (
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  name="reabrir"
                  value="SI"
                  checked={values.reabrir === "SI"}
                  onChange={() => {}}
                  className="size-4"
                />
                Confirmo que deseo reabrir esta vacante como vigente.
              </label>
            )}
          </>
        )}
        {values.resultado === "CUBIERTA" && (
          <section className="space-y-4 border-t border-line pt-5">
            <h3 className="font-medium">Datos de colocación (opcionales)</h3>
            {field("nombre", "Nombre de la persona colocada")}
            {field("curp", "CURP de la persona colocada", "text", 18)}
            {field("puesto", "Puesto de colocación")}
          </section>
        )}
        <div className="flex justify-end">
          <Button type="submit" aria-keyshortcuts="Control+Enter Meta+Enter">
            {pending ? "Guardando…" : "Guardar seguimiento"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
