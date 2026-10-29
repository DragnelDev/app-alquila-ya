import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/** Vuelve a `ruta` mostrando un mensaje de error (se lee en el componente <Aviso />). */
export function conError(ruta: string, mensaje: string): never {
  redirect(`${ruta}?error=${encodeURIComponent(mensaje)}`);
}

export function conExito(ruta: string, mensaje: string): never {
  revalidatePath("/", "layout");
  redirect(`${ruta}?ok=${encodeURIComponent(mensaje)}`);
}

/** Acepta solo rutas internas ("/algo"), para no redirigir a sitios externos. */
export function rutaSegura(
  valor: FormDataEntryValue | null,
  porDefecto: string
) {
  const v = String(valor ?? "");
  return v.startsWith("/") && !v.startsWith("//") ? v : porDefecto;
}
