import { requireSession } from "@/lib/auth";
import { UpcomingSection } from "@/components/UpcomingSection";
export default async function ReportsPage() {
  await requireSession();
  return (
    <UpcomingSection
      title="Reportes"
      description="Aquí podrás seleccionar un periodo y exportar la información capturada a los dos formatos de Excel."
    />
  );
}
