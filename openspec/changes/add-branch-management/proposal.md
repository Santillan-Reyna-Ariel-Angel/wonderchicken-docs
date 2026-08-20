## Why

El sistema es multi-sucursal (V1) pero **no existe ningún endpoint para gestionar sucursales**: la entidad `Branch` está modelada en el schema y el seeder crea el `SUPER_ADMIN` de bootstrap, pero sin sucursales no se puede crear el primer `ADMIN` (que requiere `branchId`), ni abrir turnos, cajas o inventario (todos `branchId` required). FR-000 (Gestión de sucursales, prioridad Alta) quedó huérfano en el mapa de cobertura del `implementation_guide.md`. Hay que cerrarlo en Sprint 0 para desbloquear el resto del proyecto.

## What Changes

- Crear el módulo NestJS `src/branches/` (module/controller/service + DTOs) con CRUD de sucursales.
- Endpoints nuevos (todos **solo SUPER_ADMIN**):
  - `POST /api/v1/branches` — crear sucursal (`{ name, address }`, `active` por defecto `true`).
  - `GET /api/v1/branches` — listar sucursales (alimenta el selector de sucursal del frontend).
  - `PATCH /api/v1/branches/{id}` — editar nombre/dirección.
  - `PATCH /api/v1/branches/{id}/toggle-active` — alternar el estado activo/inactivo (`toggle` de `active`), sin borrar datos.
- Registrar `BranchesModule` en `app.module.ts`.
- Actualizar la documentación: `implementation_guide.md` (FR-000 en Sprint 0 + mapa de cobertura) y `technical_guide.md` (§5.1 endpoints + §5.2 matriz de autorización).
- No hay cambios de schema: la entidad `Branch` ya existe en `prisma/schema.prisma`.

## Capabilities

### New Capabilities
- `branch-management`: Gestión de sucursales por el SUPER_ADMIN (crear, listar, editar, dar de baja), con acceso global del SUPER_ADMIN a todas las sucursales.

### Modified Capabilities
<!-- Ninguna: no cambian requisitos de capacidades existentes. -->

## Impact

- **Código:** nuevo módulo `src/branches/`; registro en `src/app.module.ts`.
- **API:** 4 endpoints nuevos bajo `/api/v1/branches`, protegidos por JWT y restringidos a `SUPER_ADMIN`.
- **Datos:** sin migración (la tabla `Branch` ya existe). El seeder ya crea el `SUPER_ADMIN` de bootstrap.
- **Docs:** `implementation_guide.md` y `technical_guide.md` actualizados.
- **Dependencias:** ninguna nueva.