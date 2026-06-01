# Technical Guide — Wonder Chicken
**Sistema Informático de Ventas — Documento Técnico de Implementación**
**Complementa:** [docs/PDR.md](PDR.md)
**Audiencia:** LLM generador de código y equipo de desarrollo backend/frontend
**Versión:** 1.0
**Fecha:** 2026-05-10

> Este documento es la **traducción técnica** de las reglas de negocio definidas en el PDR. Contiene modelo de datos, contrato de la API, requerimientos no funcionales técnicos, máquina de estados con detalles transaccionales, payloads, OpenAPI skeleton, casos de prueba E2E y despliegue.
>
> **Precedencia:** Si una decisión técnica de este documento entra en conflicto con una regla de negocio del PDR, **la regla de negocio del PDR gana**. Este documento se actualiza para reflejar el negocio, no al revés.

---

# 1. Stack tecnológico (obligatorio)

- **Backend:** **NestJS**, **TypeScript**, **Prisma** (ORM), **PostgreSQL**.
- **Frontend:** **Next.js**, **React**, **Zustand** (estado global), **MUI** (Material UI) + MUI Icons.
- **Autenticación:** JWT + **bcryptjs** para hashing de contraseñas.
- **Impresión/PDF:** `react-to-print` u otro paquete equivalente con buenos resultados personalizables.
- **Multiplataforma:** El código debe correr en Windows y Linux. Usar `path.join` (nunca strings con `\` o `/` hardcodeados) y manejar fechas en UTC con timezone explícito al presentar.

---

# 2. Requerimientos no funcionales (NFR)

- **Usabilidad:** POS en 3 pasos máximo; interfaces limpias y reactivas; español por defecto. Soporte para tema claro y oscuro usando `paper` y colores de MUI (evitar fondos sólidos no reactivos).
- **Rendimiento:** Respuesta objetivo en LAN: **≤300 ms** para operaciones de venta; tolerancia a picos.
- **Disponibilidad:** Modo local (on-premise) con opción de sincronización a nube en v2; objetivo **99.5% uptime** en horario operativo.
- **Seguridad:** Autenticación JWT; contraseñas hasheadas con **bcryptjs**; auditoría de acciones críticas. **NO se implementa control de permisos por endpoint en MVP** (ver PDR §2.7) — la diferenciación es UI-only.
- **Escalabilidad:** Backend modular (NestJS) con Prisma ORM; separación por módulos (productos, pedidos, inventario, notificaciones, reportes). Frontend modular con Next.js, Zustand, MUI.
- **Mantenibilidad:** TypeScript en todo el stack. Reutilizable, modular (funciones, componentes, hooks, estados globales). Fácil de leer y mantener.
- **Localización:** Español; formatos de fecha y moneda locales (Bs).
- **Multiplataforma:** Windows + Linux. Paths con `path.join`. Fechas en UTC + timezone explícito en presentación.
- **Impresión:** Soporte para impresoras térmicas 7cm; **PDF fallback** automático. Generación de PDF para factura mediante `react-to-print` o equivalente.
- **Accesibilidad:** Contraste y tamaño de fuente adecuados para uso en ambientes con iluminación variable.
- **Despliegue V1:** Aplicación web local en Windows 10. **Sin Docker requerido**, pero deseable para portabilidad.
- **Backup (V2):** Backup automático diario de BD + opción de backup manual on-demand para administrador.

---

# 3. Modelo de datos (esquema lógico para la BD)

> Entidades principales y campos mínimos. Diseñado para ORM (**Prisma**) y para que el LLM genere migraciones.

## 3.1 Entidades principales

- **Product**
  - `id: UUID`, `name: string`, `basePrice: decimal`, `category: string`, `active: boolean`, `description: string`

- **Variant**
  - `id: UUID`, `productId: UUID`, `name: string`, `components: JSON`, `isDefault: boolean`
  - *Nota: NO se incluye campo de ajuste de precio. Por regla del negocio (PDR §2.1) las variantes y sustituciones no modifican el precio del producto. Si en V2 alguna variante necesita ajustar el precio base, se introducirá el campo con el nombre `priceAdjustment`.*

- **Component** *(opcional)*
  - `id: UUID`, `name: string`, `type: enum(presa, acompanamiento, bebida, extra)`, `unitPrice: decimal`

- **Order**
  - `id: UUID`, `type: enum(MESA, LLEVAR)` *(CUSTOM no es un tipo — es propiedad de la orden vía `isCustom`; ver PDR §2.8 / §2.10)*
  - `tableNumber: string?`, `customerName: string?`
  - `status: enum(created, confirmed, preparing, ready, delivered, closed, pendingPayment, cancelled, onHold)`
  - `paymentStatus: enum(pending, paid, partial)`, `paymentMethod: enum(cash, card, vale)?`
  - `total: decimal`, `discountAmount: decimal?`
  - `internalDiscount: boolean` *(PDR §2.11 — descuento al personal por sobrante de pollo cocido)*
  - `isCustom: boolean` *(PDR §2.10 — true si la orden se creó vía endpoint custom; default false)*
  - `cancelReason: string?`, `cancelDetails: string?`
  - `createdBy: userId`, `createdAt: datetime`, `paidAt: datetime?`, `cancelledAt: datetime?`
  - `readyAt: datetime?` *(timestamp de transición a `ready`; reemplaza una eventual entidad `NotificationLog`)*
  - `deliveredAt: datetime?`, `deliveredBy: userId?`
  - `shiftId: UUID`

- **OrderItem**
  - `id: UUID`, `orderId: UUID`, `productId: UUID?` *(null si custom)*, `variantId: UUID?`
  - `quantity: int`, `unitPrice: decimal`, `totalPrice: decimal`
  - `notes: string?`, `substitutions: JSON?`
  - `customPieces: JSON?` *(ej. `[{type:"pecho",qty:2},{type:"ala",qty:1}]` — composición libre de presas para ítems de órdenes custom; ver PDR §2.10)*

- **InventoryItem** *(inventario transaccional — para presas representa el plano COCIDO del expositor; ver PDR §2.3)*
  - `id: UUID`, `sku: string`, `name: string`
  - `unit: enum(presa, bolsa, unidad)`, `type: enum(pecho, ala, pierna, entrepierna, bebida, insumo)`
  - `currentStock: int`, `unitMeasure: string`
  - *Nota: el ciclo CRUDO de presas (reproceso, procesado, sobrante crudo) se modela aparte en `ShiftChickenLog`. `InventoryItem` con `type ∈ {pecho, ala, pierna, entrepierna}` representa siempre el inventario cocido vendible.*

- **InventoryBatch** *(opcional)*
  - `id: UUID`, `inventoryItemId: UUID`, `batchCode: string`, `processedAt: datetime`, `quantityReceived: int`, `quantityRemaining: int`, `origin: string`

- **InventoryTransaction**
  - `id: UUID`, `inventoryItemId: UUID`, `delta: int`
  - `reason: enum(sale, adjustment, reception, vale, internalDiscount, manualConsumption)`
  - `referenceId: UUID?`, `userId: UUID`, `note: string?`, `timestamp: datetime`

- **DailyManualConsumption** *(consumos anotados por turno — bolsas de papa, smile, vasos, etc.)*
  - `id: UUID`, `shiftId: UUID`, `inventoryItemId: UUID`, `quantity: int`, `recordedBy: userId`, `recordedAt: datetime`

- **ShiftChickenLog** *(ciclo CRUDO de presas anotado por el cocinero al cierre de turno — PDR §2.3 / FR-017)*
  - `id: UUID`, `shiftId: UUID`, `pieceType: enum(pecho, ala, pierna, entrepierna)`
  - `reprocessRaw: int` *(pollo crudo sobrante del turno anterior — autopoblado con `rawLeftover` del último `ShiftChickenLog` cerrado para el mismo `pieceType`; editable por el cocinero antes de confirmar)*
  - `processedRaw: int` *(pollo fresco marinado en este turno)*
  - `rawLeftover: int` *(sobrante procesado crudo al cierre — se convierte en el `reprocessRaw` del turno siguiente)*
  - `cookedLeftover: int` *(sobrante cocido en expositor al cierre — habilita venta con descuento al personal §2.11)*
  - `recordedBy: userId`, `recordedAt: datetime`, `closedAt: datetime?`
  - *Cantidad cocinada en el turno (derivada, NO se almacena): `reprocessRaw + processedRaw − rawLeftover`*
  - *Constraint: `UNIQUE(shiftId, pieceType)` — un log por turno por tipo de presa*

- **Voucher (Vale)**
  - `id: UUID`, `code: string`
  - `workerId: UUID?` *(o `workerName: string` si el trabajador no es usuario del sistema)*
  - `productId: UUID?`, `productName: string`, `amount: decimal`
  - `issuedBy: userId`, `issuedAt: datetime`, `shiftId: UUID`
  - `status: enum(issued, redeemed, cancelled)`, `note: string?`

- **User**
  - `id: UUID`, `name: string`, `role: enum(ADMIN, CASHIER, DISPATCHER, COOK)`
  - `username: string`, `passwordHash: string`, `active: boolean`

- **Shift / CashRegister**
  - `id: UUID`, `cashierId: UUID`, `cashRegisterId: UUID?`
  - `startAt: datetime`, `endAt: datetime?`
  - `openingAmount: decimal`, `closingAmount: decimal?`, `expectedAmount: decimal?`, `discrepancy: decimal?`

- **Expense**
  - `id: UUID`, `description: string`, `amount: decimal`, `paidBy: enum(cash, register)`, `shiftId: UUID`, `createdBy: userId`, `createdAt: datetime`

- **AuditLog**
  - `id: UUID`, `entity: string`, `entityId: UUID`, `action: string`, `userId: UUID`, `timestamp: datetime`, `details: JSON?`

## 3.2 Relaciones clave

- `Product` 1..* `Variant`
- `Order` 1..* `OrderItem`
- `OrderItem` → `Product` / `Variant` (ambos opcionales si pertenece a una orden custom — `Order.isCustom = true` con item poblando `customPieces`)
- `InventoryTransaction` referencia `Order`, `Voucher` o `Expense` por `referenceId`
- `Shift` vincula `CashRegister`, `User` (cajera), `Expense`, `Voucher`, `Order`, `DailyManualConsumption`, `ShiftChickenLog`

---

# 4. Máquina de estados de pedidos (transaccional)

**Estados:**
`created → confirmed → preparing → ready → delivered → closed`
Estados adicionales: `pendingPayment`, `cancelled`, `onHold`.

## 4.1 Transiciones y efectos

- **created → confirmed (con pago)**
  - Acción: cajera confirma pedido con pago inmediato.
  - Efecto: `paymentStatus = paid` → **decremento atómico de inventario** → contabiliza ingreso → genera comanda digital → (opcional) imprime factura si cliente la pide.

- **created → pendingPayment**
  - Acción: cajera registra pedido LLEVAR/delivery sin pago aún.
  - Efecto: `paymentStatus = pending`. **NO decrementa inventario, NO contabiliza ingreso**. Se genera comanda digital y el pedido pasa directamente a preparación. La cancelación, si ocurre, es siempre manual y la realiza la cajera (PDR §2.5).

- **confirmed → preparing / pendingPayment → preparing**
  - Acción: comanda digital aparece automáticamente en panel de despacho.
  - Efecto: ningún cambio en inventario (ya se hizo en confirmed con pago, o aún no se hace si es pendingPayment).

- **pendingPayment → confirmed**
  - Acción: delivery / cliente paga.
  - Efecto: `paymentStatus = paid`, `paidAt = now`. **Decremento atómico de inventario**. Contabiliza ingreso.

- **pendingPayment → cancelled (manual — única forma)**
  - Acción: cajera cancela manualmente. **No existe auto-cancelación por timeout** (PDR §2.5).
  - Efecto: `cancelledAt = now`, `cancelReason = "manual"`. Sin requerir motivo detallado. Inventario no se tocó, ingreso no se contabilizó.

- **preparing → ready**
  - Acción: despachadora marca listo.
  - Efecto: `Order.readyAt = now`. El pedido aparece en la pantalla pública mostrando **únicamente el número de pedido** (aplica tanto a MESA como a LLEVAR) y suena alerta breve.

- **ready → delivered**
  - Acción: cliente recoge / delivery retira / despachadora entrega en mesa; despachadora marca entregado.
  - Efecto: `Order.deliveredAt = now`, `Order.deliveredBy = userId` registrados.

- **delivered → closed**
  - Acción: cierre administrativo (típicamente al cierre de turno).

- **(cualquier estado pagado) → cancelled (anulación)**
  - Acción: admin / cajera anula un pedido ya pagado.
  - Efecto requerido: `cancelReason` y `cancelDetails` obligatorios. **Reversión de inventario** (restituir presas y bebidas). Se registra en arqueo bajo `anulaciones` con monto. `AuditLog` obligatorio.

## 4.2 Reglas transaccionales

- El decremento de inventario y la marca de pago deben ocurrir en una **transacción atómica**. Si falla inventario (stock insuficiente), la orden permanece en su estado anterior y se notifica a la cajera con detalle del faltante.
- **No existe job de auto-cancelación**: los pedidos `pendingPayment` solo transitan a `cancelled` por acción manual de la cajera o a `paid` al confirmar el pago.

---

# 5. Contratos de la API

## 5.1 Endpoints principales

- `POST /api/v1/products` — crear producto
- `GET /api/v1/products` — listar productos
- `POST /api/v1/variants` — crear variante
- `POST /api/v1/orders` — crear orden estándar (MESA / LLEVAR). Solo acepta items con `productId`/`variantId` (sin `customPieces`). Setea `Order.isCustom = false`.
- `POST /api/v1/orders/custom` — crear orden custom (MESA / LLEVAR) con presas surtidas. Items llevan `customPieces` y precio unitario libre. Setea `Order.isCustom = true`. Endpoint **separado** para mantener DTOs y validaciones limpias por flujo (PDR §2.10).
- `GET /api/v1/orders/{id}` — obtener orden
- `GET /api/v1/orders/{id}/public` — vista pública de la comanda del cliente
- `PATCH /api/v1/orders/{id}/status` — cambiar estado
- `POST /api/v1/orders/{id}/pay` — confirmar pago (transita `pendingPayment` → `paid`)
- `POST /api/v1/orders/{id}/cancel` — anular pedido pagado (requiere `reason` + `details`)
- `POST /api/v1/inventory/adjust` — ajustar inventario (admin, con motivo)
- `POST /api/v1/inventory/manual-consumption` — registrar consumos manuales por turno
- `GET /api/v1/inventory/shift-chicken-log/{shiftId}` — obtener el `ShiftChickenLog` del turno (al abrir, viene precargado con `reprocessRaw` = `rawLeftover` del último turno cerrado por `pieceType`)
- `POST /api/v1/inventory/shift-chicken-log` — registrar/actualizar el ciclo crudo del turno (reproceso, procesado, sobrante crudo, sobrante cocido en expositor) por tipo de presa
- `POST /api/v1/inventory/shift-chicken-log/{shiftId}/close` — cerrar el ShiftChickenLog del turno; dispara la reconciliación contra ventas y registra discrepancias
- `POST /api/v1/shifts/open` — abrir caja/turno
- `POST /api/v1/shifts/close` — cerrar caja/turno (arqueo con anulaciones, vales, métodos)
- `POST /api/v1/vouchers` — crear vale
- `GET /api/v1/vouchers` — listar vales con filtros
- `GET /api/v1/reports/sales` — reporte ventas
- `GET /api/v1/reports/inventory-presas` — reporte inventario presas
- `POST /api/v1/print/invoice` — imprimir factura térmica (a demanda)
- `GET /api/v1/print/invoice/{orderId}/pdf` — descargar PDF factura (fallback)

## 5.2 Seguridad

- `Authorization: Bearer <token>` (JWT) en endpoints.
- **Sin enforcement por rol en MVP** (PDR §2.7): todos los usuarios autenticados pueden llamar todos los endpoints; la diferenciación es a nivel UI.
- Passwords hasheados con **bcryptjs**.

## 5.3 Estructura de respuesta estándar

**Éxito:**
```json
{
  "isSuccess": true,
  "message": "Operacion exitosa",
  "data": {}
}
```

**Error:**
```json
{
  "isSuccess": false,
  "message": "Error de validacion",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "items[0].quantity",
        "message": "Debe ser mayor a 0"
      }
    ]
  }
}
```

## 5.4 Reglas del contrato

- Frontend valida flujo con `isSuccess`.
- `error` será singular.
- `details` será array.
- `code` será string estable: `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `INSUFFICIENT_STOCK`, `PAYMENT_TIMEOUT`, etc.
- En NestJS se implementará con `ValidationPipe` + excepciones HTTP + `ExceptionFilter` global para mantener este contrato en todos los endpoints.

