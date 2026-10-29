import type { DefaultSession } from "next-auth";

type Rol = "ADMIN" | "PROPIETARIO";

declare module "next-auth" {
  interface Session {
    user: { id: string; rol?: Rol } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rol?: Rol;
  }
}
