"use server";

import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { contratoSchema } from "@/src/validations/contrato";
import { parseFecha, hoy } from "@/src/lib/fechas";
import { primerError } from "@/src/validations/comun";
import { generarCuotas } from "@/src/lib/cobranza/generar-cuotas";
import {
  aplicarConfigServicios,
  generarCargosFijos,
  leerConfigServicios,
} from "@/src/lib/cobranza/servicios";
import { conError, conExito } from "@/src/lib/mensajes";

const RUTA = "/contratos/nuevo";

export async function crearContrato(formData: FormData) {
  await exigirAdmin();
  const r = contratoSchema.safeParse(Object.fromEntries(formData));
  if (!r.success) conError(RUTA, primerError(r.error));
  const d = r.data;

  // Día de corte: mes calendario = día 1; si no, un día entre 1 y 28
  let diaCorte = 1;
  if (d.modalidadCobro === "DIA_CORTE") {
    diaCorte = Number(d.diaCorte);
    if (!Number.isInteger(diaCorte) || diaCorte < 1 || diaCorte > 28) {
      conError(RUTA, "El día de corte debe ser un número entre 1 y 28");
    }
  }

  const fechaFin = d.fechaFin ? parseFecha(d.fechaFin) : null;
  if (d.fechaFin && !fechaFin) conError(RUTA, "La fecha de fin no es válida");
  if (fechaFin && fechaFin < d.fechaInicio)
    conError(RUTA, "La fecha de fin no puede ser anterior al inicio");

  const habitacion = await prisma.habitacion.findUnique({
    where: { id: d.habitacionId },
  });
  if (!habitacion || habitacion.estado !== "DISPONIBLE")
    conError(RUTA, "La habitación seleccionada no está disponible");
  if (!(await prisma.inquilino.findUnique({ where: { id: d.inquilinoId } })))
    conError(RUTA, "El inquilino no existe");

  const servicios = leerConfigServicios(formData);
  if (!servicios.ok) conError(RUTA, servicios.error);

  let montoMensual = Number(habitacion.precioBase);
  if (d.montoMensual?.trim()) {
    montoMensual = Number(d.montoMensual.replace(",", "."));
    if (!Number.isFinite(montoMensual) || montoMensual <= 0)
      conError(RUTA, "El monto mensual debe ser mayor a 0");
  }

  let contratoId: string;
  try {
    const contrato = await prisma.$transaction(async (tx) => {
      const c = await tx.contrato.create({
        data: {
          habitacionId: d.habitacionId,
          inquilinoId: d.inquilinoId,
          fechaInicio: d.fechaInicio,
          fechaFin,
          modalidadCobro: d.modalidadCobro,
          diaCorte,
          montoMensual,
          depositoGarantia: d.depositoGarantia,
          observaciones: d.observaciones,
        },
      });
      await aplicarConfigServicios(tx, c.id, servicios.valor, d.fechaInicio);
      await tx.habitacion.update({
        where: { id: d.habitacionId },
        data: { estado: "OCUPADA" },
      });
      return c;
    });
    contratoId = contrato.id;
  } catch {
    conError(
      RUTA,
      "No se pudo crear el contrato. Verifica que la habitación no tenga otro contrato activo."
    );
  }

  await generarCuotas(contratoId);
  await generarCargosFijos();
  conExito(`/contratos/${contratoId}`, "Contrato creado y cuotas generadas");
}

export async function finalizarContrato(id: string) {
  await exigirAdmin();
  const contrato = await prisma.contrato.findUnique({ where: { id } });
  if (!contrato || contrato.estado !== "ACTIVO")
    conError(`/contratos/${id}`, "El contrato no está activo");

  const h = hoy();
  await prisma.$transaction([
    prisma.contrato.update({
      where: { id },
      data: { estado: "FINALIZADO", fechaFin: h },
    }),
    prisma.habitacion.update({
      where: { id: contrato.habitacionId },
      data: { estado: "DISPONIBLE" },
    }),
    // Las cuotas futuras ya no se cobrarán; las vencidas o del día se conservan
    prisma.pago.deleteMany({
      where: {
        contratoId: id,
        estado: "PENDIENTE",
        fechaVencimiento: { gt: h },
      },
    }),
  ]);
  conExito(
    `/contratos/${id}`,
    "Contrato finalizado. La habitación quedó disponible"
  );
}
