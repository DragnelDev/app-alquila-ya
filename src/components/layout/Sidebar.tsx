import { cerrarSesion } from "@/src/actions/auth";
import Link from "next/link";
import type { Sesion } from "@/src/lib/auth/session";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

const enlaces = {
  ADMIN: [
    { href: "/dashboard", label: "Panel" },
    { href: "/pagos", label: "Cobranzas" },
    { href: "/servicios", label: "Servicios" },
    { href: "/contratos", label: "Contratos" },
    { href: "/habitaciones", label: "Habitaciones" },
    { href: "/inquilinos", label: "Inquilinos" },
    { href: "/reportes", label: "Reportes" },
    { href: "/usuarios", label: "Usuarios" },
    { href: "/perfil", label: "Mi perfil" },
  ],
  PROPIETARIO: [
    { href: "/dashboard", label: "Panel" },
    { href: "/reportes", label: "Reportes" },
    { href: "/perfil", label: "Mi perfil" },
  ],
};

const botonSalir =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-surface2 cursor-pointer";

export function Sidebar({ sesion }: { sesion: Sesion }) {
  return (
    <aside className="flex flex-col border-b border-line bg-surface print:hidden lg:fixed lg:inset-y-0 lg:w-60 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-4 py-3 lg:py-5">
        <span className="text-lg font-semibold tracking-tight">AlquilaYa</span>
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <form action={cerrarSesion}>
            <button className={botonSalir}>Salir</button>
          </form>
        </div>
      </div>

      <NavLinks items={enlaces[sesion.rol]} />

      <div className="mt-auto hidden flex-col gap-3 border-t border-line p-4 lg:flex">
        <Link
          href="/perfil"
          className="flex min-w-0 items-center gap-3 rounded-md hover:bg-surface2"
        >
          {sesion.imagen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sesion.imagen}
              alt=""
              className="size-9 shrink-0 rounded-full border border-line object-cover"
            />
          ) : (
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface2 text-sm font-semibold text-muted"
              aria-hidden="true"
            >
              {sesion.nombre.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">
              {sesion.nombre}
            </span>
            <span className="block text-xs text-muted">
              {sesion.rol === "ADMIN"
                ? "Administrador"
                : "Propietario (solo lectura)"}
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={cerrarSesion} className="flex-1">
            <button className={`${botonSalir} w-full`}>Cerrar sesión</button>
          </form>
        </div>
      </div>
    </aside>
  );
}
