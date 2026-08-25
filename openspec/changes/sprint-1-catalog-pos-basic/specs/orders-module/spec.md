## Purpose

Permitir a la cajera registrar pedidos estándar MESA/LLEVAR con sustituciones sin afectar precio, calcular el total en backend, asignar el número de orden atómicamente por turno, generar la comanda digital, confirmar pagos pendientes y cancelar manualmente los pendientes. La venta custom (FR-002b), inventario (FR-006) y anulación de pagados (FR-011b) se cubren en sprints posteriores.

## ADDED Requirements

### Requirement: Create Order Endpoint
El sistema SHALL proporcionar un endpoint que cree una orden MESA o LLEVAR con N ítems (productos del catálogo + extras/bebidas opcionales), calcule el total en backend a partir del catálogo, asigne un `orderNumber` único por turno y persista `OrderItemComponent` por cada presa/bebida consumida.

#### Scenario: Successful order creation paid with MESA type
- **WHEN** se envía una petición POST a /api/v1/orders con `{ type: "MESA", tableNumber: "70", paymentStatus: "paid", paymentMethod: "cash", items: [...] }` por un usuario autenticado con rol CASHIER con turno activo
- **THEN** el sistema devuelve un código de estado HTTP 201
- **AND** la respuesta sigue el contrato estándar `{ isSuccess: true, message: <string>, data: { order: <objeto Order con items, total, status: "preparing", paymentStatus: "paid", publicToken, orderNumber> }, error: null }`
- **AND** la orden se persiste en una sola `prisma.$transaction` que: crea la `Order` con `orderNumber = Shift.lastOrderNumber + 1`, incrementa `Shift.lastOrderNumber`, crea cada `OrderItem` con `unitPrice`/`totalPrice` derivados del catálogo, crea los `OrderItemComponent` desde el snapshot de la variante, y registra `AuditLog(action: "CREATE_SALE")` con `shiftId` del turno activo

#### Scenario: Order creation paid with LLEVAR type
- **WHEN** se envía una petición POST a /api/v1/orders con `type: "LLEVAR"`, `paymentStatus: "paid"`, `paymentMethod: "cash"` por un cajera con turno activo
- **THEN** el sistema devuelve un código de estado HTTP 201
- **AND** la orden queda con `tableNumber: null` y el mismo flujo de creación/pago que MESA paid

