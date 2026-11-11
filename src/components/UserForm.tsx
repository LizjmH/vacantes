"use client";
import { useActionState } from "react";
import { createUserAction, setupAction } from "@/actions/auth.actions";
import { CompleteInput } from "@/components/Inputs";
import { Button } from "@/components/Button";
export function UserForm({ initial = false }: { initial?: boolean }) {
  const [state, action, pending] = useActionState(
    initial ? setupAction : createUserAction,
    {},
  );
  return (
    <form
      action={action}
      className="flex w-full flex-col gap-5"
      aria-busy={pending}
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {initial ? "Crea la primera cuenta" : "Agregar usuario"}
        </h1>
        <p className="text-sm leading-6 text-neutral-500">
          {initial
            ? "Configura el acceso inicial al sistema de vacantes."
            : "La nueva cuenta podrá acceder al sistema y agregar usuarios."}
        </p>
      </div>
      <div aria-live="polite">
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
      </div>
      <CompleteInput
        id="new-correo"
        name="correo"
        type="email"
        label="Correo electrónico"
        autoComplete="username"
        required
        maxLength={254}
        defaultValue={state.correo}
      />
      <CompleteInput
        id="new-password"
        name="password"
        type="password"
        label="Contraseña (mínimo 12 caracteres)"
        autoComplete="new-password"
        required
        minLength={12}
        maxLength={256}
      />
      <CompleteInput
        id="confirm-password"
        name="confirmPassword"
        type="password"
        label="Confirmar contraseña"
        autoComplete="new-password"
        required
        minLength={12}
        maxLength={256}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
