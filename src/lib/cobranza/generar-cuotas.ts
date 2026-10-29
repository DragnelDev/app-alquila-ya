import { prisma } from "@/src/lib/prisma";
import {
  hoy,
  siguienteVencimiento,
  primerVencimiento,
  sumarDias,
} from "@/src/lib/fechas";
import { generarCargosFijos } from "./servicios";

/** Se generan cuotas hasta esta cantidad de días hacia adelante. */
const HORIZONTE_DIAS = 31;

/**
 * Genera las cuotas mensuales de los contratos ACTIVOS según su día de corte.
 * Es idempotente: la restricción única (contrato, vencimiento) evita duplicados.
 */
export async function generarCuotas(contratoId?: string) {
  const limite = sumarDias(hoy(), HORIZONTE_DIAS);

  const contratos = await prisma.contrato.findMany({
    where: { estado: "ACTIVO", ...(contratoId ? { id: contratoId } : {}) },
    select: {
      id: true,
      fechaInicio: true,
      fechaFin: true,
      diaCorte: true,
      montoMensual: true,
    },
  });
  if (contratos.length === 0) return;

  const ultimas = await prisma.pago.groupBy({
    by: ["contratoId"],
    where: { contratoId: { in: contratos.map((c) => c.id) } },
    _max: { fechaVencimiento: true },
  });
  const ultimaPorContrato = new Map(
    ultimas.map((u) => [u.contratoId, u._max.fechaVencimiento])
  );

  const nuevas = [];
  for (const c of contratos) {
    const ultima = ultimaPorContrato.get(c.id);
    let vence = ultima
      ? siguienteVencimiento(ultima)
      : primerVencimiento(c.fechaInicio, c.diaCorte);

    while (vence <= limite && (!c.fechaFin || vence <= c.fechaFin)) {
      const siguiente = siguienteVencimiento(vence);
      nuevas.push({
        contratoId: c.id,
        periodoInicio: vence,
        periodoFin: sumarDias(siguiente, -1),
        fechaVencimiento: vence,
        monto: c.montoMensual,
      });
      vence = siguiente;
    }
  }

  if (nuevas.length > 0)
    await prisma.pago.createMany({ data: nuevas, skipDuplicates: true });
}

/** Marca como ATRASADO todo alquiler o servicio PENDIENTE cuya fecha de vencimiento ya pasó. */
export async function actualizarAtrasos() {
  const donde = {
    estado: "PENDIENTE" as const,
    fechaVencimiento: { lt: hoy() },
  };
  await prisma.pago.updateMany({ where: donde, data: { estado: "ATRASADO" } });
  await prisma.cobroServicio.updateMany({
    where: donde,
    data: { estado: "ATRASADO" },
  });
}

/** Debe llamarse antes de mostrar dashboard, cobranzas o reportes. */
export async function prepararCobranza() {
  await generarCuotas();
  await generarCargosFijos();
  await actualizarAtrasos();
}
