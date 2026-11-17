"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createEmployerAction,
  updateEmployerAction,
} from "@/actions/empresa.actions";
import { employerSections, type EmployerFormState } from "@/lib/empresa-form";
import {
  readEmployerDraft,
  writeEmployerDraft,
  removeEmployerDraft,
} from "@/lib/employer-draft";
import { Button } from "@/components/Button";

const inputClass =
  "min-h-12 w-full rounded-xl border border-input-line bg-panel px-4 py-3 text-sm text-ink outline-offset-4 focus-visible:outline-2 aria-invalid:border-red-500";

export function EmployerForm({
  employerId,
  initialValues = {},
  draftKey,
}: {
  employerId?: string;
  initialValues?: Record<string, string>;
  draftKey: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const saved = useRef(false);
  const saveAction = employerId
    ? updateEmployerAction.bind(null, employerId)
    : createEmployerAction;
  const [state, action, pending] = useActionState(
    async (
      previous: EmployerFormState,
      form: FormData,
    ): Promise<EmployerFormState> => {
      const result = await saveAction(previous, form);
      if (result.savedId) {
        saved.current = true;
        try {
          removeEmployerDraft(window.sessionStorage, draftKey);
        } catch {
          /* Storage can be unavailable. */
        }
        router.push(
          `/dashboard/empleadores/${result.savedId}?guardado=${employerId ? "cambios" : "registro"}`,
        );
      }
      return result;
    },
    { values: initialValues },
  );
  useEffect(() => {
    if (!state.error) return;
    const name = Object.keys(state.errors ?? {})[0];
    const field = name ? formRef.current?.elements.namedItem(name) : null;
    if (field instanceof HTMLElement) field.focus();
    else errorRef.current?.focus();
  }, [state.error, state.errors]);
  useEffect(() => {
    try {
      const draft = readEmployerDraft(window.sessionStorage, draftKey);
      if (draft && formRef.current) {
        for (const [name, value] of Object.entries(draft)) {
          const field = formRef.current.elements.namedItem(name);
          if (
            field instanceof HTMLInputElement ||
            field instanceof HTMLSelectElement ||
            field instanceof HTMLTextAreaElement
          )
            field.value = value;
        }
      }
    } catch {
      // Continue normally when browser storage is unavailable.
    }
  }, [draftKey]);

  function saveDraft() {
    if (!formRef.current || saved.current) return;
    const values: Record<string, string> = {};
    for (const section of employerSections)
      for (const field of section.fields) {
        const control = formRef.current.elements.namedItem(field.name);
        if (
          control instanceof HTMLInputElement ||
          control instanceof HTMLSelectElement ||
          control instanceof HTMLTextAreaElement
        )
          values[field.name] = control.value;
      }
    try {
      writeEmployerDraft(window.sessionStorage, draftKey, values);
    } catch {
      // Draft recovery is optional; submitting the form still works normally.
    }
  }
  function handleKeyboard(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || event.altKey)
      return;
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      if (!pending && !event.repeat) event.currentTarget.requestSubmit();
      return;
    }
    // Keep native keyboard behavior for selects, multiline text and buttons.
    if (!(event.target instanceof HTMLInputElement)) return;
    event.preventDefault();
    if (pending || event.repeat) return;
    const fields = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]), select, textarea, button[type="submit"]',
      ),
    ).filter(
      (field) =>
        !field.matches(":disabled") &&
        field.tabIndex >= 0 &&
        field.getClientRects().length > 0,
    );
    const current = fields.indexOf(event.target);
    if (current === -1) return;
    fields[current + (event.shiftKey ? -1 : 1)]?.focus();
  }
  return (
    <form
      ref={formRef}
      action={action}
      onChange={saveDraft}
      onSubmitCapture={saveDraft}
      className="space-y-6"
      aria-busy={pending}
      onKeyDown={handleKeyboard}
    >
      {state.error && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {state.error}
          {state.existingEmployerId && (
            <Link
              href={`/dashboard/empleadores/${state.existingEmployerId}`}
              className="mt-2 block font-medium underline underline-offset-4"
            >
              Ver empleador registrado
            </Link>
          )}
        </div>
      )}
      {employerSections.map((section, index) => (
        <fieldset
          key={section.title}
          disabled={pending}
          className="rounded-2xl border border-line bg-panel p-5 sm:p-8"
        >
          <legend className="px-2 text-lg font-semibold">
            {index + 1}. {section.title}
          </legend>
          <p className="mb-6 text-sm text-muted">{section.description}</p>
          <div className="grid gap-5 sm:grid-cols-2">
            {section.fields.map((field) => {
              const error = state.errors?.[field.name];
              const common = {
                id: field.name,
                name: field.name,
                required: field.required,
                defaultValue: state.values?.[field.name] ?? "",
                "aria-invalid": !!error,
                "aria-describedby": error ? `${field.name}-error` : undefined,
                className: inputClass,
              };
              return (
                <div
                  key={field.name}
                  className={field.type === "textarea" ? "sm:col-span-2" : ""}
                >
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
                      {field.options.map(([value, label]) => (
                        <option key={value} value={value}>
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
                      min={field.type === "number" ? 0 : undefined}
                      max={field.type === "number" ? 2147483647 : undefined}
                      step={field.type === "number" ? 1 : undefined}
                      inputMode={
                        field.name === "codigoPostal" ? "numeric" : undefined
                      }
                    />
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
      <div className="flex flex-wrap items-center justify-end gap-4 pb-8">
        <Link
          href={
            employerId
              ? `/dashboard/empleadores/${employerId}`
              : "/dashboard/empleadores"
          }
          className="rounded-xl border border-input-line bg-panel px-5 py-3 text-sm font-medium"
        >
          {employerId ? "Cancelar edición" : "Volver al listado"}
        </Link>
        <Button
          type="submit"
          disabled={pending}
          aria-keyshortcuts="Control+Enter Meta+Enter"
        >
          {pending
            ? "Guardando…"
            : employerId
              ? "Guardar cambios"
              : "Guardar empleador"}
        </Button>
      </div>
    </form>
  );
}
