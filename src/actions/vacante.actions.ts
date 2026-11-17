"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { validateVacancy, type VacancyState } from "@/lib/vacancy-form";
import {
  saveVacancy,
  manageVacancy,
  type VacancyContext,
} from "@/services/vacante.service";

export async function saveVacancyAction(
  context: VacancyContext,
  _state: VacancyState,
  form: FormData,
): Promise<VacancyState> {
  const session = await requireSession();
  const { values, errors } = validateVacancy(form);
  if (Object.keys(errors).length)
    return { values, errors, error: "Revisa los campos indicados." };
  try {
    const result = await saveVacancy(
      context,
      values,
      session.usuario.id,
      form.get("confirmarDuplicada") === "SI",
    );
    if (!result.savedId) return { values, ...result };
    revalidatePath(`/dashboard/vacantes/empresa/${context.empresaId}`);
    revalidatePath(`/dashboard/vacantes/${result.savedId}`);
    return result;
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : "";
    return {
      values,
      ...(code === "P2002"
        ? { errors: { idSilap: "Este folio de vacante ya está registrado." } }
        : {}),
      error:
        code === "P2002"
          ? "Revisa el folio; cada vacante debe tener uno diferente."
          : "No se pudo guardar. Conservamos lo capturado; inténtalo de nuevo.",
    };
  }
}
export async function manageVacancyAction(
  id: string,
  _state: { error?: string },
  form: FormData,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const action = form.get("accion");
  if (action !== "CUBRIR" && action !== "ARCHIVAR" && action !== "ELIMINAR")
    return { error: "Selecciona una acción válida." };
  if (form.get("confirmar") !== "SI") return { error: "Confirma la acción." };
  let empresaId: string;
  try {
    const result = await manageVacancy(id, action, session.usuario.id);
    if (result.error || !result.empresaId) return { error: result.error };
    empresaId = result.empresaId;
  } catch {
    return {
      error:
        "No se pudo realizar la acción. La información se conservó; inténtalo de nuevo.",
    };
  }
  revalidatePath(`/dashboard/vacantes/empresa/${empresaId}`);
  revalidatePath(`/dashboard/vacantes/${id}`);
  revalidatePath(`/dashboard/seguimiento/${id}`);
  revalidatePath("/dashboard/seguimiento");
  redirect(
    action === "ELIMINAR"
      ? `/dashboard/vacantes/empresa/${empresaId}`
      : `/dashboard/seguimiento/${id}`,
  );
}
