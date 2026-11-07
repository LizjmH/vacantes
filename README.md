# Buscador

Proyecto Next.js con App Router, TypeScript, Tailwind CSS y Prisma 7 sobre PostgreSQL.

## Requisitos

Node.js 22.12+ (o 24 LTS) y npm.

## Inicio

```powershell
npm install
Copy-Item .env.example .env
npm run db:migrate -- --name init
npm run dev
```

Abre http://localhost:3000. La página permite crear notas y listar las últimas 50 para comprobar la persistencia. En esta instalación la base de datos ya está inicializada; basta con `npm run dev`.

## Comandos

- `npm run dev`: servidor de desarrollo.
- `npm run build`: genera Prisma Client y compila para producción.
- `npm start`: ejecuta la compilación de producción.
- `npm run lint`: verifica ESLint.
- `npm run typecheck`: genera tipos de rutas y comprueba TypeScript.
- `npm run db:generate`: genera Prisma Client después de cambiar el esquema.
- `npm run db:migrate -- --name nombre`: crea y aplica una migración local y regenera el cliente.
- `npm run db:deploy`: aplica migraciones existentes.
- `npm run db:studio`: abre el explorador de la base de datos.

## Estructura

- `prisma/schema.prisma`: modelo Note y configuración del generador.
- `prisma/migrations`: historial versionable de cambios de base de datos.
- `prisma.config.ts`: configuración de Prisma CLI.
- `src/lib/prisma.ts`: cliente reutilizable para el servidor.
- `src/app/actions.ts`: acción para guardar notas con validación.
- `src/app/page.tsx`: página de ejemplo con consulta a la base de datos.

`DATABASE_URL` se define en `.env` y no se versiona. `.env.example` sirve como plantilla sin credenciales.

El ejemplo no incluye autenticación. Antes de desplegar, configura `DATABASE_URL` en el proveedor de hosting y ejecuta `npm run db:deploy`.

Documentación: https://nextjs.org/docs y https://www.prisma.io/docs/orm/overview/databases/postgresql.
