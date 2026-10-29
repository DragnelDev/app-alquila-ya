import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import {
  cambiarEstadoHabitacion,
  eliminarHabitacion,
} from "@/src/actions/habitaciones";
import { bs, nombreCompleto } from "@/src/lib/formato";
import { Aviso } from "@/src/components/ui/Aviso";
import { EstadoBadge } from "@/src/components/ui/Badge";
import { BotonConfirmar } from "@/src/components/ui/BotonConfirmar";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Vacio } from "@/src/components/ui/Vacio";
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

export const metadata: Metadata = { title: "Habitaciones" };

export default async function HabitacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await exigirAdmin();
  const { error, ok } = await searchParams;
  const habitaciones = await prisma.habitacion.findMany({
    orderBy: [{ piso: "asc" }, { nombre: "asc" }],
    include: {
      contratos: { where: { estado: "ACTIVO" }, include: { inquilino: true } },
    },
  });

  return (
    <>
      <PageHeader
        titulo="Habitaciones"
        descripcion="Registra tus cuartos y controla si están disponibles, ocupados o en mantenimiento."
        acciones={
          <Link href="/habitaciones/nueva" className={btn}>
            Nueva habitación
          </Link>
        }
      />
      <Aviso error={error} ok={ok} />
      <Card sinPadding>
        {habitaciones.length === 0 ? (
          <Vacio>
            Aún no registraste habitaciones. Crea la primera para empezar.
          </Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className={tabla}>
              <thead>
                <tr>
                  <th className={th}>Habitación</th>
                  <th className={th}>Piso</th>
                  <th className={`${th} text-right`}>Precio base</th>
                  <th className={th}>Estado</th>
                  <th className={th}>Inquilino actual</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody>
                {habitaciones.map((h) => {
                  const inquilino = h.contratos[0]?.inquilino;
                  return (
                    <tr key={h.id} className={fila}>
                      <td className={td}>
                        <p className="font-medium">{h.nombre}</p>
                        {h.descripcion && (
                          <p className="max-w-xs truncate text-xs text-muted">
                            {h.descripcion}
                          </p>
                        )}
                      </td>
                      <td className={td}>{h.piso}</td>
                      <td className={`${td} text-right tabular-nums`}>
                        {bs(h.precioBase)}
                      </td>
                      <td className={td}>
                        <EstadoBadge estado={h.estado} />
                      </td>
                      <td className={td}>
                        {inquilino ? (
                          nombreCompleto(inquilino)
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className={td}>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/habitaciones/${h.id}/editar`}
                            className={`${btnSec} ${btnChico}`}
                          >
                            Editar
                          </Link>
                          {h.estado !== "OCUPADA" && (
                            <form
                              action={cambiarEstadoHabitacion.bind(
                                null,
                                h.id,
                                h.estado === "DISPONIBLE"
                                  ? "MANTENIMIENTO"
                                  : "DISPONIBLE"
                              )}
                            >
                              <button className={`${btnSec} ${btnChico}`}>
                                {h.estado === "DISPONIBLE"
                                  ? "A mantenimiento"
                                  : "Marcar disponible"}
                              </button>
                            </form>
                          )}
                          {h.estado !== "OCUPADA" && (
                            <form action={eliminarHabitacion.bind(null, h.id)}>
                              <BotonConfirmar
                                mensaje={`¿Eliminar la habitación ${h.nombre}?`}
                                className={`${btnPeligro} ${btnChico}`}
                              >
                                Eliminar
                              </BotonConfirmar>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
