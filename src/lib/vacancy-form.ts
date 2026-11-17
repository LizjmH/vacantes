export type VacancyField = {
  name: string;
  label: string;
  required?: boolean;
  type?: "number" | "date" | "time" | "textarea";
  max?: number;
  options?: readonly (readonly [string, string])[];
};
const yesNo = [
  ["NO", "No"],
  ["SI", "Sí"],
] as const;
export const educationOptions = [
  ["SIN_ESCOLARIDAD", "Sin escolaridad"],
  ["PRIMARIA", "Primaria"],
  ["SECUNDARIA", "Secundaria"],
  ["CARRERA_TECNICA", "Carrera técnica"],
  ["BACHILLERATO", "Preparatoria o bachillerato"],
  ["LICENCIATURA", "Licenciatura o ingeniería"],
  ["MAESTRIA", "Maestría"],
  ["DOCTORADO", "Doctorado"],
] as const;
export const experienceOptions = [
  ["NINGUNA", "Ninguna"],
  ["SEIS_MESES_UN_ANIO", "6 meses a 1 año"],
  ["DOS_TRES_ANIOS", "2 a 3 años"],
  ["CUATRO_CINCO_ANIOS", "4 a 5 años"],
  ["MAS_CINCO_ANIOS", "Más de 5 años"],
] as const;
export const recruitmentOptions = [
  ["INMEDIATO", "Inmediato"],
  ["UNA_SEMANA", "1 semana"],
  ["DOS_SEMANAS", "2 semanas"],
  ["UN_MES", "1 mes"],
  ["MAS_UN_MES", "Más de 1 mes"],
] as const;
// Monday is bit 0, Sunday bit 6: weekdays=31, Monday–Saturday=63, all=127.
export const workDays = [
  [1, "Lunes"],
  [2, "Martes"],
  [4, "Miércoles"],
  [8, "Jueves"],
  [16, "Viernes"],
  [32, "Sábado"],
  [64, "Domingo"],
] as const;
export const hourOptions = Array.from({ length: 24 }, (_, hour) => {
  const value = `${String(hour).padStart(2, "0")}:00`;
  return [value, value] as const;
});
export function workDaysLabel(value: string) {
  const mask = Number(value);
  return value && Number.isInteger(mask) && mask > 0 && mask <= 127
    ? workDays
        .filter(([bit]) => (mask & bit) !== 0)
        .map(([, label]) => label)
        .join(", ")
    : "Sin seleccionar";
}
export function changeVacancyValue(
  values: Record<string, string>,
  name: string,
  value: string,
) {
  const next = { ...values, [name]: value };
  if (
    name === "fechaReinicio" &&
    (!values.fechaFin || values.fechaFin === monthAfter(values.fechaReinicio))
  )
    next.fechaFin = monthAfter(value);
  if (name === "aceptaDiscapacidad" && value !== "SI")
    next.tipoDiscapacidad = "";
  return next;
}
export const vacancySections: { title: string; fields: VacancyField[] }[] = [
  {
    title: "Puesto y vigencia",
    fields: [
      { name: "idSilap", label: "Folio de vacante / ID SILAP", max: 80 },
      { name: "puesto", label: "Puesto", required: true, max: 200 },
      {
        name: "plazas",
        label: "Número de plazas",
        type: "number",
        required: true,
      },
      {
        name: "sueldoMensual",
        label: "Sueldo mensual (MXN)",
        type: "number",
        required: true,
      },
      {
        name: "fechaReinicio",
        label: "Fecha de inicio",
        type: "date",
        required: true,
      },
      { name: "fechaFin", label: "Fecha final", type: "date", required: true },
    ],
  },
  {
    title: "Perfil y requisitos",
    fields: [
      { name: "edadMinima", label: "Edad mínima", type: "number" },
      { name: "edadMaxima", label: "Edad máxima", type: "number" },
      {
        name: "sexo",
        label: "Género",
        required: true,
        options: [
          ["INDISTINTO", "Indistinto"],
          ["FEMENINO", "Femenino"],
          ["MASCULINO", "Masculino"],
        ],
      },
      { name: "escolaridad", label: "Escolaridad", options: educationOptions },
      {
        name: "situacionAcademica",
        label: "Situación académica",
        options: [
          ["ESTUDIANTE", "Estudiante"],
          ["CERTIFICADO", "Diploma o certificado"],
          ["TRUNCA", "Trunca"],
          ["PASANTE", "Pasante"],
          ["TITULADO", "Titulado"],
        ],
      },
      { name: "carrera", label: "Carrera", max: 200 },
      {
        name: "experiencia",
        label: "Experiencia requerida",
        options: experienceOptions,
        required: true,
      },
      {
        name: "conocimientos",
        label: "Conocimientos y requisitos",
        type: "textarea",
        required: true,
        max: 4000,
      },
      {
        name: "descripcionPuesto",
        label: "Funciones del puesto",
        type: "textarea",
        required: true,
        max: 4000,
      },
    ],
  },
  {
    title: "Condiciones de trabajo",
    fields: [
      {
        name: "tipoContratacion",
        label: "Tipo de contratación",
        options: [
          ["DETERMINADO", "Tiempo determinado"],
          ["INDETERMINADO", "Tiempo indeterminado"],
          ["OBRA", "Por obra"],
        ],
      },
      {
        name: "jornada",
        label: "Jornada",
        options: [
          ["DIURNA", "Diurna"],
          ["NOCTURNA", "Nocturna"],
          ["MIXTA", "Mixta"],
          ["MEDIO_TIEMPO", "Medio tiempo"],
        ],
      },
      {
        name: "turno",
        label: "Turno",
        options: [
          ["MATUTINO", "Matutino"],
          ["VESPERTINO", "Vespertino"],
          ["NOCTURNO", "Nocturno"],
          ["MIXTO", "Mixto"],
          ["ROTATIVO", "Rotativo"],
        ],
      },
      {
        name: "diasTrabajo",
        label: "Días de trabajo",
      },
      { name: "horaInicio", label: "Hora de entrada", options: hourOptions },
      { name: "horaFin", label: "Hora de salida", options: hourOptions },
      {
        name: "horarioTrabajo",
        label: "Detalle del horario / descansos",
        max: 500,
      },
      {
        name: "prestaciones",
        label: "Prestaciones",
        type: "textarea",
        required: true,
        max: 4000,
      },
    ],
  },
  {
    title: "Inclusión",
    fields: [
      {
        name: "aceptaDiscapacidad",
        label: "Acepta personas con discapacidad",
        options: yesNo,
      },
      {
        name: "tipoDiscapacidad",
        label: "Tipo de discapacidad",
        options: [
          ["AUDITIVA", "Auditiva"],
          ["INTELECTUAL", "Intelectual"],
          ["MENTAL", "Mental"],
          ["MOTORA", "Motora"],
          ["VISUAL", "Visual"],
          ["COMUNICACION", "Comunicación"],
          ["INTELECTUAL_MENTAL", "Intelectual y mental"],
          ["OTRAS", "Otras"],
        ],
      },
    ],
  },
  {
    title: "Ubicación y reclutamiento",
    fields: [
      { name: "municipio", label: "Municipio de la vacante", max: 150 },
      { name: "direccion", label: "Dirección del lugar de trabajo", max: 1000 },
      {
        name: "tiempoReclutamiento",
        label: "Tiempo de reclutamiento",
        required: true,
        options: recruitmentOptions,
      },
      {
        name: "instruccionesGenerales",
        label: "Documentación, horario de entrevista e instrucciones",
        type: "textarea",
        max: 4000,
      },
      {
        name: "observaciones",
        label: "Observaciones",
        type: "textarea",
        max: 4000,
      },
    ],
  },
];
export const contactTypes = [
  ["CORREO", "Correo electrónico"],
  ["DOMICILIO", "Domicilio"],
  ["TELEFONO", "Teléfono"],
  ["WHATSAPP", "WhatsApp"],
] as const;
export const vacancyFieldNames = [
  ...vacancySections.flatMap((s) => s.fields.map((f) => f.name)),
  ...contactTypes.flatMap(([key]) => [`medio_${key}`, `horario_${key}`]),
];
export type VacancyState = {
  values?: Record<string, string>;
  errors?: Record<string, string>;
  error?: string;
  savedId?: string;
  duplicateId?: string;
};