---

# 6. JSON payloads de ejemplo

## 6.1 ProductCreateResponse (éxito)
```json
{
  "isSuccess": true,
  "message": "Producto creado correctamente",
  "data": {
    "id": "uuid-product-porcion-media",
    "name": "Porción Media",
    "basePrice": 30.00,
    "category": "Plato principal",
    "description": "2 presas + porción mixto",
    "active": true
  }
}
```

## 6.2 VariantCreateResponse (éxito)
```json
{
  "isSuccess": true,
  "message": "Variante creada correctamente",
  "data": {
    "id": "uuid-variant-porcion-media-mixto",
    "productId": "uuid-product-porcion-media",
    "name": "Porción Media - Mixto",
    "components": [
      {"type":"presa","count":2},
      {"type":"acompanamiento","name":"mixto","count":1}
    ],
    "isDefault": true
  }
}
```

## 6.3 OrderCreateResponse (mesa, pagado, con sustitución)
```json
{
  "isSuccess": true,
  "message": "Pedido creado y pagado correctamente",
  "data": {
    "id": "uuid-order-001",
    "type": "MESA",
    "tableNumber": "70",
    "customerName": "GOMEZ",
    "status": "preparing",
    "paymentStatus": "paid",
    "paymentMethod": "cash",
    "items": [
      {
        "productId": "uuid-product-wonder",
        "variantId": "uuid-variant-wonder",
        "quantity": 2,
        "unitPrice": 36.00,
        "totalPrice": 72.00,
        "substitutions": [
          {"from":"mixto","to":"arroz"}
        ],
        "selectedPieces": [
          {"type":"pecho","qty":2},
          {"type":"ala","qty":2}
        ]
      },
      {
        "productId": "uuid-product-fanta",
        "quantity": 1,
        "unitPrice": 8.00,
        "totalPrice": 8.00
      }
    ],
    "total": 80.00,
    "createdBy": "user-roxana",
    "paidAt": "2026-05-01T22:10:00"
  }
}
```

