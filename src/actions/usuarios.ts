"use server";

import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { enviarInvitacion } from "@/src/lib/auth/enlaces";
import { invitacionSchema } from "@/src/validations/auth";
import { primerError } from "@/src/validations/comun";
import { conError, conExito } from "@/src/lib/mensajes";

export async function invitarPropietario(formData: FormData) {
  await exigirAdmin();
  const r = invitacionSchema.safeParse(Object.fromEntries(formData));
  if (!r.success) conError("/usuarios", primerError(r.error));
  if (await prisma.usuario.findUnique({ where: { email: r.data.email } }))
    conError("/usuarios", "Ya existe un usuario con ese correo");

  const usuario = await prisma.usuario.create({
    data: { nombre: r.data.nombre, email: r.data.email, rol: "PROPIETARIO" },
  });
  const envio = await enviarInvitacion(usuario);
  if (envio !== "ok")
    conError(
      "/usuarios",
      "Usuario creado, pero no se pudo enviar la invitación. Usa «Reenviar invitación»."
    );
  conExito("/usuarios", "Invitación enviada");
}

export async function reenviarInvitacion(id: string) {
  await exigirAdmin();
  const usuario = await prisma.usuario.findFirst({
    where: { id, rol: "PROPIETARIO", passwordHash: null },
  });
  if (!usuario) conError("/usuarios", "Esta cuenta ya activó su acceso");
  const envio = await enviarInvitacion(usuario);
  if (envio === "espera")
    conError("/usuarios", "Espera un minuto antes de reenviar la invitación");
  if (envio === "error") conError("/usuarios", "No se pudo enviar el correo");
  conExito("/usuarios", "Invitación reenviada");
}

export async function cambiarEstadoUsuario(id: string, activo: boolean) {
  await exigirAdmin();
  const { count } = await prisma.usuario.updateMany({
    where: { id, rol: "PROPIETARIO" },
    data: { activo },
  });
  if (count === 0) conError("/usuarios", "Usuario no encontrado");
  conExito("/usuarios", activo ? "Acceso reactivado" : "Acceso desactivado");
}
