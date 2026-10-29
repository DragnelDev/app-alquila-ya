import { enviarCorreo } from "@/src/lib/correo/enviar";
import { plantillas } from "@/src/lib/correo/plantillas";
import { crearToken, puedeEnviar } from "./tokens";

type Destino = { id: string; nombre: string; email: string };
export type ResultadoEnvio = "ok" | "espera" | "error";

const urlApp = (ruta: string) =>
  new URL(ruta, process.env.APP_URL ?? "http://localhost:3000").toString();

async function enviarEnlace(
  u: Destino,
  tipo:
    "VERIFICAR_EMAIL" | "RECUPERAR_PASSWORD" | "INVITACION" | "CAMBIO_EMAIL",
  ruta: string,
  plantilla: (
    nombre: string,
    url: string
  ) => { asunto: string; html: string; texto: string },
  para = u.email
): Promise<ResultadoEnvio> {
  if (!(await puedeEnviar(u.id, tipo))) return "espera";
  try {
    const token = await crearToken(u.id, tipo);
    await enviarCorreo({
      para,
      ...plantilla(u.nombre, urlApp(`${ruta}?token=${token}`)),
    });
    return "ok";
  } catch (e) {
    console.error("No se pudo enviar el correo:", e);
    return "error";
  }
}

export const enviarVerificacion = (u: Destino) =>
  enviarEnlace(
    u,
    "VERIFICAR_EMAIL",
    "/verificar-email",
    plantillas.verificacion
  );
export const enviarRecuperacion = (u: Destino) =>
  enviarEnlace(
    u,
    "RECUPERAR_PASSWORD",
    "/restablecer-password",
    plantillas.recuperacion
  );
export const enviarInvitacion = (u: Destino) =>
  enviarEnlace(u, "INVITACION", "/invitacion", plantillas.invitacion);
export const enviarCambioEmail = (u: Destino, nuevoEmail: string) =>
  enviarEnlace(
    u,
    "CAMBIO_EMAIL",
    "/verificar-email",
    plantillas.cambioEmail,
    nuevoEmail
  );
