"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { validateTracking, type TrackingState } from "@/lib/tracking-form";
import { recordTracking } from "@/services/seguimiento.service";

export async function recordTrackingAction(
  vacanteId: string,
  version: string,
  _state: TrackingState,
  form: FormData,
): Promise<TrackingState> {
  const session = await requireSession();
  const { values, errors } = validateTracking(form);
  if (Object.keys(errors).length)
    return { values, errors, error: "Revisa los campos indicados." };
  try {
    const result = await recordTracking(
      vacanteId,
      values,
      session.usuario.id,
      version,
    );
    if (result.error) return { values, error: result.error };
    revalidatePath("/dashboard/seguimiento");
    revalidatePath(`/dashboard/seguimiento/${vacanteId}`);
    revalidatePath(`/dashboard/vacantes/${vacanteId}`);
    revalidatePath("/dashboard/vacantes/empresa/[empresaId]", "page");
    return result;
  } catch {
    return {
      values,
      error:
        "No se pudo guardar el seguimiento. Lo capturado se conservó; inténtalo de nuevo.",
    };
  }
}