## 6.4 OrderCreateResponse (llevar, pendingPayment)
```json
{
  "isSuccess": true,
  "message": "Pedido creado en estado pendiente de pago",
  "data": {
    "id": "uuid-order-002",
    "type": "LLEVAR",
    "customerName": "MARCO ORTEGA",
    "status": "preparing",
    "paymentStatus": "pending",
    "items": [
      {
        "productId": "uuid-product-porcion-media",
        "quantity": 3,
        "unitPrice": 30.00,
        "totalPrice": 90.00,
        "selectedPieces": [
          {"type":"pecho","qty":1},{"type":"ala","qty":1},
          {"type":"pierna","qty":2},{"type":"entrepierna","qty":2}
        ]
      }
    ],
    "total": 90.00,
    "createdBy": "user-roxana"
  }
}
```

## 6.5 CustomOrderCreateResponse (orden LLEVAR custom — presas surtidas, vía `POST /api/v1/orders/custom`)
```json
{
  "isSuccess": true,
  "message": "Pedido custom creado correctamente",
  "data": {
    "id": "uuid-order-003",
    "type": "LLEVAR",
    "isCustom": true,
    "customerName": "JUAN PEREZ",
    "status": "preparing",
    "paymentStatus": "paid",
    "items": [
      {
        "customPieces": [
          {"type":"pecho","qty":2},
          {"type":"ala","qty":1}
        ],
        "extras": [
          {"name":"papa","qty":1}
        ],
        "drinks": [
          {"productId":"uuid-coca-500","qty":1}
        ],
        "quantity": 1,
        "unitPrice": 35.00,
        "totalPrice": 35.00
      }
    ],
    "total": 35.00,
    "createdBy": "user-roxana",
    "paidAt": "2026-05-01T13:20:00"
  }
}
```

