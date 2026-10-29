const tonos = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutro: "bg-surface2 text-muted",
} as const;

export type Tono = keyof typeof tonos;

export function Badge({
  tono = "neutro",
  children,
}: {
  tono?: Tono;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tonos[tono]}`}
    >
      {children}
    </span>
  );
}

const mapa: Record<string, [Tono, string]> = {
  DISPONIBLE: ["ok", "Disponible"],
  OCUPADA: ["info", "Ocupada"],
  MANTENIMIENTO: ["warn", "Mantenimiento"],
  PENDIENTE: ["warn", "Pendiente"],
  PAGADO: ["ok", "Pagado"],
  ATRASADO: ["danger", "Atrasado"],
  ACTIVO: ["ok", "Activo"],
  FINALIZADO: ["neutro", "Finalizado"],
  CANCELADO: ["neutro", "Cancelado"],
};

export function EstadoBadge({ estado }: { estado: string }) {
  const [tono, texto] = mapa[estado] ?? ["neutro", estado];
  return <Badge tono={tono}>{texto}</Badge>;
}
