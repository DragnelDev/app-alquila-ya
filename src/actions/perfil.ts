"use server";

import { prisma } from "@/src/lib/prisma";
import { exigirSesion } from "@/src/lib/auth/session";
import { hashPassword, verificarPassword } from "@/src/lib/auth/password";
import { enviarCambioEmail } from "@/src/lib/auth/enlaces";
import { cambioPasswordSchema, perfilSchema } from "@/src/validations/perfil";
import { primerError } from "@/src/validations/comun";
import { conError, conExito } from "@/src/lib/mensajes";

export async function actualizarPerfil(formData: FormData) {
  const sesion = await exigirSesion();
  const r = perfilSchema.safeParse(Object.fromEntries(formData));
  if (!r.success) conError("/perfil", primerError(r.error));

  const quitarFoto = formData.get("quitarFoto") === "on";
  const cambiaCorreo = r.data.email !== sesion.email;

  if (
    cambiaCorreo &&
    (await prisma.usuario.findUnique({ where: { email: r.data.email } }))
  ) {
    conError("/perfil", "Ese correo ya está en uso por otra cuenta");
  }

  await prisma.usuario.update({
    where: { id: sesion.userId },
    data: {
      nombre: r.data.nombre,
      telefono: r.data.telefono,
      ...(quitarFoto
        ? { imagen: null }
        : r.data.imagen
          ? { imagen: r.data.imagen }
          : {}),
      // El correo actual sigue activo hasta confirmar el nuevo
      emailPendiente: cambiaCorreo ? r.data.email : null,
    },
  });

  if (cambiaCorreo) {
    const envio = await enviarCambioEmail(
      { id: sesion.userId, nombre: r.data.nombre, email: sesion.email },
      r.data.email
    );
    if (envio === "espera")
      conError(
        "/perfil",
        "Perfil guardado. Espera un minuto antes de pedir otro correo de confirmación."
      );
    if (envio === "error")
      conError(
        "/perfil",
        "Perfil guardado, pero no se pudo enviar el correo de confirmación. Inténtalo de nuevo."
      );
    conExito(
      "/perfil",
      "Perfil guardado. Te enviamos un enlace al nuevo correo para confirmarlo."
    );
  }
  conExito("/perfil", "Perfil actualizado");
}

export async function cambiarPassword(formData: FormData) {
  const sesion = await exigirSesion();
  const r = cambioPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!r.success) conError("/perfil", primerError(r.error));

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.userId },
  });
  if (!usuario) conError("/login", "Tu sesión ya no es válida");

  // Quien ya tiene contraseña debe confirmarla; una cuenta solo de Google puede crear la primera
  if (usuario.passwordHash) {
    const correcta = r.data.actual
      ? await verificarPassword(r.data.actual, usuario.passwordHash)
      : false;
    if (!correcta) conError("/perfil", "La contraseña actual no es correcta");
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { passwordHash: await hashPassword(r.data.password) },
  });
  conExito("/perfil", "Contraseña actualizada");
}
