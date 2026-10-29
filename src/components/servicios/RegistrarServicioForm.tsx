import type { CobroServicio, ServicioContrato } from "@prisma/client";
import { registrarCobroServicio } from "@/src/actions/servicios";
import { unidadServicio } from "@/src/lib/cobranza/servicios";
import { aISO } from "@/src/lib/fechas";
import { Campo, Input } from "@/src/components/ui/Form";
import { btn, btnChico } from "@/src/components/ui/clases";

/** Formulario para registrar o corregir el cargo de un servicio de medidor o monto variable. */
export function RegistrarServicioForm({
  pagoId,
  config,
  cobro,
  lecturaAnterior,
  vencimiento,
  volverA,
}: {
  pagoId: string;
  config: ServicioContrato;
  cobro?: CobroServicio;
  lecturaAnterior: number;
  vencimiento: Date;
  volverA: string;
}) {
  const u = unidadServicio[config.tipo];
  return (
    <form
      action={registrarCobroServicio.bind(null, pagoId, config.tipo)}
      className="mt-2 grid min-w-64 gap-3"
    >
      <input type="hidden" name="volverA" value={volverA} />
      {config.modo === "MEDIDOR" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta={`Lectura anterior (${u})`}>
              <Input
                name="lecturaAnterior"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue={
                  cobro?.lecturaAnterior?.toString() ?? lecturaAnterior
                }
              />
            </Campo>
            <Campo etiqueta={`Lectura actual (${u})`}>
              <Input
                name="lecturaActual"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue={cobro?.lecturaActual?.toString()}
              />
            </Campo>
          </div>
          <Campo etiqueta={`Tarifa por ${u} (Bs)`}>
            <Input
              name="tarifaUnitaria"
              type="number"
              min={0}
              step="0.0001"
              required
              defaultValue={
                cobro?.tarifaUnitaria?.toString() ??
                config.tarifaUnitaria?.toString()
              }
            />
          </Campo>
        </>
      ) : (
        <Campo etiqueta="Monto a cobrar (Bs)">
          <Input
            name="monto"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={cobro?.monto.toString()}
          />
        </Campo>
      )}
      <Campo etiqueta="Vence el">
        <Input
          name="fechaVencimiento"
          type="date"
          required
          defaultValue={aISO(cobro?.fechaVencimiento ?? vencimiento)}
        />
      </Campo>
      <Campo etiqueta="Nota (opcional)">
        <Input
          name="observaciones"
          maxLength={300}
          defaultValue={cobro?.observaciones ?? ""}
        />
      </Campo>
      <button className={`${btn} ${btnChico}`}>
        {cobro ? "Guardar corrección" : "Registrar cargo"}
      </button>
    </form>
  );
}
