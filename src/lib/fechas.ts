// Todas las fechas de negocio se manejan como "días" en UTC (columnas @db.Date).
// La zona horaria de referencia para "hoy" es Bolivia (UTC-4, sin horario de verano).
export const ZONA = "America/La_Paz";
const OFFSET_HORAS = 4;
const DIA_MS = 86_400_000;

export function hoy(): Date {
  const [y, m, d] = new Date()
    .toLocaleDateString("en-CA", { timeZone: ZONA })
    .split("-")
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const sumarDias = (f: Date, n: number) =>
  new Date(f.getTime() + n * DIA_MS);

export const diasEntre = (desde: Date, hasta: Date) =>
  Math.round((hasta.getTime() - desde.getTime()) / DIA_MS);

/** Instante UTC en que empieza el mes (año, mes 0-11) en hora de Bolivia. */
export const inicioMesLocal = (anio: number, mes: number) =>
  new Date(Date.UTC(anio, mes, 1, OFFSET_HORAS));

/** Convierte "YYYY-MM-DD" a Date UTC (medianoche) o null si es inválida. */
export function parseFecha(valor: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!m) return null;
  const f = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return f.getUTCMonth() === +m[2] - 1 ? f : null;
}

export const aISO = (f: Date) => f.toISOString().slice(0, 10);

/** Instante de pago a mediodía (hora Bolivia) para una fecha elegida. */
export const mediodiaLocal = (f: Date) =>
  new Date(f.getTime() + (12 + OFFSET_HORAS) * 3_600_000);

export function primerVencimiento(inicio: Date, diaCorte: number): Date {
  const y = inicio.getUTCFullYear();
  const m = inicio.getUTCMonth();
  const v = Date.UTC(y, m, diaCorte);
  return new Date(v >= inicio.getTime() ? v : Date.UTC(y, m + 1, diaCorte));
}

export const siguienteVencimiento = (v: Date) =>
  new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate()));

/** Año y mes (0-11) en hora de Bolivia de un instante (timestamp). */
export function mesLocal(f: Date): [number, number] {
  const l = new Date(f.getTime() - OFFSET_HORAS * 3_600_000);
  return [l.getUTCFullYear(), l.getUTCMonth()];
}

/** Lee "YYYY-MM" (de un <input type="month">) y devuelve [año, mes 0-11]; si no es válido, el mes actual. */
export function leerMes(valor: string | undefined): [number, number] {
  const m = valor ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(valor) : null;
  if (m) return [Number(m[1]), Number(m[2]) - 1];
  const h = hoy();
  return [h.getUTCFullYear(), h.getUTCMonth()];
}
