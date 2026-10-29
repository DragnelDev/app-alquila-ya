import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import {
  calcularCuenta,
  incluirCuenta,
} from "@/src/lib/cobranza/cuenta-mensual";
import {
  bs,
  etiquetas,
  fecha,
  fechaLocal,
  nombreCompleto,
  nroRecibo,
} from "@/src/lib/formato";
import { DesgloseCobro } from "@/src/components/pagos/DesgloseCobro";
import { BotonImprimir } from "@/src/components/ui/BotonImprimir";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { btnSec, fila, tabla, td, th } from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Recibo de pago" };

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirAdmin();
  const { id } = await params;
  const recibo = await prisma.recibo.findUnique({
    where: { id },
    include: {
      pagos: { select: { id: true } },
      cobrosServicio: { select: { pagoId: true } },
    },
  });
  if (!recibo) notFound();

  const pagoIds = [
    ...new Set([
      ...recibo.pagos.map((p) => p.id),
      ...recibo.cobrosServicio.map((c) => c.pagoId),
    ]),
  ];
  const pagos = await prisma.pago.findMany({
    where: { id: { in: pagoIds } },
    include: incluirCuenta,
    orderBy: { fechaVencimiento: "asc" },
  });
  if (pagos.length === 0) notFound();

  const inquilino = pagos[0].contrato.inquilino;
  const habitacion = pagos[0].contrato.habitacion;
  const cuentas = pagos.map((p) => ({ pago: p, cuenta: calcularCuenta(p) }));

  return (
    <>
      <PageHeader
        titulo="Recibo de pago"
        acciones={
          <>
            <Link href={`/pagos/${pagos[0].id}`} className={btnSec}>
              Ver cobro del mes
            </Link>
            <BotonImprimir />
          </>
        }
      />

      <article className="mx-auto max-w-2xl rounded-lg border border-line bg-surface p-8 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-4 border-b border-ink pb-4">
          <div>
            <p className="text-xl font-semibold tracking-tight">AlquilaYa</p>
            <p className="text-sm text-muted">Recibo de alquiler y servicios</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Recibo N°</p>
            <p className="text-xl font-semibold tabular-nums">
              {nroRecibo(recibo.numero)}
            </p>
          </div>
        </header>

        <dl className="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Fecha de pago</dt>
            <dd className="font-medium">{fechaLocal(recibo.fechaPago)}</dd>
          </div>
          <div>
            <dt className="text-muted">Método de pago</dt>
            <dd className="font-medium">
              {etiquetas.metodo[recibo.metodoPago]}
              {recibo.referencia && (
                <span className="block text-xs font-normal text-muted">
                  Ref. {recibo.referencia}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Recibido de</dt>
            <dd className="font-medium">
              {nombreCompleto(inquilino)}
              <span className="block text-xs font-normal text-muted">
                CI {inquilino.documento}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Habitación</dt>
            <dd className="font-medium">
              {habitacion.nombre} (piso {habitacion.piso})
            </dd>
          </div>
        </dl>

        <h2 className="mb-1 mt-6 text-sm font-semibold">
          Conceptos cobrados en este recibo
        </h2>
        <table className={tabla}>
          <thead>
            <tr>
              <th className={th}>Concepto</th>
              <th className={`${th} text-right`}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {cuentas.flatMap(({ pago, cuenta }) =>
              cuenta.lineas
                .filter((l) => l.reciboId === recibo.id)
                .map((l) => (
                  <tr key={`${pago.id}-${l.clave}`} className={fila}>
                    <td className={td}>
                      {l.concepto}
                      <span className="block text-xs text-muted">
                        Período {fecha(pago.periodoInicio)} al{" "}
                        {fecha(pago.periodoFin)}
                        {l.detalle ? ` · ${l.detalle}` : ""}
                      </span>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>
                      {bs(l.monto ?? 0)}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>

        <div className="mt-4 flex items-baseline justify-between rounded-md bg-surface2 px-4 py-4">
          <span className="text-sm text-muted">Total recibido</span>
          <span className="text-3xl font-semibold tabular-nums">
            {bs(recibo.total)}
          </span>
        </div>

        <h2 className="mb-2 mt-8 text-sm font-semibold">Cuenta del mes</h2>
        {cuentas.map(({ pago, cuenta }) => (
          <div key={pago.id} className="mb-4">
            <DesgloseCobro cuenta={cuenta} resaltarReciboId={recibo.id} />
          </div>
        ))}

        <div className="mt-14 grid grid-cols-2 gap-10 text-center text-xs text-muted">
          <div className="border-t border-ink pt-2">Firma del propietario</div>
          <div className="border-t border-ink pt-2">Firma del inquilino</div>
        </div>
      </article>
    </>
  );
}
