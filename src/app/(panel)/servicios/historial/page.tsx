import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma, TipoServicio } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { prepararCobranza } from "@/src/lib/cobranza/generar-cuotas";
import {
  SERVICIOS,
  etiquetaServicio,
  unidadServicio,
} from "@/src/lib/cobranza/servicios";
import { bs, fecha, nombreCompleto, nroRecibo } from "@/src/lib/formato";
import { Badge, EstadoBadge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { Select } from "@/src/components/ui/Form";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Vacio } from "@/src/components/ui/Vacio";
import { btnSec, fila, tabla, td, th } from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Historial de servicios" };

export default async function HistorialServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; tipo?: string }>;
}) {
  await exigirAdmin();
  await prepararCobranza();
  const { estado, tipo } = await searchParams;
  const soloPendientes = estado !== "todos";
  const tipoFiltro = SERVICIOS.includes(tipo as TipoServicio)
    ? (tipo as TipoServicio)
    : undefined;

  const donde: Prisma.CobroServicioWhereInput = {
    ...(soloPendientes ? { estado: { in: ["PENDIENTE", "ATRASADO"] } } : {}),
    ...(tipoFiltro ? { tipo: tipoFiltro } : {}),
  };
  const cobros = await prisma.cobroServicio.findMany({
    where: donde,
    orderBy: [{ fechaVencimiento: "desc" }],
    include: {
      recibo: true,
      pago: {
        include: {
          contrato: { include: { habitacion: true, inquilino: true } },
        },
      },
    },
    take: 300,
  });

  return (
    <>
      <PageHeader
        titulo="Historial de servicios"
        descripcion="Seguimiento de cada servicio por separado. Te muestra quién pagó el alquiler pero debe luz, agua o WiFi."
        acciones={
          <Link href="/servicios" className={btnSec}>
            Volver a servicios
          </Link>
        }
      />

      <form className="mb-5 flex flex-wrap items-end gap-3" role="search">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Mostrar</span>
          <Select
            name="estado"
            defaultValue={soloPendientes ? "pendientes" : "todos"}
            className="w-48"
          >
            <option value="pendientes">Solo pendientes</option>
            <option value="todos">Todos</option>
          </Select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Servicio</span>
          <Select name="tipo" defaultValue={tipoFiltro ?? ""} className="w-40">
            <option value="">Todos</option>
            {SERVICIOS.map((s) => (
              <option key={s} value={s}>
                {etiquetaServicio[s]}
              </option>
            ))}
          </Select>
        </label>
        <button className={btnSec}>Filtrar</button>
      </form>

      <Card sinPadding>
        {cobros.length === 0 ? (
          <Vacio>
            {soloPendientes
              ? "No hay servicios pendientes de cobro."
              : "Aún no hay cargos de servicios registrados."}
          </Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className={tabla}>
              <thead>
                <tr>
                  <th className={th}>Vencimiento</th>
                  <th className={th}>Habitación</th>
                  <th className={th}>Inquilino</th>
                  <th className={th}>Servicio</th>
                  <th className={`${th} text-right`}>Monto</th>
                  <th className={th}>Estado</th>
                  <th className={th}>Alquiler del mes</th>
                </tr>
              </thead>
              <tbody>
                {cobros.map((c) => (
                  <tr key={c.id} className={`${fila} align-top`}>
                    <td className={`${td} whitespace-nowrap`}>
                      {fecha(c.fechaVencimiento)}
                    </td>
                    <td className={`${td} font-medium`}>
                      {c.pago.contrato.habitacion.nombre}
                    </td>
                    <td className={td}>
                      {nombreCompleto(c.pago.contrato.inquilino)}
                    </td>
                    <td className={td}>
                      {etiquetaServicio[c.tipo]}
                      {c.modo === "MEDIDOR" && c.consumo !== null && (
                        <p className="text-xs text-muted">
                          {Number(c.consumo)} {unidadServicio[c.tipo]}
                        </p>
                      )}
                    </td>
                    <td className={`${td} text-right font-medium tabular-nums`}>
                      {bs(c.monto)}
                    </td>
                    <td className={td}>
                      <EstadoBadge estado={c.estado} />
                      {c.recibo && (
                        <Link
                          href={`/recibos/${c.recibo.id}`}
                          className="mt-1 block text-xs text-accent hover:underline"
                        >
                          Recibo {nroRecibo(c.recibo.numero)}
                        </Link>
                      )}
                    </td>
                    <td className={td}>
                      <Link href={`/pagos/${c.pagoId}`}>
                        {c.pago.estado === "PAGADO" && c.estado !== "PAGADO" ? (
                          <Badge tono="info">Pagado, servicio pendiente</Badge>
                        ) : (
                          <EstadoBadge estado={c.pago.estado} />
                        )}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
