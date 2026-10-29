"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { habitacionSchema } from "@/src/validations/habitacion";
import { primerError } from "@/src/validations/comun";
import { conError, conExito } from "@/src/lib/mensajes";

const duplicado = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function crearHabitacion(formData: FormData) {
  await exigirAdmin();
  const r = habitacionSchema.safeParse(Object.fromEntries(formData));
  if (!r.success) conError("/habitaciones/nueva", primerError(r.error));

  try {
    await prisma.habitacion.create({
      data: { ...r.data, estado: r.data.estado ?? "DISPONIBLE" },
    });
  } catch (e) {
    if (duplicado(e))
      conError(
        "/habitaciones/nueva",
        "Ya existe una habitación con ese número o nombre"
      );
    throw e;
  }
  conExito("/habitaciones", "Habitación registrada");
}

export async function actualizarHabitacion(id: string, formData: FormData) {
  await exigirAdmin();
  const ruta = `/habitaciones/${id}/editar`;
  const r = habitacionSchema.safeParse(Object.fromEntries(formData));
  if (!r.success) conError(ruta, primerError(r.error));

  const actual = await prisma.habitacion.findUnique({ where: { id } });
  if (!actual) conError("/habitaciones", "La habitación no existe");

  // El estado OCUPADA lo controlan los contratos; no se puede cambiar a mano
  const estado =
    actual.estado === "OCUPADA" ? "OCUPADA" : (r.data.estado ?? actual.estado);

  try {
    await prisma.habitacion.update({
      where: { id },
      data: { ...r.data, estado },
    });
  } catch (e) {
    if (duplicado(e))
      conError(ruta, "Ya existe una habitación con ese número o nombre");
    throw e;
  }
  conExito("/habitaciones", "Habitación actualizada");
}

export async function cambiarEstadoHabitacion(
  id: string,
  estado: "DISPONIBLE" | "MANTENIMIENTO"
) {
  await exigirAdmin();
  const { count } = await prisma.habitacion.updateMany({
    where: { id, estado: { not: "OCUPADA" } },
    data: { estado },
  });
  if (count === 0)
    conError(
      "/habitaciones",
      "No se puede cambiar el estado de una habitación ocupada"
    );
  conExito("/habitaciones", "Estado actualizado");
}

export async function eliminarHabitacion(id: string) {
  await exigirAdmin();
  const contratos = await prisma.contrato.count({
    where: { habitacionId: id },
  });
  if (contratos > 0)
    conError(
      "/habitaciones",
      "No se puede eliminar: la habitación tiene contratos registrados"
    );
  await prisma.habitacion.delete({ where: { id } });
  conExito("/habitaciones", "Habitación eliminada");
}
