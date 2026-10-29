import Link from "next/link";
import type {
  CobroServicio,
  Contrato,
  Habitacion,
  Inquilino,
  Pago,
} from "@prisma/client";
import { diasEntre, hoy } from "@/src/lib/fechas";
import { bs, fecha, nombreCompleto } from "@/src/lib/formato";
import { etiquetaServicio } from "@/src/lib/cobranza/servicios";
import { Badge, EstadoBadge, type Tono } from "@/src/components/ui/Badge";
import { Vacio } from "@/src/components/ui/Vacio";
import {
  btnChico,
  btnSec,
  fila,
  tabla,
  td,
  th,
} from "@/src/components/ui/clases";

export type PagoFila = Pago & {
  servicios: CobroServicio[];
  contrato?: Contrato & { habitacion: Habitacion; inquilino: Inquilino };
};

const tonoServicio: Record<string, Tono> = {
  PAGADO: "ok",
  ATRASADO: "danger",
  PENDIENTE: "warn",
};

export function TablaPagos({
  pagos,
  mostrarContrato = false,
  vacio = "No hay cuotas para mostrar.",
}: {
  pagos: PagoFila[];
  mostrarContrato?: boolean;
  vacio?: string;
}) {
  if (pagos.length === 0) return <Vacio>{vacio}</Vacio>;
  const h = hoy();

  return (
    <div className="overflow-x-auto">
      <table className={tabla}>
        <thead>
          <tr>
            <th className={th}>Vencimiento</th>
            {mostrarContrato && <th className={th}>Habitación</th>}
            {mostrarContrato && <th className={th}>Inquilino</th>}
            <th className={th}>Alquiler</th>
            <th className={th}>Servicios</th>
            <th className={`${th} text-right`}>Saldo</th>
            <th className={th}></th>
          </tr>
        </thead>
        <tbody>
          {pagos.map((p) => {
            const atraso =
              p.estado === "ATRASADO" ? diasEntre(p.fechaVencimiento, h) : 0;
            const saldo =
              (p.estado === "PAGADO" ? 0 : Number(p.monto)) +
              p.servicios
                .filter((s) => s.estado !== "PAGADO")
                .reduce((suma, s) => suma + Number(s.monto), 0);
            return (
              <tr key={p.id} className={`${fila} align-top`}>
                <td className={`${td} whitespace-nowrap`}>
                  {fecha(p.fechaVencimiento)}
                  <p className="text-xs text-muted">
                    Período {fecha(p.periodoInicio)} – {fecha(p.periodoFin)}
                  </p>
                </td>
                {mostrarContrato && p.contrato && (
                  <>
                    <td className={`${td} font-medium`}>
                      <Link
                        href={`/contratos/${p.contratoId}`}
                        className="hover:underline"
                      >
                        {p.contrato.habitacion.nombre}
                      </Link>
                    </td>
                    <td className={td}>
                      {nombreCompleto(p.contrato.inquilino)}
                    </td>
                  </>
                )}
                <td className={td}>
                  <p className="font-medium tabular-nums">{bs(p.monto)}</p>
                  <EstadoBadge estado={p.estado} />
                  {atraso > 0 && (
                    <p className="mt-1 text-xs text-danger">
                      {atraso} {atraso === 1 ? "día" : "días"} de atraso
                    </p>
                  )}
                </td>
                <td className={td}>
                  {p.servicios.length === 0 ? (
                    <span className="text-muted">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {p.servicios.map((s) => (
                        <Badge key={s.id} tono={tonoServicio[s.estado]}>
                          {etiquetaServicio[s.tipo]} {bs(s.monto)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </td>
                <td
                  className={`${td} text-right font-medium tabular-nums ${saldo > 0 ? "" : "text-muted"}`}
                >
                  {bs(saldo)}
                </td>
                <td className={`${td} text-right`}>
                  <Link
                    href={`/pagos/${p.id}`}
                    className={`${btnSec} ${btnChico}`}
                  >
                    {saldo > 0 ? "Cobrar" : "Ver"}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
