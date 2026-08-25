# Tasks — Sprint 1: Catálogo + POS básico

> **No tests.** Por convención del proyecto (AGENTS.md), en V1 no se crean archivos `*.spec.ts` ni E2E; las verificaciones son manuales contra el seed.
> **Convención pnpm.** Todos los comandos usan `pnpm`.
> **Verificación final:** `pnpm run lint` en verde; smoke test manual según DoD abajo.

## 1. Módulo Audit (transversal — base para todos los demás)

- [x] 1.1 Crear `src/audit/audit.module.ts` exportando `AuditService` (sin controllers en V1).
- [x] 1.2 Crear `src/audit/audit.service.ts` con:
  - Método único `log(tx: Prisma.TransactionClient, params: { entity: string; entityId: string; action: string; userId: string; shiftId?: string; details?: JsonValue }): Promise<AuditLog>`.
  - Validación de `action` contra el set cerrado del tech guide §4.3 (`CREATE_SALE | CANCEL_SALE | ADJUST_INVENTORY | CREATE_VOUCHER | OPEN_SHIFT | CLOSE_SHIFT | GENERATE_REPORT | AUTHORIZE_DISCOUNT`); cualquier otro verbo lanza `BadRequestException` con código `INVALID_AUDIT_ACTION`.
  - `userId` se recibe del invocador (decisión tomada en el caller desde `request.user.sub`).
  - `timestamp` lo asigna Prisma con `@default(now())`.
- [x] 1.3 Registrar `AuditModule` en `src/app.module.ts` (import global para que orders/shifts lo inyecten).

## 2. Módulo Products (catálogo)

- [x] 2.1 Crear `src/products/products.module.ts` (registra `ProductsService` y el submódulo de variantes).
- [x] 2.2 Crear `src/products/products.controller.ts` con:
  - `POST /api/v1/products` (`@Roles(UserRole.ADMIN)`).
  - `GET /api/v1/products` (`@Roles(UserRole.ADMIN, UserRole.CASHIER)`).
- [x] 2.3 Crear `src/products/products.service.ts`:
  - `create(dto)`: valida unicidad de `name` (error `DUPLICATE_PRODUCT_NAME` 400 si choca), persiste con `active: true` por defecto.
  - `findAll({ onlyActive, onlySellable })`: filtrable; cajeras reciben solo `active && isSellable`, admin recibe todo.
- [x] 2.4 Crear `src/products/dto/create-product.dto.ts` con `class-validator`:
  - `name: string` (3-80, requerido).
  - `basePrice: number` (`@Min(0.01)`, `@IsDecimal` con 2 decimales).
  - `category: string` (requerido).
  - `description?: string` (max 500).
  - `isSellable?: boolean` (default `true`).
  - `isInventoryItem?: boolean` (default `true`).
- [x] 2.5 Crear `src/products/variants/variants.controller.ts` con `POST /api/v1/variants` (`@Roles(UserRole.ADMIN)`).
- [x] 2.6 Crear `src/products/variants/variants.service.ts`:
  - `create(dto)`: valida `productId` existe (error `PRODUCT_NOT_FOUND` 400 si no), valida `components` no vacío, persiste con `active: true` por defecto.
- [x] 2.7 Crear `src/products/variants/dto/create-variant.dto.ts` con `class-validator`:
  - `productId: string` (`@IsUUID`).
  - `name: string` (requerido).
  - `components: Array<{ type: 'presa' | 'acompanamiento' | 'bebida' | 'extra'; name?: string; count: number }>` (`@ArrayMinSize(1)`, `count >= 1`).
  - `isDefault?: boolean` (default `false`).

## 3. Módulo Shifts (turno mínimo)

- [x] 3.1 Crear `src/shifts/shifts.module.ts` (importa `AuditModule`).
- [x] 3.2 Crear `src/shifts/shifts.controller.ts` con:
  - `GET /api/v1/shift-periods` (`@Roles(UserRole.CASHIER, UserRole.ADMIN)`).
  - `POST /api/v1/shifts/open` (`@Roles(UserRole.CASHIER)`).
  - `GET /api/v1/shifts/active` (`@Roles(UserRole.CASHIER)`).
