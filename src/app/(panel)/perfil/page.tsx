import type { Metadata } from "next";
import { prisma } from "@/src/lib/prisma";
import { exigirSesion } from "@/src/lib/auth/session";
import { actualizarPerfil, cambiarPassword } from "@/src/actions/perfil";
import { FotoPerfil } from "@/src/components/perfil/FotoPerfil";
import { Aviso } from "@/src/components/ui/Aviso";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { Campo, Input } from "@/src/components/ui/Form";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { btn } from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const sesion = await exigirSesion();
  const { error, ok } = await searchParams;
  const u = await prisma.usuario.findUniqueOrThrow({
    where: { id: sesion.userId },
    include: { _count: { select: { cuentas: true } } },
  });

  return (
    <>
      <PageHeader
        titulo="Mi perfil"
        descripcion={
          u.rol === "ADMIN"
            ? "Administrador"
            : "Propietario (acceso de solo lectura)"
        }
        acciones={
          <>
            {u.emailVerificado && <Badge tono="ok">Correo verificado</Badge>}
            {u._count.cuentas > 0 && (
              <Badge tono="info">Google vinculado</Badge>
            )}
          </>
        }
      />
      <Aviso error={error} ok={ok} />

      <div className="grid max-w-3xl gap-6">
        <Card titulo="Datos personales">
          <form action={actualizarPerfil} className="space-y-5">
            <FotoPerfil imagen={u.imagen} nombre={u.nombre} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nombre">
                <Input
                  name="nombre"
                  required
                  defaultValue={u.nombre}
                  autoComplete="name"
                />
              </Campo>
              <Campo etiqueta="Teléfono">
                <Input
                  name="telefono"
                  type="tel"
                  defaultValue={u.telefono ?? ""}
                  autoComplete="tel"
                />
              </Campo>
            </div>
            <Campo
              etiqueta="Correo"
              ayuda={
                u.emailPendiente
                  ? `Pendiente de confirmar: ${u.emailPendiente}. Seguirás ingresando con tu correo actual hasta confirmarlo.`
                  : "Si lo cambias, te enviaremos un enlace al nuevo correo para confirmarlo."
              }
            >
              <Input
                name="email"
                type="email"
                required
                defaultValue={u.email}
                autoComplete="email"
              />
            </Campo>
            <button className={btn}>Guardar cambios</button>
          </form>
        </Card>

        <Card
          titulo={u.passwordHash ? "Cambiar contraseña" : "Crear contraseña"}
        >
          <form action={cambiarPassword} className="space-y-4">
            {u.passwordHash ? (
              <Campo etiqueta="Contraseña actual">
                <Input
                  name="actual"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </Campo>
            ) : (
              <p className="text-sm text-muted">
                Entras con Google. Puedes crear una contraseña para ingresar
                también con tu correo.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                etiqueta="Nueva contraseña"
                ayuda="Mínimo 8 caracteres, con letras y números."
              >
                <Input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </Campo>
              <Campo etiqueta="Confirmar nueva contraseña">
                <Input
                  name="confirmar"
                  type="password"
                  required
                  autoComplete="new-password"
                />
              </Campo>
            </div>
            <button className={btn}>
              {u.passwordHash ? "Cambiar contraseña" : "Crear contraseña"}
            </button>
          </form>
        </Card>
      </div>
    </>
  );
}
