import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { registrar } from "@/src/actions/auth";
import { prisma } from "@/src/lib/prisma";
import { Aviso } from "@/src/components/ui/Aviso";
import { Campo, Input } from "@/src/components/ui/Form";
import { btn } from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams; // hace la página dinámica: nunca se genera en el build
  // Sistema unipersonal: el registro solo existe mientras no haya ningún usuario
  if ((await prisma.usuario.count()) > 0) redirect("/login");

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Crear cuenta</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Esta primera cuenta será la del administrador. Te enviaremos un correo
        para confirmarla.
      </p>
      <Aviso error={error} />
      <form
        action={registrar}
        className="space-y-4 rounded-lg border border-line bg-surface p-5"
      >
        <Campo etiqueta="Nombre">
          <Input name="nombre" required autoComplete="name" autoFocus />
        </Campo>
        <Campo etiqueta="Correo">
          <Input name="email" type="email" required autoComplete="email" />
        </Campo>
        <Campo
          etiqueta="Contraseña"
          ayuda="Mínimo 8 caracteres, con letras y números."
        >
          <Input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
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
        <button className={`${btn} w-full`}>Crear cuenta</button>
      </form>
      <p className="mt-5 text-sm">
        <Link href="/login" className="text-accent hover:underline">
          Volver a ingresar
        </Link>
      </p>
    </>
  );
}
