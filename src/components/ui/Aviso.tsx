/** Muestra mensajes de error u éxito que llegan por la URL (?error=... / ?ok=...). */
export function Aviso({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  const esError = Boolean(error);
  return (
    <div
      role={esError ? "alert" : "status"}
      className={`mb-5 rounded-md border px-4 py-3 text-sm ${
        esError
          ? "border-danger/40 bg-danger-soft text-danger"
          : "border-ok/40 bg-ok-soft text-ok"
      }`}
    >
      {error ?? ok}
    </div>
  );
}
