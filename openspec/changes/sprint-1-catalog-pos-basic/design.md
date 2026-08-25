## Context

> Ver [proposal.md](./proposal.md) para motivación y [specs/](./specs/) para el detalle de comportamiento.

Tras Sprint 0, el backend tiene: `PrismaService` (driver adapter pg), `AuthModule` (JWT sin Passport), `UsersModule`, `BranchesModule`, `RolesGuard`/`AuthGuard` globales, `HttpExceptionFilter` global con contrato `{ isSuccess, message, data, error }`, y un seed que carga productos/variantes, sucursales, `ShiftPeriod` (Mañana/Noche) y un `SUPER_ADMIN` de bootstrap. **Falta el catálogo vendible, los turnos mínimos, los pedidos y la auditoría cableada.**

Este diseño cubre la implementación de los 5 módulos nuevos (`products`, `shifts`, `audit`, `orders`, `pos`) sin cambios de schema y reusando las piezas existentes.

## Goals / Non-Goals

**Goals:**

- Catálogo `Product`/`Variant` operable desde el POS (Sprint 1 sin descuento ni precio custom por presa).
- Apertura de turno declarando período (sin inferencia de reloj) y consulta del turno activo.
- `AuditService.log(tx, ...)` reusable, append-only, dentro de `$transaction`.
- `POST /orders` con N ítems, totales derivados del catálogo, sustituciones sin efecto de precio, `orderNumber` atómico vía `Shift.lastOrderNumber`, `publicToken` no adivinable, snapshot JSON por ítem, persistencia de `OrderItemComponent` por presa/bebida, audit `CREATE_SALE` cableado.
- `POST /orders/{id}/pay` para `pendingPayment` con audit; `POST /orders/{id}/cancel` para `pendingPayment` (manual, sin motivo).
- `GET /orders/{id}` y `GET /orders` con filtros, restringidos por `branchId`.
- `GET /pos/context` v1 (productos + variantes + shiftPeriods + shift activo) — único endpoint de inicialización del POS.

**Non-Goals (los cubre otro sprint):**

- Descuentos (Sprint 3), catálogo `Discount`/`DiscountAuthorization` — `discountId` en ítems se rechaza en DTO.
- Venta custom (Sprint 2) — `POST /orders/custom` no existe.
- Inventario transaccional y decremento al pagar (Sprint 2) — `InventoryTransaction`/`InventoryItem` no se tocan; `OrderItemComponent` se persiste como referencia declarativa.
- Anulación de pagados con motivo (Sprint 2, FR-011b).
- Pantalla pública de listos y vista del cliente (Sprint 4).
- Reportes CSV (Sprint 3).
- Cierre de turno / arqueo (Sprint 3).
- Endpoints públicos (`/public/...`) — Sprint 4.

## Decisions

### 1. `AuditService` como servicio con método `log(tx, params)`

**Decisión:** `AuditService` se inyecta con `PrismaService` y expone un único método público `log(tx: Prisma.TransactionClient, params: { entity, entityId, action, userId, shiftId?, details? })`. NO expone `create`, `update`, `delete` ni nada más. La tabla `AuditLog` es append-only.

**Por qué:** PDR §2.9 y tech guide §4.3 lo imponen: audit explícito dentro del service y la `$transaction`. La atomicidad y el `details` con estado *antes/después* requieren capturar el contexto dentro del flujo. Un interceptor genérico queda fuera de V1 (justificación §4.3 del tech guide).

**Alternativas descartadas:**

- **Interceptor genérico global:** corre fuera de la transacción, no tiene el estado previo. Optimización diferida a V2 (misma disciplina que el catálogo de descuentos).
- **Trigger de BD:** agrega complejidad operacional (migración + auditoría de triggers) y rompe el principio "un único método reutilizable" del PDR. No justificado en V1.

### 2. `orderNumber` atómico vía `UPDATE ... RETURNING`

**Decisión:** dentro de la `$transaction` de creación de orden:

```ts
const updated = await tx.shift.update({
  where: { id: shiftId },
  data: { lastOrderNumber: { increment: 1 } },
  select: { lastOrderNumber: true },
});
const orderNumber = updated.lastOrderNumber;
```

**Por qué:** la combinación `@@unique([shiftId, orderNumber])` + `increment` atómico en Prisma garantiza unicidad incluso bajo concurrencia. El `orderNumber` se reinicia por turno (1, 2, 3...), coherente con PDR §2.8.

**Alternativas descartadas:**

