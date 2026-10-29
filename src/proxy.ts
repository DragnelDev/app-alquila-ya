import { NextResponse } from "next/server";
import { auth } from "@/src/auth";

const RUTAS_PUBLICAS = [
  "/login",
  "/registro",
  "/verificar-email",
  "/olvide-password",
  "/restablecer-password",
  "/invitacion",
];
// El rol PROPIETARIO solo puede ver estas rutas (lectura) y su perfil
const RUTAS_PROPIETARIO = ["/dashboard", "/reportes", "/perfil"];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  if (RUTAS_PUBLICAS.includes(pathname)) return;

  const usuario = request.auth?.user;
  if (!usuario) return NextResponse.redirect(new URL("/login", request.url));

  if (usuario.rol === "PROPIETARIO") {
    const permitido = RUTAS_PROPIETARIO.some(
      (r) => pathname === r || pathname.startsWith(`${r}/`)
    );
    if (!permitido)
      return NextResponse.redirect(new URL("/dashboard", request.url));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
