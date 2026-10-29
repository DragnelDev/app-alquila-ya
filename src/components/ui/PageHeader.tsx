export function PageHeader({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descripcion && (
          <p className="mt-1 max-w-prose text-sm text-muted">{descripcion}</p>
        )}
      </div>
      {acciones && (
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {acciones}
        </div>
      )}
    </div>
  );
}
