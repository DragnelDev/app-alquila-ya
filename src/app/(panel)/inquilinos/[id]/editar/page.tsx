import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { actualizarInquilino } from "@/src/actions/inquilinos";
import { nombreCompleto } from "@/src/lib/formato";
import { InquilinoForm } from "@/src/components/inquilinos/InquilinoForm";
import { Aviso } from "@/src/components/ui/Aviso";
import { PageHeader } from "@/src/components/ui/PageHeader";

export const metadata: Metadata = { title: "Editar inquilino" };

export default async function EditarInquilinoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await exigirAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const inquilino = await prisma.inquilino.findUnique({ where: { id } });
  if (!inquilino) notFound();

  return (
    <>
      <PageHeader titulo={`Editar a ${nombreCompleto(inquilino)}`} />
      <Aviso error={error} />
      <InquilinoForm
        accion={actualizarInquilino.bind(null, inquilino.id)}
        valores={inquilino}
        etiquetaBoton="Guardar cambios"
      />
    </>
  );
}
