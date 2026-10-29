import { registrarPago } from "@/src/actions/pagos";
import type { LineaCuenta } from "@/src/lib/cobranza/cuenta-mensual";
import { aISO, hoy } from "@/src/lib/fechas";
import { bs, etiquetas } from "@/src/lib/formato";
import { Campo, Input, Select } from "@/src/components/ui/Form";
import { btn } from "@/src/components/ui/clases";

/** Cobra uno o varios conceptos pendientes de la cuota con un solo recibo. */
export function RegistrarPagoForm({
  pagoId,
  pendientes,
}: {
  pagoId: string;
  pendientes: LineaCuenta[];
}) {
  return (
    <form action={registrarPago.bind(null, pagoId)} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          Conceptos a cobrar ahora
        </legend>
        <div className="space-y-2">
          {pendientes.map((l) => (
            <label
              key={l.clave}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-line px-3 py-2.5 text-sm"
            >
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="items"
                  value={l.clave}
                  defaultChecked
                  className="size-4 accent-[var(--accent)]"
                />
                {l.concepto}
              </span>
              <span className="font-medium tabular-nums">
                {bs(l.monto ?? 0)}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Lo que no marques queda pendiente y se puede cobrar después con otro
          recibo.
        </p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo etiqueta="Método de pago">
          <Select name="metodoPago" required defaultValue="">
            <option value="" disabled>
              Selecciona
            </option>
            {Object.entries(etiquetas.metodo).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo etiqueta="Fecha de pago">
          <Input
            name="fechaPago"
            type="date"
            required
            defaultValue={aISO(hoy())}
          />
        </Campo>
        <Campo
          etiqueta="Referencia"
          ayuda="Opcional. Nº de transferencia o comprobante."
        >
          <Input name="referencia" />
        </Campo>
      </div>
      <button className={btn}>Registrar cobro y generar recibo</button>
    </form>
  );
}
