import Link from "next/link";
import type { Inquilino } from "@prisma/client";
import { Campo, Input } from "@/src/components/ui/Form";
import { btn, btnSec } from "@/src/components/ui/clases";

export function InquilinoForm({
  accion,
  valores,
  etiquetaBoton,
}: {
  accion: (formData: FormData) => Promise<void>;
  valores?: Inquilino;
  etiquetaBoton: string;
}) {
  return (
    <form
      action={accion}
      className="max-w-xl space-y-4 rounded-lg border border-line bg-surface p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre">
          <Input
            name="nombre"
            required
            defaultValue={valores?.nombre}
            autoComplete="off"
          />
        </Campo>
        <Campo etiqueta="Apellidos">
          <Input
            name="apellidos"
            required
            defaultValue={valores?.apellidos}
            autoComplete="off"
          />
        </Campo>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="CI o documento">
          <Input
            name="documento"
            required
            defaultValue={valores?.documento}
            autoComplete="off"
          />
        </Campo>
        <Campo etiqueta="Teléfono">
          <Input
            name="telefono"
            type="tel"
            required
            defaultValue={valores?.telefono}
            autoComplete="off"
          />
        </Campo>
      </div>
      <fieldset className="space-y-4 border-t border-line pt-4">
        <legend className="mb-1 text-sm font-semibold">
          Contacto de emergencia
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre">
            <Input
              name="contactoEmergenciaNombre"
              required
              defaultValue={valores?.contactoEmergenciaNombre}
              autoComplete="off"
            />
          </Campo>
          <Campo etiqueta="Teléfono">
            <Input
              name="contactoEmergenciaTelefono"
              type="tel"
              required
              defaultValue={valores?.contactoEmergenciaTelefono}
              autoComplete="off"
            />
          </Campo>
        </div>
      </fieldset>
      <div className="flex gap-2 pt-2">
        <button className={btn}>{etiquetaBoton}</button>
        <Link href="/inquilinos" className={btnSec}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
