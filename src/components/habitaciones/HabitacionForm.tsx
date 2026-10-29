import Link from "next/link";
import { Campo, Input, Select, Textarea } from "@/src/components/ui/Form";
import { btn, btnSec } from "@/src/components/ui/clases";

type Valores = {
  nombre: string;
  piso: number;
  precioBase: string;
  descripcion: string | null;
  estado: string;
};

export function HabitacionForm({
  accion,
  valores,
  ocupada = false,
  etiquetaBoton,
}: {
  accion: (formData: FormData) => Promise<void>;
  valores?: Valores;
  ocupada?: boolean;
  etiquetaBoton: string;
}) {
  return (
    <form
      action={accion}
      className="max-w-xl space-y-4 rounded-lg border border-line bg-surface p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Número o nombre">
          <Input
            name="nombre"
            required
            defaultValue={valores?.nombre}
            placeholder="Ej. 101"
          />
        </Campo>
        <Campo etiqueta="Piso">
          <Input
            name="piso"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={valores?.piso ?? 1}
          />
        </Campo>
      </div>
      <Campo etiqueta="Precio base mensual (Bs)">
        <Input
          name="precioBase"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={valores?.precioBase}
        />
      </Campo>
      <Campo
        etiqueta="Descripción"
        ayuda="Opcional. Por ejemplo: baño privado, ventana a la calle."
      >
        <Textarea
          name="descripcion"
          defaultValue={valores?.descripcion ?? ""}
        />
      </Campo>
      {ocupada ? (
        <p className="text-sm text-muted">
          La habitación está ocupada. Su estado cambia al finalizar el contrato.
        </p>
      ) : (
        <Campo etiqueta="Estado">
          <Select name="estado" defaultValue={valores?.estado ?? "DISPONIBLE"}>
            <option value="DISPONIBLE">Disponible</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
          </Select>
        </Campo>
      )}
      <div className="flex gap-2 pt-2">
        <button className={btn}>{etiquetaBoton}</button>
        <Link href="/habitaciones" className={btnSec}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
