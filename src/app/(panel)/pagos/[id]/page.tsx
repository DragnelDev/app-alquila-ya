import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { prepararCobranza } from "@/src/lib/cobranza/generar-cuotas";
import {
  calcularCuenta,
  incluirCuenta,
} from "@/src/lib/cobranza/cuenta-mensual";
import { fecha, nombreCompleto } from "@/src/lib/formato";
import { DesgloseCobro } from "@/src/components/pagos/DesgloseCobro";
import { RegistrarPagoForm } from "@/src/components/pagos/RegistrarPagoForm";
import { Aviso } from "@/src/components/ui/Aviso";
import { BotonImprimir } from "@/src/components/ui/BotonImprimir";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { btnSec } from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Cobro del mes" };

export default async function CobroPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await exigirAdmin();
  const { id } = await params;
  const { error, ok } = await searchParams;
  await prepararCobranza();

  const pago = await prisma.pago.findUnique({
    where: { id },
    include: incluirCuenta,
  });
  if (!pago) notFound();
  const cuenta = calcularCuenta(pago);
  const mes = `${pago.fechaVencimiento.getUTCFullYear()}-${String(pago.fechaVencimiento.getUTCMonth() + 1).padStart(2, "0")}`;

  return (
    <>
      <PageHeader
        titulo={`Habitación ${pago.contrato.habitacion.nombre} · ${nombreCompleto(pago.contrato.inquilino)}`}
        descripcion={`Período ${fecha(pago.periodoInicio)} al ${fecha(pago.periodoFin)} · vence el ${fecha(pago.fechaVencimiento)}`}
        acciones={
          <>
            <Link href="/pagos" className={btnSec}>
              Volver a cobranzas
            </Link>
            {cuenta.sinRegistrar > 0 && (
              <Link href={`/servicios?mes=${mes}`} className={btnSec}>
                Registrar servicios
              </Link>
            )}
            <BotonImprimir />
          </>
        }
      />
      <Aviso error={error} ok={ok} />

      <div className="grid max-w-4xl gap-6">
        <Card titulo="Detalle del mes" sinPadding>
          <div className="px-5 py-4">
            <DesgloseCobro cuenta={cuenta} />
          </div>
        </Card>

        <div className="print:hidden">
          <Card titulo="Registrar cobro">
            {cuenta.pendientes.length > 0 ? (
              <RegistrarPagoForm
                pagoId={pago.id}
                pendientes={cuenta.pendientes}
              />
            ) : (
              <p className="text-sm text-muted">
                {cuenta.sinRegistrar > 0
                  ? "No hay importes por cobrar todavía. Registra primero el consumo de los servicios pendientes."
                  : "Todo lo de este mes ya fue cobrado."}
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
