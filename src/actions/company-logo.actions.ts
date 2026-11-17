"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_LOGO_BYTES, normalizeCompanyLogo } from "@/lib/company-logo";

export type CompanyLogoState = {
  error?: string;
  success?: string;
  version?: string;
};
export async function saveCompanyLogoAction(
  empresaId: string,
  _state: CompanyLogoState,
  data: FormData,
): Promise<CompanyLogoState> {
  await requireSession();
  const failure = (error: string): CompanyLogoState => ({
    error,
    version: _state.version,
  });
  const file = data.get("logo");
  if (!(file instanceof File) || !file.size)
    return failure("Selecciona una imagen para el logo.");
  if (file.size > MAX_LOGO_BYTES)
    return failure("La imagen debe pesar como máximo 2 MB.");
  let contenido: Uint8Array<ArrayBuffer>;
  try {
    contenido = await normalizeCompanyLogo(
      new Uint8Array(await file.arrayBuffer()),
    );
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "No se pudo leer la imagen.",
    );
  }
  try {
    const exists = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    });
    if (!exists) return failure("El empleador ya no existe.");
    const saved = await prisma.logoEmpresa.upsert({
      where: { empresaId },
      create: { empresaId, contenido },
      update: { contenido },
      select: { actualizadoEl: true },
    });
    revalidatePath(`/dashboard/empleadores/${empresaId}`);
    return {
      success: "Logo guardado correctamente.",
      version: saved.actualizadoEl.toISOString(),
    };
  } catch {
    return failure(
      "No se pudo guardar el logo. La imagen anterior se conservó; inténtalo de nuevo.",
    );
  }
}
