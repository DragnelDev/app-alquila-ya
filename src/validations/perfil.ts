import { z } from "zod";
import { passwordSchema } from "@/src/lib/auth/password";
import { emailSchema } from "./auth";
import { texto } from "./comun";

// La foto llega ya reducida desde el navegador (JPEG de hasta 256 px)
const FOTO = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_FOTO = 150_000;

export const perfilSchema = z.object({
  nombre: texto("El nombre", 80),
  telefono: z
    .string()
    .trim()
    .max(30, "El teléfono es demasiado largo")
    .optional()
    .transform((v) => v || null),
  email: emailSchema,
  imagen: z
    .string()
    .optional()
    .transform((v) => v || null)
    .refine(
      (v) => v === null || (v.length <= MAX_FOTO && FOTO.test(v)),
      "La foto no es válida o es demasiado pesada"
    ),
});

export const cambioPasswordSchema = z
  .object({
    actual: z.string().optional(),
    password: passwordSchema,
    confirmar: z.string("Confirma la contraseña"),
  })
  .refine((d) => d.password === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });
