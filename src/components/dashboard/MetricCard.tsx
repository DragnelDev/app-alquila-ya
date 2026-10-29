export function MetricCard({
  titulo,
  valor,
  detalle,
  children,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <p className="text-sm text-muted">{titulo}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {valor}
      </p>
      {detalle && <p className="mt-1 text-sm text-muted">{detalle}</p>}
      {children}
    </div>
  );
}
