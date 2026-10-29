import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { exigirSesion } from "@/src/lib/auth/session";
import { prepararCobranza } from "@/src/lib/cobranza/generar-cuotas";
import { etiquetaServicio } from "@/src/lib/cobranza/servicios";
import { inicioMesLocal, leerMes, mesLocal } from "@/src/lib/fechas";
import {
  bs,
  etiquetas,
  fechaLocal,
  mesAnio,
  nombreCompleto,
  nroRecibo,
} from "@/src/lib/formato";
import { MetricCard } from "@/src/components/dashboard/MetricCard";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Form";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Vacio } from "@/src/components/ui/Vacio";
import { btnSec, fila, tabla, td, th } from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Reportes" };

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  await exigirSesion();
  await prepararCobranza();
  const { mes } = await searchParams;
  const [anio, m] = leerMes(mes);
  const clave = `${anio}-${String(m + 1).padStart(2, "0")}`;

  const desde = inicioMesLocal(anio, m);
  const hasta = inicioMesLocal(anio, m + 1);

  const incluirContrato = {
    contrato: { include: { habitacion: true, inquilino: true } },
  } as const;
  const [recibosMes, recibosSeisMeses, porEstado] = await Promise.all([
    prisma.recibo.findMany({
      where: { fechaPago: { gte: desde, lt: hasta } },
      orderBy: { fechaPago: "desc" },
      include: {
        pagos: { include: incluirContrato },
        cobrosServicio: { include: { pago: { include: incluirContrato } } },
      },
    }),
    prisma.recibo.findMany({
      where: { fechaPago: { gte: inicioMesLocal(anio, m - 5), lt: hasta } },
      select: { total: true, fechaPago: true },
    }),
    prisma.habitacion.groupBy({ by: ["estado"], _count: { _all: true } }),
  ]);

  const totalMes = recibosMes.reduce((s, r) => s + Number(r.total), 0);
  const alquilerMes = recibosMes.reduce(
    (s, r) => s + r.pagos.reduce((a, p) => a + Number(p.monto), 0),
    0
  );
  const serviciosMes = totalMes - alquilerMes;
  const porMetodo = Object.keys(etiquetas.metodo).map((k) => ({
    clave: k as keyof typeof etiquetas.metodo,
    total: recibosMes
      .filter((r) => r.metodoPago === k)
      .reduce((s, r) => s + Number(r.total), 0),
  }));

  // Ingresos de los últimos 6 meses (hasta el mes elegido)
  const meses = Array.from({ length: 6 }, (_, i) => {
    const f = new Date(Date.UTC(anio, m - 5 + i, 1));
    return { anio: f.getUTCFullYear(), mes: f.getUTCMonth(), total: 0 };
  });
  for (const r of recibosSeisMeses) {
    const [a, mm] = mesLocal(r.fechaPago);
    const destino = meses.find((x) => x.anio === a && x.mes === mm);
    if (destino) destino.total += Number(r.total);
  }
  const maximo = Math.max(...meses.map((x) => x.total), 1);

  const conteo = (e: string) =>
    porEstado.find((x) => x.estado === e)?._count._all ?? 0;
  const ocupadas = conteo("OCUPADA");
  const total = ocupadas + conteo("DISPONIBLE") + conteo("MANTENIMIENTO");
  const tasa = total > 0 ? Math.round((ocupadas / total) * 100) : 0;

  return (
    <>
      <PageHeader
        titulo="Reportes"
        descripcion="Ingresos, ocupación e historial de pagos recaudados."
      />

      <form className="mb-6 flex flex-wrap items-end gap-2" role="search">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Mes</span>
          <Input
            name="mes"
            type="month"
            defaultValue={clave}
            required
            className="w-44"
          />
        </label>
        <button className={btnSec}>Ver mes</button>
        <Link href="/reportes" className={btnSec}>
          Mes actual
        </Link>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          titulo={`Ingresos de ${mesAnio(anio, m)}`}
          valor={bs(totalMes)}
          detalle={`Alquiler ${bs(alquilerMes)} · Servicios ${bs(serviciosMes)} · ${recibosMes.length} ${recibosMes.length === 1 ? "recibo" : "recibos"}`}
        />
        <MetricCard
          titulo="Tasa de ocupación actual"
          valor={`${tasa}%`}
          detalle={`${ocupadas} de ${total} habitaciones ocupadas`}
        >
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-surface2"
            role="img"
            aria-label={`${tasa}% de ocupación`}
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${tasa}%` }}
            />
          </div>
        </MetricCard>
        <MetricCard titulo="Por método de pago" valor="">
          <ul className="mt-1 space-y-1.5 text-sm">
            {porMetodo.map((x) => (
              <li key={x.clave} className="flex justify-between">
                <span className="text-muted">{etiquetas.metodo[x.clave]}</span>
                <span className="font-medium tabular-nums">{bs(x.total)}</span>
              </li>
            ))}
          </ul>
        </MetricCard>
      </div>

      <Card titulo="Ingresos de los últimos 6 meses" className="mt-6">
        <ul
          className="flex h-44 items-end gap-3"
          aria-label="Ingresos mensuales"
        >
          {meses.map((x) => (
            <li
              key={`${x.anio}-${x.mes}`}
              className="flex h-full flex-1 flex-col justify-end text-center"
            >
              <span className="mb-1 text-xs font-medium tabular-nums">
                {x.total > 0 ? bs(x.total) : ""}
              </span>
              <div
                className={`w-full rounded-t-sm ${x.anio === anio && x.mes === m ? "bg-accent" : "bg-surface2"}`}
                style={{
                  height: `${Math.max((x.total / maximo) * 100, x.total > 0 ? 4 : 1)}%`,
                }}
              />
              <span className="mt-2 text-xs capitalize text-muted">
                {new Date(Date.UTC(x.anio, x.mes, 1)).toLocaleDateString(
                  "es-BO",
                  { month: "short", timeZone: "UTC" }
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        titulo={`Historial de pagos · ${mesAnio(anio, m)}`}
        sinPadding
        className="mt-6"
      >
        {recibosMes.length === 0 ? (
          <Vacio>No se registraron pagos en este mes.</Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className={tabla}>
              <thead>
                <tr>
                  <th className={th}>Fecha</th>
                  <th className={th}>Recibo</th>
                  <th className={th}>Habitación</th>
                  <th className={th}>Inquilino</th>
                  <th className={th}>Conceptos</th>
                  <th className={th}>Método</th>
                  <th className={`${th} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {recibosMes.map((r) => {
                  const contrato =
                    r.pagos[0]?.contrato ?? r.cobrosServicio[0]?.pago.contrato;
                  const conceptos = [
                    ...(r.pagos.length ? ["Alquiler"] : []),
                    ...r.cobrosServicio.map((c) => etiquetaServicio[c.tipo]),
                  ];
                  return (
                    <tr key={r.id} className={fila}>
                      <td className={`${td} whitespace-nowrap`}>
                        {fechaLocal(r.fechaPago)}
                      </td>
                      <td className={`${td} tabular-nums`}>
                        {nroRecibo(r.numero)}
                      </td>
                      <td className={`${td} font-medium`}>
                        {contrato?.habitacion.nombre ?? "—"}
                      </td>
                      <td className={td}>
                        {contrato ? nombreCompleto(contrato.inquilino) : "—"}
                      </td>
                      <td className={td}>{conceptos.join(" + ")}</td>
                      <td className={td}>{etiquetas.metodo[r.metodoPago]}</td>
                      <td
                        className={`${td} text-right font-medium tabular-nums`}
                      >
                        {bs(r.total)}
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
