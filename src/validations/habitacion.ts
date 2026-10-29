import { z } from "zod";
import { numero, texto, textoOpcional } from "./comun";

export const habitacionSchema = z.object({
  nombre: texto("El número o nombre", 60),
  piso: numero("El piso")
    .refine(Number.isInteger, "El piso debe ser un número entero")
    .refine((n) => n >= 0 && n <= 99, "El piso debe estar entre 0 y 99"),
  precioBase: numero("El precio base").refine(
    (n) => n > 0,
    "El precio base debe ser mayor a 0"
  ),
  descripcion: textoOpcional(500),
  estado: z.enum(["DISPONIBLE", "MANTENIMIENTO"]).optional(),
});