## 6.6 InternalDiscountOrderResponse (descuento personal)
```json
{
  "isSuccess": true,
  "message": "Venta con descuento personal registrada",
  "data": {
    "id": "uuid-order-004",
    "type": "MESA",
    "status": "preparing",
    "paymentStatus": "paid",
    "internalDiscount": true,
    "discountAmount": 7.00,
    "items": [
      {
        "productId": "uuid-product-porcion-media",
        "quantity": 1,
        "unitPrice": 23.00,
        "totalPrice": 23.00,
        "selectedPieces": [
          {"type":"pierna","qty":1},
          {"type":"entrepierna","qty":1}
        ]
      }
    ],
    "total": 23.00,
    "createdBy": "user-roxana"
  }
}
```

## 6.7 VoucherCreateResponse
```json
{
  "isSuccess": true,
  "message": "Vale registrado correctamente",
  "data": {
    "id": "uuid-voucher-001",
    "code": "V-20260501-001",
    "workerName": "MARIA LOPEZ",
    "productName": "Porción Media",
    "amount": 30.00,
    "issuedBy": "user-roxana",
    "issuedAt": "2026-05-01T14:30:00",
    "shiftId": "uuid-shift-001",
    "status": "issued"
  }
}
```

## 6.8 InventoryAdjustResponse (éxito)
```json
{
  "isSuccess": true,
  "message": "Ajuste de inventario registrado correctamente",
  "data": {
    "id": "uuid-invtx-001",
    "inventoryItemId": "uuid-inv-pecho",
    "delta": -2,
    "reason": "sale",
    "referenceId": "uuid-order-123",
    "userId": "user-roxana"
  }
}
```

