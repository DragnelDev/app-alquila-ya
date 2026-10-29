# AlquilaYa

Sistema web unipersonal para gestionar el alquiler de habitaciones individuales: habitaciones, inquilinos,
contratos con cobro flexible, cuotas automáticas, pagos con recibo imprimible y un panel con métricas y alertas.

**Stack:** Next.js 16 (App Router, Server Components y Server Actions) · TypeScript · PostgreSQL · Prisma 7 · Tailwind CSS 4.
Interfaz en español con modo claro y oscuro (se recuerda la elección y respeta el tema del sistema la primera vez).

## Puesta en marcha

```bash
npm install
cp .env.example .env          # edita DATABASE_URL y AUTH_SECRET
npx prisma migrate deploy     # crea las tablas (incluye el índice único de contrato activo por habitación)
npm run db:seed               # crea usuarios ADMIN y PROPIETARIO + habitaciones de ejemplo
npm run dev
```

Abre http://localhost:3000 e ingresa con los usuarios del seed (cámbialos en `.env` antes de ejecutarlo):

Auth.js confía en el encabezado `Host` para construir sus URL. En producción, publica la aplicación detrás de un proxy o plataforma que establezca y valide ese encabezado.

| Rol           | Correo por defecto            | Acceso                         |
| ------------- | ----------------------------- | ------------------------------ |
| `ADMIN`       | `admin@alquilaya.local`       | Todo el sistema                |
| `PROPIETARIO` | `propietario@alquilaya.local` | Solo lectura: Panel y Reportes |

## Cómo funcionan los cobros

- Cada contrato define si se cobra el **día 1** (mes calendario) o un **día de corte** entre 1 y 28.
- Las cuotas se generan solas, hasta 31 días hacia adelante, al crear el contrato y al abrir Panel, Cobranzas, Reportes o el contrato. No se duplican.
- La primera cuota vence en el primer día de corte igual o posterior al inicio del contrato, por el monto completo.
- Una cuota `PENDIENTE` pasa a `ATRASADO` cuando su fecha de vencimiento ya pasó.
- "Hoy" se calcula con la hora de Bolivia (`America/La_Paz`). La moneda es el boliviano (Bs).
- Al finalizar un contrato se eliminan las cuotas futuras; las vencidas se conservan.
- El recibo (`/pagos/[id]/recibo`) se imprime o se guarda como PDF desde el navegador.

## Scripts

`npm run dev` · `npm run build` · `npm run typecheck` · `npm run db:migrate` · `npm run db:deploy` · `npm run db:seed`

## Estructura

```
prisma/              schema.prisma, migraciones y seed
src/proxy.ts         sesión y control de roles antes de renderizar
src/app/             rutas: login y panel (dashboard, habitaciones, inquilinos, contratos, pagos, reportes)
src/actions/         Server Actions por módulo
src/lib/             prisma, auth, fechas, formato y lógica de cobranza
src/validations/     esquemas zod
src/components/      ui, layout, dashboard y pagos
```
