import Link from "next/link";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { vacancyStatus } from "@/lib/vacancy-form";
import { VacancyActions } from "../../vacantes/components/VacancyActions";
import { TrackingForm } from "../components/TrackingForm";

export default async function VacancyTrackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pagina?: string; guardado?: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const filters = await searchParams;
  const v = await prisma.vacante.findUnique({
    where: { id },
    include: {
      empresa: { include: { contacto: true } },
      historial: { orderBy: [{ fecha: "desc" }, { id: "desc" }], take: 20 },
      _count: { select: { seguimientos: true, recicladas: true } },
    },
  });
  if (!v) notFound();
  const pages = Math.max(1, Math.ceil(v._count.seguimientos / 20));
  const requested = Number(filters.pagina);
  const page = Math.min(
    pages,
    Math.max(1, Number.isSafeInteger(requested) ? requested : 1),
  );
  const records = await prisma.seguimientoVacante.findMany({
    where: { vacanteId: id },
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
    skip: (page - 1) * 20,
    take: 20,
  });
  const saved =
    typeof filters.guardado === "string"
      ? await prisma.seguimientoVacante.findFirst({
          where: { id: filters.guardado, vacanteId: id },
          select: { id: true },
        })
      : null;
  const requestId = randomUUID();
  const contact = v.empresa.contacto;
  const labels: Record<string, string> = {
    PENDIENTE: "Pendiente / sin respuesta",
    VIGENTE: "Sigue disponible",
    CUBIERTA: "Cubierta",
  };
  const historyLabels: Record<string, string> = {
    REGISTRO: "Vacante registrada",
    EDICION: "Datos modificados",
    RECICLADA: "Nueva vacante a partir de una anterior",
    CUBIERTA: "Marcada como cubierta",
    ARCHIVADA: "Vacante archivada",
    REABIERTA: "Vacante reabierta",
    SEGUIMIENTO: "Contacto de seguimiento registrado",
  };
  return (
    <main className="px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard/seguimiento"
          className="text-sm underline underline-offset-4"
        >
          ← Seguimiento
        </Link>
        <header className="my-8">
          <p className="mb-2 text-sm text-muted">
            {v.empresa.nombreComercial || v.empresa.razonSocial} · RFC:{" "}
            {v.empresa.rfc}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{v.puesto}</h1>
          <p className="mt-3 text-sm text-muted">
            {vacancyStatus(v)} · {v.plazas} plazas · Fecha final:{" "}
            {v.fechaFin?.toLocaleDateString("es-MX", { timeZone: "UTC" }) ||
              "Sin capturar"}
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link
              href={`/dashboard/vacantes/${id}`}
              className="text-sm underline underline-offset-4"
            >
              Ver vacante completa
            </Link>
            <Link
              href={`/dashboard/vacantes/empresa/${v.empresaId}`}
              className="text-sm underline underline-offset-4"
            >
              Otras vacantes del empleador
            </Link>
          </div>
        </header>
        <section className="mb-6 rounded-2xl border border-line bg-panel p-6">
          <h2 className="mb-3 text-lg font-semibold">Contacto del empleador</h2>
          <p className="text-sm font-medium">
            {contact.nombres} {contact.apellidos} · {contact.cargo}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {[contact.telefonoFijo, contact.celular]
              .filter(Boolean)
              .map((phone, index) => (
                <a
                  key={index}
                  href={`tel:${phone!.replace(/[^+0-9]/g, "")}`}
                  className="underline underline-offset-4"
                >
                  {phone}
                </a>
              ))}
            <a
              href={`mailto:${encodeURIComponent(contact.correo || v.empresa.correoGeneral)}`}
              className="break-all underline underline-offset-4"
            >
              {contact.correo || v.empresa.correoGeneral}
            </a>
          </div>
        </section>
        {saved && (
          <p
            role="status"
            className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            Seguimiento registrado correctamente.
          </p>
        )}
        {v.archivada ? (
          <p className="mb-6 rounded-xl border border-line p-4 text-sm text-secondary">
            Esta vacante está archivada. Su historial permanece disponible para
            consulta.
          </p>
        ) : (
          <TrackingForm
            key={requestId}
            vacanteId={id}
            version={v.actualizadoEl.toISOString()}
            requestId={requestId}
            userId={session.usuario.id}
            cubierta={v.cubierta}
            puesto={v.puesto}
          />
        )}

        <div className="mt-6 space-y-6">
          <VacancyActions
            id={id}
            cubierta={v.cubierta}
            archivada={v.archivada}
            hasHistory={v._count.seguimientos > 0 || v._count.recicladas > 0}
          />
          <section className="rounded-2xl border border-line bg-panel p-6">
            <h2 className="mb-4 text-lg font-semibold">Últimos 20 cambios</h2>
            {v.historial.length ? (
              <ol className="divide-y divide-line">
                {v.historial.map((h) => (
                  <li key={h.id} className="py-3 text-sm">
                    <span className="font-medium">
                      {historyLabels[h.accion] || "Cambio registrado"}
                    </span>
                    <time
                      className="mt-1 block text-xs text-muted"
                      dateTime={h.fecha.toISOString()}
                    >
                      {h.fecha.toLocaleString("es-MX", {
                        timeZone: "America/Mexico_City",
                      })}
                    </time>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">Sin cambios registrados.</p>
            )}
          </section>
        </div>
        <section className="mt-6 rounded-2xl border border-line bg-panel p-5 sm:p-8">
          <h2 className="mb-5 text-lg font-semibold">
            Historial de contactos ({v._count.seguimientos})
          </h2>
          {records.length ? (
            <ol className="divide-y divide-line">
              {records.map((s) => (
                <li key={s.id} className="py-5">
                  <p className="text-sm font-semibold">{labels[s.resultado]}</p>
                  <time
                    dateTime={s.fecha.toISOString()}
                    className="mt-1 block text-xs text-muted"
                  >
                    {s.fecha.toLocaleString("es-MX", {
                      timeZone: "America/Mexico_City",
                    })}
                  </time>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-secondary">
                    {s.comentario || "Sin observaciones adicionales."}
                  </p>
                  {(s.nombre || s.curp || s.puesto) && (
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer text-secondary">
                        Datos de colocación
                      </summary>
                      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                        {[
                          ["Nombre", s.nombre],
                          ["CURP", s.curp],
                          ["Puesto", s.puesto],
                        ]
                          .filter(([, value]) => value)
                          .map(([label, value]) => (
                            <div key={label}>
                              <dt className="text-xs text-muted">{label}</dt>
                              <dd className="mt-1">{value}</dd>
                            </div>
                          ))}
                      </dl>
                    </details>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted">
              Aún no hay seguimientos para esta vacante.
            </p>
          )}
          {pages > 1 && (
            <nav
              aria-label="Páginas del historial"
              className="mt-5 flex items-center gap-4"
            >
              <span className="text-sm text-muted">
                Página {page} de {pages}
              </span>
              {page > 1 && (
                <Link
                  href={`?pagina=${page - 1}`}
                  className="text-sm underline"
                >
                  Anterior
                </Link>
              )}
              {page < pages && (
                <Link
                  href={`?pagina=${page + 1}`}
                  className="text-sm underline"
                >
                  Siguiente
                </Link>
              )}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