## 6.9 ManualConsumptionResponse (cierre turno cocina)
```json
{
  "isSuccess": true,
  "message": "Consumos manuales registrados",
  "data": {
    "shiftId": "uuid-shift-001",
    "entries": [
      {"inventoryItemId":"uuid-bolsa-papa","quantity":3},
      {"inventoryItemId":"uuid-bolsa-smile","quantity":1},
      {"inventoryItemId":"uuid-envase-arroz","quantity":45}
    ]
  }
}
```

## 6.10 CashOpenResponse (éxito)
```json
{
  "isSuccess": true,
  "message": "Caja abierta correctamente",
  "data": {
    "id": "uuid-shift-001",
    "cashierId": "user-admin",
    "openingAmount": 200.00,
    "startAt": "2026-05-01T09:00:00"
  }
}
```

## 6.11 CancelOrderResponse (anulación de pedido pagado)
```json
{
  "isSuccess": true,
  "message": "Pedido anulado correctamente",
  "data": {
    "id": "uuid-order-001",
    "status": "cancelled",
    "cancelReason": "Cliente cambió de opinión",
    "cancelDetails": "Se devolvió el dinero en efectivo. Sin factura emitida.",
    "cancelledAt": "2026-05-01T22:30:00",
    "inventoryReverted": true
  }
}
```