export function todayInMexico() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function monthAfter(value: string) {
  if (!validDate(value)) return "";
  const [year, month, day] = value.split("-").map(Number);
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, last)))
    .toISOString()
    .slice(0, 10);
}
export function vacancyStatus(
  v: {
    archivada: boolean;
    cubierta: boolean;
    fechaReinicio: Date;
    fechaFin: Date | null;
  },
  today = todayInMexico(),
) {
  if (v.archivada) return "Archivada";
  if (v.cubierta) return "Cubierta";
  const start = v.fechaReinicio.toISOString().slice(0, 10);
  const end = v.fechaFin?.toISOString().slice(0, 10) ?? monthAfter(start);
  if (end < today) return "Vencida";
  if (start > today) return "Programada";
  const days = (Date.parse(end) - Date.parse(today)) / 86400000;
  return days <= 7 ? "Por vencer" : "Vigente";
}
export function validateVacancy(form: FormData) {
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};
  for (const section of vacancySections)
    for (const field of section.fields) {
      const raw = form.get(field.name);
      const value = typeof raw === "string" ? raw.trim() : "";
      values[field.name] = value;
      if (field.required && !value)
        errors[field.name] = "Este campo es obligatorio.";
      else if (field.max && value.length > field.max)
        errors[field.name] = `Máximo ${field.max} caracteres.`;
      else if (
        value &&
        field.options &&
        !field.options.some(([key]) => key === value)
      )
        errors[field.name] = "Selecciona una opción válida.";
    }
  for (const [name, min, max] of [
    ["plazas", 1, 1000000],
    ["edadMinima", 0, 120],
    ["edadMaxima", 0, 120],
    ["diasTrabajo", 0, 127],
  ] as const) {
    if (
      values[name] &&
      (!/^\d+$/.test(values[name]) ||
        +values[name] < min ||
        +values[name] > max)
    )
      errors[name] = `Escribe un entero entre ${min} y ${max}.`;
  }
  if (
    !/^\d{1,8}(\.\d{1,2})?$/.test(values.sueldoMensual) ||
    +values.sueldoMensual <= 0
  )
    errors.sueldoMensual =
      "Escribe un sueldo mayor que cero, con máximo dos decimales.";
  for (const key of ["fechaReinicio", "fechaFin"])
    if (!validDate(values[key])) errors[key] = "Escribe una fecha válida.";
  if (
    !errors.fechaReinicio &&
    !errors.fechaFin &&
    values.fechaFin < values.fechaReinicio
  )
    errors.fechaFin = "La fecha final no puede ser anterior al inicio.";
  if (
    values.edadMinima &&
    values.edadMaxima &&
    +values.edadMaxima < +values.edadMinima
  )
    errors.edadMaxima = "Debe ser mayor o igual a la edad mínima.";
  for (const key of ["horaInicio", "horaFin"])
    if (values[key] && !/^([01]\d|2[0-3]):00$/.test(values[key]))
      errors[key] = "Selecciona una hora completa.";
  if (values.aceptaDiscapacidad !== "SI") values.tipoDiscapacidad = "";
  for (const [key] of contactTypes) {
    values[`medio_${key}`] = form.get(`medio_${key}`) === "SI" ? "SI" : "NO";
    const raw = form.get(`horario_${key}`);
    values[`horario_${key}`] = typeof raw === "string" ? raw.trim() : "";
    if (values[`horario_${key}`].length > 500)
      errors[`horario_${key}`] = "Máximo 500 caracteres.";
  }
  return { values, errors };
}
