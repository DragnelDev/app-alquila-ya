import { z } from "zod";
import { fechaISO, numero, textoOpcional } from "./comun";

export const contratoSchema = z.object({
  habitacionId: z
    .string("Selecciona una habitación")
    .min(1, "Selecciona una habitación"),
  inquilinoId: z
    .string("Selecciona un inquilino")
    .min(1, "Selecciona un inquilino"),
  fechaInicio: fechaISO("La fecha de inicio"),
  fechaFin: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  modalidadCobro: z.enum(
    ["MES_CALENDARIO", "DIA_CORTE"],
    "Selecciona la modalidad de cobro"
  ),
  diaCorte: z.string().optional(),
  montoMensual: z.string().optional(),
  depositoGarantia: numero("El depósito en garantía").refine(
    (n) => n >= 0,
    "El depósito no puede ser negativo"
  ),
  observaciones: textoOpcional(500),
});
