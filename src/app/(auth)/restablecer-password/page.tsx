import type { Metadata } from "next";
import Link from "next/link";
import { restablecerPassword } from "@/src/actions/auth";
import { consultarToken } from "@/src/lib/auth/tokens";
import { Aviso } from "@/src/components/ui/Aviso";
import { Campo, Input } from "@/src/components/ui/Form";
import { btn, btnSec } from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Restablecer contraseña" };

export default async function RestablecerPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const valido = await consultarToken(token, ["RECUPERAR_PASSWORD"]);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">
        Nueva contraseña
      </h1>
      {valido && token ? (
        <>
          <p className="mb-6 mt-1 text-sm text-muted">
            Elige una contraseña nueva para tu cuenta.
          </p>
          <Aviso error={error} />
          <form
            action={restablecerPassword.bind(null, token)}
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
            <button className={`${btn} w-full`}>Guardar contraseña</button>
          </form>
        </>
      ) : (
        <>
          <p className="mb-6 mt-1 text-sm text-muted">
            El enlace no es válido o ya venció.
          </p>
          <Link href="/olvide-password" className={btnSec}>
            Pedir un nuevo enlace
          </Link>
        </>
      )}
    </>
  );
}
