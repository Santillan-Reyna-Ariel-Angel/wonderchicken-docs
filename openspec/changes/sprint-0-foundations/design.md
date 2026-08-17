## Context

El Sprint 0 establece las fundaciones técnicas del backend Wonder Chicken V1. Actualmente existe:
- Prisma schema completo y validado en `prisma/schema.prisma`
- Seeders funcionales que usan el patrón Prisma 7 + driver adapter pg en `seeders/prisma.ts`
- Scaffold NestJS básico con `main.ts`, `app.module.ts`, `app.controller.ts` y `app.service.ts`
- Dependencias instaladas: NestJS 11, Prisma 7.8 + adapter-pg, TypeScript, pnpm

Las restricciones clave son:
- Usar el patrón de conexión Prisma 7 + driver adapter pg tal como está en seeders
- Seguir la arquitectura de módulos de NestJS con responsabilidad única
- Implementar el contrato de respuesta estándar { isSuccess, message, data, error }
- Usar JWT directo (sin Passport) para autenticación
- Aplicar guards globales (APP_GUARD) para autenticación y autorización
- Eliminar los archivos scaffolded innecesarios al final

## Goals / Non-Goals

**Goals:**
- Establecer un PrismaService global reutilizable por todos los módulos
- Implementar manejo global de excepciones que respete el contrato de respuesta
- Proveer decoradores y guards para autenticación JWT y autorización por roles
- Crear módulos completos de auth y users con endpoints protegidos
- Configurar la aplicación principal con prefijo /api/v1 y middleware global
- Eliminar archivos scaffolded que no serán usados

**Non-Goals:**
- Implementar lógica de negocio específica de productos, órdenes o inventario
- Crear endpoints más allá de auth y users en este sprint
- Implementar la sesión única por turno (se hará en Sprint 5)
- Crear módulos de auditoría, impresión o reportes
- Optimizar consultas de base de datos más allá de lo básico

## Decisions

### Decisión: Patrón de Servicio Prisma Global
**Qué:** Crear PrismaService que maneje la conexión usando driver adapter pg y hacerlo global
**Por qué:** 
- Los seeders ya usan este patrón exitosamente, por lo que reutilizamos lo probado
- Un servicio global evita tener que crear conexiones múltiples en cada módulo
- Permite inyección de dependencias estándar mediante constructor privado y readonly
**Alternativas consideradas:**
- Crear instancia de Prisma por módulo: rechazado por generar conexiones múltiples y desperdicio de recursos
- Usar PrismaModule de NestJS oficial: rechazado porque no soporta fácilmente el driver adapter pg necesario

### Decisión: Filtro de Excepciones Global
**Qué:** Implementar HttpExceptionFilter que capture todas las excepciones y forme respuestas estándar
**Por qué:**
- Garantiza que TODAS las respuestas (éxito y error) sigan el mismo contrato { isSuccess, message, data, error }
- Centraliza el manejo de códigos de error según technical_guide.md §5.4
- Evita repetir lógica de manejo de errores en cada controller
**Alternativas consideradas:**
- Manejar excepciones en cada controller: rechazado por violar DRY y riesgo de inconsistencia
- Usar interceptores: rechazado porque los filters son más apropiados para transformación de excepciones

### Decisión: Arquitectura de Autenticación JWT Manual
**Qué:** Implementar AuthGuard y RolesGuard personalizados sin Passport, usando jwt.verify directamente
**Por qué:**
- El technical_guide.md especifica JWT directo sin Passport en §5.2
- Menor complejidad y dependencias para los requisitos de V1
- Control total sobre el flujo de verificación y manejo de errores
**Alternativas consideradas:**
- Usar @nestjs/jwt y Passport: rechazado por añadir complejidad innecesaria para V1
- Bibliotecas de terceros para JWT: rechazado por preferir implementación explícita y controlada

### Decisión: Organización por Módulos de Característica
**Qué:** Seguir la estructura src/<dominio>/ con module, controller, service y dto/
**Por qué:**
- Es la convención establecida en el proyecto y en la arquitectura de NestJS
- Facilita el mantenimiento y escalabilidad a medida que se añaden más funcionalidades
- Cada módulo tiene responsabilidad única y bien definida
**Alternativas consideradas:**
- Estructura por capas (controllers, services, etc.): rechazado por no seguir las convenciones del proyecto
- Archivo único para funcionalidades relacionadas: rechazado por falta de escalabilidad y organización

### Decisión: Eliminación de Archivos Scaffolded
**Qué:** Eliminar app.controller.ts y app.service.ts al final del sprint
**Por qué:**
- Estos archivos fueron creados por el CLI de NestJS pero no serán usados
- La funcionalidad se moverá a módulos específicos (auth, users, etc.)
- Mantener código muerto genera confusión y viola el principio de limpieza
**Alternativas consideradas:**
- Renombrar y reusar: rechazado porque no siguen la convención de nomenclatura y propósito claro
- Mantener para futuro uso: rechazado por principio YAGNI y código muerto

## Risks / Trade-offs

[Riesgo de conexión fallida en PrismaService] → Mitigación: El servicio lanza excepciones claras que serán capturadas por el HttpExceptionFilter global, proporcionando mensajes de error útiles para diagnóstico

[Trade-off: Complejidad inicial vs beneficio a largo plazo] → Mitigación: Aunque requiere más código inicial, establece patrones reutilizables que acelerarán los sprints posteriores

[Riesgo de incompatibilidad con versiones futuras de Prisma] → Mitigación: Usamos la versión estable 7.8 especificada y el patrón probado en seeders

[Trade-off: JWT manual vs bibliotecas establecidas] → Mitigación: La implementación directa es más transparente y evita dependencias adicionales para los requisitos básicos de V1

[Riesgo de olvido en eliminación de archivos scaffolded] → Mitigación: Esta tarea está explícitamente incluida en el tasks.md como paso final de verificación