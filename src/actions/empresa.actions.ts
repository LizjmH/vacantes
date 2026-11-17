"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { validateEmployer, type EmployerFormState } from "@/lib/empresa-form";
import {
  createEmployer,
  updateEmployer,
  deleteEmployer,
  findEmployerConflict,
} from "@/services/empresa.service";

async function conflictState(
  values: Record<string, string>,
  excludingId?: string,
): Promise<EmployerFormState> {
  try {
    const conflict = await findEmployerConflict(values, excludingId);
    if (conflict)
      return {
        values,
        existingEmployerId: conflict.id,
        errors: {
          [conflict.field]:
            conflict.field === "rfc"
              ? "Este RFC ya está registrado en otro empleador."
              : "Este folio ya está registrado.",
        },
        error:
          "Este empleador ya está registrado. Consulta o edita el registro existente.",
      };
  } catch {
    /* Keep the captured values even if the conflict lookup fails. */
  }
  return {
    values,
    error: "Ya existe un registro con estos datos. Revisa el RFC y el folio.",
  };
}

export async function createEmployerAction(
  _state: EmployerFormState,
  form: FormData,
): Promise<EmployerFormState> {
  await requireSession();
  const { values, errors } = validateEmployer(form);
  if (Object.keys(errors).length)
    return {
      values,
      errors,
      error: "Revisa los campos indicados antes de guardar.",
    };
  let id: string;
  try {
    const employer = await createEmployer(values);
    id = employer.id;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    )
      return conflictState(values);
    return {
      values,
      error:
        "No se pudo guardar el empleador. Tus datos siguen en el formulario; inténtalo de nuevo.",
    };
  }
  revalidatePath("/dashboard/empleadores");
  return { savedId: id };
}

export async function updateEmployerAction(
  id: string,
  _state: EmployerFormState,
  form: FormData,
): Promise<EmployerFormState> {
  await requireSession();
  const { values, errors } = validateEmployer(form);
  if (Object.keys(errors).length)
    return {
      values,
      errors,
      error: "Revisa los campos indicados antes de guardar.",
    };
  try {
    await updateEmployer(id, values);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : null;
    if (code === "P2002") return conflictState(values, id);
    if (code === "P2025")
      return {
        values,
        error: "Este empleador ya no existe. Vuelve al listado.",
      };
    return {
      values,
      error: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
    };
  }
  revalidatePath("/dashboard/empleadores");
  revalidatePath(`/dashboard/empleadores/${id}`);
  return { savedId: id };
}

export async function deleteEmployerAction(
  id: string,
  _state: { error?: string },
  form: FormData,
): Promise<{ error?: string }> {
  await requireSession();
  if (form.get("confirmar") !== "si")
    return { error: "Confirma que deseas eliminar este empleador." };
  try {
    await deleteEmployer(id);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : null;
    if (code === "P2003")
      return {
        error:
          "No se puede eliminar: tiene vacantes asociadas. Se conservó toda la información.",
      };
    if (code !== "P2025")
      return { error: "No se pudo eliminar el empleador. Inténtalo de nuevo." };
  }
  revalidatePath("/dashboard/empleadores");
  revalidatePath(`/dashboard/empleadores/${id}`);
  redirect("/dashboard/empleadores");
}
