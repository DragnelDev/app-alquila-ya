import { z } from "zod";
import { passwordSchema } from "@/src/lib/auth/password";
import { texto } from "./comun";

export const emailSchema = z
  .string("Ingresa tu correo")
  .trim()
  .toLowerCase()
  .pipe(z.email("Ingresa un correo válido"));

export const loginSchema = z.object({
  email: z
    .string("Ingresa tu correo")
    .trim()
    .toLowerCase()
    .min(1, "Ingresa tu correo"),
  password: z.string("Ingresa tu contraseña").min(1, "Ingresa tu contraseña"),
});

const coinciden = (d: { password: string; confirmar: string }) =>
  d.password === d.confirmar;
const msgCoinciden = {
  message: "Las contraseñas no coinciden",
  path: ["confirmar"],
};

export const registroSchema = z
  .object({
    nombre: texto("El nombre", 80),
    email: emailSchema,
    password: passwordSchema,
    confirmar: z.string("Confirma la contraseña"),
  })
  .refine(coinciden, msgCoinciden);

export const nuevaPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmar: z.string("Confirma la contraseña"),
  })
  .refine(coinciden, msgCoinciden);

export const invitacionSchema = z.object({
  nombre: texto("El nombre", 80),
  email: emailSchema,
});
