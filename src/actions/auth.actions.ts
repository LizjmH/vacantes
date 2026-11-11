"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, requireSession } from "@/lib/auth";
import { allowLogin, resetLoginAttempts } from "@/lib/login-rate-limit";
import {
  authenticate,
  createSession,
  revokeSession,
  createUser,
} from "@/services/auth.service";
export type AuthState = { error?: string; success?: string; correo?: string };
function credentials(data: FormData) {
  const email = data.get("correo");
  const password = data.get("password");
  const correo = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
    correo.length > 254 ||
    typeof password !== "string" ||
    !password ||
    password.length > 256
  )
    return null;
  return { correo, password };
}
async function startSession(userId: string) {
  const store = await cookies();
  const session = await createSession(userId, store.get(SESSION_COOKIE)?.value);
  store.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiraEl,
  });
}
export async function loginAction(
  _state: AuthState,
  data: FormData,
): Promise<AuthState> {
  const input = credentials(data);
  if (!input) return { error: "Escribe un correo válido y tu contraseña." };
  const { correo, password } = input;
  if (!allowLogin(correo))
    return {
      error: "Demasiados intentos. Inténtalo de nuevo en 15 minutos.",
      correo,
    };
  try {
    const user = await authenticate(correo, password);
    if (!user)
      return { error: "El correo o la contraseña son incorrectos.", correo };
    await startSession(user.id);
    resetLoginAttempts(correo);
  } catch {
    return {
      error: "No se pudo conectar con el sistema. Inténtalo de nuevo.",
      correo,
    };
  }
  redirect("/dashboard");
}
export async function logoutAction() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await revokeSession(token);
  store.delete(SESSION_COOKIE);
  redirect("/auth/login");
}
async function register(data: FormData, first: boolean): Promise<AuthState> {
  const input = credentials(data);
  if (!input || input.password.length < 12)
    return {
      error:
        "Escribe un correo válido y una contraseña de 12 a 256 caracteres.",
    };
  if (input.password !== data.get("confirmPassword"))
    return { error: "Las contraseñas no coinciden.", correo: input.correo };
  try {
    const user = await createUser(input.correo, input.password, first);
    if (!user)
      return { error: "La primera cuenta ya fue creada. Inicia sesión." };
    if (first) await startSession(user.id);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    )
      return {
        error: "Ya existe una cuenta con ese correo.",
        correo: input.correo,
      };
    return {
      error:
        "No se pudo crear la cuenta. Verifica la conexión e inténtalo de nuevo.",
    };
  }
  return { success: "Usuario creado. Ya puede iniciar sesión." };
}
export async function setupAction(
  _state: AuthState,
  data: FormData,
): Promise<AuthState> {
  const result = await register(data, true);
  if (result.error) return result;
  redirect("/dashboard");
}
export async function createUserAction(
  _state: AuthState,
  data: FormData,
): Promise<AuthState> {
  await requireSession();
  return register(data, false);
}
