import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { actualizarHabitacion } from "@/src/actions/habitaciones";
import { HabitacionForm } from "@/src/components/habitaciones/HabitacionForm";
import { Aviso } from "@/src/components/ui/Aviso";
import { PageHeader } from "@/src/components/ui/PageHeader";

export const metadata: Metadata = { title: "Editar habitación" };

export default async function EditarHabitacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await exigirAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const h = await prisma.habitacion.findUnique({ where: { id } });
  if (!h) notFound();

  return (
    <>
      <PageHeader titulo={`Editar habitación ${h.nombre}`} />
      <Aviso error={error} />
      <HabitacionForm
        accion={actualizarHabitacion.bind(null, h.id)}
        valores={{
          nombre: h.nombre,
          piso: h.piso,
          precioBase: h.precioBase.toString(),
          descripcion: h.descripcion,
          estado: h.estado,
        }}
        ocupada={h.estado === "OCUPADA"}
        etiquetaBoton="Guardar cambios"
      />
    </>
  );
}
