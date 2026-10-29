import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { exigirAdmin } from "@/src/lib/auth/session";
import { prepararCobranza } from "@/src/lib/cobranza/generar-cuotas";
import { TablaPagos } from "@/src/components/pagos/TablaPagos";
import { Aviso } from "@/src/components/ui/Aviso";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";

export const metadata: Metadata = { title: "Cobranzas" };

const abierto = {
  in: ["PENDIENTE", "ATRASADO"],
} satisfies Prisma.EnumEstadoPagoFilter;

const filtros = {
  "por-cobrar": {
    texto: "Por cobrar",
    donde: {
      OR: [{ estado: abierto }, { servicios: { some: { estado: abierto } } }],
    },
    orden: "asc",
  },
  "servicios-pendientes": {
    texto: "Alquiler pagado, servicio pendiente",
    donde: { estado: "PAGADO", servicios: { some: { estado: abierto } } },
    orden: "asc",
  },
  atrasadas: {
    texto: "Atrasadas",
    donde: {
      OR: [
        { estado: "ATRASADO" },
        { servicios: { some: { estado: "ATRASADO" } } },
      ],
    },
    orden: "asc",
  },
  pagadas: { texto: "Pagadas", donde: { estado: "PAGADO" }, orden: "desc" },
  todas: { texto: "Todas", donde: {}, orden: "desc" },
} satisfies Record<
  string,
  { texto: string; donde: Prisma.PagoWhereInput; orden: "asc" | "desc" }
>;

type Filtro = keyof typeof filtros;

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; error?: string; ok?: string }>;
}) {
  await exigirAdmin();
  const { estado, error, ok } = await searchParams;
  const filtro: Filtro =
    estado && estado in filtros ? (estado as Filtro) : "por-cobrar";
  await prepararCobranza();

  const pagos = await prisma.pago.findMany({
    where: filtros[filtro].donde,
    orderBy: { fechaVencimiento: filtros[filtro].orden },
    include: {
      servicios: true,
      contrato: { include: { habitacion: true, inquilino: true } },
    },
    take: 200,
  });

  return (
    <>
      <PageHeader
        titulo="Cobranzas"
        descripcion="Cada cuota reúne el alquiler base y los servicios del mes. Entra a una cuota para cobrar todo junto o por separado."
      />
      <Aviso error={error} ok={ok} />
      <nav className="mb-4 flex flex-wrap gap-1" aria-label="Filtrar cuotas">
        {(Object.keys(filtros) as Filtro[]).map((clave) => (
          <Link
            key={clave}
            href={`/pagos?estado=${clave}`}
            aria-current={clave === filtro ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              clave === filtro
                ? "bg-accent text-accent-ink"
                : "text-muted hover:bg-surface2 hover:text-ink"
            }`}
          >
            {filtros[clave].texto}
          </Link>
        ))}
      </nav>
      <Card sinPadding>
        <TablaPagos
          pagos={pagos}
          mostrarContrato
          vacio={
            filtro === "por-cobrar"
              ? "No tienes cobros pendientes."
              : "No hay cuotas en esta vista."
          }
        />
      </Card>
    </>
  );
}
