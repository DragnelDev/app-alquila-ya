import { cache } from "react";
import { redirect } from "next/navigation";
import type { Rol } from "@prisma/client";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export type Sesion = {
  userId: string;
  nombre: string;
  email: string;
  imagen: string | null;
  rol: Rol;
};

/** Lee la sesión de Auth.js y la completa con datos frescos de la base (rol, nombre, foto, activo). */
export const obtenerSesion = cache(async (): Promise<Sesion | null> => {
  const s = await auth();
  const id = s?.user?.id;
  if (!id) return null;
  const u = await prisma.usuario.findUnique({ where: { id } });
  if (!u || !u.activo) return null;
  return {
    userId: u.id,
    nombre: u.nombre,
    email: u.email,
    imagen: u.imagen,
    rol: u.rol,
  };
});

/** Exige sesión válida. Si se indican roles, exige que el usuario tenga uno de ellos. */
export async function exigirSesion(...roles: Rol[]): Promise<Sesion> {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  if (roles.length > 0 && !roles.includes(sesion.rol)) redirect("/dashboard");
  return sesion;
}

export const exigirAdmin = () => exigirSesion("ADMIN");
