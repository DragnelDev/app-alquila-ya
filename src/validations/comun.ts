import { z } from "zod";
import { parseFecha } from "@/src/lib/fechas";

export const primerError = (e: z.ZodError) =>
  e.issues[0]?.message ?? "Datos inválidos";

export const texto = (campo: string, max = 120) =>
  z
    .string(`${campo} es obligatorio`)
    .trim()
    .min(1, `${campo} es obligatorio`)
    .max(max, `${campo} es demasiado largo`);

export const textoOpcional = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, "El texto es demasiado largo")
    .optional()
    .transform((v) => (v ? v : null));

export const numero = (campo: string) =>
  z
    .string(`${campo} es obligatorio`)
    .trim()
    .min(1, `${campo} es obligatorio`)
    .transform((v) => Number(v.replace(",", ".")))
    .refine((n) => Number.isFinite(n), `${campo} no es un número válido`);

export const fechaISO = (campo: string) =>
  z
    .string(`${campo} es obligatoria`)
    .trim()
    .min(1, `${campo} es obligatoria`)
    .transform((v) => parseFecha(v))
    .refine((d): d is Date => d !== null, `${campo} no es una fecha válida`);