- **`SELECT ... FOR UPDATE` + UPDATE:** más verboso, requiere `raw` o `$queryRaw`; el `increment` de Prisma ya emite la sentencia `UPDATE ... SET col = col + 1` atómica.
- **Contador en memoria:** no escala a reinicio por turno.

### 3. `publicToken` con `crypto.randomBytes(16).toString('hex')`

**Decisión:** 128 bits hex (32 chars). Constraint `@unique` ya en el schema.

**Por qué:** cumple "no adivinable" del PDR §2.8. 128 bits es el estándar para tokens capability-URL. El hex evita caracteres ambiguos.

**Alternativas descartadas:**

- **UUID v4:** funciona, pero requiere una lib (`uuid`) o `crypto.randomUUID()`. Misma seguridad; el hex es más explícito en logs.
- **Base64:** contiene `+/=` que rompen URLs y son ambiguos.

### 4. `OrderItemComponent` se persiste al crear la orden (incluso sin decremento de stock)

**Decisión:** `OrdersService` persiste `OrderItemComponent` desde el snapshot de la variante (`components: Json`) en la misma `$transaction` que crea la orden, **aunque no decremente `InventoryItem`**. Quedan como **referencia declarativa** para que Sprint 2 solo agregue la lógica de decremento.

**Por qué:** mantiene la fuente de verdad del consumo (filas por presa/bebida) disponible desde S1, sin tener que reconstruir el shape en S2. La atomicidad con la creación ya está garantizada por la `$transaction`.

**Alternativas descartadas:**

- **Generar `OrderItemComponent` solo al pagar:** complica S2 porque tiene que recorrer el `snapshot` JSON, no las filas normalizadas. El snapshot es para impresión/auditoría, no para mover stock (tech guide §2.3).

### 5. Rechazo explícito de `discountId` en DTO de creación

**Decisión:** `CreateOrderItemDto` NO incluye `discountId` (ni `discountAmount`); cualquier intento de pasar `discountId` desde el cliente se ignora por `class-transformer` (whitelist) o se rechaza con 400 `INVALID_DISCOUNT_FOR_ITEM` si se fuerza.

**Por qué:** la guía de implementación lo dice textual: "Los ítems ya aceptan `discountId` en el DTO pero la validación/snapshot de descuentos llega en Sprint 3 — hasta entonces, rechazar si viene." Esto evita acoplar Sprint 1 al catálogo de descuentos.

**Alternativas descartadas:**

- **Aceptar `discountId` y guardarlo:** implica validar contra `Discount` que no existe aún; agrega una migración condicional que después hay que revertir.

### 6. `POSContextService` como composición liviana

**Decisión:** `PosService` arma `data` con tres llamadas Prisma (`product.findMany`, `shiftPeriod.findMany`, `shift.findFirst`) en paralelo con `Promise.all` y un shape plano.

**Por qué:** una sola llamada HTTP al POS (tech guide §5.0 princ. 6). Liviano: solo activos, sin históricos.

**Alternativas descartadas:**

- **Endpoint único pero con `select` profundo por variante:** vuelve el query más caro sin beneficio (los productos del POS no necesitan `updatedAt` ni descripciones largas).
- **GraphQL:** fuera de alcance del stack V1.

### 7. Multi-sucursal: filtrado por `branchId` en orders/shifts, productos globales

**Decisión:**

- `Product`/`Variant` siguen **globales** (sin `branchId`) — coherente con Sprint 0 y el seed.
- `Shift.branchId` se asigna en creación desde el `cashier.branchId`.
- `GET /orders` y `GET /orders/{id}` filtran por `branchId` del turno del usuario (excepto `ADMIN`/`SUPER_ADMIN` con acceso global).
- `pos/context` no filtra productos por sucursal (son globales).

**Por qué:** Sprint 1 no introduce `InventoryItem` (esa es la entidad que ata el producto a una sucursal). Mantener productos globales respeta la decisión actual del schema y evita romper seeds existentes.

**Alternativas descartadas:**

- **Agregar `branchId` a `Product`:** cambio de schema que rompe seeds + requiere migración + reflexión con admin.

### 8. Sustituciones: validación en DTO + persistencia como `Json`

**Decisión:** `substitutions` es un arreglo con validación `class-validator`: máximo 1 elemento, `from === "mixto"`, `to ∈ {arroz, papa, smiles, mixto}`. Se persiste en `OrderItem.substitutions: Json`. NO modifica `unitPrice`.