---

# 7. OpenAPI skeleton (recomendación)

El LLM debe generar `openapi: 3.0.3` con:
- `securitySchemes` JWT Bearer
- `paths` para todos los endpoints listados en §5.1
- `tags` para agrupar requests (Products, Orders, Inventory, Shifts, Vouchers, Reports, Print)
- `components/schemas` con los DTOs de request y response
- Ejemplos de request/response basados en los payloads de §6

---

# 8. Test cases E2E (casos prioritarios)

1. Crear producto + variante → aparece en POS.
2. Registrar venta MESA con sustitución → precio NO cambia; inventario decrementa al confirmar pago.
3. Registrar venta LLEVAR `pendingPayment` → comanda se prepara; inventario NO decrementa hasta confirmar pago.
4. Pedido `pendingPayment` cancelado manualmente por la cajera → inventario nunca tocado, ingreso nunca contabilizado, no requiere motivo. (No existe auto-cancelación por tiempo.)
5. Crear orden custom LLEVAR vía `POST /api/v1/orders/custom` (item con `customPieces`: 2 pechos + 1 ala) → al pagar, decrementa exactamente 2 pechos y 1 ala. La orden queda con `type = LLEVAR` y `isCustom = true` (no existe `type = CUSTOM`).
6. Abrir caja → registrar ventas (incl. vale, anulación, descuento personal) → cerrar caja → arqueo correcto con desglose por método y vales.
7. Emitir vale → aparece en arqueo y en listado de vales; decrementa inventario.
8. Pedido `preparing` → comanda digital aparece en panel despacho → marcar `ready` → pantalla pública muestra → marcar `delivered`.
9. Cliente accede a URL pública de su pedido → ve su comanda; intenta acceder a otro orderId → no autorizado.
10. Cliente pide factura → impresora térmica imprime; impresora desconectada → PDF se descarga.
11. Anular pedido pagado → motivo y detalles obligatorios → inventario revertido → aparece en arqueo.
12. Reconciliación diaria: comparar `InventoryTransaction` vs `InventoryItem.currentStock`.
13. Venta con `internalDiscount` (Porción Media a 23 Bs) → registro correcto, inventario y caja cuadran.
14. Cocinero registra consumos manuales al cierre → se vinculan al `Shift` y aparecen en reporte diario.
14b. Ciclo crudo de presas — continuidad entre turnos: al cierre del turno mañana, cocinero registra `ShiftChickenLog` con `rawLeftover = 64` para cada `pieceType`. Al abrir el turno noche, `GET /api/v1/inventory/shift-chicken-log/{shiftIdNoche}` devuelve `reprocessRaw = 64` autopoblado por `pieceType`. Cocinero confirma o ajusta. Al cerrar el turno noche, el sistema reconcilia `(reprocessRaw + processedRaw − rawLeftover) − vendido_cocido_del_turno` vs `cookedLeftover` anotado y reporta discrepancia si existe.
15. Usuario logueado como CASHIER intenta logear como DISPATCHER en mismo turno → falla.

