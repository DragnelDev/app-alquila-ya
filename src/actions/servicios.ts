"use server";

import type { TipoServicio } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { hoy, parseFecha } from "@/src/lib/fechas";
import {
  aplicarConfigServicios,
  generarCargosFijos,
  leerConfigServicios,
  redondear,
  SERVICIOS,
} from "@/src/lib/cobranza/servicios";
import { conError, conExito, rutaSegura } from "@/src/lib/mensajes";

const numero = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? NaN : Number(s.replace(",", "."));
};

/** Cambia la configuración de Luz, Agua y WiFi de un contrato (aplica a los cargos futuros). */
export async function configurarServicios(
  contratoId: string,
  formData: FormData
) {
  await exigirAdmin();
  const ruta = `/contratos/${contratoId}`;

  const contrato = await prisma.contrato.findUnique({
    where: { id: contratoId },
  });
  if (!contrato || contrato.estado !== "ACTIVO")
    conError(ruta, "Solo se pueden editar los servicios de un contrato activo");

  const r = leerConfigServicios(formData);
  if (!r.ok) conError(ruta, r.error);

  await prisma.$transaction((tx) =>
    aplicarConfigServicios(tx, contratoId, r.valor, hoy())
  );
  await generarCargosFijos();
  conExito(
    ruta,
    "Servicios actualizados. Los cambios aplican a los próximos cargos"
  );
}

/** Registra o corrige el cargo de un servicio (por lectura de medidor o monto manual) de una cuota. */
export async function registrarCobroServicio(
  pagoId: string,
  tipo: TipoServicio,
  formData: FormData
) {
  await exigirAdmin();
  const volver = rutaSegura(formData.get("volverA"), "/servicios");
  if (!SERVICIOS.includes(tipo)) conError(volver, "Servicio no válido");

  const pago = await prisma.pago.findUnique({
    where: { id: pagoId },
    include: { contrato: { include: { servicios: true } }, servicios: true },
  });
  const config = pago?.contrato.servicios.find((s) => s.tipo === tipo);
  if (!pago || !config || config.modo === "FIJO")
    conError(volver, "Este servicio no se registra manualmente");

  const existente = pago.servicios.find((s) => s.tipo === tipo);
  if (existente?.estado === "PAGADO")
    conError(volver, "Ese cargo ya fue pagado y no se puede modificar");

  const vencimiento = parseFecha(
    String(formData.get("fechaVencimiento") ?? "")
  );
  if (!vencimiento) conError(volver, "La fecha de vencimiento no es válida");

  let lecturaAnterior: number | null = null;
  let lecturaActual: number | null = null;
  let consumo: number | null = null;
  let tarifa: number | null = null;
  let monto: number;

  if (config.modo === "MEDIDOR") {
    lecturaAnterior = numero(formData.get("lecturaAnterior"));
    lecturaActual = numero(formData.get("lecturaActual"));
    tarifa = numero(formData.get("tarifaUnitaria"));
    if (![lecturaAnterior, lecturaActual, tarifa].every(Number.isFinite))
      conError(volver, "Completa las lecturas y la tarifa con números válidos");
    if (lecturaAnterior < 0)
      conError(volver, "La lectura anterior no puede ser negativa");
    if (lecturaActual < lecturaAnterior)
      conError(volver, "La lectura actual no puede ser menor que la anterior");
    if (tarifa <= 0) conError(volver, "La tarifa debe ser mayor a 0");
    consumo = redondear(lecturaActual - lecturaAnterior);
    monto = redondear(consumo * tarifa);
    if (monto <= 0)
      conError(
        volver,
        "El consumo es 0, no hay monto por cobrar. Revisa las lecturas."
      );
  } else {
    monto = numero(formData.get("monto"));
    if (!Number.isFinite(monto) || monto <= 0)
      conError(volver, "El monto debe ser mayor a 0");
    monto = redondear(monto);
  }

  const datos = {
    modo: config.modo,
    lecturaAnterior,
    lecturaActual,
    consumo,
    tarifaUnitaria: tarifa,
    monto,
    fechaVencimiento: vencimiento,
    estado:
      vencimiento < hoy() ? ("ATRASADO" as const) : ("PENDIENTE" as const),
    observaciones:
      String(formData.get("observaciones") ?? "")
        .trim()
        .slice(0, 300) || null,
  };

  await prisma.cobroServicio.upsert({
    where: { pagoId_tipo: { pagoId, tipo } },
    update: datos,
    create: { pagoId, tipo, ...datos },
  });
  conExito(volver, "Cargo registrado");
}
