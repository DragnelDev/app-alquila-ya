import Link from "next/link";
import type { AlertaCobro } from "@/src/lib/cobranza/resumen";
import { diasEntre } from "@/src/lib/fechas";
import { bs, fecha } from "@/src/lib/formato";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { Vacio } from "@/src/components/ui/Vacio";

export function ListaAlertas({
  titulo,
  tipo,
  alertas,
  hoy,
  soloLectura,
}: {
  titulo: string;
  tipo: "proximos" | "mora";
  alertas: AlertaCobro[];
  hoy: Date;
  soloLectura: boolean;
}) {
  return (
    <Card
      titulo={titulo}
      sinPadding
      accion={
        <Badge
          tono={
            alertas.length ? (tipo === "mora" ? "danger" : "warn") : "neutro"
          }
        >
          {alertas.length}
        </Badge>
      }
    >
      {alertas.length === 0 ? (
        <Vacio>
          {tipo === "mora"
            ? "No hay cobros en mora."
            : "No hay cobros por vencer en los próximos días."}
        </Vacio>
      ) : (
        <ul>
          {alertas.map((a) => {
            const dias = diasEntre(hoy, a.fechaVencimiento);
            const etiqueta =
              tipo === "mora"
                ? `${-dias} ${-dias === 1 ? "día" : "días"} de atraso`
                : dias === 0
                  ? "Vence hoy"
                  : `Vence en ${dias} ${dias === 1 ? "día" : "días"}`;
            const contenido = (
              <>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {a.concepto} · Habitación {a.habitacion}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {a.inquilino} · vencimiento {fecha(a.fechaVencimiento)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {bs(a.monto)}
                  </p>
                  <p
                    className={`text-xs ${tipo === "mora" ? "text-danger" : "text-warn"}`}
                  >
                    {etiqueta}
                  </p>
                </div>
              </>
            );
            const clases =
              "flex items-center justify-between gap-4 border-t border-line px-5 py-3 first:border-t-0";
            return (
              <li key={`${a.concepto}-${a.id}`}>
                {soloLectura ? (
                  <div className={clases}>{contenido}</div>
                ) : (
                  <Link
                    href={`/pagos/${a.pagoId}`}
                    className={`${clases} hover:bg-surface2`}
                  >
                    {contenido}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