---

# 9. Despliegue, backups y sincronización

- **Modo inicial (V1):** Servidor local (Windows 10) ejecutando aplicación web; **PostgreSQL local**. Código multiplataforma (también funciona en Linux).
- **Distribución (V1):** Aplicación web local. **Docker Compose opcional** para portabilidad pero no requerido.
- **Sincronización (V2):** Operación local en V1; sincronización a nube en **V2** (fase posterior).
- **Backups (V2):** Copia diaria automática de BD + opción de backup manual disponible para administrador.
- **Conflictos de sincronización (V2):** Priorizar cambios locales recientes; registrar conflictos para resolución manual.

---

# 10. Mapeo Negocio → Técnica

Tabla de referencia rápida entre los conceptos del PDR y su contraparte técnica en este documento.

| Concepto de negocio (PDR) | Contraparte técnica |
|---------------------------|---------------------|
| Venta custom de presas surtidas (§2.10) | Endpoint `POST /api/v1/orders/custom`; flag `Order.isCustom = true`; ítem con `customPieces: JSON` |
| Tipo de pedido (MESA / LLEVAR) (§2.8) | `Order.type: enum(MESA, LLEVAR)` — CUSTOM **no** es un valor de `type` |
| Sustitución de acompañamiento sin afectar precio (§2.1) | `OrderItem.substitutions: JSON` con `{from, to}`; sin campo de ajuste de precio |
| Descuento al personal por sobrante de pollo cocido (§2.11) | `Order.internalDiscount: boolean = true`; `Order.discountAmount` con la diferencia |
| Pedido con pago pendiente (§2.5) | `Order.status = pendingPayment` + `paymentStatus = pending`; cancelación solo manual |
| Confirmación de pago | Endpoint `POST /api/v1/orders/{id}/pay`; transición a `paid` + decremento atómico de inventario |
| Anulación de pedido pagado (FR-011b) | Endpoint `POST /api/v1/orders/{id}/cancel` con `reason` + `details`; reversión de `InventoryTransaction` |
| Notificación de pedido listo (§2.8 / FR-007) | `Order.readyAt` registrado; pantalla pública lee órdenes con `status = ready` |
| Entrega del pedido | `Order.deliveredAt` + `Order.deliveredBy` |
| Inventario por presas (§2.3) | `InventoryItem.type ∈ {pecho, ala, pierna, entrepierna}`; decremento vía `InventoryTransaction` con `reason = sale` |
| Consumos manuales por turno (FR-017) | `DailyManualConsumption` ligado a `Shift` |
| Ciclo crudo de presas por turno — plano crudo (§2.3, FR-017) | `ShiftChickenLog` ligado a `Shift`; campos `reprocessRaw`, `processedRaw`, `rawLeftover`, `cookedLeftover` por `pieceType`; regla de continuidad entre turnos: `rawLeftover(T) → reprocessRaw(T+1)` vía autopoblado en `GET /shift-chicken-log/{shiftId}` |
| Vales (§2.4) | Entidad `Voucher`; `InventoryTransaction.reason = vale`; NO suma al ingreso de `Shift` |
| Apertura/cierre de caja por turno (§2.6) | Entidad `Shift` con `openingAmount`, `closingAmount`, `expectedAmount`, `discrepancy` |
| Caja = 1 cajera por turno (§2.7) | `Shift.cashierId` único activo por `cashRegisterId` |
| Sesión única por turno (FR-008b) | Constraint a nivel servicio: 1 sesión activa por `userId` por `shiftId` |
| Roles funcionales (§2.7) | `User.role: enum(ADMIN, CASHIER, DISPATCHER, COOK)` — sin enforcement backend en MVP |
| Auditoría de acciones críticas (§2.9) | Entidad `AuditLog` con `userId`, `entity`, `entityId`, `action`, `details: JSON` |
| Visión V2: precio sugerido en venta custom (§2.10) | `InventoryItem.unitPrice` (V2); cálculo `sum(customPieces[].qty × unitPrice)` |

---

## Notas finales

- Este documento se mantiene sincronizado con el PDR. Cuando una regla de negocio cambia, esta guía se actualiza en consecuencia, **nunca al revés**.
- Las **decisiones residuales** (umbral de discrepancia de arqueo, política contable de vales, etc.) están en [PDR §13.3 / §14](PDR.md) — no se duplican aquí.
- Las **decisiones de scope V1 vs V2** están en [PDR §13](PDR.md) — este documento solo refleja **detalles técnicos** de cada decisión.