#### Scenario: Order creation pendingPayment with LLEVAR type
- **WHEN** se envía una petición POST a /api/v1/orders con `type: "LLEVAR"`, `paymentStatus: "pending"` por un cajera con turno activo
- **THEN** el sistema devuelve un código de estado HTTP 201
- **AND** la orden queda con `paymentStatus: "PENDING"`, `status: "preparing"` (aparece igual en panel de despacho, [PDR §2.5](../../../../../docs/business/pdr.md#25-pedidos-delivery-y-pago-pendiente))
- **AND** NO se descuenta inventario aún (Sprint 2 lo cablea) y NO se registra `AuditLog CREATE_SALE` (queda pendiente al confirmar pago)

#### Scenario: Order creation with selected pieces for variant
- **WHEN** un ítem incluye `variantId` y `selectedPieces` (ej. `[{type: "pecho", qty: 2}, {type: "ala", qty: 2}]`)
- **THEN** el sistema persiste `OrderItem.selectedPieces` con el arreglo recibido
- **AND** crea una fila en `OrderItemComponent` por cada presa del par seleccionado con su `quantity` correspondiente

#### Scenario: Order creation with substitution no price change
- **WHEN** un ítem incluye `substitutions: [{from: "mixto", to: "arroz"}]`
- **THEN** el `unitPrice` del ítem queda igual al `basePrice` del producto (sin ajuste por sustitución, [PDR §2.1](../../../../../docs/business/pdr.md#21-precios-y-sustituciones))
- **AND** `substitutions` se persiste en `OrderItem.substitutions` para impresión/auditoría

#### Scenario: Order creation rejects more than one substitution per item
- **WHEN** un ítem incluye más de una entrada en `substitutions`
- **THEN** el sistema devuelve un código de estado HTTP 400
- **AND** la respuesta sigue el contrato estándar de error con código estable `MULTIPLE_SUBSTITUTIONS_NOT_ALLOWED`

#### Scenario: Order creation rejects substitution to non-acompanamiento target
- **WHEN** un ítem incluye `substitutions` cuyo `to` no es `arroz`, `papa`, `smiles` o `mixto`
- **THEN** el sistema devuelve un código de estado HTTP 400
- **AND** la respuesta sigue el contrato estándar de error con código estable `INVALID_SUBSTITUTION_TARGET`

#### Scenario: Order creation rejects discountId in items
- **WHEN** cualquier ítem incluye `discountId` en el DTO de creación
- **THEN** el sistema devuelve un código de estado HTTP 400
- **AND** la respuesta sigue el contrato estándar de error con código estable `INVALID_DISCOUNT_FOR_ITEM` (los descuentos se aplican desde Sprint 3)

#### Scenario: Order creation without active shift
- **WHEN** el cajera intenta crear una orden sin tener un turno abierto en su sucursal
- **THEN** el sistema devuelve un código de estado HTTP 409 (o 400 según contrato)
- **AND** la respuesta sigue el contrato estándar de error con código estable `NO_ACTIVE_SHIFT`

#### Scenario: Order creation with non-existent product
- **WHEN** un ítem referencia un `productId` inexistente o inactivo
- **THEN** el sistema devuelve un código de estado HTTP 400
- **AND** la respuesta sigue el contrato estándar de error con código estable `PRODUCT_NOT_FOUND` o `PRODUCT_INACTIVE`

#### Scenario: Order creation without CASHIER privileges
- **WHEN** un usuario sin rol CASHIER intenta crear una orden
- **THEN** el sistema devuelve un código de estado HTTP 403
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: Order Number Assigned Atomically Per Shift
El sistema SHALL asignar el `orderNumber` de cada orden como `Shift.lastOrderNumber + 1` dentro de la misma transacción que crea la orden, garantizando que el contador `lastOrderNumber` refleje exactamente la cantidad de órdenes creadas en el turno.

#### Scenario: OrderNumber increments within shift
- **WHEN** se crea la primera orden de un turno
- **THEN** la orden queda con `orderNumber: 1` y `Shift.lastOrderNumber: 1`
- **AND** la siguiente orden del mismo turno queda con `orderNumber: 2` y `lastOrderNumber: 2`
- **AND** dos peticiones concurrentes para crear órdenes del mismo turno no obtienen el mismo `orderNumber` (constraint `@@unique([shiftId, orderNumber])`)

### Requirement: Public Token Generated For Order
El sistema SHALL generar un `publicToken` no adivinable (128 bits, hex) por cada orden al momento de creación.

#### Scenario: publicToken uniqueness and shape
- **WHEN** se crea una orden
- **THEN** `Order.publicToken` queda persistido con el resultado de `crypto.randomBytes(16).toString('hex')` (32 caracteres hex)
- **AND** el token es único entre todas las órdenes (constraint `@unique` en el schema)
- **AND** el token se devuelve en el response de creación y queda disponible para la vista pública del cliente (Sprint 4)

### Requirement: Order Snapshot Persisted
El sistema SHALL persistir un `snapshot: Json` por cada `OrderItem` al momento de creación, conteniendo la información imprimible y auditable (nombre del producto/variante, presas, sustituciones, bebidas, extras).

#### Scenario: Snapshot contains display data
- **WHEN** se crea un `OrderItem`
- **THEN** `OrderItem.snapshot` queda persistido con al menos `{ productName, variantName?, pieces, substitutions, extras, drinks }`
- **AND** el snapshot NO incluye montos derivados del catálogo que ya están en `unitPrice`/`totalPrice` (evita redundancia)
- **AND** el snapshot se usa en impresión/auditoría; el decremento de inventario usa `OrderItemComponent` (Sprint 2)

### Requirement: Pay Order Endpoint
El sistema SHALL proporcionar un endpoint que confirme el pago de una orden `pendingPayment` y la transicione a `PAID`, registrando `AuditLog CREATE_SALE` dentro de la misma transacción.

#### Scenario: Successful payment confirmation
- **WHEN** se envía una petición POST a /api/v1/orders/{id}/pay con `{ paymentMethod: "cash" }` por un CASHIER con turno activo y la orden existe en estado `pendingPayment`
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la orden queda con `paymentStatus: "PAID"`, `paymentMethod` actualizado, `paidAt: <timestamp>`, `status: "preparing"`
- **AND** el sistema registra `AuditLog(action: "CREATE_SALE")` con `shiftId` del turno activo y `details` con `{ orderId, total, paymentMethod, itemsSummary }`
- **AND** en Sprint 1 no se decrementa inventario (queda cableado en Sprint 2 con `OrderItemComponent`)

#### Scenario: Pay already paid order
- **WHEN** se intenta pagar una orden que ya está `PAID`
- **THEN** el sistema devuelve un código de estado HTTP 409
- **AND** la respuesta sigue el contrato estándar de error con código estable `ORDER_ALREADY_PAID`

#### Scenario: Pay cancelled order
- **WHEN** se intenta pagar una orden en estado `CANCELLED`
- **THEN** el sistema devuelve un código de estado HTTP 409
- **AND** la respuesta sigue el contrato estándar de error con código estable `ORDER_CANCELLED`

#### Scenario: Pay order from different branch
- **WHEN** un CASHIER de una sucursal distinta a la del turno intenta pagar la orden
- **THEN** el sistema devuelve un código de estado HTTP 403
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: Cancel Pending Order Endpoint
El sistema SHALL permitir cancelar manualmente una orden en estado `pendingPayment`, sin requerir motivo (regla [PDR §2.5](../../../../../docs/business/pdr.md#25-pedidos-delivery-y-pago-pendiente)); las cancelaciones de órdenes pagadas llegan en Sprint 2 (FR-011b).

#### Scenario: Successful cancellation of pending order
- **WHEN** se envía una petición POST a /api/v1/orders/{id}/cancel sin body por un CASHIER y la orden está en estado `pendingPayment`
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la orden queda con `status: "CANCELLED"`, `paymentStatus: "PENDING"` (sin cambios), `cancelledAt: <timestamp>`
- **AND** NO se registra `AuditLog CANCEL_SALE` en Sprint 1 (queda cableado en Sprint 2 cuando aplique a pagados)

#### Scenario: Cancel paid order not supported yet
- **WHEN** se intenta cancelar una orden `PAYada`
- **THEN** el sistema devuelve un código de estado HTTP 409
- **AND** la respuesta sigue el contrato estándar de error con código estable `ORDER_ALREADY_PAID_USE_ANULL` (la anulación con motivo llega en Sprint 2)

### Requirement: Get Order By Id Endpoint
El sistema SHALL permitir consultar el detalle completo de una orden con sus ítems (incluyendo snapshot), totales y datos de auditoría visibles para cajera/despachadora/admin de la misma sucursal.

#### Scenario: Successful order retrieval
- **WHEN** un usuario autenticado con rol CASHIER, DISPATCHER o ADMIN envía GET /api/v1/orders/{id} y la orden pertenece a su sucursal
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta sigue el contrato estándar con `{ order: <Order con items, snapshot, total, status, paymentStatus, createdBy, paidAt, cancelledAt, orderNumber> }`
- **AND** los ítems incluyen `unitPrice`, `totalPrice`, `substitutions`, `selectedPieces`, `customPieces?`, `extras?`, `drinks?`, `snapshot`

#### Scenario: Order from different branch
- **WHEN** un CASHIER o DISPATCHER de otra sucursal intenta ver una orden
- **THEN** el sistema devuelve un código de estado HTTP 403
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: List Orders With Filters Endpoint
El sistema SHALL permitir listar órdenes con filtros (`status`, `date`, `createdBy`, `table`, `customer`) para alimentar tanto el panel de despacho como el historial de comandas (FR-012). El listado se restringe por `branchId` del usuario (excepto ADMIN/SUPER_ADMIN).

#### Scenario: Successful orders list retrieval
- **WHEN** un CASHIER envía GET /api/v1/orders con o sin filtros
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta incluye solo órdenes de la `branchId` del cajera
- **AND** la lista viene ordenada por `createdAt DESC` (más recientes primero)

#### Scenario: Filter by status
- **WHEN** un DISPATCHER envía GET /api/v1/orders?status=preparing
- **THEN** la lista incluye solo órdenes con `status: "preparing"` (panel de despacho)
- **AND** la lista incluye órdenes con `paymentStatus: "PENDING"` (aparece igual en panel, PDR §2.5)

#### Scenario: Filter by date and table
- **WHEN** un cajera envía GET /api/v1/orders?date=2026-05-01&table=70
- **THEN** la lista incluye solo órdenes de esa fecha con `tableNumber: "70"`

#### Scenario: Filter by customer
- **WHEN** un cajera envía GET /api/v1/orders?customer=<customerId>
- **THEN** la lista incluye solo órdenes vinculadas a ese cliente

### Requirement: Order Total Calculated By Backend
El sistema SHALL calcular el `originalAmount`, `total`, `unitPrice` y `totalPrice` de cada ítem a partir del catálogo, sin aceptar precios del cliente ([tech guide §5.0](../../../../../docs/backend/technical_guide.md#50-principios-de-diseño-de-la-api-el-backend-manda-el-frontend-renderiza), principio 6).

#### Scenario: Backend computes from catalog
- **WHEN** se crea una orden con N ítems
- **THEN** cada `unitPrice` se toma del `Product.basePrice` (o del precio de variante si existiera override)
- **AND** `originalAmount = Σ(unitPrice × quantity)` de todos los ítems
- **AND** `total = originalAmount − Σ(descuentos aplicados)` (Sprint 1 sin descuentos, `total = originalAmount`)
- **AND** cualquier campo de precio enviado por el cliente es ignorado o rechazado por el DTO

### Requirement: Audit Log on Order Creation and Payment
El sistema SHALL registrar `AuditLog` con `action: "CREATE_SALE"` en (a) creación de orden con `paymentStatus: "paid"` y (b) confirmación de pago de una orden `pendingPayment`. Ambos logs dentro de la misma `$transaction` que la acción.

#### Scenario: Audit log on paid order creation
- **WHEN** se completa con éxito POST /api/v1/orders con `paymentStatus: "paid"`
- **THEN** existe un `AuditLog` con `entity: "Order"`, `entityId: <id de la orden>`, `action: "CREATE_SALE"`, `userId`, `shiftId` del turno activo y `details: { total, items: <resumen>, paymentMethod }`

#### Scenario: Audit log on payment confirmation
- **WHEN** se completa con éxito POST /api/v1/orders/{id}/pay
- **THEN** existe un `AuditLog` con `entity: "Order"`, `entityId: <id de la orden>`, `action: "CREATE_SALE"`, `userId`, `shiftId` del turno activo y `details: { orderId, total, paymentMethod, itemsSummary }`