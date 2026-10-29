import Link from "next/link";
import type { calcularCuenta } from "@/src/lib/cobranza/cuenta-mensual";
import { bs, nroRecibo } from "@/src/lib/formato";
import { Badge, EstadoBadge } from "@/src/components/ui/Badge";
import { fila, tabla, td, th } from "@/src/components/ui/clases";

type Cuenta = ReturnType<typeof calcularCuenta>;

/** Alquiler base + Luz + Agua + WiFi = Total a pagar, con el estado de cada concepto. */
export function DesgloseCobro({
  cuenta,
  resaltarReciboId,
}: {
  cuenta: Cuenta;
  resaltarReciboId?: string;
}) {
  const conMonto = cuenta.lineas.filter((l) => l.monto !== null);
  return (
    <div>
      <div className="overflow-x-auto">
        <table className={tabla}>
          <thead>
            <tr>
              <th className={th}>Concepto</th>
              <th className={th}>Detalle</th>
              <th className={`${th} text-right`}>Importe</th>
              <th className={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {cuenta.lineas.map((l) => (
              <tr
                key={l.clave}
                className={`${fila} ${resaltarReciboId && l.reciboId === resaltarReciboId ? "bg-surface2" : ""}`}
              >
                <td className={`${td} font-medium`}>{l.concepto}</td>
                <td className={`${td} text-muted`}>{l.detalle ?? "—"}</td>
                <td className={`${td} text-right tabular-nums`}>
                  {l.monto === null ? "—" : bs(l.monto)}
                </td>
                <td className={td}>
                  {l.estado === "INCLUIDO" ? (
                    <Badge>Incluido</Badge>
                  ) : l.estado === "SIN_REGISTRAR" ? (
                    <Badge tono="warn">Sin registrar</Badge>
                  ) : (
                    <>
                      <EstadoBadge estado={l.estado} />
                      {l.estado === "PAGADO" &&
                        l.reciboId &&
                        l.reciboNumero && (
                          <Link
                            href={`/recibos/${l.reciboId}`}
                            className="ml-2 text-xs text-accent hover:underline print:no-underline"
                          >
                            Recibo {nroRecibo(l.reciboNumero)}
                          </Link>
                        )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ink">
              <td className={`${td} font-semibold`} colSpan={2}>
                Total a pagar
              </td>
              <td className={`${td} text-right font-semibold tabular-nums`}>
                {bs(cuenta.total)}
              </td>
              <td />
            </tr>
            <tr>
              <td className={`${td} text-muted`} colSpan={2}>
                Pagado
              </td>
              <td className={`${td} text-right tabular-nums`}>
                {bs(cuenta.pagado)}
              </td>
              <td />
            </tr>
            <tr>
              <td className={`${td} font-medium`} colSpan={2}>
                Saldo pendiente
              </td>
              <td
                className={`${td} text-right font-medium tabular-nums ${cuenta.saldo > 0 ? "text-danger" : "text-ok"}`}
              >
                {bs(cuenta.saldo)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        {conMonto.map((l) => `${l.concepto} ${bs(l.monto ?? 0)}`).join(" + ")} ={" "}
        {bs(cuenta.total)}
        {cuenta.sinRegistrar > 0 &&
          ` · Faltan ${cuenta.sinRegistrar} ${cuenta.sinRegistrar === 1 ? "servicio" : "servicios"} por registrar`}
      </p>
    </div>
  );
}
