"use server";

import { redirect } from "next/navigation";
import AuthError from "next-auth";
import { signIn, signOut } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { hashPassword, verificarPassword } from "@/src/lib/auth/password";
import { consumirToken } from "@/src/lib/auth/tokens";
import { enviarRecuperacion, enviarVerificacion } from "@/src/lib/auth/enlaces";
import {
  emailSchema,
  loginSchema,
  nuevaPasswordSchema,
  registroSchema,
} from "@/src/validations/auth";
import { primerError } from "@/src/validations/comun";
import { conError, conExito } from "@/src/lib/mensajes";

export async function iniciarSesion(formData: FormData) {
  const r = loginSchema.safeParse(Object.fromEntries(formData));
  if (!r.success) conError("/login", primerError(r.error));

  const usuario = await prisma.usuario.findUnique({
    where: { email: r.data.email },
  });
  const claveOk = usuario?.passwordHash
    ? await verificarPassword(r.data.password, usuario.passwordHash)
    : false;
  if (!usuario || !usuario.activo || !claveOk)
    conError("/login", "Correo o contraseña incorrectos");

  if (!usuario.emailVerificado) {
    redirect(
      `/login?error=${encodeURIComponent("Debes verificar tu correo antes de ingresar")}&noverificado=${encodeURIComponent(usuario.email)}`
    );
  }

  try {
    await signIn("credentials", {
      email: r.data.email,
      password: r.data.password,
      redirectTo: "/dashboard",
    });
  } catch (e) {
    if (e instanceof AuthError)
      conError("/login", "Correo o contraseña incorrectos");
    throw e; // la redirección de Next también es una excepción y debe propagarse
  }
}

export async function iniciarConGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function cerrarSesion() {
  await signOut({ redirectTo: "/login" });
}

/** Solo permitido mientras no exista ningún usuario: la primera cuenta es el administrador. */
export async function registrar(formData: FormData) {
  if ((await prisma.usuario.count()) > 0)
    conError(
      "/login",
      "El registro está cerrado. Pide una invitación al administrador."
    );

  const r = registroSchema.safeParse(Object.fromEntries(formData));
  if (!r.success) conError("/registro", primerError(r.error));

  const usuario = await prisma.usuario.create({
    data: {
      nombre: r.data.nombre,
      email: r.data.email,
      passwordHash: await hashPassword(r.data.password),
      rol: "ADMIN",
    },
  });
  const envio = await enviarVerificacion(usuario);
  if (envio === "error")
    conError(
      "/login",
      "Cuenta creada, pero no se pudo enviar el correo. Pide un nuevo enlace desde esta pantalla."
    );
  conExito(
    "/login",
    "Cuenta creada. Revisa tu correo para confirmarla antes de ingresar."
  );
}

export async function reenviarVerificacion(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));
  if (email.success) {
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.data },
    });
    if (usuario && usuario.activo && !usuario.emailVerificado)
      await enviarVerificacion(usuario);
  }
  // Misma respuesta exista o no la cuenta, para no revelar qué correos están registrados
  conExito(
    "/login",
    "Si la cuenta existe y falta verificarla, te enviamos un nuevo enlace."
  );
}

export async function confirmarEmail(token: string) {
  const t = await consumirToken(token, ["VERIFICAR_EMAIL", "CAMBIO_EMAIL"]);
  if (!t)
    conError(
      "/login",
      "El enlace no es válido o ya venció. Solicita uno nuevo."
    );

  const usuario = await prisma.usuario.findUnique({
    where: { id: t.usuarioId },
  });
  if (!usuario) conError("/login", "El enlace no es válido");

  if (t.tipo === "CAMBIO_EMAIL") {
    if (!usuario.emailPendiente)
      conError("/login", "No hay un cambio de correo pendiente");
    const ocupado = await prisma.usuario.findUnique({
      where: { email: usuario.emailPendiente },
    });
    if (ocupado)
      conError("/perfil", "Ese correo ya está en uso por otra cuenta");
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        email: usuario.emailPendiente,
        emailPendiente: null,
        emailVerificado: new Date(),
      },
    });
    conExito("/perfil", "Tu correo fue actualizado");
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { emailVerificado: new Date() },
  });
  conExito("/login", "Correo confirmado. Ya puedes ingresar.");
}

export async function solicitarRecuperacion(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) conError("/olvide-password", primerError(email.error));

  const usuario = await prisma.usuario.findUnique({
    where: { email: email.data },
  });
  if (usuario?.activo) await enviarRecuperacion(usuario);
  conExito(
    "/olvide-password",
    "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña."
  );
}

export async function restablecerPassword(token: string, formData: FormData) {
  const ruta = `/restablecer-password?token=${encodeURIComponent(token)}`;
  const r = nuevaPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!r.success)
    redirect(`${ruta}&error=${encodeURIComponent(primerError(r.error))}`);

  const t = await consumirToken(token, ["RECUPERAR_PASSWORD"]);
  if (!t)
    conError(
      "/olvide-password",
      "El enlace no es válido o ya venció. Solicita uno nuevo."
    );

  const usuario = await prisma.usuario.findUnique({
    where: { id: t.usuarioId },
  });
  await prisma.usuario.update({
    where: { id: t.usuarioId },
    // Recibir el enlace en su correo también confirma que el correo es suyo
    data: {
      passwordHash: await hashPassword(r.data.password),
      emailVerificado: usuario?.emailVerificado ?? new Date(),
    },
  });
  conExito(
    "/login",
    "Contraseña actualizada. Ingresa con tu nueva contraseña."
  );
}

export async function aceptarInvitacion(token: string, formData: FormData) {
  const ruta = `/invitacion?token=${encodeURIComponent(token)}`;
  const r = nuevaPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!r.success)
    redirect(`${ruta}&error=${encodeURIComponent(primerError(r.error))}`);

  const t = await consumirToken(token, ["INVITACION"]);
  if (!t)
    conError(
      "/login",
      "La invitación no es válida o ya venció. Pide una nueva al administrador."
    );

  await prisma.usuario.update({
    where: { id: t.usuarioId },
    data: {
      passwordHash: await hashPassword(r.data.password),
      emailVerificado: new Date(),
    },
  });
  conExito("/login", "Cuenta activada. Ya puedes ingresar.");
}
