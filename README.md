# Wonder Chicken Backend

Sistema Informático de Ventas — Backend del restaurante Wonder Chicken V1.

Stack: **NestJS 11** · **TypeScript** · **PostgreSQL** · **Prisma 7** · **pnpm** · **Jest**.

> 📚 Documentación completa en [`docs/`](docs/index.md): reglas de negocio (PDR), requerimientos (FR), guía técnica y de implementación.

---

## Guía de primeros pasos — desde cero hasta loguearse como SUPER_ADMIN

Estos son los pasos para levantar el proyecto **por primera vez** y llegar a autenticarte con el usuario `SUPER_ADMIN` de bootstrap.

### Requisitos previos

- **Node.js** (v22+ recomendado)
- **pnpm** (`npm install -g pnpm`)
- **PostgreSQL** corriendo localmente (o una `DATABASE_URL` remota)

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

Copiá el contenido de `.env` (o crealo) con al menos:

```bash
# Puerto del servidor
PORT=4000

# Conexión a PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wonderchicken-db"

# Credenciales del SUPER_ADMIN de bootstrap (creado con `pnpm bootstrap:admin`)
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=password123
```

> ⚠️ Nunca commitees `.env` con credenciales reales. En producción cambiá `SUPER_ADMIN_PASSWORD`.

### 3. Crear la base de datos y aplicar el schema

```bash
pnpm prisma generate   # genera el cliente Prisma
pnpm prisma db push    # crea/actualiza las tablas en la BD
```

> También podés usar migraciones: `pnpm prisma migrate dev`.

### 4. Crear el SUPER_ADMIN de bootstrap

Este script crea el `SUPER_ADMIN` **directamente contra la base de datos** (no pasa por la API, por lo que no requiere token). Es **idempotente**: si el usuario ya existe, no hace nada.

```bash
pnpm bootstrap:admin
```

> En **desarrollo**, podés poblar toda la BD con datos de prueba en vez del paso 4:
> ```bash
> pnpm seed          # borra la BD y la repuebla con datos de prueba (incluye el superadmin)
> ```
> En **producción / datos reales**, usá `pnpm bootstrap:admin` (el seeder es solo para desarrollo).

### 5. Levantar el servidor

```bash
pnpm run start:dev   # modo desarrollo (watch)
# o
pnpm run start       # sin watch
```

Deberías ver en el log:

```
wonderChicken backend is running in 4000
Swagger docs available at http://localhost:4000/api/docs
```

### 6. Loguearse como SUPER_ADMIN

1. Abrí **Swagger**: http://localhost:4000/api/docs
2. En el endpoint **`POST /api/v1/auth/login`**, usá las credenciales del paso 2 (por defecto `superadmin` / `password123` — ya aparecen precargadas en Swagger).
3. Ejecutá la petición → copiá el `accessToken` del response.
4. Click en **Authorize** (candado) y pegá el token.
5. Ya podés operar todos los endpoints (crear usuarios, listar, etc.).

> El `SUPER_ADMIN` tiene acceso global a todos los endpoints. Con su token podés crear el resto de usuarios (admins, cajeras, etc.) vía `POST /api/v1/users`.

---

## Comandos útiles

| Comando | Descripción |
| ------- | ----------- |
| `pnpm run start:dev` | Servidor en modo desarrollo (watch) |
| `pnpm run start` | Servidor sin watch |
| `pnpm run build` | Compila TypeScript (`nest build`) |
| `pnpm run lint` | ESLint con auto-fix |
| `pnpm run format` | Prettier |
| `pnpm test` | Tests unitarios |
| `pnpm run test:e2e` | Tests E2E |
| `pnpm seed` | Wipe + seed completo con datos de prueba (dev) |
| `pnpm seed:reset` | Solo vacía la BD |
| `pnpm seed -- <dominio>` | Corre un seeder puntual |
| `pnpm bootstrap:admin` | Crea el SUPER_ADMIN si no existe (idempotente) |
| `pnpm prisma generate` | Regenera el cliente Prisma |
| `pnpm prisma db push` | Sincroniza el schema con la BD |

---

## Puertos y endpoints

- **Servidor**: `http://localhost:4000`
- **Prefijo global de API**: `/api/v1` (ej. `POST /api/v1/auth/login`)
- **Swagger / OpenAPI**: `http://localhost:4000/api/docs`

---

## Estructura del proyecto

```
src/
  main.ts                  # Bootstrap: puerto 4000, prefijo /api/v1, Swagger
  app.module.ts            # Módulo raíz
  prisma/                  # PrismaService global (driver adapter pg)
  common/                  # Decorators, guards, filters, bootstrap
  auth/                    # Módulo de autenticación (login/logout JWT)
  users/                   # Módulo de gestión de usuarios (admin)
seeders/                   # Datos de prueba para desarrollo
scripts/                   # Scripts de utilidad (bootstrap-superadmin)
prisma/
  schema.prisma            # Fuente de verdad del modelo de datos
generated/prisma/          # Cliente Prisma generado (gitignored)
docs/                      # Documentación del proyecto
```

---

## Autenticación

- **JWT** vía `@nestjs/jwt` (sin Passport) + **bcryptjs** para hashing.
- Guards globales: `AuthGuard` (valida JWT → 401) y `RolesGuard` (valida rol → 403).
- El `SUPER_ADMIN` tiene **acceso global** a todos los endpoints.
- Detalle completo en [`technical_guide.md` §5.2](docs/backend/technical_guide.md#52-autenticación-y-autorización).
