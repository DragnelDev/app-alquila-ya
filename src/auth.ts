import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/src/lib/prisma";
import { verificarPassword } from "@/src/lib/auth/password";

const MENSAJE_GOOGLE_NO_REGISTRADO =
  "Tu cuenta de Google no está registrada en AlquilaYa. Pide una invitación al administrador.";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credenciales) {
        const email = String(credenciales?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credenciales?.password ?? "");
        if (!email || !password) return null;

        const u = await prisma.usuario.findUnique({ where: { email } });
        // Sin correo verificado no hay acceso con contraseña
        if (!u || !u.activo || !u.passwordHash || !u.emailVerificado)
          return null;
        if (!(await verificarPassword(password, u.passwordHash))) return null;
        return { id: u.id, name: u.nombre, email: u.email };
      },
    }),
    // Solo se activa si hay credenciales de Google en el entorno (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET)
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;

      // Sistema unipersonal: Google nunca crea cuentas, solo entra un correo ya registrado
      const email = profile?.email?.toLowerCase();
      const emailVerificado =
        profile &&
        "email_verified" in profile &&
        profile.email_verified === true;
      const aviso = (m: string) => `/login?error=${encodeURIComponent(m)}`;
      if (!email || !emailVerificado)
        return aviso("Google no confirmó tu correo");

      const u = await prisma.usuario.findUnique({ where: { email } });
      if (!u || !u.activo) return aviso(MENSAJE_GOOGLE_NO_REGISTRADO);

      await prisma.cuenta.upsert({
        where: {
          proveedor_proveedorCuentaId: {
            proveedor: "google",
            proveedorCuentaId: account.providerAccountId,
          },
        },
        update: {},
        create: {
          usuarioId: u.id,
          proveedor: "google",
          proveedorCuentaId: account.providerAccountId,
        },
      });
      await prisma.usuario.update({
        where: { id: u.id },
        data: {
          emailVerificado: u.emailVerificado ?? new Date(),
          imagen:
            u.imagen ??
            (profile &&
            "picture" in profile &&
            typeof profile.picture === "string"
              ? profile.picture
              : null),
        },
      });
      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        // Inicio de sesión: el token guarda el id y el rol de NUESTRO usuario (no el id de Google)
        const u = await prisma.usuario.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, rol: true },
        });
        if (u) {
          token.sub = u.id;
          token.rol = u.rol;
        }
      }
      // Nombre y foto se leen de la base; así la cookie no crece
      delete token.picture;
      delete token.name;
      return token;
    },

    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.rol = token.rol as "ADMIN" | "PROPIETARIO" | undefined;
      return session;
    },
  },
});
