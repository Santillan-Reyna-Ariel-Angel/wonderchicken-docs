## Why

Establecer las fundaciones técnicas del backend Wonder Chicken V1 según el Sprint 0 definido en la implementation_guide.md. Este cambio implementa toda la infraestructura transversal necesaria para que los sprints posteriores puedan construir sobre una base sólida, incluyendo el servicio Prisma con adapter pg, filtros de excepciones globales, decoradores de autenticación, guards de JWT y roles, módulos de auth y users, y la configuración principal de la aplicación.

## What Changes

- Crear `src/prisma/prisma.service.ts` con patrón de conexión Prisma 7 + driver adapter pg
- Crear `src/prisma/prisma.module.ts` con exportación global del servicio Prisma
- Crear `src/common/filters/http-exception.filter.ts` para manejo global de excepciones con contrato estándar
- Crear `src/common/decorators/public.decorator.ts` y `roles.decorator.ts` para control de acceso
- Crear `src/common/guards/auth.guard.ts` y `roles.guard.ts` para autenticación JWT y autorización por roles
- Crear módulo completo de `src/auth/` con login/logout y DTOs asociados
- Crear módulo completo de `src/users/` para gestión de usuarios por administradores
- Actualizar `src/main.ts` con prefijo `/api/v1`, ValidationPipe global, CORS y registro de guards
- Actualizar `src/app.module.ts` para registrar todos los módulos fundamentales y eliminar archivos scaffolded innecesarios
- Eliminar `src/app.controller.ts` y `src/app.service.ts` (scaffolded inicial)

## Capabilities

### New Capabilities
- `prisma-service`: Servicio Prisma global con driver adapter pg para conexión a PostgreSQL
- `exception-filter`: Filtro global de excepciones que asegura contrato de respuesta estándar
- `auth-decorators`: Decoradores @Public() y @Roles() para control de acceso flexible
- `auth-guards`: Guards de autenticación JWT y autorización por roles
- `auth-module`: Módulo de autenticación con endpoints de login/logout y manejo de sesiones
- `users-module`: Módulo de gestión de usuarios (CRUD) para administradores
- `app-configuration`: Configuración principal de la aplicación con prefijo API y middleware global

### Modified Capabilities
- (Ninguna - este es el Sprint 0 de fundaciones, estableciendo capacidades desde cero)

## Impact

- Código: Afecta toda la estructura de `src/` con nuevos módulos y archivos transversales
- APIs: Introduce endpoints bajo `/api/v1` para auth y users, con protección por JWT y roles
- Dependencias: Requiere bcryptjs para hash de contraseñas (ya presente en seeders)
- Sistemas: Establece el patrón transaccional para auditoría que será usado en sprints posteriores
- Configuración: Establece el puerto 4000 y prefijo global `/api/v1` como estándar del proyecto