# Acceso al sistema

La estructura sigue la separación de SOS: páginas en `src/app/auth`, formulario en `components/LoginForm`, acciones en `src/actions/auth.actions.ts`, operaciones de datos en `src/services/auth.service.ts` y validación de sesión en `src/lib/auth.ts`.

1. Configura una conexión PostgreSQL válida en `DATABASE_URL` dentro de `.env`. Las tablas `Usuario` y `Sesion` del esquema Prisma deben existir en esa base de datos.
2. Ejecuta `pnpm dev` y abre `/auth/login`.
3. Si no hay usuarios, pulsa **Configurar primera cuenta**. Esta opción deja de estar disponible cuando ya existe una cuenta. Configura la primera cuenta antes de publicar el sistema.
4. Después de ingresar, abre **Agregar usuario** para crear más cuentas sin editar directamente la base de datos. Actualmente todas las cuentas autenticadas tienen el mismo acceso y pueden crear usuarios; el esquema aún no define roles.

Las contraseñas se guardan como hashes scrypt con sal aleatoria, nunca como texto normal. Las sesiones duran ocho horas; la cookie es HttpOnly, SameSite=Lax y Secure en producción. La tabla Sesion guarda el hash SHA-256 del token y el cierre de sesión elimina ese registro. No hay credenciales predeterminadas ni registro público después de la primera cuenta.

El límite de acceso es de cinco intentos por correo cada quince minutos y reside en memoria del proceso. Para desplegar varias instancias se necesita un almacén compartido. Las futuras páginas, acciones y endpoints que accedan a datos privados deben llamar a `requireSession()` en el servidor.

Comprobaciones: `pnpm typecheck`, `pnpm lint`, `pnpm build` y `node --test tests/*.test.mjs`.
