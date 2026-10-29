import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { finalizarContrato } from "@/src/actions/contratos";
import { configurarServicios } from "@/src/actions/servicios";
import {
  etiquetaModo,
  etiquetaServicio,
  unidadServicio,
} from "@/src/lib/cobranza/servicios";
import { ConfigServicios } from "@/src/components/servicios/ConfigServicios";
import { prepararCobranza } from "@/src/lib/cobranza/generar-cuotas";
import { bs, etiquetas, fecha, nombreCompleto } from "@/src/lib/formato";
import { TablaPagos } from "@/src/components/pagos/TablaPagos";
import { Aviso } from "@/src/components/ui/Aviso";
import { EstadoBadge } from "@/src/components/ui/Badge";
import { BotonConfirmar } from "@/src/components/ui/BotonConfirmar";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { btn, btnPeligro, btnSec } from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Contrato" };

function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm font-medium">{children}</dd>
    </div>
  );
}

export default async function ContratoPage({
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

  const c = await prisma.contrato.findUnique({
    where: { id },
    include: {
      habitacion: true,
      inquilino: true,
      pagos: {
        orderBy: { fechaVencimiento: "desc" },
        include: { servicios: true },
      },
      servicios: true,
    },
  });
  if (!c) notFound();

  const resumenServicios = (["LUZ", "AGUA", "WIFI"] as const).map((tipo) => {
    const incluido =
      tipo === "LUZ"
        ? c.incluyeLuz
        : tipo === "AGUA"
          ? c.incluyeAgua
          : c.incluyeWifi;
    const cfg = c.servicios.find((x) => x.tipo === tipo);
    let detalle = "No se cobra";
    if (incluido) detalle = "Incluido en la tarifa";
    else if (cfg) {
      detalle = etiquetaModo[cfg.modo];
      if (cfg.modo === "FIJO" && cfg.montoFijo)
        detalle += ` · ${bs(cfg.montoFijo)}`;
      if (cfg.modo === "MEDIDOR" && cfg.tarifaUnitaria)
        detalle += ` · ${bs(cfg.tarifaUnitaria)} por ${unidadServicio[tipo]}`;
    }
    return { tipo, detalle, cobrado: Boolean(cfg) };
  });

  return (
    <>
      <PageHeader
        titulo={`Habitación ${c.habitacion.nombre} · ${nombreCompleto(c.inquilino)}`}
        descripcion={`Contrato desde el ${fecha(c.fechaInicio)}${c.fechaFin ? ` hasta el ${fecha(c.fechaFin)}` : ""}`}
        acciones={
          <>
            <Link href="/contratos" className={btnSec}>
              Volver
            </Link>
            {c.estado === "ACTIVO" && (
              <form action={finalizarContrato.bind(null, c.id)}>
                <BotonConfirmar
                  mensaje="¿Finalizar el contrato? La habitación quedará disponible y se quitarán las cuotas futuras."
                  className={btnPeligro}
                >
                  Finalizar contrato
                </BotonConfirmar>
              </form>
            )}
          </>
        }
      />
      <Aviso error={error} ok={ok} />

      <Card className="mb-6">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dato etiqueta="Estado">
            <EstadoBadge estado={c.estado} />
          </Dato>
          <Dato etiqueta="Monto mensual">{bs(c.montoMensual)}</Dato>
          <Dato etiqueta="Modalidad de cobro">
            {etiquetas.modalidad[c.modalidadCobro]}
            {c.modalidadCobro === "DIA_CORTE" && ` (día ${c.diaCorte})`}
          </Dato>
          <Dato etiqueta="Depósito en garantía">{bs(c.depositoGarantia)}</Dato>
          <Dato etiqueta="Inquilino">
            {nombreCompleto(c.inquilino)}
            <span className="block text-xs font-normal text-muted">
              CI {c.inquilino.documento} · {c.inquilino.telefono}
            </span>
          </Dato>
          <Dato etiqueta="Contacto de emergencia">
            {c.inquilino.contactoEmergenciaNombre}
            <span className="block text-xs font-normal text-muted">
              {c.inquilino.contactoEmergenciaTelefono}
            </span>
          </Dato>
          {resumenServicios.map((r) => (
            <Dato key={r.tipo} etiqueta={etiquetaServicio[r.tipo]}>
              <span className={r.cobrado ? "" : "font-normal text-muted"}>
                {r.detalle}
              </span>
            </Dato>
          ))}
          {c.observaciones && (
            <Dato etiqueta="Observaciones">{c.observaciones}</Dato>
          )}
        </dl>
      </Card>

      {c.estado === "ACTIVO" && (
        <Card titulo="Editar servicios" className="mb-6">
          <p className="mb-4 text-sm text-muted">
            Los cambios aplican a los próximos cargos; los ya registrados no se
            modifican.
          </p>
          <details>
            <summary className="cursor-pointer text-sm font-medium text-accent">
              Cambiar configuración de Luz, Agua y WiFi
            </summary>
            <form
              action={configurarServicios.bind(null, c.id)}
              className="mt-4 space-y-4"
            >
              <ConfigServicios valores={c} />
              <button className={btn}>Guardar servicios</button>
            </form>
          </details>
        </Card>
      )}

      <Card titulo="Cuotas" sinPadding>
        <TablaPagos
          pagos={c.pagos}
          vacio="Este contrato aún no tiene cuotas."
        />
      </Card>
    </>
  );
}