- [x] 3.3 Crear `src/shifts/shifts.service.ts`:
  - `listPeriods()`: devuelve solo períodos con `active: true`, ordenados por `displayOrder` asc.
  - `open(dto, user)`: en una `$transaction`:
    1. Valida `periodId` existe y `active: true` (errores `SHIFT_PERIOD_NOT_FOUND` / `SHIFT_PERIOD_INACTIVE`).
    2. Valida `cashRegisterId` existe y pertenece a la misma `branchId` del cajera (error `CASH_REGISTER_NOT_FOUND`).
    3. Crea `Shift` con `status: OPEN`, `lastOrderNumber: 0`, `branchId = user.branchId`.
    4. Invoca `auditService.log(tx, { entity: 'Shift', entityId: shift.id, action: 'OPEN_SHIFT', userId: user.sub, shiftId: shift.id, details: { openingAmount, cashRegisterId, periodId } })`.
    5. Retorna el turno creado.
  - `findActiveForUser(user)`: busca `Shift` con `status: OPEN`, `cashierId: user.sub`, `branchId: user.branchId`; devuelve el más reciente o `null`.
- [x] 3.4 Crear `src/shifts/dto/open-shift.dto.ts`:
  - `openingAmount: number` (`@Min(0)`, 2 decimales).
  - `cashRegisterId: string` (`@IsUUID`).
  - `periodId: string` (`@IsUUID`).
- [x] 3.5 Manejar caso sin turno activo en `OrdersService` y `PosService`: si `findActiveForUser` devuelve `null`, lanzar `ConflictException` con código `NO_ACTIVE_SHIFT` (cuando aplique).

## 4. Módulo Orders (corazón del Sprint 1)

- [x] 4.1 Crear `src/orders/orders.module.ts` (importa `AuditModule`, `ProductsModule` para resolver productos).
- [x] 4.2 Crear `src/orders/orders.controller.ts` con:
  - `POST /api/v1/orders` (`@Roles(UserRole.CASHIER)`).
  - `POST /api/v1/orders/{id}/pay` (`@Roles(UserRole.CASHIER)`).
  - `POST /api/v1/orders/{id}/cancel` (`@Roles(UserRole.CASHIER)`).
  - `GET /api/v1/orders/{id}` (`@Roles(UserRole.CASHIER, UserRole.DISPATCHER, UserRole.ADMIN)`).
  - `GET /api/v1/orders` (`@Roles(UserRole.CASHIER, UserRole.DISPATCHER, UserRole.ADMIN)`).
- [x] 4.3 Crear `src/orders/orders.service.ts`:
  - `create(dto, user)`: en una `$transaction`:
    1. Resuelve turno activo (error `NO_ACTIVE_SHIFT` si no hay).
    2. Valida cada ítem: producto existe y activo (`PRODUCT_NOT_FOUND` / `PRODUCT_INACTIVE`), variante existe si viene.
    3. Valida sustituciones: máximo 1 por ítem, `to ∈ {arroz, papa, smiles, mixto}`, `from === 'mixto'` (errores `MULTIPLE_SUBSTITUTIONS_NOT_ALLOWED` / `INVALID_SUBSTITUTION_TARGET`).
    4. Rechaza `discountId` o `discountAmount` en items (error `INVALID_DISCOUNT_FOR_ITEM`) — DTO usa `whitelist: true`.
    5. Para cada item, calcula `unitPrice = product.basePrice`, `totalPrice = unitPrice * quantity`.
    6. Genera `publicToken = crypto.randomBytes(16).toString('hex')`.
    7. Asigna `orderNumber` con `tx.shift.update({ where: { id: shiftId }, data: { lastOrderNumber: { increment: 1 } }, select: { lastOrderNumber: true } })` y toma `lastOrderNumber`.
    8. Crea `Order` con `status: 'preparing'`, `paymentStatus`, `paymentMethod?`, `originalAmount = Σ(totalPrice)`, `total = originalAmount` (sin descuentos).
    9. Crea cada `OrderItem` con su `snapshot` JSON.
    10. Construye `OrderItemComponent` desde el snapshot de la variante (`components: Json` → filas normalizadas de presas/bebidas); persiste.
    11. Si `paymentStatus === 'paid'`: invoca `auditService.log(tx, { entity: 'Order', entityId: order.id, action: 'CREATE_SALE', userId: user.sub, shiftId, details: { total, items: <resumen>, paymentMethod } })`. Si es `pending`, NO se audita (queda pendiente al confirmar pago).
    12. Retorna la orden creada con `items` y `createdBy` populated.
  - `pay(orderId, dto, user)`: en una `$transaction`:
    1. Carga `Order` con `shift`; valida existe y pertenece a la `branchId` del cajera (error `ORDER_NOT_FOUND` / `ORDER_FROM_OTHER_BRANCH`).
    2. Valida `paymentStatus === 'PENDING'` y `status !== 'CANCELLED'` (errores `ORDER_ALREADY_PAID` / `ORDER_CANCELLED`).
    3. Update `Order`: `paymentStatus: PAID`, `paymentMethod`, `paidAt: now()`.
    4. Invoca `auditService.log(tx, { entity: 'Order', entityId, action: 'CREATE_SALE', userId, shiftId: order.shiftId, details: { orderId, total, paymentMethod, itemsSummary } })`.
    5. **En Sprint 1 NO decrementa inventario** (queda cableado en Sprint 2 con `OrderItemComponent`).
  - `cancel(orderId, user)`: en una `$transaction`:
    1. Carga `Order`; valida pertenece a la `branchId` del cajera.
    2. Valida `paymentStatus === 'PENDING'` (si está `PAID` → error `ORDER_ALREADY_PAID_USE_ANULL`).
    3. Update `Order`: `status: CANCELLED`, `cancelledAt: now()`.
    4. **En Sprint 1 NO se audita `CANCEL_SALE`** (queda cableado en Sprint 2 cuando aplique a pagados).
  - `findById(orderId, user)`: carga orden con `items`, `createdBy`, `shift.cashier`. Filtra por `branchId` salvo admin/super_admin. Si no pertenece → `FORBIDDEN` 403.
  - `list({ filters }, user)`: aplica filtros (`status`, `date`, `createdBy`, `table`, `customer`), restringe por `branchId` salvo admin/super_admin, ordena `createdAt DESC`.
