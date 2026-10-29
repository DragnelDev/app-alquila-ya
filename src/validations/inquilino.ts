import { z } from "zod";
import { texto } from "./comun";

export const inquilinoSchema = z.object({
  nombre: texto("El nombre", 80),
  apellidos: texto("Los apellidos", 80),
  documento: texto("El CI o documento", 30),
  telefono: texto("El teléfono", 30),
  contactoEmergenciaNombre: texto("El nombre del contacto de emergencia", 120),
  contactoEmergenciaTelefono: texto(
    "El teléfono del contacto de emergencia",
    30
  ),
});
