"use client";
import { useActionState, useState } from "react";
import { loginAction } from "@/actions/auth.actions";
import { Button } from "@/components/Button";
import { CompleteInput } from "@/components/Inputs";
export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  const [visible, setVisible] = useState(false);
  return (
    <form
      action={action}
      className="flex w-full flex-col gap-6"
      aria-busy={pending}
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido de nuevo
        </h1>
        <p className="text-sm leading-6 text-neutral-500">
          Inicia sesión para gestionar empleadores y vacantes.
        </p>
      </div>
      <div aria-live="polite" aria-atomic="true">
        {state.error && (
          <p
            id="login-error"
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {state.error}
          </p>
        )}
      </div>
      <CompleteInput
        id="correo"
        name="correo"
        type="email"
        label="Correo electrónico"
        placeholder="tu@correo.com"
        autoComplete="username"
        required
        maxLength={254}
        defaultValue={state.correo}
        aria-describedby={state.error ? "login-error" : undefined}
      />
      <div className="space-y-2">
        <CompleteInput
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          label="Contraseña"
          placeholder="Escribe tu contraseña"
          autoComplete="current-password"
          required
          maxLength={256}
          aria-describedby={state.error ? "login-error" : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-pressed={visible}
          aria-controls="password"
          className="rounded text-xs text-neutral-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        </button>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Iniciando sesión…" : "Iniciar sesión"}
        <span aria-hidden="true">→</span>
      </Button>
      <p className="text-center text-xs leading-5 text-neutral-500">
        Si necesitas una cuenta, contacta a la persona encargada del sistema.
      </p>
    </form>
  );
}
