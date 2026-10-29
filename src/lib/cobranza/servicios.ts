import type { ModoServicio, Prisma, TipoServicio } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

export const SERVICIOS: TipoServicio[] = ["LUZ", "AGUA", "WIFI"];
export const etiquetaServicio: Record<TipoServicio, string> = {
  LUZ: "Luz",
  AGUA: "Agua",
  WIFI: "WiFi",
};
export const unidadServicio: Record<TipoServicio, string> = {
  LUZ: "kWh",
  AGUA: "m³",
  WIFI: "",
};
export const etiquetaModo: Record<ModoServicio, string> = {
  FIJO: "Monto fijo mensual",
  MEDIDOR: "Por lectura de medidor",
  MANUAL: "Monto variable cada mes",
};

export const redondear = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;

export type ConfigServicio = {
  tipo: TipoServicio;
  incluido: boolean;
  config: null | {
    modo: ModoServicio;
    montoFijo: number | null;
    tarifaUnitaria: number | null;
    lecturaInicial: number | null;
  };
};

const numero = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : Number(s.replace(",", "."));
};

/** Lee la configuración de Luz, Agua y WiFi desde un formulario (campos modo_LUZ, monto_LUZ, tarifa_LUZ, lectura_LUZ...). */
export function leerConfigServicios(
  fd: FormData
): { ok: true; valor: ConfigServicio[] } | { ok: false; error: string } {
  const valor: ConfigServicio[] = [];
  for (const tipo of SERVICIOS) {
    const nombre = etiquetaServicio[tipo];
    const modo = String(fd.get(`modo_${tipo}`) ?? "NINGUNO");

    if (modo === "NINGUNO" || modo === "INCLUIDO") {
      valor.push({ tipo, incluido: modo === "INCLUIDO", config: null });
      continue;
    }
    if (modo !== "FIJO" && modo !== "MEDIDOR" && modo !== "MANUAL")
      return { ok: false, error: `Modo de cobro no válido para ${nombre}` };

    const montoFijo = numero(fd.get(`monto_${tipo}`));
    const tarifaUnitaria = numero(fd.get(`tarifa_${tipo}`));
    const lecturaInicial = numero(fd.get(`lectura_${tipo}`));

    if (
      modo === "FIJO" &&
      (montoFijo === null || !Number.isFinite(montoFijo) || montoFijo <= 0)
    ) {
      return { ok: false, error: `${nombre}: ingresa un monto fijo mayor a 0` };
    }
    if (modo === "MEDIDOR") {
      if (
        tarifaUnitaria === null ||
        !Number.isFinite(tarifaUnitaria) ||
        tarifaUnitaria <= 0
      ) {
        return {
          ok: false,
          error: `${nombre}: ingresa la tarifa por ${unidadServicio[tipo] || "unidad"} mayor a 0`,
        };
      }
      if (
        lecturaInicial !== null &&
        (!Number.isFinite(lecturaInicial) || lecturaInicial < 0)
      ) {
        return {
          ok: false,
          error: `${nombre}: la lectura inicial no es válida`,
        };
      }
    }
    valor.push({
      tipo,
      incluido: false,
      config: {
        modo,
        montoFijo: modo === "FIJO" ? montoFijo : null,
        tarifaUnitaria: modo === "MEDIDOR" ? tarifaUnitaria : null,
        lecturaInicial: modo === "MEDIDOR" ? (lecturaInicial ?? 0) : null,
      },
    });
  }
  return { ok: true, valor };
}

/**
 * Guarda la configuración de servicios de un contrato: actualiza las banderas "incluye_*" y las filas de
 * ServicioContrato. `vigenteDesde` aplica a servicios nuevos o con cambio de modo (para cargos FIJO).
 */
export async function aplicarConfigServicios(
  tx: Prisma.TransactionClient,
  contratoId: string,
  items: ConfigServicio[],
  vigenteDesde: Date
) {
  const incluido = (t: TipoServicio) =>
    items.find((i) => i.tipo === t)?.incluido ?? false;
  await tx.contrato.update({
    where: { id: contratoId },
    data: {
      incluyeLuz: incluido("LUZ"),
      incluyeAgua: incluido("AGUA"),
      incluyeWifi: incluido("WIFI"),
    },
  });

  const existentes = await tx.servicioContrato.findMany({
    where: { contratoId },
  });
  for (const it of items) {
    const previo = existentes.find((e) => e.tipo === it.tipo);
    if (!it.config) {
      if (previo)
        await tx.servicioContrato.delete({ where: { id: previo.id } });
      continue;
    }
    const datos = {
      modo: it.config.modo,
      montoFijo: it.config.montoFijo,
      tarifaUnitaria: it.config.tarifaUnitaria,
      lecturaInicial: it.config.lecturaInicial,
    };
    if (previo) {
      await tx.servicioContrato.update({
        where: { id: previo.id },
        data: {
          ...datos,
          vigenteDesde:
            previo.modo === it.config.modo ? previo.vigenteDesde : vigenteDesde,
        },
      });
    } else {
      await tx.servicioContrato.create({
        data: { contratoId, tipo: it.tipo, vigenteDesde, ...datos },
      });
    }
  }
}

/** Crea automáticamente el cargo de los servicios de monto fijo en cada cuota (idempotente). */
export async function generarCargosFijos() {
  const configs = await prisma.servicioContrato.findMany({
    where: {
      modo: "FIJO",
      montoFijo: { not: null },
      contrato: { estado: "ACTIVO" },
    },
  });

  for (const c of configs) {
    const cuotas = await prisma.pago.findMany({
      where: {
        contratoId: c.contratoId,
        fechaVencimiento: { gte: c.vigenteDesde },
        servicios: { none: { tipo: c.tipo } },
      },
      select: { id: true, fechaVencimiento: true },
    });
    if (cuotas.length === 0) continue;
    await prisma.cobroServicio.createMany({
      data: cuotas.map((q) => ({
        pagoId: q.id,
        tipo: c.tipo,
        modo: "FIJO" as const,
        monto: c.montoFijo!,
        fechaVencimiento: q.fechaVencimiento,
      })),
      skipDuplicates: true,
    });
  }
}

/** Lectura anterior sugerida: última lectura registrada del contrato o la lectura inicial configurada. */
export async function lecturaAnteriorSugerida(
  contratoId: string,
  tipo: TipoServicio,
  antesDe: Date,
  lecturaInicial: number | null
) {
  const previo = await prisma.cobroServicio.findFirst({
    where: {
      tipo,
      lecturaActual: { not: null },
      pago: { contratoId, fechaVencimiento: { lt: antesDe } },
    },
    orderBy: { pago: { fechaVencimiento: "desc" } },
    select: { lecturaActual: true },
  });
  return previo?.lecturaActual
    ? Number(previo.lecturaActual)
    : (lecturaInicial ?? 0);
}
