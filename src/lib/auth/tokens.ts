import { createHash, randomBytes } from "crypto";
import type { TipoToken } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

const HORA = 3_600_000;
const DURACION: Record<TipoToken, number> = {
  VERIFICAR_EMAIL: 24 * HORA,
  RECUPERAR_PASSWORD: 1 * HORA,
  INVITACION: 72 * HORA,
  CAMBIO_EMAIL: 24 * HORA,
};
const ESPERA_REENVIO_MS = 60_000;

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/** Evita enviar correos en ráfaga: un token por minuto y tipo de usuario. */
export async function puedeEnviar(usuarioId: string, tipo: TipoToken) {
  const ultimo = await prisma.tokenUsuario.findFirst({
    where: { usuarioId, tipo },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return !ultimo || Date.now() - ultimo.createdAt.getTime() > ESPERA_REENVIO_MS;
}

/** Crea un token de un solo uso. Solo se guarda su hash; el valor real viaja por correo. */
export async function crearToken(usuarioId: string, tipo: TipoToken) {
  await prisma.tokenUsuario.deleteMany({
    where: { usuarioId, tipo, usadoEn: null },
  });
  const token = randomBytes(32).toString("base64url");
  await prisma.tokenUsuario.create({
    data: {
      usuarioId,
      tipo,
      tokenHash: hashToken(token),
      expiraEn: new Date(Date.now() + DURACION[tipo]),
    },
  });
  return token;
}

/** Consulta un token sin consumirlo (para mostrar el formulario correcto). */
export async function consultarToken(
  token: string | undefined,
  tipos: TipoToken[]
) {
  if (!token) return null;
  const t = await prisma.tokenUsuario.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!t || t.usadoEn || t.expiraEn < new Date() || !tipos.includes(t.tipo))
    return null;
  return { usuarioId: t.usuarioId, tipo: t.tipo };
}

/** Consume el token de forma atómica: solo una petición puede usarlo. */
export async function consumirToken(token: string, tipos: TipoToken[]) {
  const tokenHash = hashToken(token);
  const { count } = await prisma.tokenUsuario.updateMany({
    where: {
      tokenHash,
      tipo: { in: tipos },
      usadoEn: null,
      expiraEn: { gt: new Date() },
    },
    data: { usadoEn: new Date() },
  });
  if (count !== 1) return null;
  const t = await prisma.tokenUsuario.findUnique({ where: { tokenHash } });
  return t ? { usuarioId: t.usuarioId, tipo: t.tipo } : null;
}
