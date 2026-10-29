import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { crearContrato } from "@/src/actions/contratos";
import { aISO, hoy } from "@/src/lib/fechas";
import { bs, nombreCompleto } from "@/src/lib/formato";
import { Aviso } from "@/src/components/ui/Aviso";
import { Card } from "@/src/components/ui/Card";
import { ConfigServicios } from "@/src/components/servicios/ConfigServicios";
import { Campo, Input, Select, Textarea } from "@/src/components/ui/Form";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { btn, btnSec } from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Nuevo contrato" };

export default async function NuevoContratoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await exigirAdmin();
  const { error } = await searchParams;
  const [habitaciones, inquilinos] = await Promise.all([
    prisma.habitacion.findMany({
      where: { estado: "DISPONIBLE" },
      orderBy: [{ piso: "asc" }, { nombre: "asc" }],
    }),
    prisma.inquilino.findMany({
      orderBy: [{ apellidos: "asc" }, { nombre: "asc" }],
    }),
  ]);

  const faltan = habitaciones.length === 0 || inquilinos.length === 0;

  return (
    <>
      <PageHeader
        titulo="Nuevo contrato"
        descripcion="Al guardar, la habitación pasa a ocupada y se generan las cuotas mensuales."
      />
      <Aviso error={error} />
      {faltan ? (
        <Card className="max-w-xl">
          <p className="text-sm">
            {habitaciones.length === 0 && "No hay habitaciones disponibles. "}
            {inquilinos.length === 0 && "No hay inquilinos registrados. "}
            Regístralos primero para crear un contrato.
          </p>
          <div className="mt-4 flex gap-2">
            {habitaciones.length === 0 && (
              <Link href="/habitaciones" className={btnSec}>
                Ir a habitaciones
              </Link>
            )}
            {inquilinos.length === 0 && (
              <Link href="/inquilinos/nuevo" className={btnSec}>
                Registrar inquilino
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <form
          action={crearContrato}
          className="max-w-2xl space-y-6 rounded-lg border border-line bg-surface p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Habitación">
              <Select name="habitacionId" required defaultValue="">
                <option value="" disabled>
                  Selecciona una habitación
                </option>
                {habitaciones.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nombre} · piso {h.piso} · {bs(h.precioBase)}
                  </option>
                ))}
              </Select>
            </Campo>
            <Campo etiqueta="Inquilino">
              <Select name="inquilinoId" required defaultValue="">
                <option value="" disabled>
                  Selecciona un inquilino
                </option>
                {inquilinos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {nombreCompleto(i)} · {i.documento}
                  </option>
                ))}
              </Select>
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Fecha de inicio">
              <Input
                name="fechaInicio"
                type="date"
                required
                defaultValue={aISO(hoy())}
              />
            </Campo>
            <Campo
              etiqueta="Fecha de fin"
              ayuda="Opcional. Sin fecha, el contrato continúa hasta finalizarlo."
            >
              <Input name="fechaFin" type="date" />
            </Campo>
          </div>

          <fieldset className="space-y-4 border-t border-line pt-5">
            <legend className="mb-1 text-sm font-semibold">Cobro</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Modalidad de cobro">
                <Select name="modalidadCobro" defaultValue="MES_CALENDARIO">
                  <option value="MES_CALENDARIO">
                    Mes calendario (se cobra el día 1)
                  </option>
                  <option value="DIA_CORTE">Día de corte específico</option>
                </Select>
              </Campo>
              <Campo
                etiqueta="Día de corte"
                ayuda="Solo para día de corte. Un día entre 1 y 28, por ejemplo 15."
              >
                <Input
                  name="diaCorte"
                  type="number"
                  min={1}
                  max={28}
                  step={1}
                  placeholder="15"
                />
              </Campo>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                etiqueta="Monto mensual (Bs)"
                ayuda="Déjalo vacío para usar el precio base de la habitación."
              >
                <Input name="montoMensual" type="number" min={0} step="0.01" />
              </Campo>
              <Campo etiqueta="Depósito en garantía (Bs)">
                <Input
                  name="depositoGarantia"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  defaultValue={0}
                />
              </Campo>
            </div>
          </fieldset>

          <fieldset className="border-t border-line pt-5">
            <legend className="mb-3 text-sm font-semibold">
              Servicios: Luz, Agua y WiFi
            </legend>
            <ConfigServicios />
          </fieldset>

          <Campo etiqueta="Observaciones">
            <Textarea name="observaciones" />
          </Campo>

          <div className="flex gap-2">
            <button className={btn}>Crear contrato</button>
            <Link href="/contratos" className={btnSec}>
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </>
  );
}
