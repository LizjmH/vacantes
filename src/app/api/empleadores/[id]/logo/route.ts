import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession()))
    return new Response("Inicia sesión para consultar la imagen.", {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  const { id } = await params;
  const logo = await prisma.logoEmpresa.findUnique({
    where: { empresaId: id },
    select: { contenido: true },
  });
  if (!logo)
    return new Response("Este empleador no tiene logo.", {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  const download = new URL(request.url).searchParams.get("descargar") === "1";
  return new Response(new Uint8Array(logo.contenido), {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(logo.contenido.length),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="logo-empleador.png"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
