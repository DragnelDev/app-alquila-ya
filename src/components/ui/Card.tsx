export function Card({
  titulo,
  accion,
  children,
  className = "",
  sinPadding = false,
}: {
  titulo?: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  sinPadding?: boolean;
}) {
  return (
    <section
      className={`rounded-lg border border-line bg-surface ${className}`}
    >
      {titulo && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold">{titulo}</h2>
          {accion}
        </header>
      )}
      <div className={sinPadding ? "" : "p-5"}>{children}</div>
    </section>
  );
}
