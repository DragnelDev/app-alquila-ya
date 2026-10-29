import { z } from "zod";
import { fechaISO, textoOpcional } from "./comun";

export const pagoSchema = z.object({
  metodoPago: z.enum(
    ["EFECTIVO", "TRANSFERENCIA", "QR"],
    "Selecciona el método de pago"
  ),
  referencia: textoOpcional(120),
  fechaPago: fechaISO("La fecha de pago"),
});
