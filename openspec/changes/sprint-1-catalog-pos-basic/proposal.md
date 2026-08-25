## Why

Sprint 0 dejó el sistema en pie (PrismaService, Auth/Users/Branches, guards JWT + roles, contrato de respuesta estándar) pero **no hay catálogo vendible ni forma de registrar ventas**. Sin productos, variantes, turnos abiertos, ni `POST /orders` no se puede operar el restaurante — todo el MVP depende de esto. Es el primer sprint que produce funcionalidad de cara al usuario final (cajera abre caja, vende un plato, despachadora ve la comanda) y además introduce el `AuditService` que se cablea a todas las acciones críticas del resto del MVP (PDR §2.9: retrofitearlo en S5 implicaría reabrir cada service).

## What Changes

**Catálogo (admin):**

- `POST /api/v1/products` y `GET /api/v1/products` — alta y listado de productos (`name`, `basePrice`, `category`, `description?`, `active`, `isSellable`, `isInventoryItem`).
- `POST /api/v1/variants` — alta de variantes por producto (`name`, `components: Json`, `isDefault`).
- Multi-sucursal: los productos y variantes son **globales** (no tienen `branchId`); la asignación por sucursal se materializa cuando se crea `InventoryItem` (Sprint 2). Coherente con el seed actual.

**Shifts mínimo (cajera):**

- `GET /api/v1/shift-periods` — catálogo (el seed ya crea Mañana/Noche).
- `POST /api/v1/shifts/open` — apertura de turno declarando `periodId`, `cashRegisterId` y `openingAmount`. El `periodId` lo confirma la cajera (preselección editable en el front; **el backend nunca infiere del reloj**, PDR §13.3). Inicializa `lastOrderNumber = 0`.
- `GET /api/v1/shifts/active` — turno activo de la cajera (alimenta el POS y la cabecera del panel). Sin turno → 409.
- Cablear `OPEN_SHIFT` en `AuditLog` (acción crítica, §4.3).

**Auditoría (transversal):**

- Crear `AuditModule` + `AuditService` con un único método `log(tx, { entity, entityId, action, userId, shiftId, details })`. Patrón V1: invocación explícita dentro de cada `$transaction` de acción crítica (PDR §4.3 / tech guide §4.3). `AuditLog` es append-only (solo INSERT/SELECT; la inmutabilidad ES la feature).

**Pedidos estándar (cajera):**

- `POST /api/v1/orders` — crear orden MESA/LLEVAR con N ítems (`productId` + `quantity`, opcional `variantId`, `selectedPieces?`, `substitutions?`, `extras?`, `drinks?`). `paymentStatus: paid` o `pending`. Transición atómica: crea Order + OrderItems + OrderItemComponents + asigna `orderNumber` vía `Shift.lastOrderNumber` + audit `CREATE_SALE`. **En Sprint 1 NO se acepta `discountId`** (queda rechazado hasta Sprint 3 — coherente con la guía de implementación, "rechazar si viene").
- `POST /api/v1/orders/{id}/pay` — confirmar pago de un `pendingPayment`: transacción atómica que descuenta inventario (Sprint 1: solo crea `OrderItemComponent` de referencia; el decremento real de `InventoryItem` con `InventoryTransaction` llega en Sprint 2 cuando exista el catálogo de inventario). Setea `paidAt` y `paymentStatus = PAID`. Cablear `CREATE_SALE` (no se había cableado en la creación si era `pending`).
- `POST /api/v1/orders/{id}/cancel` — cancelar `pendingPayment` (manual, sin motivo; PDR §2.5). Devuelve a estado terminal `CANCELLED`. **Pedidos pagados NO se anulan en este sprint** (eso es FR-011b → Sprint 2 junto con la reversión de inventario).
- `GET /api/v1/orders/{id}` — detalle de orden con `items` (snapshot expandido), `createdBy`, totales.
- `GET /api/v1/orders?status=&date=&createdBy=&table=&customer=` — listado con filtros (panel despacho + historial FR-012). Un solo endpoint para ambos usos. **Restringido por branch**: la cashier ve solo lo de su sucursal.
- **Sustituciones (PDR §2.1):** máximo 1 por ítem, solo al acompañamiento; **no afectan precio**. Validar en el DTO (`class-validator`) y persistir en `OrderItem.substitutions: Json`.
- **Snapshot (PDR §2.3):** cada `OrderItem` persiste `snapshot: Json` con la información imprimible (nombre del producto, variante, presas, sustituciones, precio confirmado). En Sprint 1 el `snapshot` se usa para impresión/auditoría futura; **el decremento de inventario usa `OrderItemComponent`** (fila por presa/bebida consumida) como fuente de verdad.
- `OrderItemComponent` se puebla desde el snapshot de la variante (`components: Json` → filas normalizadas de presas/bebidas) en la misma `$transaction`. Sprint 1 persiste las filas como **referencia declarativa** (sin tocar `InventoryItem`/`InventoryTransaction` — eso llega en Sprint 2).
- **Order number:** `Order.orderNumber` se asigna vía `Shift.lastOrderNumber` dentro de la misma `$transaction` (`UPDATE Shift SET lastOrderNumber = lastOrderNumber + 1 RETURNING lastOrderNumber`). Único en combinación con `shiftId` (`@@unique([shiftId, orderNumber])`).
- **publicToken:** `crypto.randomBytes(16).toString('hex')` (128 bits), persistido y devuelto en el response.

