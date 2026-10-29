import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { eliminarInquilino } from "@/src/actions/inquilinos";
import { nombreCompleto } from "@/src/lib/formato";
import { Aviso } from "@/src/components/ui/Aviso";
import { Badge } from "@/src/components/ui/Badge";
import { BotonConfirmar } from "@/src/components/ui/BotonConfirmar";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Form";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Vacio } from "@/src/components/ui/Vacio";
import {
  btn,
  btnChico,
  btnPeligro,
  btnSec,
  fila,
  tabla,
  td,
  th,
} from "@/src/components/ui/clases";

export const metadata: Metadata = { title: "Inquilinos" };

export default async function InquilinosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; q?: string }>;
}) {
  await exigirAdmin();
  const { error, ok, q } = await searchParams;
  const buscar = q?.trim();

  const inquilinos = await prisma.inquilino.findMany({
    where: buscar
      ? {
          OR: [
            { nombre: { contains: buscar, mode: "insensitive" } },
            { apellidos: { contains: buscar, mode: "insensitive" } },
            { documento: { contains: buscar, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ apellidos: "asc" }, { nombre: "asc" }],
    include: {
      contratos: { where: { estado: "ACTIVO" }, include: { habitacion: true } },
    },
  });

  return (
    <>
      <PageHeader
        titulo="Inquilinos"
        descripcion="Datos personales y contacto de emergencia de quienes alquilan."
        acciones={
          <Link href="/inquilinos/nuevo" className={btn}>
            Nuevo inquilino
          </Link>
        }
      />
      <Aviso error={error} ok={ok} />
      <form className="mb-4 flex max-w-md gap-2" role="search">
        <Input
          name="q"
          defaultValue={buscar}
          placeholder="Buscar por nombre o CI"
          aria-label="Buscar inquilino"
        />
        <button className={btnSec}>Buscar</button>
      </form>
      <Card sinPadding>
        {inquilinos.length === 0 ? (
          <Vacio>
            {buscar
              ? "No hay inquilinos que coincidan con la búsqueda."
              : "Aún no registraste inquilinos."}
          </Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className={tabla}>
              <thead>
                <tr>
                  <th className={th}>Inquilino</th>
                  <th className={th}>CI / documento</th>
                  <th className={th}>Teléfono</th>
                  <th className={th}>Contacto de emergencia</th>
                  <th className={th}>Habitación</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody>
                {inquilinos.map((i) => {
                  const contrato = i.contratos[0];
                  return (
                    <tr key={i.id} className={fila}>
                      <td className={`${td} font-medium`}>
                        {nombreCompleto(i)}
                      </td>
                      <td className={td}>{i.documento}</td>
                      <td className={td}>{i.telefono}</td>
                      <td className={td}>
                        <p>{i.contactoEmergenciaNombre}</p>
                        <p className="text-xs text-muted">
                          {i.contactoEmergenciaTelefono}
                        </p>
                      </td>
                      <td className={td}>
                        {contrato ? (
                          <Link href={`/contratos/${contrato.id}`}>
                            <Badge tono="info">
                              Hab. {contrato.habitacion.nombre}
                            </Badge>
                          </Link>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className={td}>
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/inquilinos/${i.id}/editar`}
                            className={`${btnSec} ${btnChico}`}
                          >
                            Editar
                          </Link>
                          <form action={eliminarInquilino.bind(null, i.id)}>
                            <BotonConfirmar
                              mensaje={`¿Eliminar a ${nombreCompleto(i)}?`}
                              className={`${btnPeligro} ${btnChico}`}
                            >
                              Eliminar
                            </BotonConfirmar>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
