import { prisma } from "@/src/lib/prisma";
import { hoy, inicioMesLocal, sumarDias } from "@/src/lib/fechas";
import { nombreCompleto } from "@/src/lib/formato";
import { etiquetaServicio } from "./servicios";

export const DIAS_ALERTA = 5;

/** Un cobro pendiente (alquiler o servicio) que merece atención en el panel. */
export type AlertaCobro = {
  id: string;
  concepto: string;
  pagoId: string;
  habitacion: string;
  inquilino: string;
  monto: number;
  fechaVencimiento: Date;
};

const incluirContrato = {
  contrato: { include: { habitacion: true, inquilino: true } },
} as const;

export async function obtenerResumen() {
  const h = hoy();
  const inicioMes = inicioMesLocal(h.getUTCFullYear(), h.getUTCMonth());
  const inicioSiguiente = inicioMesLocal(
    h.getUTCFullYear(),
    h.getUTCMonth() + 1
  );
  const ventana = { gte: h, lte: sumarDias(h, DIAS_ALERTA) };
  const abiertos = {
    in: ["PENDIENTE", "ATRASADO"] as ("PENDIENTE" | "ATRASADO")[],
  };

  const [
    recaudado,
    pagosPend,
    serviciosPend,
    pagosMora,
    serviciosMora,
    porEstado,
    pagosProx,
    serviciosProx,
    pagosEnMora,
    serviciosEnMora,
  ] = await Promise.all([
    prisma.recibo.aggregate({
      _sum: { total: true },
      where: { fechaPago: { gte: inicioMes, lt: inicioSiguiente } },
    }),
    prisma.pago.aggregate({
      _sum: { monto: true },
      where: { estado: abiertos },
    }),
    prisma.cobroServicio.aggregate({
      _sum: { monto: true },
      where: { estado: abiertos },
    }),
    prisma.pago.aggregate({
      _sum: { monto: true },
      where: { estado: "ATRASADO" },
    }),
    prisma.cobroServicio.aggregate({
      _sum: { monto: true },
      where: { estado: "ATRASADO" },
    }),
    prisma.habitacion.groupBy({ by: ["estado"], _count: { _all: true } }),
    prisma.pago.findMany({
      where: { estado: "PENDIENTE", fechaVencimiento: ventana },
      include: incluirContrato,
    }),
    prisma.cobroServicio.findMany({
      where: { estado: "PENDIENTE", fechaVencimiento: ventana },
      include: { pago: { include: incluirContrato } },
    }),
    prisma.pago.findMany({
      where: { estado: "ATRASADO" },
      include: incluirContrato,
    }),
    prisma.cobroServicio.findMany({
      where: { estado: "ATRASADO" },
      include: { pago: { include: incluirContrato } },
    }),
  ]);

  const deAlquiler = (p: (typeof pagosProx)[number]): AlertaCobro => ({
    id: p.id,
    concepto: "Alquiler",
    pagoId: p.id,
    habitacion: p.contrato.habitacion.nombre,
    inquilino: nombreCompleto(p.contrato.inquilino),
    monto: Number(p.monto),
    fechaVencimiento: p.fechaVencimiento,
  });
  const deServicio = (c: (typeof serviciosProx)[number]): AlertaCobro => ({
    id: c.id,
    concepto: etiquetaServicio[c.tipo],
    pagoId: c.pagoId,
    habitacion: c.pago.contrato.habitacion.nombre,
    inquilino: nombreCompleto(c.pago.contrato.inquilino),
    monto: Number(c.monto),
    fechaVencimiento: c.fechaVencimiento,
  });
  const ordenar = (a: AlertaCobro, b: AlertaCobro) =>
    a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime();

  const conteo = (e: string) =>
    porEstado.find((x) => x.estado === e)?._count._all ?? 0;
  const ocupadas = conteo("OCUPADA");
  const disponibles = conteo("DISPONIBLE");
  const mantenimiento = conteo("MANTENIMIENTO");

  return {
    hoy: h,
    recaudadoMes: Number(recaudado._sum.total ?? 0),
    saldoPendiente:
      Number(pagosPend._sum.monto ?? 0) + Number(serviciosPend._sum.monto ?? 0),
    saldoEnMora:
      Number(pagosMora._sum.monto ?? 0) + Number(serviciosMora._sum.monto ?? 0),
    habitaciones: {
      ocupadas,
      disponibles,
      mantenimiento,
      total: ocupadas + disponibles + mantenimiento,
    },
    proximos: [
      ...pagosProx.map(deAlquiler),
      ...serviciosProx.map(deServicio),
    ].sort(ordenar),
    mora: [
      ...pagosEnMora.map(deAlquiler),
      ...serviciosEnMora.map(deServicio),
    ].sort(ordenar),
  };
}
