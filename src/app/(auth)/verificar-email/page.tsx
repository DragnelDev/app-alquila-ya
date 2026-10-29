import type { Metadata } from "next";
import Link from "next/link";
import { confirmarEmail } from "@/src/actions/auth";
import { consultarToken } from "@/src/lib/auth/tokens";
import { btn, btnSec } from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Confirmar correo" };

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const valido = await consultarToken(token, [
    "VERIFICAR_EMAIL",
    "CAMBIO_EMAIL",
  ]);

  // El token se consume al pulsar el botón (POST), no al abrir el enlace: así los
  // antivirus o previsualizadores de correo no lo gastan sin querer.
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">
        Confirmar correo
      </h1>
      {valido && token ? (
        <>
          <p className="mb-6 mt-1 text-sm text-muted">
            Pulsa el botón para confirmar tu correo.
          </p>
          <form action={confirmarEmail.bind(null, token)}>
            <button className={`${btn} w-full`}>Confirmar correo</button>
          </form>
        </>
      ) : (
        <>
          <p className="mb-6 mt-1 text-sm text-muted">
            El enlace no es válido o ya venció. Pide uno nuevo desde la pantalla
            de ingreso.
          </p>
          <Link href="/login" className={btnSec}>
            Ir a ingresar
          </Link>
        </>
      )}
    </>
  );
}
