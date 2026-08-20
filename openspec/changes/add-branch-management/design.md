## Context

Ver `proposal.md` — Why. El sistema es multi-sucursal (V1) pero no existe gestión de sucursales. La entidad `Branch` ya está modelada en `prisma/schema.prisma` (`id`, `name`, `address`, `active`, `createdAt`, `updatedAt`) y el seeder crea el `SUPER_ADMIN` de bootstrap con `branchId = null`. El `RolesGuard` ya deja pasar siempre al SUPER_ADMIN sin importar el `@Roles` declarado (technical_guide §5.2), por lo que los endpoints de sucursales pueden declarar `@Roles(UserRole.SUPER_ADMIN)` y el bootstrap funciona igual.

## Goals / Non-Goals

**Goals:**
- CRUD de sucursales completo y restringido a SUPER_ADMIN.
- Desbloquear `POST /users` (el admin se crea con `branchId`) y las entidades locales que requieren `branchId`.
- Mantener coherencia con el contrato de respuesta estándar y la matriz de autorización.

**Non-Goals:**
- No hay cambios de schema (la tabla `Branch` ya existe).
- No se implementa el reporte consolidado `GET /reports/branches-summary` (ya está en el roadmap de Sprint 3).
- No se implementa el selector de sucursal del frontend (es frontend, fuera de este backend).
- No se valida la restricción de datos por sucursal en los demás módulos (es transversal y se resuelve en cada módulo según su sprint).

## Decisions

- **Módulo `src/branches/` con patrón feature module** (module/controller/service + `dto/`), consistente con el resto del proyecto y con `users/` (Sprint 0). Alternativa descartada: meterlo dentro de `users/` — mezcla responsabilidades y rompe la organización por dominio.
- **Endpoints solo SUPER_ADMIN** vía `@Roles(UserRole.SUPER_ADMIN)`. El `RolesGuard` ya deja pasar siempre al SUPER_ADMIN (§5.2), así que el bootstrap no se rompe. Alternativa descartada: permitir ADMIN — contradice el PDR §2.7 (gestión de sucursales es exclusiva de SUPER_ADMIN).
- **`PATCH /branches/{id}/toggle-active` en vez de `DELETE`**: la sucursal tiene datos históricos (turnos, cajas, inventario, usuarios) que deben conservarse; el borrado físico rompería las FKs. El toggle invierte el estado actual de `active` (activa ↔ desactiva) y es el mecanismo de baja/reactivación definido en FR-000. Alternativa descartada: dos endpoints separados (`deactivate`/`activate`) — el toggle es un solo endpoint idempótico en estado final y reversible sin body.
- **DTOs con class-validator** (`CreateBranchDto`, `UpdateBranchDto`), validados por el `ValidationPipe` global ya configurado en Sprint 0.
- **Sin auditoría en V1 para CRUD de sucursales**: el PDR §2.9 define 6 acciones auditadas y la gestión de sucursales no está entre ellas. Se mantiene el alcance definido.

## Risks / Trade-offs

- [Sucursal desactivada con usuarios/turnos activos] → La desactivación es administrativa y no bloquea operaciones en curso; se documenta que el alta de nuevos usuarios en esa sucursal queda a criterio del SUPER_ADMIN. No se implementa validación de bloqueo en V1 (YAGNI).
- [Editar nombre/dirección no propaga a datos pasados] → Es el comportamiento deseado (los snapshots y `branchId` de entidades locales se conservan); se documenta en el spec.
- [Config.yaml con error de parseo pre-existente] → No afecta este cambio; el CLI funciona con warning. Se recomienda corregirlo aparte.

## Migration Plan

- No requiere migración de datos ni de schema.
- Despliegue: agregar `BranchesModule` a `app.module.ts` y crear los archivos del módulo. Sin cambios en la base de datos.

## Open Questions

- Ninguna. El alcance está definido por FR-000 y el PDR §2.7.