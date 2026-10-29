import type { Metadata } from "next";
import { exigirAdmin } from "@/src/lib/auth/session";
import { crearHabitacion } from "@/src/actions/habitaciones";
import { HabitacionForm } from "@/src/components/habitaciones/HabitacionForm";
import { Aviso } from "@/src/components/ui/Aviso";
import { PageHeader } from "@/src/components/ui/PageHeader";

export const metadata: Metadata = { title: "Nueva habitación" };

export default async function NuevaHabitacionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await exigirAdmin();
  const { error } = await searchParams;
  return (
    <>
      <PageHeader titulo="Nueva habitación" />
      <Aviso error={error} />
      <HabitacionForm
        accion={crearHabitacion}
        etiquetaBoton="Guardar habitación"
      />
    </>
  );
}