- [x] 4.4 Crear `src/orders/dto/create-order.dto.ts`:
  - `type: 'MESA' | 'LLEVAR'` (`@IsEnum`).
  - `tableNumber?: string` (requerido si `type === 'MESA'`, validar en service).
  - `customerId?: string` (`@IsUUID`).
  - `paymentStatus: 'paid' | 'pending'` (`@IsIn`).
  - `paymentMethod?: 'cash' | 'card' | 'vale'` (`@IsIn`, requerido si `paymentStatus === 'paid'`).
  - `items: CreateOrderItemDto[]` (`@ArrayMinSize(1)`, `@ValidateNested({ each: true })`).
- [x] 4.5 Crear `src/orders/dto/create-order-item.dto.ts`:
  - `productId: string` (`@IsUUID`).
  - `variantId?: string` (`@IsUUID`).
  - `quantity: number` (`@Min(1)`, `@IsInt`).
  - `selectedPieces?: Array<{ type: 'pecho' | 'ala' | 'pierna' | 'entrepierna'; qty: number }>`.
  - `substitutions?: Array<{ from: 'mixto'; to: 'arroz' | 'papa' | 'smiles' | 'mixto' }>` (`@ArrayMaxSize(1)`).
  - `extras?: Array<{ type: string; qty: number }>`.
  - `drinks?: Array<{ productId: string; qty: number }>`.
  - **No incluir** `discountId` ni `discountAmount` (whitelist en ValidationPipe global los descarta; agregar validación explícita en service con `INVALID_DISCOUNT_FOR_ITEM` 400).
- [x] 4.6 Crear `src/orders/dto/pay-order.dto.ts`:
  - `paymentMethod: 'cash' | 'card' | 'vale'` (`@IsIn`).
- [x] 4.7 Crear `src/orders/dto/cancel-order.dto.ts`: vacío (la cancelación de `pendingPayment` no requiere motivo). Validación en service.
- [x] 4.8 Crear `src/orders/dto/list-orders.dto.ts`:
  - `status?: OrderStatus` (`@IsEnum`).
  - `date?: string` (ISO date, validar).
  - `createdBy?: string` (`@IsUUID`).
  - `table?: string`.
  - `customer?: string` (`@IsUUID`).
- [x] 4.9 Crear `src/orders/orders.helpers.ts` con funciones puras:
  - `assignOrderNumber(tx, shiftId): Promise<number>` (encapsula el `UPDATE ... increment`).
  - `generatePublicToken(): string` (`crypto.randomBytes(16).toString('hex')`).
  - `buildOrderItemSnapshot(product, variant, item)`.
  - `buildOrderItemComponents(variant.components, orderItemId)`.

## 5. Módulo POS Context

- [x] 5.1 Crear `src/pos/pos.module.ts` (importa `ProductsModule`, `ShiftsModule`).
- [x] 5.2 Crear `src/pos/pos.controller.ts` con `GET /api/v1/pos/context` (`@Roles(UserRole.CASHIER)`).
- [x] 5.3 Crear `src/pos/pos.service.ts`:
  - `getContext(user)`:
    1. `products = product.findMany({ where: { active: true, isSellable: true }, include: { variants: { where: { active: true } } } })`.
    2. `shiftPeriods = shiftPeriod.findMany({ where: { active: true }, orderBy: { displayOrder: 'asc' } })`.
    3. `shift = shiftsService.findActiveForUser(user)`.
    4. Retorna `{ products, shiftPeriods, shift }`. En Sprint 1 NO incluye `discounts` ni `piecePrices` (Sprint 3 / Sprint 2).
