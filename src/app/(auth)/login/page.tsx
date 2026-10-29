import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { iniciarSesion, reenviarVerificacion } from "@/src/actions/auth";
import { obtenerSesion } from "@/src/lib/auth/session";
import { prisma } from "@/src/lib/prisma";
import { BotonGoogle } from "@/src/components/auth/BotonGoogle";
import { Aviso } from "@/src/components/ui/Aviso";
import { Campo, Input } from "@/src/components/ui/Form";
import { btn, btnSec } from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Ingresar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; noverificado?: string }>;
}) {
  if (await obtenerSesion()) redirect("/dashboard");
  const { error, ok, noverificado } = await searchParams;
  const sinUsuarios = (await prisma.usuario.count()) === 0;
  const hayGoogle = Boolean(process.env.AUTH_GOOGLE_ID);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Ingresar</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Gestiona tus habitaciones, contratos y cobranzas.
      </p>
      <Aviso error={error} ok={ok} />

      {noverificado && (
        <form action={reenviarVerificacion} className="mb-5">
          <input type="hidden" name="email" value={noverificado} />
          <button className={`${btnSec} w-full`}>
            Reenviar correo de verificación
          </button>
        </form>
      )}

      <form
        action={iniciarSesion}
        className="space-y-4 rounded-lg border border-line bg-surface p-5"
      >
        <Campo etiqueta="Correo">
          <Input
            name="email"
            type="email"
            autoComplete="username"
            required
            autoFocus
          />
        </Campo>
        <Campo etiqueta="Contraseña">
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Campo>
        <button className={`${btn} w-full`}>Ingresar</button>
        {hayGoogle && <p className="text-center text-xs text-muted">o</p>}
      </form>
      {hayGoogle && (
        <div className="mt-3">
          <BotonGoogle />
        </div>
      )}

      <div className="mt-5 flex justify-between text-sm">
        <Link href="/olvide-password" className="text-accent hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
        {sinUsuarios && (
          <Link href="/registro" className="text-accent hover:underline">
            Crear la primera cuenta
          </Link>
        )}
      </div>
    </>
  );
}
