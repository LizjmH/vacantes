-- One-time, transactional update for the existing database (no reset).
-- Original values are retained in datosAnteriores before converting catalogs.
BEGIN;
SET LOCAL lock_timeout = '10s';
CREATE TYPE "Escolaridad" AS ENUM ('SIN_ESCOLARIDAD','PRIMARIA','SECUNDARIA','CARRERA_TECNICA','BACHILLERATO','LICENCIATURA','MAESTRIA','DOCTORADO');
CREATE TYPE "ExperienciaRequerida" AS ENUM ('NINGUNA','SEIS_MESES_UN_ANIO','DOS_TRES_ANIOS','CUATRO_CINCO_ANIOS','MAS_CINCO_ANIOS');
CREATE TYPE "TiempoReclutamiento" AS ENUM ('INMEDIATO','UNA_SEMANA','DOS_SEMANAS','UN_MES','MAS_UN_MES');
ALTER TABLE "Vacante" ADD COLUMN "datosAnteriores" JSONB;
UPDATE "Vacante" SET "datosAnteriores" = jsonb_build_object(
  'escolaridad',"escolaridad", 'experienciaAnios',"experienciaAnios",
  'tiempoReclutamiento',"tiempoReclutamiento",'diasTrabajo',"diasTrabajo",
  'horaInicio',"horaInicio",'horaFin',"horaFin"
);
ALTER TABLE "Vacante" ALTER COLUMN "escolaridad" TYPE "Escolaridad" USING (
  CASE translate(lower(trim("escolaridad")), 'áéíóú', 'aeiou')
    WHEN 'sin escolaridad' THEN 'SIN_ESCOLARIDAD'
    WHEN 'primaria' THEN 'PRIMARIA'
    WHEN 'secundaria' THEN 'SECUNDARIA'
    WHEN 'carrera tecnica' THEN 'CARRERA_TECNICA'
    WHEN 'tecnico' THEN 'CARRERA_TECNICA'
    WHEN 'tecnica' THEN 'CARRERA_TECNICA'
    WHEN 'preparatoria' THEN 'BACHILLERATO'
    WHEN 'bachillerato' THEN 'BACHILLERATO'
    WHEN 'preparatoria o bachillerato' THEN 'BACHILLERATO'
    WHEN 'licenciatura' THEN 'LICENCIATURA'
    WHEN 'ingenieria' THEN 'LICENCIATURA'
    WHEN 'licenciatura o ingenieria' THEN 'LICENCIATURA'
    WHEN 'maestria' THEN 'MAESTRIA'
    WHEN 'doctorado' THEN 'DOCTORADO'
    ELSE NULL END
)::"Escolaridad";
ALTER TABLE "Vacante" RENAME COLUMN "experienciaAnios" TO "experiencia";
ALTER TABLE "Vacante" ALTER COLUMN "experiencia" TYPE "ExperienciaRequerida" USING (
  CASE WHEN "experiencia" = 0 THEN 'NINGUNA'
    WHEN "experiencia" = 1 THEN 'SEIS_MESES_UN_ANIO'
    WHEN "experiencia" BETWEEN 2 AND 3 THEN 'DOS_TRES_ANIOS'
    WHEN "experiencia" BETWEEN 4 AND 5 THEN 'CUATRO_CINCO_ANIOS'
    ELSE 'MAS_CINCO_ANIOS' END
)::"ExperienciaRequerida";
ALTER TABLE "Vacante" ALTER COLUMN "tiempoReclutamiento" DROP NOT NULL;
ALTER TABLE "Vacante" ALTER COLUMN "tiempoReclutamiento" TYPE "TiempoReclutamiento" USING (
  CASE translate(lower(trim("tiempoReclutamiento")), 'áéíóú', 'aeiou')
    WHEN 'inmediato' THEN 'INMEDIATO'
    WHEN 'inmediata' THEN 'INMEDIATO'
    WHEN '1 semana' THEN 'UNA_SEMANA'
    WHEN 'una semana' THEN 'UNA_SEMANA'
    WHEN '2 semanas' THEN 'DOS_SEMANAS'
    WHEN 'dos semanas' THEN 'DOS_SEMANAS'
    WHEN '1 mes' THEN 'UN_MES'
    WHEN 'un mes' THEN 'UN_MES'
    WHEN 'mas de 1 mes' THEN 'MAS_UN_MES'
    WHEN 'mas de un mes' THEN 'MAS_UN_MES'
    ELSE NULL END
)::"TiempoReclutamiento";
-- Previous day counts cannot identify the actual weekdays. Keep them in the snapshot.
UPDATE "Vacante" SET "diasTrabajo" = NULL;
ALTER TABLE "Vacante" ADD CONSTRAINT "Vacante_diasTrabajo_bits_check"
  CHECK ("diasTrabajo" BETWEEN 0 AND 127);
COMMIT;
