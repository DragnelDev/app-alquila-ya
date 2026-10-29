import type { Metadata } from "next";
import Link from "next/link";
import { aceptarInvitacion } from "@/src/actions/auth";
import { consultarToken } from "@/src/lib/auth/tokens";
import { Aviso } from "@/src/components/ui/Aviso";
import { Campo, Input } from "@/src/components/ui/Form";
import { btn, btnSec } from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Activar cuenta" };

export default async function InvitacionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const valido = await consultarToken(token, ["INVITACION"]);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Activar cuenta</h1>
      {valido && token ? (
        <>
          <p className="mb-6 mt-1 text-sm text-muted">
            Crea tu contraseña para entrar como propietario.
          </p>
          <Aviso error={error} />
          <form
            action={aceptarInvitacion.bind(null, token)}
            className="space-y-4 rounded-lg border border-line bg-surface p-5"
          >
            <Campo
              etiqueta="Contraseña"
              ayuda="Mínimo 8 caracteres, con letras y números."
            >
              <Input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                autoFocus
              />
            </Campo>
            <Campo etiqueta="Confirmar contraseña">
              <Input
                name="confirmar"
                type="password"
                required
                autoComplete="new-password"
              />
            </Campo>
            <button className={`${btn} w-full`}>Activar cuenta</button>
          </form>
        </>
      ) : (
        <>
          <p className="mb-6 mt-1 text-sm text-muted">
            El enlace no es válido o ya venció.
          </p>
          <Link href="/login" className={btnSec}>
            Ir a ingresar
          </Link>
        </>
      )}
    </>
  );
}
