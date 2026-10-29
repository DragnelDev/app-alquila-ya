import type { EstadoPago, Prisma } from "@prisma/client";
import { SERVICIOS, etiquetaServicio, unidadServicio } from "./servicios";
import { bs } from "@/src/lib/formato";

export const incluirCuenta = {
  contrato: { include: { habitacion: true, inquilino: true, servicios: true } },
  servicios: { include: { recibo: true } },
  recibo: true,
} satisfies Prisma.PagoInclude;

export type PagoCompleto = Prisma.PagoGetPayload<{
  include: typeof incluirCuenta;
}>;

export type LineaCuenta = {
  clave: string; // "ALQUILER" o "servicio:<id>" (se usa en el formulario de cobro)
  concepto: string;
  detalle?: string;
  monto: number | null;
  estado: EstadoPago | "INCLUIDO" | "SIN_REGISTRAR";
  reciboId?: string | null;
  reciboNumero?: number | null;
};

/** Arma el desglose del mes: Alquiler base + Luz + Agua + WiFi = Total a pagar. */
export function calcularCuenta(p: PagoCompleto) {
  const lineas: LineaCuenta[] = [
    {
      clave: "ALQUILER",
      concepto: "Alquiler base",
      monto: Number(p.monto),
      estado: p.estado,
      reciboId: p.reciboId,
      reciboNumero: p.recibo?.numero,
    },
  ];

  for (const tipo of SERVICIOS) {
    const nombre = etiquetaServicio[tipo];
    const cobro = p.servicios.find((s) => s.tipo === tipo);
    const incluido =
      tipo === "LUZ"
        ? p.contrato.incluyeLuz
        : tipo === "AGUA"
          ? p.contrato.incluyeAgua
          : p.contrato.incluyeWifi;
    const config = p.contrato.servicios.find((c) => c.tipo === tipo);

    if (cobro) {
      const u = unidadServicio[tipo];
      lineas.push({
        clave: `servicio:${cobro.id}`,
        concepto: nombre,
        detalle:
          cobro.modo === "MEDIDOR" &&
          cobro.lecturaAnterior !== null &&
          cobro.lecturaActual !== null
            ? `Lectura ${Number(cobro.lecturaAnterior)} → ${Number(cobro.lecturaActual)} · ${Number(cobro.consumo)} ${u} × ${bs(cobro.tarifaUnitaria ?? 0)}`
            : cobro.modo === "FIJO"
              ? "Monto fijo mensual"
              : (cobro.observaciones ?? undefined),
        monto: Number(cobro.monto),
        estado: cobro.estado,
        reciboId: cobro.reciboId,
        reciboNumero: cobro.recibo?.numero,
      });
    } else if (incluido) {
      lineas.push({
        clave: `incluido:${tipo}`,
        concepto: nombre,
        detalle: "Incluido en la tarifa",
        monto: null,
        estado: "INCLUIDO",
      });
    } else if (config) {
      lineas.push({
        clave: `pendiente:${tipo}`,
        concepto: nombre,
        detalle: "Aún no se registró el consumo o cargo del mes",
        monto: null,
        estado: "SIN_REGISTRAR",
      });
    }
  }

  const total = lineas.reduce((s, l) => s + (l.monto ?? 0), 0);
  const pagado = lineas
    .filter((l) => l.estado === "PAGADO")
    .reduce((s, l) => s + (l.monto ?? 0), 0);
  const pendientes = lineas.filter(
    (l) =>
      (l.estado === "PENDIENTE" || l.estado === "ATRASADO") && l.monto !== null
  );
  return {
    lineas,
    total,
    pagado,
    saldo: total - pagado,
    pendientes,
    sinRegistrar: lineas.filter((l) => l.estado === "SIN_REGISTRAR").length,
  };
}
