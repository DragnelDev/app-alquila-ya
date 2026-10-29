"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { pagoSchema } from "@/src/validations/pago";
import { primerError } from "@/src/validations/comun";
import { mediodiaLocal } from "@/src/lib/fechas";
import { redondear } from "@/src/lib/cobranza/servicios";
import { conError } from "@/src/lib/mensajes";

/**
 * Cobra los conceptos elegidos (alquiler y/o servicios) de una cuota con un solo recibo.
 * Los conceptos no elegidos quedan pendientes y pueden cobrarse después con otro recibo.
 */
export async function registrarPago(pagoId: string, formData: FormData) {
  await exigirAdmin();
  const ruta = `/pagos/${pagoId}`;

  const r = pagoSchema.safeParse(Object.fromEntries(formData));
  if (!r.success) conError(ruta, primerError(r.error));
  const items = formData.getAll("items").map(String);
  if (items.length === 0)
    conError(ruta, "Selecciona al menos un concepto a cobrar");

  const reciboId = await prisma.$transaction(async (tx) => {
    const pago = await tx.pago.findUnique({
      where: { id: pagoId },
      include: { servicios: true },
    });
    if (!pago) return null;

    const cobrarAlquiler =
      items.includes("ALQUILER") && pago.estado !== "PAGADO";
    const servicios = pago.servicios.filter(
      (s) => items.includes(`servicio:${s.id}`) && s.estado !== "PAGADO"
    );
    if (!cobrarAlquiler && servicios.length === 0) return null;

    const total = redondear(
      (cobrarAlquiler ? Number(pago.monto) : 0) +
        servicios.reduce((s, c) => s + Number(c.monto), 0)
    );
    const recibo = await tx.recibo.create({
      data: {
        fechaPago: mediodiaLocal(r.data.fechaPago),
        metodoPago: r.data.metodoPago,
        referencia: r.data.referencia,
        total,
      },
    });
    if (cobrarAlquiler)
      await tx.pago.update({
        where: { id: pagoId },
        data: { estado: "PAGADO", reciboId: recibo.id },
      });
    if (servicios.length > 0) {
      await tx.cobroServicio.updateMany({
        where: { id: { in: servicios.map((s) => s.id) } },
        data: { estado: "PAGADO", reciboId: recibo.id },
      });
    }
    return recibo.id;
  });

  if (!reciboId)
    conError(ruta, "Esos conceptos ya fueron cobrados o no existen");

  revalidatePath("/", "layout");
  redirect(`/recibos/${reciboId}`);
}
