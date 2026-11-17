"use client";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { saveVacancyAction } from "@/actions/vacante.actions";
import {
  vacancySections,
  vacancyFieldNames,
  contactTypes,
  workDays,
  experienceOptions,
  changeVacancyValue,
  type VacancyState,
} from "@/lib/vacancy-form";
import type { VacancyContext } from "@/services/vacante.service";
import { Button } from "@/components/Button";

const inputClass =
  "min-h-12 w-full rounded-xl border border-input-line bg-panel px-4 py-3 text-sm outline-offset-4 focus-visible:outline-2 aria-invalid:border-red-500 read-only:bg-muted-surface";
export function VacancyForm({
  context,
  initialValues,
  draftKey,
}: {
  context: VacancyContext;
  initialValues: Record<string, string>;
  draftKey: string;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [state, action, pending] = useActionState(
    async (previous: VacancyState, form: FormData) => {
      const result = await saveVacancyAction(context, previous, form);
      if (result.savedId) {
        try {
          window.sessionStorage.removeItem(draftKey);
        } catch {
          /* Optional browser storage. */
        }
        router.push(`/dashboard/vacantes/${result.savedId}`);
      }
      return result;
    },
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    let active = true;
    try {
      const raw = window.sessionStorage.getItem(draftKey);
      const draft = raw && raw.length < 100000 ? JSON.parse(raw) : null;
      if (
        (draft?.version === 1 || draft?.version === 2) &&
        draft.values &&
        typeof draft.values === "object"
      ) {
        const safe: Record<string, string> = {};
        for (const name of vacancyFieldNames)
          if (typeof draft.values[name] === "string")
            safe[name] = draft.values[name].slice(0, 4000);
        if (draft.version === 1) {
          const years = Number(draft.values.experienciaAnios);
          if (Number.isInteger(years) && years >= 0)
            safe.experiencia =
              experienceOptions[
                years === 0
                  ? 0
                  : years === 1
                    ? 1
                    : years <= 3
                      ? 2
                      : years <= 5
                        ? 3
                        : 4
              ][0];
          // A count of days in the old form cannot identify selected weekdays.
          safe.diasTrabajo = "";
        }
        queueMicrotask(() => {
          if (active) setValues((current) => ({ ...current, ...safe }));
        });
      }
    } catch {
      /* Storage failures do not prevent manual capture. */
    }
    queueMicrotask(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, [draftKey]);
  function change(event: SyntheticEvent<HTMLFormElement>) {
    const control = event.target;
    if (
      !(
        control instanceof HTMLInputElement ||
        control instanceof HTMLSelectElement ||
        control instanceof HTMLTextAreaElement
      ) ||
      control.name === "confirmarDuplicada"
    )
      return;
    const value =
      control instanceof HTMLInputElement && control.type === "checkbox"
        ? control.checked
          ? "SI"
          : "NO"
        : control.value;
    let next = changeVacancyValue(values, control.name, value);
    if (control instanceof HTMLInputElement && control.name === "diaTrabajo") {
      const bit = Number(control.value);
      const mask = Number(values.diasTrabajo || 0);
      next = {
        ...values,
        diasTrabajo: String(control.checked ? mask | bit : mask & ~bit),
      };
    }
    setValues(next);
    try {
      window.sessionStorage.setItem(
        draftKey,
        JSON.stringify({ version: 2, values: next }),
      );
    } catch {
      /* Keep editing when storage is blocked. */
    }
  }
  function keyboard(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.altKey || event.nativeEvent.isComposing)
      return;
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      if (!pending && !event.repeat) event.currentTarget.requestSubmit();
      return;
    }
    if (
      !(event.target instanceof HTMLInputElement) ||
      event.target.type === "checkbox"
    )
      return;
    event.preventDefault();
    if (event.repeat || pending) return;
    const fields = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]), select, textarea, button[type="submit"]',
      ),
    ).filter(
      (field) =>
        !field.matches(":disabled") &&
        field.tabIndex >= 0 &&
        field.getClientRects().length,
    );
    const index = fields.indexOf(event.target);
    if (index >= 0) fields[index + (event.shiftKey ? -1 : 1)]?.focus();
  }
  return (
    <form
      ref={formRef}
      action={action}
      onChange={change}
      onInput={change}
      onKeyDown={keyboard}
      aria-busy={pending}
      className="space-y-6"
    >
      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {state.error}
          {state.duplicateId && (
            <>
              <Link
                href={`/dashboard/vacantes/${state.duplicateId}`}
                className="mt-2 block underline underline-offset-4"
              >
                Ver oferta existente
              </Link>
              <label className="mt-4 flex items-start gap-3">
                <input
                  type="checkbox"
                  name="confirmarDuplicada"
                  value="SI"
                  className="mt-1 size-4"
                />
                Confirmo que es otra oferta independiente y quiero guardarla.
              </label>
            </>
          )}
        </div>
      )}
      {vacancySections.map((section) => (
        <fieldset
          key={section.title}
          disabled={pending || !ready}
          className="rounded-2xl border border-line bg-panel p-5 sm:p-8"
        >
          <legend className="px-2 text-lg font-semibold">
            {section.title}
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            {section.fields.map((field) => {
              if (
                field.name === "tipoDiscapacidad" &&
                values.aceptaDiscapacidad !== "SI"
              )
                return null;
              const error = state.errors?.[field.name];
              const common = {
                id: field.name,
                name: field.name,
                required: field.required,
                value: values[field.name] ?? "",
                "aria-invalid": !!error,
                "aria-describedby": error ? `${field.name}-error` : undefined,
                className: inputClass,
                onChange: () => {},
              };
              return (
                <div
                  key={field.name}
                  className={field.type === "textarea" ? "sm:col-span-2" : ""}
                >
                  {field.name === "diasTrabajo" ? (
                    <fieldset>
                      <legend className="mb-2 text-sm font-medium">
                        {field.label}
                      </legend>
                      <input
                        type="hidden"
                        name="diasTrabajo"
                        value={values.diasTrabajo || "0"}
                      />
                      <div className="flex flex-wrap gap-2">
                        {workDays.map(([bit, label]) => (
                          <label
                            key={bit}
                            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-input-line px-3 py-2 text-sm has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand-ink"
                          >
                            <input
                              type="checkbox"
                              name="diaTrabajo"
                              value={bit}
                              checked={
                                (Number(values.diasTrabajo || 0) & bit) !== 0
                              }
                              onChange={() => {}}
                              className="size-4 accent-brand"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : (
                    <>
                      <label
                        htmlFor={field.name}
                        className="mb-2 block text-sm font-medium"
                      >
                        {field.label}
                        {field.required ? " *" : ""}
                      </label>
                      {field.options ? (
                        <select {...common}>
                          <option value="">Selecciona una opción</option>
                          {common.value &&
                            !field.options.some(
                              ([key]) => key === common.value,
                            ) && (
                              <option value={common.value} disabled>
                                {common.value} (anterior)
                              </option>
                            )}
                          {field.options.map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea {...common} rows={3} maxLength={field.max} />
                      ) : (
                        <input
                          {...common}
                          type={field.type ?? "text"}
                          maxLength={field.max}
                          step={
                            field.name === "sueldoMensual"
                              ? "0.01"
                              : field.type === "number"
                                ? "1"
                                : undefined
                          }
                          min={
                            field.type === "number"
                              ? field.name === "plazas" ||
                                field.name === "diasTrabajo"
                                ? "1"
                                : field.name === "sueldoMensual"
                                  ? "0.01"
                                  : "0"
                              : undefined
                          }
                        />
                      )}
                    </>
                  )}
                  {error && (
                    <p
                      id={`${field.name}-error`}
                      className="mt-2 text-sm text-red-700"
                    >
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
      <fieldset
        disabled={pending || !ready}
        className="rounded-2xl border border-line bg-panel p-5 sm:p-8"
      >
        <legend className="px-2 text-lg font-semibold">
          Medios de contacto para la vacante
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {contactTypes.map(([key, label]) => (
            <div key={key}>
              <label className="mb-2 flex items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  name={`medio_${key}`}
                  value="SI"
                  checked={values[`medio_${key}`] === "SI"}
                  onChange={() => {}}
                  className="size-4"
                />
                {label}
              </label>
              <label htmlFor={`horario_${key}`} className="sr-only">
                Horario o indicaciones de {label}
              </label>
              <input
                id={`horario_${key}`}
                name={`horario_${key}`}
                value={values[`horario_${key}`] ?? ""}
                onChange={() => {}}
                maxLength={500}
                placeholder="Horario o indicaciones"
                className={inputClass}
              />
              {state.errors?.[`horario_${key}`] && (
                <p className="mt-2 text-sm text-red-700">
                  {state.errors[`horario_${key}`]}
                </p>
              )}
            </div>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap justify-end gap-3 pb-8">
        <Link
          href={`/dashboard/vacantes/empresa/${context.empresaId}`}
          className="rounded-xl border border-input-line bg-panel px-5 py-3 text-sm font-medium"
        >
          Volver a las vacantes
        </Link>
        <Button
          type="submit"
          disabled={pending || !ready}
          aria-keyshortcuts="Control+Enter Meta+Enter"
        >
          {pending
            ? "Guardando…"
            : context.id
              ? "Guardar cambios"
              : context.origenId
                ? "Guardar nueva vacante"
                : "Registrar vacante"}
        </Button>
      </div>
    </form>
  );
}
