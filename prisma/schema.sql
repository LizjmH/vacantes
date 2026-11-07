-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoEmpleador" AS ENUM ('PRIVADA', 'PUBLICA', 'SOCIAL');

-- CreateEnum
CREATE TYPE "TipoPersona" AS ENUM ('FISICA', 'MORAL');

-- CreateEnum
CREATE TYPE "EstadoVacante" AS ENUM ('VIGENTE', 'PENDIENTE', 'CUBIERTA', 'NO_VIGENTE');

-- CreateEnum
CREATE TYPE "TipoMedioContacto" AS ENUM ('CORREO', 'DOMICILIO', 'TELEFONO', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "ResultadoSeguimiento" AS ENUM ('VIGENTE', 'CUBIERTA', 'NO_VIGENTE', 'SIN_RESPUESTA', 'PENDIENTE');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "idSilap" TEXT,
    "folio" TEXT,
    "rfc" TEXT,
    "curp" TEXT,
    "tipoEmpleador" "TipoEmpleador" NOT NULL,
    "tipoPersona" "TipoPersona",
    "razonSocial" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "tipoSociedad" TEXT,
    "calle" TEXT,
    "numeroExterior" TEXT,
    "numeroInterior" TEXT,
    "colonia" TEXT,
    "municipio" TEXT,
    "localidad" TEXT,
    "entidad" TEXT,
    "codigoPostal" TEXT,
    "entreCalles" TEXT,
    "empleadosMujeres" INTEGER,
    "empleadosHombres" INTEGER,
    "ramaActividad" TEXT,
    "descripcion" TEXT,
    "correoGeneral" TEXT,
    "paginaWeb" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactoEmpresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT,
    "telefonoFijo" TEXT,
    "extension" TEXT,
    "celular" TEXT,
    "correo" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactoEmpresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vacante" (
    "id" TEXT NOT NULL,
    "idSilap" TEXT,
    "empresaId" TEXT NOT NULL,
    "puesto" TEXT NOT NULL,
    "plazas" INTEGER NOT NULL DEFAULT 1,
    "edadMinima" INTEGER,
    "edadMaxima" INTEGER,
    "escolaridad" TEXT,
    "sueldoMensual" DECIMAL(10,2),
    "diasTrabajo" TEXT,
    "horarioTrabajo" TEXT,
    "experienciaAnios" INTEGER,
    "aceptaDiscapacidad" BOOLEAN NOT NULL DEFAULT false,
    "tipoDiscapacidad" TEXT,
    "descripcionPuesto" TEXT,
    "conocimientos" TEXT,
    "prestaciones" TEXT,
    "tiempoReclutamiento" TEXT,
    "estado" "EstadoVacante" NOT NULL DEFAULT 'VIGENTE',
    "fechaRegistro" TIMESTAMP(3) NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vacante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedioContactoVacante" (
    "id" TEXT NOT NULL,
    "vacanteId" TEXT NOT NULL,
    "tipo" "TipoMedioContacto" NOT NULL,
    "valor" TEXT NOT NULL,
    "horario" TEXT,

    CONSTRAINT "MedioContactoVacante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeguimientoVacante" (
    "id" TEXT NOT NULL,
    "vacanteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultado" "ResultadoSeguimiento" NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeguimientoVacante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_idSilap_key" ON "Empresa"("idSilap");

-- CreateIndex
CREATE INDEX "Empresa_razonSocial_idx" ON "Empresa"("razonSocial");

-- CreateIndex
CREATE INDEX "Empresa_rfc_idx" ON "Empresa"("rfc");

-- CreateIndex
CREATE INDEX "ContactoEmpresa_empresaId_idx" ON "ContactoEmpresa"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Vacante_idSilap_key" ON "Vacante"("idSilap");

-- CreateIndex
CREATE INDEX "Vacante_empresaId_idx" ON "Vacante"("empresaId");

-- CreateIndex
CREATE INDEX "Vacante_fechaRegistro_idx" ON "Vacante"("fechaRegistro");

-- CreateIndex
CREATE INDEX "Vacante_estado_idx" ON "Vacante"("estado");

-- CreateIndex
CREATE INDEX "Vacante_puesto_idx" ON "Vacante"("puesto");

-- CreateIndex
CREATE INDEX "MedioContactoVacante_vacanteId_idx" ON "MedioContactoVacante"("vacanteId");

-- CreateIndex
CREATE INDEX "SeguimientoVacante_vacanteId_idx" ON "SeguimientoVacante"("vacanteId");

-- CreateIndex
CREATE INDEX "SeguimientoVacante_fecha_idx" ON "SeguimientoVacante"("fecha");

-- AddForeignKey
ALTER TABLE "ContactoEmpresa" ADD CONSTRAINT "ContactoEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacante" ADD CONSTRAINT "Vacante_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedioContactoVacante" ADD CONSTRAINT "MedioContactoVacante_vacanteId_fkey" FOREIGN KEY ("vacanteId") REFERENCES "Vacante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguimientoVacante" ADD CONSTRAINT "SeguimientoVacante_vacanteId_fkey" FOREIGN KEY ("vacanteId") REFERENCES "Vacante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

