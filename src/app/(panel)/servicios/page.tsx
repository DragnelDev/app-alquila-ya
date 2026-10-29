import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { prepararCobranza } from "@/src/lib/cobranza/generar-cuotas";
import {
  SERVICIOS,
  etiquetaModo,
  etiquetaServicio,
  lecturaAnteriorSugerida,
  unidadServicio,
} from "@/src/lib/cobranza/servicios";
import { hoy, leerMes, sumarDias } from "@/src/lib/fechas";
import { bs, fecha, mesAnio, nombreCompleto } from "@/src/lib/formato";
import { RegistrarServicioForm } from "@/src/components/servicios/RegistrarServicioForm";
import { Aviso } from "@/src/components/ui/Aviso";
import { Badge, EstadoBadge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Form";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Vacio } from "@/src/components/ui/Vacio";
import { btnSec, fila, tabla, td, th } from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Servicios" };

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; error?: string; ok?: string }>;
}) {
  await exigirAdmin();
  await prepararCobranza();
  const { mes, error, ok } = await searchParams;
  const [anio, m] = leerMes(mes);
  const clave = `${anio}-${String(m + 1).padStart(2, "0")}`;
  const h = hoy();

  // Cada cuota del mes lleva los cargos de Luz, Agua y WiFi de ese período
  const pagos = await prisma.pago.findMany({
    where: {
      fechaVencimiento: {
        gte: new Date(Date.UTC(anio, m, 1)),
        lt: new Date(Date.UTC(anio, m + 1, 1)),
      },
      contrato: { servicios: { some: {} } },
    },
    include: {
      contrato: {
        include: { habitacion: true, inquilino: true, servicios: true },
      },
      servicios: true,
    },
    orderBy: [{ contrato: { habitacion: { nombre: "asc" } } }],
  });

  const filas = await Promise.all(
    pagos.flatMap((pago) =>
      SERVICIOS.flatMap((tipo) => {
        const config = pago.contrato.servicios.find((s) => s.tipo === tipo);
        if (!config) return [];
        const cobro = pago.servicios.find((s) => s.tipo === tipo);
        return [
          (async () => ({
            pago,
            config,
            cobro,
            anterior:
              config.modo === "MEDIDOR" && !cobro
                ? await lecturaAnteriorSugerida(
                    pago.contratoId,
                    tipo,
                    pago.fechaVencimiento,
                    config.lecturaInicial ? Number(config.lecturaInicial) : null
                  )
                : 0,
          }))(),
        ];
      })
    )
  );

  const sinRegistrar = filas.filter(
    (f) => !f.cobro && f.config.modo !== "FIJO"
  ).length;
  const volverA = `/servicios?mes=${clave}`;

  return (
    <>
      <PageHeader
        titulo="Servicios"
        descripcion="Registra cada mes la lectura de medidor o el monto de Luz, Agua y WiFi. Los montos fijos se cargan solos."
        acciones={
          <Link href="/servicios/historial" className={btnSec}>
            Historial de servicios
          </Link>
        }
      />
      <Aviso error={error} ok={ok} />

      <form className="mb-6 flex flex-wrap items-end gap-2" role="search">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Mes de vencimiento
          </span>
          <Input
            name="mes"
            type="month"
            defaultValue={clave}
            required
            className="w-44"
          />
        </label>
        <button className={btnSec}>Ver mes</button>
        {sinRegistrar > 0 && (
          <Badge tono="warn">
            {sinRegistrar} sin registrar en {mesAnio(anio, m)}
          </Badge>
        )}
      </form>

      <Card sinPadding>
        {filas.length === 0 ? (
          <Vacio>
            No hay cuotas con servicios por cobrar en {mesAnio(anio, m)}.
            Configura Luz, Agua o WiFi en el contrato de la habitación.
          </Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className={tabla}>
              <thead>
                <tr>
                  <th className={th}>Habitación</th>
                  <th className={th}>Inquilino</th>
                  <th className={th}>Servicio</th>
                  <th className={th}>Cargo</th>
                  <th className={th}>Estado</th>
                  <th className={th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filas.map(({ pago, config, cobro, anterior }) => {
                  const u = unidadServicio[config.tipo];
                  const vence =
                    pago.fechaVencimiento >= h
                      ? pago.fechaVencimiento
                      : sumarDias(h, 5);
                  return (
                    <tr
                      key={`${pago.id}-${config.tipo}`}
                      className={`${fila} align-top`}
                    >
                      <td className={`${td} font-medium`}>
                        {pago.contrato.habitacion.nombre}
                      </td>
                      <td className={td}>
                        {nombreCompleto(pago.contrato.inquilino)}
                      </td>
                      <td className={td}>
                        {etiquetaServicio[config.tipo]}
                        <p className="text-xs text-muted">
                          {etiquetaModo[config.modo]}
                        </p>
                      </td>
                      <td className={td}>
                        {cobro ? (
                          <>
                            <p className="font-medium tabular-nums">
                              {bs(cobro.monto)}
                            </p>
                            {cobro.modo === "MEDIDOR" &&
                              cobro.lecturaActual !== null && (
                                <p className="text-xs text-muted">
                                  {Number(cobro.lecturaAnterior)} →{" "}
                                  {Number(cobro.lecturaActual)} ·{" "}
                                  {Number(cobro.consumo)} {u}
                                </p>
                              )}
                            <p className="text-xs text-muted">
                              Vence {fecha(cobro.fechaVencimiento)}
                            </p>
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className={td}>
                        {cobro ? (
                          <EstadoBadge estado={cobro.estado} />
                        ) : config.modo === "FIJO" ? (
                          <Badge>Automático</Badge>
                        ) : (
                          <Badge tono="warn">Sin registrar</Badge>
                        )}
                      </td>
                      <td className={td}>
                        {config.modo === "FIJO" ? (
                          <span className="text-xs text-muted">
                            Se carga solo
                          </span>
                        ) : cobro?.estado === "PAGADO" ? (
                          <Link
                            href={`/pagos/${pago.id}`}
                            className="text-sm text-accent hover:underline"
                          >
                            Ver cobro
                          </Link>
                        ) : (
                          <details>
                            <summary className="cursor-pointer text-sm font-medium text-accent">
                              {cobro ? "Corregir" : "Registrar"}
                            </summary>
                            <RegistrarServicioForm
                              pagoId={pago.id}
                              config={config}
                              cobro={cobro}
                              lecturaAnterior={anterior}
                              vencimiento={vence}
                              volverA={volverA}
                            />
                          </details>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 text-xs text-muted">
        El vencimiento sugerido es la fecha de la cuota; si ya pasó, 5 días
        desde hoy. Puedes cambiarlo al registrar el cargo.
      </p>
    </>
  );
}