**Por qué:** regla [PDR §2.1](../../../../../docs/business/pdr.md#21-precios-y-sustituciones): sustitución nunca afecta precio.

**Alternativas descartadas:**

- **Tabla normalizada `OrderItemSubstitution`:** sobreingeniería para 1 fila por ítem en V1 (el JSON es suficiente y se mantiene en `snapshot`).

### 9. `Variant` se gestiona en módulo anidado bajo `products`

**Decisión:** `src/products/variants/` con su propio controller (`POST /api/v1/variants`) pero registrado como parte de `ProductsModule`. El service de variantes consume `ProductsService` para resolver `productId`.

**Por qué:** las variantes son del catálogo de productos; agruparlas evita dependencias circulares y mantiene el dominio cohesivo. El controller está separado solo para rutas distintas (`/products` vs `/variants`).

**Alternativas descartadas:**

- **Módulo separado `VariantsModule`:** más boilerplate (otro `module.ts`, registro en `app.module`) sin ganancia real en V1.

### 10. Manejo de errores: reusar `HttpException` + códigos estables

**Decisión:** los services lanzan `BadRequestException`, `ConflictException`, `ForbiddenException`, `NotFoundException` con `getErrorCode(err)` que retorna el código estable (`DUPLICATE_PRODUCT_NAME`, `NO_ACTIVE_SHIFT`, etc.) que el `HttpExceptionFilter` mapea al campo `error.code` del contrato §5.4.

**Por qué:** ya está el filter de S0; no reinventamos. Los códigos estables se documentan en este design y se referencian desde los specs.

## Risks / Trade-offs

- **[Riesgo]** Concurrencia en creación de órdenes de la misma cajera → **[Mitigación]** `UPDATE ... SET lastOrderNumber = lastOrderNumber + 1` en la `$transaction` + `@@unique([shiftId, orderNumber])` como red de seguridad final.
- **[Riesgo]** `OrderItemComponent` se persiste sin decrementar stock y queda "colgado" hasta S2 → **[Mitigación]** documentado en `tasks.md` y en el seed; S2 cablea el decremento. No afecta comportamiento de V1 (no hay stock que decrementar).
- **[Riesgo]** Catálogo global de productos puede inflarse en el POS context si crecen a > 200 → **[Mitigación]** el POS context ya excluye históricos y variantes inactivas; si el menú crece se introduce paginación (futuro).
- **[Riesgo]** `OrdersService` queda grande si crece la lógica de validación (descuentos, custom, inventario) → **[Mitigación]** extraer helpers puros (`orders.helpers.ts` con `assignOrderNumber`, `buildOrderItemComponents`, `validateSubstitutions`) y mantener el service delgado.
- **[Riesgo]** `AUDIT` no audita cancelaciones de `pendingPayment` (queda para S2) → **[Mitigación]** documentado en proposal y spec; la acción `CANCEL_SALE` se cablea cuando exista cancelación de pagados con reversión de inventario (FR-011b).
- **[Trade-off]** rechazar `discountId` en Sprint 1 significa que el DTO de OrderItem de S3 tendrá que agregar `discountId?` y el `class-validator` validar contra el catálogo de descuentos — es un cambio aditivo, no breaking, pero queda como tarea explícita en S3.
- **[Trade-off]** `PosContextService` no usa `select` proyectado por variante: el query trae más campos de los que el front usa en Sprint 1. Aceptable en V1 por simplicidad y tamaño pequeño del payload (≤ 50 productos).

## Migration Plan

Sin cambios de schema → sin migración Prisma. Pasos de despliegue:

1. Mergear la rama.
2. `pnpm install` (sin nuevas deps).
3. `pnpm prisma generate` (por si el cliente Prisma requiere refresh — no obligatorio en V1).
4. Levantar backend: `pnpm start:dev`.
5. Smoke test manual con un seed limpio:
   - Login como ADMIN → crear 2 productos + 2 variantes.
   - Login como CASHIER → abrir turno Mañana → `GET /pos/context` devuelve productos/variantes/turno activo.
   - `POST /orders` con 1 plato MESA paid → verificar orden con `orderNumber: 1`, items con `OrderItemComponent`, `AuditLog` con `CREATE_SALE`.
   - `POST /orders` con 1 plato LLEVAR pending → `POST /orders/{id}/pay` → verificar transición y audit.
   - `POST /orders/{id}/cancel` sobre otra pending → verificar `status: CANCELLED`.
6. Rollback: revertir merge (sin migraciones que revertir).

## Open Questions

Ninguna que cambie los specs, el approach o las tasks. Las decisiones menores (cómo armar el `pos/context`, dónde anidar `variants`, etc.) están tomadas y documentadas arriba.