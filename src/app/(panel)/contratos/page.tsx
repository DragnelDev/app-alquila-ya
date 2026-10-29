import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { bs, etiquetas, fecha, nombreCompleto } from "@/src/lib/formato";
import { Aviso } from "@/src/components/ui/Aviso";
import { EstadoBadge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Vacio } from "@/src/components/ui/Vacio";
import {
  btn,
  btnChico,
  btnSec,
  fila,
  tabla,
  td,
  th,
} from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Contratos" };

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await exigirAdmin();
  const { error, ok } = await searchParams;
  const contratos = await prisma.contrato.findMany({
    orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
    include: { habitacion: true, inquilino: true },
  });

  return (
    <>
      <PageHeader
        titulo="Contratos"
        descripcion="Cada contrato asigna un inquilino a una habitación y define cómo y cuándo se cobra."
        acciones={
          <Link href="/contratos/nuevo" className={btn}>
            Nuevo contrato
          </Link>
        }
      />
      <Aviso error={error} ok={ok} />
      <Card sinPadding>
        {contratos.length === 0 ? (
          <Vacio>
            Aún no hay contratos. Registra una habitación y un inquilino, y
            luego crea el primer contrato.
          </Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className={tabla}>
              <thead>
                <tr>
                  <th className={th}>Habitación</th>
                  <th className={th}>Inquilino</th>
                  <th className={th}>Inicio</th>
                  <th className={th}>Cobro</th>
                  <th className={`${th} text-right`}>Monto mensual</th>
                  <th className={th}>Estado</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody>
                {contratos.map((c) => (
                  <tr key={c.id} className={fila}>
                    <td className={`${td} font-medium`}>
                      {c.habitacion.nombre}
                    </td>
                    <td className={td}>{nombreCompleto(c.inquilino)}</td>
                    <td className={`${td} whitespace-nowrap`}>
                      {fecha(c.fechaInicio)}
                    </td>
                    <td className={td}>
                      {c.modalidadCobro === "MES_CALENDARIO"
                        ? "Día 1 de cada mes"
                        : `Día ${c.diaCorte} de cada mes`}
                    </td>
                    <td className={`${td} text-right tabular-nums`}>
                      {bs(c.montoMensual)}
                    </td>
                    <td className={td}>
                      <EstadoBadge estado={c.estado} />
                    </td>
                    <td className={`${td} text-right`}>
                      <Link
                        href={`/contratos/${c.id}`}
                        className={`${btnSec} ${btnChico}`}
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 text-xs text-muted">
        Modalidades disponibles:{" "}
        {Object.values(etiquetas.modalidad).join(" · ")}.
      </p>
    </>
  );
}
