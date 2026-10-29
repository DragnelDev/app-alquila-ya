import type { Metadata } from "next";
import Link from "next/link";
import { solicitarRecuperacion } from "@/src/actions/auth";
import { Aviso } from "@/src/components/ui/Aviso";
import { Campo, Input } from "@/src/components/ui/Form";
import { btn } from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default async function OlvidePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">
        Recuperar contraseña
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Te enviaremos un enlace para elegir una nueva contraseña. Vence en 1
        hora.
      </p>
      <Aviso error={error} ok={ok} />
      <form
        action={solicitarRecuperacion}
        className="space-y-4 rounded-lg border border-line bg-surface p-5"
      >
        <Campo etiqueta="Correo">
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
          />
        </Campo>
        <button className={`${btn} w-full`}>Enviar enlace</button>
      </form>
      <p className="mt-5 text-sm">
        <Link href="/login" className="text-accent hover:underline">
          Volver a ingresar
        </Link>
      </p>
    </>
  );
}