**POS context (cajera):**

- `GET /api/v1/pos/context` v1: `products` + `variants` activos + `shiftPeriods` + `shift` activo (o `null`). Carga del POS en una sola llamada liviana (Sprint 1 todavía sin `discounts`, sin `piecePrices`; esos crecen en S3/S2). `piecePrices` se agrega en Sprint 2.

**Estados y transiciones (PDR §4 / tech guide §4.1):**

- `POST /orders` con `paymentStatus: paid` → `status: preparing`, `paymentStatus: PAID` → descuento de inventario al confirmar pago (en Sprint 1 sin inventario, persiste `OrderItemComponent` y `paidAt`).
- `POST /orders` con `paymentStatus: pending` → `status: preparing`, `paymentStatus: PENDING` (aparece igual en panel de despacho, PDR §2.5).
- `POST /orders/{id}/pay` con `pending` → `PAID`, persiste `paidAt`. Sprint 2 sumará el decremento de inventario.
- `POST /orders/{id}/cancel` con `pending` → `CANCELLED` (manual, sin motivo). Sprint 2 sumará la cancelación de pagados con reversión.

**Cableado de auditoría (Sprint 1):**

| Acción | Entidad | Punto |
|---|---|---|
| `OPEN_SHIFT` | `Shift` | `POST /shifts/open` (dentro de la `$transaction` que crea el turno) |
| `CREATE_SALE` | `Order` | `POST /orders` cuando `paymentStatus: paid`; `POST /orders/{id}/pay` cuando era `pending` |

`CANCEL_SALE` se cablea en Sprint 2 cuando exista `cancel` de pagados con reversión de inventario (FR-011b). El resto de las 6 acciones (`ADJUST_INVENTORY`, `CREATE_VOUCHER`, `CLOSE_SHIFT`, `AUTHORIZE_DISCOUNT`, `GENERATE_REPORT`) llegan con sus sprints.

**No se hace en Sprint 1 (queda explícito):**

- Descuentos (Sprint 3, FR-016/FR-016b) — los `OrderItem` no aceptan `discountId` aún (DTO lo rechaza con 400 `INVALID_DISCOUNT_FOR_ITEM`).
- Venta custom / presas surtidas (Sprint 2, FR-002b) — el endpoint `POST /orders/custom` no existe.
- Inventario y decremento (Sprint 2, FR-006) — `InventoryItem`/`InventoryTransaction` aún no se cablean; `OrderItemComponent` se persiste como referencia.
- Anulación de pagados con motivo (Sprint 2, FR-011b) — `cancel` solo aplica a `pendingPayment`.
- Pantalla pública de listos y vista del cliente (Sprint 4, FR-007/FR-015).
- Reportes CSV (Sprint 3, FR-010).
- Auditoría completa por turno/mes — el endpoint `POST /audit-logs/shift` llega en Sprint 5 (FR-018 cierra; aquí solo se crea el service y se cablea en 2 puntos).

**Actualización de docs:**

- `docs/backend/implementation_guide.md`: marcar Sprint 1 como implementado en el DoD y mantener el orden de archivos real.
- `docs/backend/technical_guide.md`: verificar que §5.1 endpoints y §5.2 matriz reflejan lo construido (sin introducir cambios de contrato).

## Capabilities

### New Capabilities

- `products-module`: catálogo de productos y variantes (CRUD admin, lectura POS). Cubre FR-001.
- `shifts-module`: gestión mínima del turno de caja (apertura con declaración de período, lectura del turno activo, catálogo de períodos). Cubre FR-004 (apertura mínima — el cierre/arqueo completo llega en Sprint 3).
- `audit-module`: `AuditService.log(tx, ...)` con semántica append-only y patrón "audit explícito dentro de la transacción". Cubre PDR §2.9 + tech guide §4.3 (el módulo nace en S1; la consulta por turno/mes llega en S5).
- `orders-module`: registro de pedidos estándar (MESA/LLEVAR) con sustituciones, snapshot, generación de `publicToken`, asignación atómica de `orderNumber`, confirmación de pago de pendientes y cancelación manual de pendientes. Cubre FR-002 (parcial — sin custom, sin inventario), FR-003 (parcial — comanda en panel vía `GET /orders?status=`), FR-011 (parcial — crear pendiente y pagar; anulación de pagados en S2), FR-012 (historial con filtros).
- `pos-context`: endpoint único que carga el POS (`GET /pos/context` v1: productos + variantes + shiftPeriods + shift activo). Crece en S2/S3. Sin capacidad propia de descuentos en S1.

