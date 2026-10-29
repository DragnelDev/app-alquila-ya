import { ZONA } from "./fechas";

const moneda = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  currencyDisplay: "narrowSymbol",
});

export const bs = (n: number | { toString(): string }) =>
  moneda.format(Number(n.toString()));

/** Fecha de columna @db.Date (UTC) → dd/mm/aaaa */
export const fecha = (f: Date) =>
  f.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });

/** Instante (timestamp) → dd/mm/aaaa en hora de Bolivia */
export const fechaLocal = (f: Date) =>
  f.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: ZONA,
  });

export const mesAnio = (anio: number, mes: number) =>
  new Date(Date.UTC(anio, mes, 1)).toLocaleDateString("es-BO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export const nombreCompleto = (i: { nombre: string; apellidos: string }) =>
  `${i.nombre} ${i.apellidos}`;

export const nroRecibo = (n: number) => String(n).padStart(6, "0");

export const etiquetas = {
  metodo: { EFECTIVO: "Efectivo", TRANSFERENCIA: "Transferencia", QR: "QR" },
  modalidad: {
    MES_CALENDARIO: "Mes calendario (día 1)",
    DIA_CORTE: "Día de corte",
  },
} as const;
