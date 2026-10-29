"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { inquilinoSchema } from "@/src/validations/inquilino";
import { primerError } from "@/src/validations/comun";
import { conError, conExito } from "@/src/lib/mensajes";

const duplicado = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function crearInquilino(formData: FormData) {
  await exigirAdmin();
  const r = inquilinoSchema.safeParse(Object.fromEntries(formData));
  if (!r.success) conError("/inquilinos/nuevo", primerError(r.error));

  try {
    await prisma.inquilino.create({ data: r.data });
  } catch (e) {
    if (duplicado(e))
      conError(
        "/inquilinos/nuevo",
        "Ya existe un inquilino con ese CI o documento"
      );
    throw e;
  }
  conExito("/inquilinos", "Inquilino registrado");
}

export async function actualizarInquilino(id: string, formData: FormData) {
  await exigirAdmin();
  const ruta = `/inquilinos/${id}/editar`;
  const r = inquilinoSchema.safeParse(Object.fromEntries(formData));
  if (!r.success) conError(ruta, primerError(r.error));

  try {
    await prisma.inquilino.update({ where: { id }, data: r.data });
  } catch (e) {
    if (duplicado(e))
      conError(ruta, "Ya existe un inquilino con ese CI o documento");
    throw e;
  }
  conExito("/inquilinos", "Inquilino actualizado");
}

export async function eliminarInquilino(id: string) {
  await exigirAdmin();
  const contratos = await prisma.contrato.count({ where: { inquilinoId: id } });
  if (contratos > 0)
    conError(
      "/inquilinos",
      "No se puede eliminar: el inquilino tiene contratos registrados"
    );
  await prisma.inquilino.delete({ where: { id } });
  conExito("/inquilinos", "Inquilino eliminado");
}
