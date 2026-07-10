# Modelo de datos y Endpoints — Referencia rápida

**Sistema Informático de Ventas — Wonder Chicken**

> **Qué es este documento:** el **cheat-sheet de endpoints** — los requests mínimos que envía el frontend (con sus notas de diseño §5.0) y respuestas resumidas. Para entidades y campos, la fuente es [`prisma/schema.prisma`](../prisma/schema.prisma); el ER se genera desde ahí (ver §1).
>
> **No es fuente de verdad.** Es una **derivación** de [`technical_guide.md` §3](technical_guide.md#3-modelo-de-datos-esquema-lógico-para-la-bd) (modelo) y [`technical_guide.md` §6](technical_guide.md#6-json-payloads-de-ejemplo) (payloads completos). Ante cualquier conflicto, **gana `technical_guide.md`**.
>
> Todas las respuestas siguen el **contrato estándar** `{ isSuccess, message, data }` ([§5.3](technical_guide.md#53-estructura-de-respuesta-estándar)). Todos los endpoints exigen `Authorization: Bearer <token>` salvo los marcados **público**.

---

## Índice

- [1. Diagrama entidad-relación (generado desde el schema)](#1-diagrama-entidad-relación-generado-desde-el-schema)
- [2. Resumen de entidades](#2-resumen-de-entidades)
- [3. Endpoints importantes (request / response)](#3-endpoints-importantes-request--response)
  - [3.1 Autenticación](#31-autenticación)
  - [3.2 Órdenes](#32-órdenes)
  - [3.3 Inventario](#33-inventario)
  - [3.4 Caja y turno](#34-caja-y-turno)
  - [3.5 Vales](#35-vales)
  - [3.6 Descuentos](#36-descuentos)
  - [3.7 Gastos](#37-gastos)
  - [3.8 Auditoría](#38-auditoría)

---

## 1. Diagrama entidad-relación (generado desde el schema)

> **El diagrama ER no se dibuja a mano acá** — el modelo cambia seguido y un diagrama estático queda desactualizado en silencio (ya pasó). La **fuente de verdad de entidades y campos** es [`prisma/schema.prisma`](../prisma/schema.prisma); el diagrama se **genera on-demand** desde el schema:
>
> - **Extensión de VS Code:** *Prisma ERD Visualizer* (o similar) — abre el schema y renderiza el ER al instante.
> - **Herramienta externa:** [`prisma-erd-generator`](https://github.com/keonik/prisma-erd-generator) (genera mermaid/SVG desde el schema) o importar el SQL a [dbdiagram.io](https://dbdiagram.io).
>
> Para entender qué es cada entidad, ver el [resumen de entidades (§2)](#2-resumen-de-entidades); para el detalle lógico campo por campo, [`technical_guide.md` §3.1](technical_guide.md#31-entidades-principales).

> **Nota:** `Component` es una entidad **opcional** (`id`, `name`, `type`, `unitPrice`) que el modelo contempla para descomponer platos; no es obligatoria en V1. Detalle en [`technical_guide.md` §3.1](technical_guide.md#31-entidades-principales).

---

## 2. Resumen de entidades

| Entidad | Para qué sirve |
|---|---|
| `User` | Personal del sistema con su rol (ADMIN, CASHIER, DISPATCHER, COOK). |
| `CashRegister` / `Shift` | Caja física y turno de trabajo (apertura/cierre, arqueo). |
| `ShiftPeriod` | Catálogo de períodos del día ("Mañana", "Noche"; ampliable sin migración). El turno lo **declara** al abrir — nunca se infiere del reloj. |
| `Product` / `Variant` | Catálogo de platos y sus variantes (composición). |
| `Order` / `OrderItem` | Pedido y sus ítems (estándar o custom; MESA/LLEVAR). |
| `Customer` | Cliente registrado (CI/NIT, datos personales) para **factura nominada** y la vista de **"pedidos del día"**. Opcional por venta — anónimo = "S/N". |
| `InventoryItem` | Inventario **cocido** transaccional (presas, bebidas, insumos). |
| `InventoryTransaction` | Todo movimiento de stock (venta, ajuste, vale, recepción). |
| `InventoryBatch` | Lotes (opcional). |
| `ShiftChickenLog` | Ciclo **crudo** de presas por turno (§2.3). |
| `DailyManualConsumption` | Consumos manuales por turno (bolsas, vasos, etc.). |
| `Voucher` | Vale de consumo del personal (descuenta nómina, no caja). |
| `Discount` / `DiscountAuthorization` | Catálogo de descuentos (monto fijo **por plato**, aplicado a nivel `OrderItem`) y su autorización por turno (§2.11). |
| `Expense` | Gasto pagado desde caja. |
| `AuditLog` | Rastro inmutable de acciones críticas (§2.9). |

---

## 3. Endpoints importantes (request / response)

> Los request bodies son **ejemplos representativos** de lo que recibirá cada endpoint; los DTOs definitivos se validan con `class-validator`. Lista completa de endpoints y matriz de roles en [`technical_guide.md` §5](technical_guide.md#5-contratos-de-la-api).

### 3.1 Autenticación

**`POST /api/v1/auth/login`** — **público**. Devuelve el JWT que el resto de llamadas envía como `Bearer`.

Request:
```json
{
  "username": "roxana",
  "password": "••••••••"
}
```
Response (200):
```json
{
  "isSuccess": true,
  "message": "Autenticación exitosa",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "uuid-user-roxana", "username": "roxana", "role": "CASHIER" }
  }
}
```
> Sin token o token expirado/inválido en el resto de endpoints → **401**. Rol no autorizado → **403** (`FORBIDDEN`).

### 3.1a Clientes

**`GET /api/v1/customers?search=<ci|nit|nombre>`** — buscar cliente registrado para factura nominada. Rol: `CASHIER`, `ADMIN`.

Response (200):
```json
{
  "isSuccess": true,
  "message": "Clientes encontrados",
  "data": [
    {
      "id": "uuid-customer-001",
      "ci": "8351427",
      "nit": "120558027",
      "firstName": "MARCO",
      "lastName": "ORTEGA GUTIERREZ",
      "sex": "HOMBRE",
      "birthDate": "1990-03-14",
      "phone": "71234567",
      "email": "marco.ortega@example.com",
      "active": true
    }
  ]
}
```

**`POST /api/v1/customers`** — registrar cliente. Rol: `CASHIER`, `ADMIN`. El cliente puede dictar **CI o NIT** para su factura.

Request:
```json
{
  "ci": "8351427",
  "nit": "120558027",
  "firstName": "MARCO",
  "lastName": "ORTEGA GUTIERREZ",
  "sex": "HOMBRE",
  "birthDate": "1990-03-14",
  "phone": "71234567",
  "email": "marco.ortega@example.com"
}
```
Response (201): mismo objeto `Customer` dentro de `data` (con `id` y `active: true`).

**`GET /api/v1/public/orders/{token}`** — **público**: vista de la comanda del cliente por su `publicToken` (no por `id`). Si la orden tiene `customerId`, incluye además sus **otros pedidos del día**. El token habilita el acceso; el NIT **no** es llave. (Ver [`pdr.md` §2.12 / §7.4](pdr.md), FR-015 / FR-019.)

### 3.2 Órdenes

**`POST /api/v1/orders`** — crear orden estándar (MESA/LLEVAR). Rol: `CASHIER`.

Request (datos mínimos — ver [principios §5.0](technical_guide.md#50-principios-de-diseño-de-la-api-el-backend-manda-el-frontend-renderiza)):
```json
{
  "type": "MESA",
  "tableNumber": "70",
  "customerId": "uuid-customer-001",
  "paymentStatus": "paid",
  "paymentMethod": "cash",
  "items": [
    {
      "productId": "uuid-product-wonder",
      "variantId": "uuid-variant-wonder",
      "quantity": 2,
      "discountId": "uuid-discount-compensacion",
      "selectedPieces": [ {"type":"pecho","qty":2}, {"type":"ala","qty":2} ],
      "substitutions": [ {"from":"mixto","to":"arroz"} ]
    },
    { "productId": "uuid-product-fanta", "quantity": 1 },
    { "productId": "uuid-product-papas", "quantity": 2 }
  ]
}
```
> **N ítems libres:** un pedido estándar mezcla **platos + bebidas + extras** en cualquier cantidad (acá: Wonder×2, Fanta×1, Porción de Papas×2). Cada uno es un `Product`; el front solo manda `productId` + `quantity`, el backend pone el precio y suma el total (§2.2 / §5.0).
> **Descuento por plato en la MISMA llamada (§2.11):** el ítem que lleva descuento manda su `discountId` (opcional) — **no existe endpoint separado** para aplicarlo. El backend valida (disponibilidad + autorización del turno), congela `discountAmount` (snapshot por unidad) y deriva `totalPrice` y `total` en la misma transacción. Errores: `DISCOUNT_NOT_AVAILABLE`, `DISCOUNT_NOT_AUTHORIZED`.
> **Mínimos:** `customerId` es **opcional** (omitirlo = venta anónima "S/N"); el backend lee `Customer` y snapshotea `customerName`. NO se envían `createdBy` ni `shiftId` (los deriva del JWT y del turno activo) ni precios ni montos de descuento (los calcula desde `Product`/`Variant`/`Discount`). Para venta nominada, el front ya obtuvo el `customerId` vía `GET /customers`.
Response (resumen — payloads completos en [`technical_guide.md` §6.3](technical_guide.md#63-ordercreateresponse-mesa-pagado-con-sustitución) y, con descuentos por plato, [§6.6](technical_guide.md#66-ordercreatewithdiscountresponse-descuento-al-personal-por-plato-en-la-creación--una-sola-llamada)):
```json
{ "data": { "id": "...", "publicToken": "a3f9c2e8...", "status": "preparing",
            "originalAmount": 104.00,
            "items": [ { "unitPrice": 36.00, "discountAmount": 7.00, "totalPrice": 58.00, "...": "..." } ],
            "total": 90.00, "createdBy": { "id": "...", "name": "Roxana" } } }
```
> **Listo para render (§5.0):** actores como `{ id, name }`, `customerName` resuelto, precios y totales calculados. El descuento quedó congelado en el ítem: `totalPrice = (36 − 7) × 2 = 58`; `total = 104 − 14 = 90`. El frontend solo pinta.

**`POST /api/v1/orders/custom`** — crear orden custom (presas surtidas). Rol: `CASHIER`. La cajera arma las presas y confirma el precio.

Request:
```json
{
  "type": "LLEVAR",
  "customerId": "uuid-customer-002",
  "paymentStatus": "paid",
  "paymentMethod": "cash",
  "items": [
    {
      "customPieces": [ {"type":"pecho","qty":2}, {"type":"ala","qty":1} ],
      "extras": [ {"name":"papa","qty":1} ],
      "drinks": [ {"productId":"uuid-coca-500","qty":1} ],
      "quantity": 1,
      "unitPrice": 35.00
    }
  ]
}
```
> **Excepción de precio (§5.0):** acá el `unitPrice` **sí** lo envía el front porque es el **precio confirmado por la cajera** (§2.10). El **precio sugerido** lo calcula el POS en el cliente con los `piecePrices` de `GET /pos/context`; lo que se persiste es el confirmado. Los ítems custom también aceptan `discountId?` opcional (mismas validaciones que la orden estándar, §2.11). `customerId` opcional; `createdBy`/`shiftId` del token/sesión.
Response: `Order` con `isCustom: true` y el ítem con sus `customPieces` — payload completo en [`technical_guide.md` §6.5](technical_guide.md#65-customordercreateresponse-orden-llevar-custom--presas-surtidas-vía-post-apiv1orderscustom).

**`POST /api/v1/orders/{id}/pay`** — confirmar pago (`pendingPayment` → `paid`). Acá se descuenta inventario. Rol: `CASHIER`.

Request:
```json
{ "paymentMethod": "cash" }
```
Response:
```json
{
  "isSuccess": true,
  "message": "Pago confirmado; inventario descontado",
  "data": {
    "id": "uuid-order-002",
    "status": "preparing",
    "paymentStatus": "paid",
    "paymentMethod": "cash",
    "total": 90.00,
    "paidAt": "2026-05-01T20:50:00"
  }
}
```

**`GET /api/v1/pos/context`** — carga del POS en **una sola llamada liviana** (solo datos activos, listos para pintar). Rol: `CASHIER`.

Response (resumen — payload completo en [`technical_guide.md` §6.12](technical_guide.md#612-poscontextresponse-carga-del-pos-en-una-llamada)):
```json
{
  "isSuccess": true,
  "message": "Contexto POS",
  "data": {
    "shift": { "id": "uuid-shift-001", "orderCount": 27, "startAt": "2026-05-01T09:00:00" },
    "products": [ { "id": "...", "name": "Porción Media", "basePrice": 30.00, "category": "Plato principal", "variants": [ ... ] } ],
    "discounts": [ { "id": "...", "name": "Descuento personal", "fixedAmount": 7.00, "availability": "endOfShift" } ],
    "piecePrices": [ { "type": "pecho", "salePrice": 12.00 }, { "type": "ala", "salePrice": 10.00 } ]
  }
}
```
> `discounts` ya viene **filtrado por el backend** para esta sesión (activos + ventana vigente + autorización si corresponde) — el POS no filtra nada. Con `piecePrices` el precio sugerido custom se calcula **en el cliente**, sin llamadas por cada cambio de selección.

**`POST /api/v1/orders/{id}/cancel`** — anular pedido pagado (revierte inventario). Rol: `CASHIER`. `reason` y `details` obligatorios.

Request:
```json
{
  "reason": "Cliente cambió de opinión",
  "details": "Se devolvió el dinero en efectivo. Sin factura emitida."
}
```
Response: orden `cancelled` con `inventoryReverted: true` — payload completo en [`technical_guide.md` §6.11](technical_guide.md#611-cancelorderresponse-anulación-de-pedido-pagado).

**`PATCH /api/v1/orders/{id}/status`** — despacho marca `ready` / `delivered`. Rol: `DISPATCHER`.

Request:
```json
{ "status": "ready" }
```
Response:
```json
{
  "isSuccess": true,
  "message": "Estado actualizado",
  "data": { "id": "uuid-order-001", "status": "ready", "readyAt": "2026-05-01T22:15:00" }
}
```

### 3.3 Inventario

**`POST /api/v1/inventory/adjust`** — ajuste manual con motivo. Rol: `ADMIN`.

Request:
```json
{
  "inventoryItemId": "uuid-inv-pecho",
  "delta": -2,
  "reason": "adjustment",
  "note": "Merma por presas quebradas"
}
```
Response: la `InventoryTransaction` creada, con `userId` derivado del JWT y resuelto `{ id, name }` (§5.0) — payload completo en [`technical_guide.md` §6.8](technical_guide.md#68-inventoryadjustresponse-éxito).

### 3.4 Caja y turno

**`POST /api/v1/shifts/open`** — abrir caja/turno. Rol: `CASHIER`.

Request:
```json
{ "openingAmount": 200.00, "cashRegisterId": "uuid-caja-1", "periodId": "uuid-period-manana" }
```
> El `periodId` viene del catálogo `ShiftPeriod` (la pantalla lo preselecciona como sugerencia **editable** — quién lo confirma es decisión residual, [PDR §13.3](pdr.md)). El sistema **nunca** lo infiere del reloj.

Response: el `Shift` creado con `cashier`, `cashRegister` y `period` resueltos `{ id, name }` — payload completo en [`technical_guide.md` §6.10](technical_guide.md#610-cashopenresponse-éxito).

**`POST /api/v1/shifts/close`** — cerrar caja/turno con arqueo. Rol: `CASHIER`.

Request:
```json
{ "countedAmount": 1450.00 }
```
Response (ejemplo de arqueo):
```json
{
  "isSuccess": true,
  "message": "Caja cerrada; arqueo generado",
  "data": {
    "id": "uuid-shift-001",
    "openingAmount": 200.00,
    "closingAmount": 1450.00,
    "expectedAmount": 1455.00,
    "discrepancy": -5.00,
    "totals": {
      "sales": 1255.00,
      "byMethod": { "cash": 1100.00, "card": 155.00, "vale": 0.00 },
      "expenses": 30.00,
      "vouchers": 60.00,
      "cancellations": { "count": 1, "amount": 36.00 }
    }
  }
}
```

### 3.5 Vales

**`POST /api/v1/vouchers`** — emitir vale (descuenta inventario, NO suma a caja). Rol: `CASHIER`.

Request (con descuento personal aplicado):
```json
{
  "workerName": "MARIA LOPEZ",
  "productId": "uuid-product-porcion-media",
  "discountId": "uuid-discount-personal"
}
```
> **Mínimos (§5.0):** el `amount` **NO se envía** — el backend toma `originalAmount` de `productId` y, si viene `discountId`, le resta el `fixedAmount` (snapshot). `discountId` es **opcional** (sin él, el vale vale el precio pleno). `issuedBy` y `shiftId` salen del JWT y del turno activo; el `code` lo genera el backend.

Response: el vale con `originalAmount` (30), `discountAmount` (7, snapshot) y `amount` (23) derivados — payload completo en [`technical_guide.md` §6.7](technical_guide.md#67-vouchercreateresponse).

### 3.6 Descuentos

**`POST /api/v1/discounts`** — crear descuento en el catálogo. Rol: `ADMIN`.

Request:
```json
{
  "name": "Compensación al cliente",
  "fixedAmount": 7.00,
  "availability": "always",
  "requiresAuthorization": true,
  "active": true
}
```
Response: el `Discount` creado (mismos campos + `id`) — payload completo en [`technical_guide.md` §6.6b](technical_guide.md#66b-discountcreateresponse-catálogo--admin).

**`POST /api/v1/discounts/{id}/authorize`** — el admin autoriza a la sesión de cajera del turno. Rol: `ADMIN`. Deja `AuditLog`.

Request:
```json
{ "cashierId": "uuid-user-roxana" }
```
> **Mínimos (§5.0):** solo `cashierId` (a qué cajera se habilita). El `shiftId` lo deriva el backend del **turno activo de esa cajera**; `authorizedBy` sale del JWT del admin.

Response: la `DiscountAuthorization` creada con cajera y admin resueltos `{ id, name }` — payload completo en [`technical_guide.md` §6.6c](technical_guide.md#66c-discountauthorizationresponse-admin-autoriza-a-la-sesión-de-cajera-por-turno).

### 3.7 Gastos

**`POST /api/v1/expenses`** — registrar gasto pagado desde caja (FR-009). Rol: `CASHIER`.

Request:
```json
{ "description": "Compra de arroz", "amount": 35.50, "paidBy": "cash" }
```
> **Mínimos (§5.0):** `createdBy` sale del JWT y `shiftId` del **turno activo** de la cajera (no se envían). Sin turno abierto → error claro. El gasto aparece en el arqueo (`totals.expenses`) y en reportes; no genera `AuditLog`.

Response: el `Expense` creado ligado al turno activo — payload completo en [`technical_guide.md` §6.13](technical_guide.md#613-expensecreateresponse-gasto-desde-caja--fr-009).

### 3.8 Auditoría

**`POST /api/v1/audit-logs/shift`** — logs de **UN turno** (fecha + período + caja opcional). Rol: `ADMIN`. **Sin paginación** (~50-80 filas por turno). Resolución por **FK directa**: `Shift` por fecha + `periodId` (+ `cashRegisterId` si se envía) → `AuditLog WHERE shiftId IN (...)` — el log nace sabiendo su turno, cero ventanas horarias.

Request (`cashRegisterId` opcional — omitido = todas las cajas de ese período):
```json
{ "date": "2026-07-07", "periodId": "uuid-period-noche", "cashRegisterId": "uuid-caja-1" }
```
Response (resumen — payload completo en [`technical_guide.md` §6.14](technical_guide.md#614-auditlogsbyshiftresponse-consulta-del-rastro-por-turno--admin)):
```json
{
  "isSuccess": true,
  "message": "Registros de auditoría del turno",
  "data": {
    "date": "2026-07-07",
    "period": { "id": "uuid-period-noche", "name": "Noche" },
    "shifts": [
      { "id": "uuid-shift-002",
        "cashRegister": { "id": "uuid-caja-1", "name": "Caja 1" },
        "cashier": { "id": "uuid-user-roxana", "name": "Roxana" } }
    ],
    "count": 42,
    "rows": [
      {
        "id": "uuid-audit-002",
        "entity": "Order",
        "entityId": "uuid-order-004",
        "action": "CREATE_SALE",
        "user": { "id": "uuid-user-roxana", "name": "Roxana" },
        "timestamp": "2026-07-07T21:42:00",
        "details": { "total": 69.00, "paymentMethod": "cash" }
      }
    ]
  }
}
```

**`POST /api/v1/audit-logs/month`** — logs de un **mes calendario completo**. Rol: `ADMIN`. Sin paginación (~3-4 mil filas/mes). Misma forma de fila; incluye también los logs con `shiftId = null` (acciones de admin fuera de turno), que no aparecen en `/shift`.

Request:
```json
{ "month": "2026-07" }
```
> Día sin turnos → `shifts: []`, `rows: []` (no es error). Un **año** completo no va por acá: es un export CSV de reportes (V2). Ambos endpoints son solo lectura — la tabla es append-only y la consulta en sí no se audita.

---

> **Para profundizar:** modelo completo en [`technical_guide.md` §3](technical_guide.md#3-modelo-de-datos-esquema-lógico-para-la-bd), todos los endpoints + matriz de roles en [`technical_guide.md` §5](technical_guide.md#5-contratos-de-la-api), payloads completos en [`technical_guide.md` §6](technical_guide.md#6-json-payloads-de-ejemplo). Las reglas de negocio mandan: [`pdr.md` §2](pdr.md).
