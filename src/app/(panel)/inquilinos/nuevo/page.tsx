import type { Metadata } from "next";
import { exigirAdmin } from "@/src/lib/auth/session";
import { crearInquilino } from "@/src/actions/inquilinos";
import { InquilinoForm } from "@/src/components/inquilinos/InquilinoForm";
import { Aviso } from "@/src/components/ui/Aviso";
import { PageHeader } from "@/src/components/ui/PageHeader";

export const metadata: Metadata = { title: "Nuevo inquilino" };

export default async function NuevoInquilinoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await exigirAdmin();
  const { error } = await searchParams;
  return (
    <>
      <PageHeader titulo="Nuevo inquilino" />
      <Aviso error={error} />
      <InquilinoForm
        accion={crearInquilino}
        etiquetaBoton="Guardar inquilino"
      />
    </>
  );
}
