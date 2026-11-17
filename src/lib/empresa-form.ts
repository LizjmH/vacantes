export type EmployerField = {
  name: string;
  label: string;
  required?: boolean;
  type?: "email" | "url" | "number" | "tel" | "textarea";
  max?: number;
  options?: readonly (readonly [string, string])[];
};

export const employerSections: {
  title: string;
  description: string;
  fields: EmployerField[];
}[] = [
  {
    title: "Datos del empleador",
    description: "Identificación y clasificación de la empresa o institución.",
    fields: [
      { name: "folio", label: "Folio", max: 50 },
      { name: "rfc", label: "RFC", required: true, max: 13 },
      { name: "curp", label: "CURP", max: 18 },
      {
        name: "tipoEmpleador",
        label: "Tipo de empleador",
        required: true,
        options: [
          ["PRIVADA", "Privada"],
          ["PUBLICA", "Pública"],
          ["SOCIAL", "Social"],
        ],
      },
      {
        name: "tipoPersona",
        label: "Tipo de persona",
        options: [
          ["FISICA", "Física"],
          ["MORAL", "Moral"],
        ],
      },
      {
        name: "razonSocial",
        label: "Razón social / nombre del empleador",
        max: 250,
      },
      { name: "nombreComercial", label: "Nombre comercial", max: 250 },
      { name: "tipoSociedad", label: "Tipo de sociedad", max: 100 },
      {
        name: "cantidadEempleados",
        label: "Cantidad de empleados",
        type: "number",
        required: true,
      },
      {
        name: "ramaActividad",
        label: "Rama de actividad",
        required: true,
        max: 200,
      },
      {
        name: "descripcion",
        label: "Descripción de la actividad",
        type: "textarea",
        max: 2000,
      },
    ],
  },
  {
    title: "Información general",
    description: "Medios de comunicación y relación con el servicio de empleo.",
    fields: [
      {
        name: "correoGeneral",
        label: "Correo general",
        type: "email",
        required: true,
        max: 254,
      },
      { name: "paginaWeb", label: "Página web", type: "url", max: 500 },
      {
        name: "medioConocimiento",
        label: "¿Cómo conoció el servicio?",
        options: [
          ["REDES_SOCIALES", "Redes sociales"],
          ["CONOCIDOS", "Conocidos"],
          ["PRENSA", "Prensa"],
          ["AMISTADES", "Amistades"],
          ["VISITA_DEL_SNE", "Visita del SNE"],
        ],
      },
      {
        name: "registroPortal",
        label: "¿Registrado en el portal?",
        required: true,
        options: [
          ["SI", "Sí"],
          ["NO", "No"],
        ],
      },
    ],
  },
  {
    title: "Contacto",
    description: "Persona con quien se dará seguimiento a las vacantes.",
    fields: [
      { name: "nombres", label: "Nombres", required: true, max: 150 },
      { name: "apellidos", label: "Apellidos", required: true, max: 150 },
      { name: "cargo", label: "Cargo", required: true, max: 150 },
      { name: "telefonoFijo", label: "Teléfono fijo", type: "tel", max: 30 },
      { name: "extension", label: "Extensión", max: 10 },
      { name: "celular", label: "Celular", type: "tel", max: 30 },
      { name: "correo", label: "Correo del contacto", type: "email", max: 254 },
      { name: "telsne", label: "Teléfono SNE", type: "tel", max: 30 },
    ],
  },
  {
    title: "Domicilio del empleador",
    description: "Ubicación de la empresa o institución.",
    fields: [
      { name: "calle", label: "Calle", max: 200 },
      { name: "numeroExterior", label: "Número exterior", max: 30 },
      { name: "numeroInterior", label: "Número interior", max: 30 },
      { name: "colonia", label: "Colonia", max: 150 },
      { name: "municipio", label: "Municipio", max: 150 },
      { name: "localidad", label: "Localidad", max: 150 },
      { name: "entidad", label: "Entidad federativa", max: 150 },
      { name: "codigoPostal", label: "Código postal", max: 5 },
      { name: "entreCalles", label: "Entre calles", max: 250 },
    ],
  },
];

export type EmployerFormState = {
  existingEmployerId?: string;
  savedId?: string;
  values?: Record<string, string>;
  errors?: Record<string, string>;
  error?: string;
};

export function validateEmployer(form: FormData) {
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};
  for (const section of employerSections)
    for (const field of section.fields) {
      const raw = form.get(field.name);
      const value = typeof raw === "string" ? raw.trim() : "";
      values[field.name] = value;
      if (field.required && !value)
        errors[field.name] = "Este campo es obligatorio.";
      else if (value && field.max && value.length > field.max)
        errors[field.name] = `Máximo ${field.max} caracteres.`;
      else if (
        value &&
        field.options &&
        !field.options.some(([key]) => key === value)
      )
        errors[field.name] = "Selecciona una opción válida.";
      else if (
        value &&
        field.type === "email" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      )
        errors[field.name] = "Escribe un correo válido.";
    }
  values.rfc = values.rfc.toUpperCase();
  values.curp = values.curp.toUpperCase();
  values.correoGeneral = values.correoGeneral.toLowerCase();
  values.correo = values.correo.toLowerCase();
  if (values.rfc && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(values.rfc))
    errors.rfc =
      values.rfc.length !== 12 && values.rfc.length !== 13
        ? "El RFC debe tener 12 o 13 caracteres: 3 o 4 letras, 6 números y 3 letras o números al final."
        : "El RFC tiene la longitud correcta, pero el formato debe ser: 3 o 4 letras, 6 números y 3 letras o números al final. Ejemplo ficticio: ABC010101AB1.";
  if (
    values.curp &&
    !/^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(values.curp)
  )
    errors.curp = "Revisa la CURP de 18 caracteres.";
  if (!values.razonSocial && !values.nombreComercial)
    errors.razonSocial =
      "Escribe la razón social, el nombre del empleador o el nombre comercial.";
  if (
    !/^\d+$/.test(values.cantidadEempleados) ||
    Number(values.cantidadEempleados) > 2147483647
  )
    errors.cantidadEempleados =
      "Escribe una cantidad entera mayor o igual a cero.";
  if (values.codigoPostal && !/^\d{5}$/.test(values.codigoPostal))
    errors.codigoPostal = "Escribe los cinco dígitos del código postal.";
  if (values.paginaWeb) {
    try {
      if (!["https:", "http:"].includes(new URL(values.paginaWeb).protocol))
        throw new Error();
    } catch {
      errors.paginaWeb =
        "Escribe una dirección que comience con https:// o http://.";
    }
  }
  return { values, errors };
}
