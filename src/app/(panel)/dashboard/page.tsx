import type { Metadata } from "next";
import { exigirSesion } from "@/src/lib/auth/session";
import { prepararCobranza } from "@/src/lib/cobranza/generar-cuotas";
import { DIAS_ALERTA, obtenerResumen } from "@/src/lib/cobranza/resumen";
import { bs } from "@/src/lib/formato";
import { MetricCard } from "@/src/components/dashboard/MetricCard";
import { ListaAlertas } from "@/src/components/dashboard/ListaAlertas";
import { PageHeader } from "@/src/components/ui/PageHeader";

export const metadata: Metadata = { title: "Panel" };

export default async function DashboardPage() {
  const sesion = await exigirSesion();
  await prepararCobranza();
  const r = await obtenerResumen();
  const { ocupadas, disponibles, mantenimiento, total } = r.habitaciones;
  const porcentaje = total > 0 ? Math.round((ocupadas / total) * 100) : 0;
  const hoyTexto = r.hoy.toLocaleDateString("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <>
      <PageHeader
        titulo="Panel"
        descripcion={hoyTexto.charAt(0).toUpperCase() + hoyTexto.slice(1)}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          titulo="Recaudado este mes"
          valor={bs(r.recaudadoMes)}
          detalle="Pagos registrados en el mes actual"
        />
        <MetricCard
          titulo="Saldo pendiente por cobrar"
          valor={bs(r.saldoPendiente)}
          detalle={
            r.saldoEnMora > 0
              ? `${bs(r.saldoEnMora)} en mora`
              : "Sin cuotas en mora"
          }
        />
        <MetricCard
          titulo="Habitaciones ocupadas / libres"
          valor={`${ocupadas} / ${disponibles}`}
          detalle={`${porcentaje}% de ocupación${mantenimiento ? ` · ${mantenimiento} en mantenimiento` : ""}`}
        >
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-surface2"
            role="img"
            aria-label={`${porcentaje}% de ocupación`}
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </MetricCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ListaAlertas
          titulo={`Por vencer en ${DIAS_ALERTA} días`}
          tipo="proximos"
          alertas={r.proximos}
          hoy={r.hoy}
          soloLectura={sesion.rol !== "ADMIN"}
        />
        <ListaAlertas
          titulo="Cuotas en mora"
          tipo="mora"
          alertas={r.mora}
          hoy={r.hoy}
          soloLectura={sesion.rol !== "ADMIN"}
        />
      </div>
    </>
  );
}
