export const trackingResults = [
  ["PENDIENTE", "Pendiente / sin respuesta"],
  ["VIGENTE", "Sigue disponible"],
  ["CUBIERTA", "Cubierta (todas las plazas)"],
] as const;
export const trackingNames = [
  "resultado",
  "comentario",
  "curp",
  "nombre",
  "puesto",
  "fechaFin",
  "reabrir",
  "solicitudId",
];
export type TrackingState = {
  values?: Record<string, string>;
  errors?: Record<string, string>;
  error?: string;
  savedId?: string;
};
export function validTrackingDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function validateTracking(form: FormData) {
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};
  for (const name of trackingNames) {
    const raw = form.get(name);
    values[name] = typeof raw === "string" ? raw.trim() : "";
  }
  if (!trackingResults.some(([key]) => key === values.resultado))
    errors.resultado = "Selecciona un resultado válido.";
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
      values.solicitudId,
    )
  )
    errors.solicitudId = "Recarga la página antes de registrar el seguimiento.";
  for (const [name, max] of [
    ["comentario", 4000],
    ["nombre", 200],
    ["puesto", 200],
  ] as const)
    if (values[name].length > max) errors[name] = `Máximo ${max} caracteres.`;
  values.curp = values.curp.toUpperCase();
  if (values.resultado !== "CUBIERTA") {
    values.nombre = "";
    values.puesto = "";
    values.curp = "";
  }
  if (
    values.curp &&
    !/^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(values.curp)
  )
    errors.curp = "Revisa la CURP de 18 caracteres.";
  if (values.resultado !== "VIGENTE") {
    values.fechaFin = "";
    values.reabrir = "";
  }
  if (values.fechaFin && !validTrackingDate(values.fechaFin))
    errors.fechaFin = "Escribe una fecha válida.";
  return { values, errors };
}
