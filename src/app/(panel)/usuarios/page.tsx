import type { Metadata } from "next";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import {
  cambiarEstadoUsuario,
  invitarPropietario,
  reenviarInvitacion,
} from "@/src/actions/usuarios";
import { Aviso } from "@/src/components/ui/Aviso";
import { Badge } from "@/src/components/ui/Badge";
import { BotonConfirmar } from "@/src/components/ui/BotonConfirmar";
import { Card } from "@/src/components/ui/Card";
import { Campo, Input } from "@/src/components/ui/Form";
import { PageHeader } from "@/src/components/ui/PageHeader";
import {
  btn,
  btnChico,
  btnPeligro,
  btnSec,
  fila,
  tabla,
  td,
  th,
} from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await exigirAdmin();
  const { error, ok } = await searchParams;
  const usuarios = await prisma.usuario.findMany({
    orderBy: [{ rol: "asc" }, { createdAt: "asc" }],
  });

  return (
    <>
      <PageHeader
        titulo="Usuarios"
        descripcion="Invita al propietario para que vea reportes e ingresos. Recibe un correo para crear su contraseña o puede entrar con Google."
      />
      <Aviso error={error} ok={ok} />

      <Card titulo="Invitar propietario" className="mb-6 max-w-2xl">
        <form
          action={invitarPropietario}
          className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <Campo etiqueta="Nombre">
            <Input name="nombre" required autoComplete="off" />
          </Campo>
          <Campo etiqueta="Correo">
            <Input name="email" type="email" required autoComplete="off" />
          </Campo>
          <button className={btn}>Enviar invitación</button>
        </form>
      </Card>

      <Card sinPadding>
        <div className="overflow-x-auto">
          <table className={tabla}>
            <thead>
              <tr>
                <th className={th}>Usuario</th>
                <th className={th}>Rol</th>
                <th className={th}>Estado</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const pendiente = !u.passwordHash && !u.emailVerificado;
                return (
                  <tr key={u.id} className={fila}>
                    <td className={td}>
                      <p className="font-medium">{u.nombre}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className={td}>
                      {u.rol === "ADMIN" ? "Administrador" : "Propietario"}
                    </td>
                    <td className={td}>
                      {!u.activo ? (
                        <Badge tono="neutro">Desactivado</Badge>
                      ) : pendiente ? (
                        <Badge tono="warn">Invitación pendiente</Badge>
                      ) : (
                        <Badge tono="ok">Activo</Badge>
                      )}
                    </td>
                    <td className={td}>
                      {u.rol === "PROPIETARIO" && (
                        <div className="flex justify-end gap-2">
                          {pendiente && u.activo && (
                            <form action={reenviarInvitacion.bind(null, u.id)}>
                              <button className={`${btnSec} ${btnChico}`}>
                                Reenviar invitación
                              </button>
                            </form>
                          )}
                          <form
                            action={cambiarEstadoUsuario.bind(
                              null,
                              u.id,
                              !u.activo
                            )}
                          >
                            {u.activo ? (
                              <BotonConfirmar
                                mensaje={`¿Desactivar el acceso de ${u.nombre}?`}
                                className={`${btnPeligro} ${btnChico}`}
                              >
                                Desactivar
                              </BotonConfirmar>
                            ) : (
                              <button className={`${btnSec} ${btnChico}`}>
                                Reactivar
                              </button>
                            )}
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
