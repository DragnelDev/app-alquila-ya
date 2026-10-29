import type { Contrato, ServicioContrato, TipoServicio } from "@prisma/client";
import {
  SERVICIOS,
  etiquetaModo,
  etiquetaServicio,
  unidadServicio,
} from "@/src/lib/cobranza/servicios";
import { Campo, Input, Select } from "@/src/components/ui/Form";

type Valores = Pick<Contrato, "incluyeLuz" | "incluyeAgua" | "incluyeWifi"> & {
  servicios: ServicioContrato[];
};

function valorInicial(tipo: TipoServicio, v?: Valores) {
  if (!v) return { modo: "NINGUNO", monto: "", tarifa: "", lectura: "" };
  const incluido =
    tipo === "LUZ"
      ? v.incluyeLuz
      : tipo === "AGUA"
        ? v.incluyeAgua
        : v.incluyeWifi;
  const c = v.servicios.find((s) => s.tipo === tipo);
  if (c)
    return {
      modo: c.modo as string,
      monto: c.montoFijo?.toString() ?? "",
      tarifa: c.tarifaUnitaria?.toString() ?? "",
      lectura: c.lecturaInicial?.toString() ?? "",
    };
  return {
    modo: incluido ? "INCLUIDO" : "NINGUNO",
    monto: "",
    tarifa: "",
    lectura: "",
  };
}

/** Define cómo se cobra cada servicio: incluido en la tarifa, monto fijo, por medidor o monto variable. */
export function ConfigServicios({ valores }: { valores?: Valores }) {
  return (
    <div className="space-y-5">
      {SERVICIOS.map((tipo) => {
        const ini = valorInicial(tipo, valores);
        const u = unidadServicio[tipo];
        return (
          <fieldset key={tipo} className="rounded-md border border-line p-4">
            <legend className="px-1 text-sm font-semibold">
              {etiquetaServicio[tipo]}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Cómo se cobra">
                <Select name={`modo_${tipo}`} defaultValue={ini.modo}>
                  <option value="NINGUNO">No se cobra</option>
                  <option value="INCLUIDO">Incluido en la tarifa</option>
                  <option value="FIJO">{etiquetaModo.FIJO}</option>
                  <option value="MEDIDOR">{etiquetaModo.MEDIDOR}</option>
                  <option value="MANUAL">{etiquetaModo.MANUAL}</option>
                </Select>
              </Campo>
              <Campo
                etiqueta="Monto fijo mensual (Bs)"
                ayuda="Solo para monto fijo."
              >
                <Input
                  name={`monto_${tipo}`}
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={ini.monto}
                />
              </Campo>
              {tipo !== "WIFI" && (
                <>
                  <Campo
                    etiqueta={`Tarifa por ${u} (Bs)`}
                    ayuda="Solo para lectura de medidor."
                  >
                    <Input
                      name={`tarifa_${tipo}`}
                      type="number"
                      min={0}
                      step="0.0001"
                      defaultValue={ini.tarifa}
                    />
                  </Campo>
                  <Campo
                    etiqueta={`Lectura inicial del medidor (${u})`}
                    ayuda="Solo para lectura de medidor."
                  >
                    <Input
                      name={`lectura_${tipo}`}
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={ini.lectura}
                    />
                  </Campo>
                </>
              )}
            </div>
          </fieldset>
        );
      })}
      <p className="text-xs text-muted">
        Completa solo los campos del modo elegido. Los montos fijos se cargan
        solos cada mes; los de medidor y variables se registran en Servicios.
      </p>
    </div>
  );
}
