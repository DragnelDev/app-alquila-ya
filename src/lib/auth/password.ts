import { compare, hash } from "bcryptjs";
import { z } from "zod";

export const hashPassword = (password: string) => hash(password, 10);
export const verificarPassword = (password: string, passwordHash: string) =>
  compare(password, passwordHash);

/** Política: 8 a 72 caracteres (límite de bcrypt), con al menos una letra y un número. */
export const passwordSchema = z
  .string("La contraseña es obligatoria")
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña no puede superar 72 caracteres")
  .regex(/[A-Za-z]/, "La contraseña debe incluir al menos una letra")
  .regex(/\d/, "La contraseña debe incluir al menos un número");