- [x] 5.4 Verificar que el payload resultante pese pocos KB con el seed (≤ 50 productos, ≤ 10 variantes por producto).

## 6. Registro en AppModule

- [x] 6.1 Importar `AuditModule`, `ProductsModule`, `ShiftsModule`, `OrdersModule`, `PosModule` en `src/app.module.ts`.
- [x] 6.2 Verificar que `PrismaModule` y `AuthModule` (Sprint 0) siguen registrados y disponibles globalmente.
- [x] 6.3 Verificar que el orden de guards globales (`APP_GUARD`) sigue siendo `AuthGuard` → `RolesGuard` (configurado en Sprint 0; no se toca).

## 7. Documentación

- [x] 7.1 Actualizar `docs/backend/implementation_guide.md`:
  - Marcar el DoD de Sprint 1 (catálogo + orders + shifts mínimo + audit cableado en 2 puntos).
  - Mantener el orden de archivos real (sections 2-5 → "implementado").
  - No tocar el mapa de cobertura (Sprint 1 ya estaba planificado ahí).
- [x] 7.2 Verificar que `docs/backend/technical_guide.md` §5.1 y §5.2 reflejan los endpoints construidos. **No introducir cambios de contrato** (los endpoints ya están documentados ahí).

## 8. Verificación

- [x] 8.1 Ejecutar `pnpm run lint` y dejar en verde.
- [x] 8.2 Ejecutar `pnpm run build` y verificar que TypeScript compila sin errores.
- [x] 8.3 Smoke test manual con DB sembrada (`pnpm seed`):
  - Login como ADMIN (del seed) → `POST /api/v1/products` crear "Porción Media" → `POST /api/v1/variants` crear variante con 2 presas + mixto.
  - Login como CASHIER → `GET /api/v1/shift-periods` devuelve Mañana/Noche.
  - `POST /api/v1/shifts/open` con `periodId` Mañana → verificar respuesta 201 y turno en BD.
  - `GET /api/v1/shifts/active` → devuelve el turno recién creado con `lastOrderNumber: 0`.
  - `GET /api/v1/pos/context` → devuelve `products`, `variants`, `shiftPeriods` y `shift` con datos.
  - `POST /api/v1/orders` con 1 plato MESA paid → verificar:
    - `orderNumber: 1`.
    - `Shift.lastOrderNumber: 1`.
    - `OrderItemComponent` con 1 fila por presa.
    - `AuditLog` con `action: 'CREATE_SALE'`.
    - `total` = suma derivada.
  - Repetir `POST /orders` → verificar `orderNumber: 2`.
  - `POST /api/v1/orders` con 1 plato LLEVAR pending → verificar `paymentStatus: 'PENDING'`, sin audit `CREATE_SALE`.
  - `POST /api/v1/orders/{id}/pay` sobre la pending → verificar `paymentStatus: 'PAID'`, `paidAt` seteado, audit `CREATE_SALE` registrado.
  - `POST /api/v1/orders/{otherId}/cancel` sobre otra pending → verificar `status: 'CANCELLED'`, `cancelledAt` seteado.
  - `POST /api/v1/orders` con `discountId` en un ítem → 400 `INVALID_DISCOUNT_FOR_ITEM`.
  - `POST /api/v1/orders` con 2 sustituciones en un ítem → 400 `MULTIPLE_SUBSTITUTIONS_NOT_ALLOWED`.
  - `POST /api/v1/orders` con `type: 'MESA'` y sustituciones válidas → verificar `unitPrice` igual a `basePrice` (sin ajuste).
  - `GET /api/v1/orders?status=preparing` → devuelve órdenes pagadas y pendientes del panel.
  - `GET /api/v1/orders/{id}` con orden de otra `branchId` → 403.
  - `GET /api/v1/pos/context` sin turno activo (logout + relogin sin abrir) → `shift: null` (no error).
- [x] 8.4 Confirmar que `pnpm prisma generate` no requiere cambios (schema intacto).
- [x] 8.5 Confirmar DoD del Sprint 1 según `implementation_guide.md` §3:
  - FR-001 cumplido (admin crea producto + variante, queda disponible en POS).
  - FR-002 cumplido (cajera registra pedido MESA/LLEVAR; totales correctos; comanda en panel).
  - FR-003 parcial cumplido (comanda digital en panel vía `GET /orders?status=`).
  - FR-011 parcial cumplido (crear pendiente y pagar; anulación de pagados en Sprint 2).
  - FR-012 cumplido (historial con filtros).
  - Audit cableado en 2 puntos (`OPEN_SHIFT`, `CREATE_SALE`).
  - `pnpm run lint` en verde; `pnpm run build` compila.