### Modified Capabilities

Ninguna. Los specs del Sprint 0 (`prisma-service`, `auth-module`, `auth-guards`, `auth-decorators`, `exception-filter`, `users-module`) **no cambian sus requirements**: este sprint solo los consume.

## Impact

**Código (nuevo):**

```
src/products/
  products.module.ts
  products.controller.ts
  products.service.ts
  dto/create-product.dto.ts
  dto/update-product.dto.ts
src/variants/                         ← módulo anidado bajo products (mismo dominio)
  variants.controller.ts               ← ruta POST /api/v1/variants
  variants.service.ts
  dto/create-variant.dto.ts
src/shifts/
  shifts.module.ts
  shifts.controller.ts
  shifts.service.ts
  dto/open-shift.dto.ts
src/audit/
  audit.module.ts
  audit.service.ts
src/orders/
  orders.module.ts
  orders.controller.ts
  orders.service.ts
  orders.helpers.ts                   ← asignación orderNumber + publicToken
  dto/create-order.dto.ts
  dto/pay-order.dto.ts
  dto/cancel-order.dto.ts
  dto/list-orders.dto.ts
src/pos/
  pos.module.ts
  pos.controller.ts
  pos.service.ts                      ← ensamble de contexto del POS
src/order-item-components/            ← sin módulo NestJS: helper puro invocado por OrdersService
  build-from-variant.ts
```

**API (nuevos, todos bajo `/api/v1`):**

- `POST /products`, `GET /products` (ADMIN; `GET` también CASHIER para el POS).
- `POST /variants` (ADMIN).
- `GET /shift-periods` (CASHIER, ADMIN).
- `POST /shifts/open` (CASHIER).
- `GET /shifts/active` (CASHIER).
- `POST /orders`, `POST /orders/{id}/pay`, `POST /orders/{id}/cancel` (CASHIER).
- `GET /orders/{id}`, `GET /orders` (CASHIER, DISPATCHER, ADMIN).
- `GET /pos/context` (CASHIER).

**Esquema:** sin cambios de schema. Todas las entidades necesarias (`Product`, `Variant`, `Order`, `OrderItem`, `OrderItemComponent`, `Shift`, `ShiftPeriod`, `CashRegister`, `AuditLog`) ya existen en `prisma/schema.prisma` con sus índices, `@@unique([shiftId, orderNumber])`, etc. La única adición lógica es que ahora **se persisten `OrderItemComponent` reales** al confirmar pago (en Sprint 0 no había quien los crease).

**Dependencias:** ninguna nueva. `class-validator`, `class-transformer` y `bcryptjs` ya están en `package.json` desde S0.

**Seguridad:**

- Todos los endpoints protegidos por `AuthGuard` (S0) salvo los que ya son `@Public()` (ninguno nuevo en S1).
- `RolesGuard` con `@Roles(UserRole.ADMIN | UserRole.CASHIER | UserRole.DISPATCHER)` según matriz §5.2.
- `GET /orders` filtra por `branchId` de la cajera (excepto `ADMIN`/`SUPER_ADMIN` con acceso global).
- `Order.publicToken` se genera con `crypto.randomBytes(16)` (128 bits) — credencial no adivinable para FR-015.

**Multi-sucursal:**

- Productos/variantes: globales (sin `branchId`); coherente con el modelo actual.
- Shift: pertenece a la sucursal del cajera (`Shift.branchId` requerido).
- Orders: filtradas por `branchId` del turno (excepto admin/super).
- Sprint 1 no introduce `branchId` propio en `Product`/`Variant` (no romper la regla del seed).

**Auditoría — punto crítico (PDR §2.9):** la implementación de S1 nace **con `AuditService` ya cableado en `OPEN_SHIFT` y `CREATE_SALE`**, en la misma `$transaction` que la acción. Esto es disciplina explícita del PDR (tech guide §4.3: "no retrofitear en S5"). Los 2 puntos cableados son los únicos posibles en Sprint 1; el resto se suma con sus features.

**Docs:**

- `docs/backend/implementation_guide.md`: actualizar DoD de Sprint 1 y marcar tareas implementadas; mantener el orden de archivos real.
- `docs/backend/technical_guide.md`: confirmar que §5.1 y §5.2 están coherentes con lo construido; **sin introducir cambios de contrato** (los endpoints ya existen ahí).

**Out of scope (no tocar en este sprint):**

- Reportes CSV.
- Venta custom / presas surtidas.
- Inventario y decremento.
- Anulación de pedidos pagados.
- Pantalla pública y vista del cliente.
- Impresión térmica / PDF.
- Endpoints públicos (`/public/...`).