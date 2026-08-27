# Technical Guide — Wonder Chicken
**Sistema Informático de Ventas — Documento Técnico de Implementación**
**Complementa:** [../business/pdr.md](../business/pdr.md)
**Material de origen:** [../business/business_context.md](../business/business_context.md) (evidencia del trabajo de titulación que alimenta el PDR — citas, menú, inventario, tickets reales)
**Audiencia:** LLM generador de código y equipo de desarrollo backend/frontend
**Versión:** 1.8 (cierra los huecos de contrato detectados al preparar la guía de implementación: listado de órdenes, pantalla pública, dashboard de stock, reporte de arqueo + CSV, CRUD de usuarios, logout, cierre administrativo de órdenes y estados reservados sin uso en V1)
**Fecha:** 2026-07-10

> Este documento es la **traducción técnica** de las reglas de negocio definidas en el PDR. Contiene modelo de datos, contrato de la API, requerimientos no funcionales técnicos, máquina de estados con detalles transaccionales, payloads, OpenAPI skeleton, casos de prueba E2E y despliegue.
>
> **Precedencia:** Si una decisión técnica de este documento entra en conflicto con una regla de negocio del PDR, **la regla de negocio del PDR gana**. Este documento se actualiza para reflejar el negocio, no al revés.
>
> **Altitud de este documento:** el modelo de datos de §3 es el **modelo lógico completo** — todos los campos, snapshots y enums. Es el **contrato del dato**. Los diagramas ER no se dibujan a mano: se **generan** desde [`prisma/schema.prisma`](../prisma/schema.prisma) (ver [§3.3](#33-diagrama-de-relaciones-er)).

---

## Índice

- [1. Stack tecnológico (obligatorio)](#1-stack-tecnológico-obligatorio)
- [2. Requerimientos no funcionales (NFR)](#2-requerimientos-no-funcionales-nfr)
- [3. Modelo de datos (esquema lógico para la BD)](#3-modelo-de-datos-esquema-lógico-para-la-bd)
  - [3.1 Entidades principales](#31-entidades-principales)
  - [3.2 Relaciones clave](#32-relaciones-clave)
  - [3.3 Diagrama de relaciones (ER)](#33-diagrama-de-relaciones-er)
- [4. Máquina de estados de pedidos (transaccional)](#4-máquina-de-estados-de-pedidos-transaccional)
  - [4.1 Transiciones y efectos](#41-transiciones-y-efectos)
  - [4.2 Reglas transaccionales](#42-reglas-transaccionales)
  - [4.3 Auditoría — implementación (V1)](#43-auditoría--implementación-v1)
- [5. Contratos de la API](#5-contratos-de-la-api)
  - [5.1 Endpoints principales](#51-endpoints-principales)
  - [5.2 Autenticación y autorización](#52-autenticación-y-autorización)
  - [5.3 Estructura de respuesta estándar](#53-estructura-de-respuesta-estándar)
  - [5.4 Reglas del contrato](#54-reglas-del-contrato)
- [6. JSON payloads de ejemplo (request/response por endpoint)](#6-json-payloads-de-ejemplo-requestresponse-por-endpoint)
  - [6.0 AuthLoginResponse](#60-authloginresponse)
  - [6.1 ProductCreateResponse](#61-productcreateresponse-éxito)
  - [6.2 VariantCreateResponse](#62-variantcreateresponse-éxito) · [6.2a Customer create/search](#62a-customercreateresponse--customersearchresponse)
  - [6.3 OrderCreateResponse (mesa, pagado, con sustitución)](#63-ordercreateresponse-mesa-pagado-con-sustitución)
  - [6.4 OrderCreateResponse (llevar, pendingPayment)](#64-ordercreateresponse-llevar-pendingpayment) · [6.4b PayOrderResponse](#64b-payorderresponse-confirmar-pago-de-un-pendiente)
  - [6.5 CustomOrderCreateResponse (presas surtidas)](#65-customordercreateresponse-orden-llevar-custom--presas-surtidas-vía-post-apiv1orderscustom)
  - [6.6 OrderCreateWithDiscountResponse (descuento al personal por plato, una sola llamada)](#66-ordercreatewithdiscountresponse-descuento-al-personal-por-plato-en-la-creación--una-sola-llamada)
  - [6.6b DiscountCreateResponse (catálogo — admin)](#66b-discountcreateresponse-catálogo--admin)
  - [6.6c DiscountAuthorizationResponse](#66c-discountauthorizationresponse-admin-autoriza-a-la-sesión-de-cajera-por-turno)
  - [6.7 VoucherCreateResponse](#67-vouchercreateresponse)
  - [6.8 InventoryAdjustResponse](#68-inventoryadjustresponse-éxito)
  - [6.9 ManualConsumptionResponse (cierre turno cocina)](#69-manualconsumptionresponse-cierre-turno-cocina)
  - [6.10 CashOpenResponse](#610-cashopenresponse-éxito) · [6.10b CashCloseResponse (arqueo)](#610b-cashcloseresponse-arqueo)
  - [6.11 CancelOrderResponse (anulación)](#611-cancelorderresponse-anulación-de-pedido-pagado) · [6.11b OrderStatusUpdate](#611b-orderstatusupdateresponse-despacho)
  - [6.12 PosContextResponse (carga del POS en una llamada)](#612-poscontextresponse-carga-del-pos-en-una-llamada)
  - [6.13 ExpenseCreateResponse (gasto desde caja — FR-009)](#613-expensecreateresponse-gasto-desde-caja--fr-009)
  - [6.14 AuditLogsByShiftResponse (consulta del rastro por turno — admin)](#614-auditlogsbyshiftresponse-consulta-del-rastro-por-turno--admin)
- [7. OpenAPI skeleton (recomendación)](#7-openapi-skeleton-recomendación)
- [8. Test cases E2E (casos prioritarios)](#8-test-cases-e2e-casos-prioritarios)
- [9. Despliegue, backups y sincronización](#9-despliegue-backups-y-sincronización)
- [10. Mapeo Negocio → Técnica](#10-mapeo-negocio--técnica)
- [Notas finales](#notas-finales)

---

# 1. Stack tecnológico (obligatorio)

- **Backend:** **NestJS**, **TypeScript**, **Prisma** (ORM), **PostgreSQL**.
- **Frontend:** **Next.js**, **React**, **Zustand** (estado global), **MUI** (Material UI) + MUI Icons.
- **Autenticación:** **JWT** vía `@nestjs/jwt` (enfoque liviano y explícito, **sin Passport**) + **bcryptjs** para hashing de contraseñas. Autorización por rol con **guards de NestJS** (`AuthGuard` + `RolesGuard`) registrados globales. Validación de entrada con `ValidationPipe` + **class-validator** en los DTOs. Detalle en [§5.2](#52-autenticación-y-autorización).
- **Impresión/PDF:** `react-to-print` u otro paquete equivalente con buenos resultados personalizables.
- **Multiplataforma:** El código debe correr en Windows y Linux. Usar `path.join` (nunca strings con `\` o `/` hardcodeados) y manejar fechas en UTC con timezone explícito al presentar.

---

# 2. Requerimientos no funcionales (NFR)

- **Usabilidad:** POS en 3 pasos máximo; interfaces limpias y reactivas; español por defecto. Soporte para tema claro y oscuro usando `paper` y colores de MUI (evitar fondos sólidos no reactivos).
- **Rendimiento:** Respuesta objetivo en LAN: **≤300 ms** para operaciones de venta; tolerancia a picos.
- **Disponibilidad:** Modo local (on-premise) con opción de sincronización a nube en v2; objetivo **99.5% uptime** en horario operativo.
- **Seguridad:** Autenticación JWT; contraseñas hasheadas con **bcryptjs**; auditoría de acciones críticas. **El control de permisos por rol SÍ se aplica en el backend en V1** ([PDR §2.7](../business/pdr.md#27-roles-e-interfaces-v1-con-autenticación-jwt-y-control-de-permisos-por-rol-en-backend)): cada endpoint valida el rol vía `RolesGuard`. **La UI no es la frontera de seguridad** — oculta pantallas, pero el backend devuelve **401** sin token válido o expirado y **403** si el rol no corresponde. Detalle de arquitectura en [§5.2](#52-autenticación-y-autorización).
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

Mapa rápido (el detalle campo por campo, abajo):

| Entidad | Para qué sirve |
|---|---|
| `Branch` | Sucursal del restaurante (entidad central para multi-sucursal). |
| `User` | Personal del sistema con su rol (SUPER_ADMIN, ADMIN, CASHIER, DISPATCHER, COOK) y sucursal asignada. |
| `CashRegister` / `Shift` | Caja física y turno de trabajo (apertura/cierre, arqueo). Cada caja y turno pertenece a una sucursal. |
| `ShiftPeriod` | Catálogo de períodos del día ("Mañana", "Noche"; ampliable sin migración). |
| `Product` / `Variant` | Catálogo de platos y sus variantes (composición). |
| `Order` / `OrderItem` | Pedido y sus ítems (estándar o custom; MESA/LLEVAR). |
| `Customer` | Cliente registrado (CI/NIT) para factura nominada y "pedidos del día"; opcional por venta. |
| `InventoryItem` / `InventoryTransaction` / `InventoryBatch` | Inventario **cocido** transaccional, sus movimientos y lotes (opcional). Cada ítem de inventario pertenece a una sucursal. |
| `ShiftChickenLog` | Ciclo **crudo** de presas por turno ([PDR §2.3](../business/pdr.md#23-inventario-por-presas)). |
| `DailyManualConsumption` | Consumos manuales por turno (bolsas, vasos, etc.). |
| `Voucher` | Vale del personal (descuenta nómina, no caja). |
| `Discount` / `DiscountAuthorization` | Catálogo de descuentos por plato y su autorización por turno ([PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal)). |
| `Expense` | Gasto pagado desde caja. |
| `AuditLog` | Rastro inmutable de acciones críticas ([PDR §2.9](../business/pdr.md#29-auditoría)). |

- **Branch** *(NUEVO - Multi-sucursal V1)*
  - `id: UUID`, `name: string`, `address: string`, `active: boolean` *(sucursal activa/inactiva)*
  - `createdAt: datetime`, `updatedAt: datetime`
  - *Relaciones: `User.branchId` (nullable para SUPER_ADMIN), `Shift.branchId`, `CashRegister.branchId`, `InventoryItem.branchId` (required para entidades locales).*

- **Product**
  - `id: UUID`, `name: string`, `basePrice: decimal`, `category: string`, `active: boolean`, `description: string`
  - `isSellable: boolean` *(nuevo flag — si el producto debe aparecer en el POS para venta)*
  - `isInventoryItem: boolean` *(nuevo flag — si las ventas del producto generan movimientos en inventario / `InventoryTransaction`)*

- **Variant**
  - `id: UUID`, `productId: UUID`, `name: string`, `components: JSON`, `isDefault: boolean`
  - *Nota: NO se incluye campo de ajuste de precio. Por regla del negocio ([PDR §2.1](../business/pdr.md#21-precios-y-sustituciones)) las variantes y sustituciones no modifican el precio del producto. Si en V2 alguna variante necesita ajustar el precio base, se introducirá el campo con el nombre `priceAdjustment`.*

- **Component** *(opcional)*
  - `id: UUID`, `name: string`, `type: enum(presa, acompanamiento, bebida, extra)`, `unitPrice: decimal`

- **Customer (Cliente)** *(cliente registrado para factura nominada y vista de "pedidos del día" — [PDR §2.1](../business/pdr.md#21-precios-y-sustituciones)2 / FR-019)*
  - `id: UUID`
  - `ci: string` *(cédula de identidad — **único**, indexado; clave de búsqueda)*
  - `nit: string?` *(para factura a nombre de empresa; también buscable. El cliente puede dictar **CI o NIT** para su factura)*
  - `firstName: string` *(nombres)*, `lastName: string` *(apellidos)*
  - `sex: enum(HOMBRE, MUJER)`
  - `birthDate: date?` *(opcional — tipo `date`, NO `datetime`: una fecha de nacimiento no lleva hora)*
  - `phone: string?` *(celular)*, `email: string?` *(la factura electrónica se envía por correo)*
  - `active: boolean`, `createdAt: datetime`, `updatedAt: datetime`
  - *Registrar al cliente es **opcional por venta** → `Order.customerId` nullable ("S/N" si anónimo). La regla legal completa (umbral Bs 1.000, RND del SIN, por qué NO usar NIT `99001`) vive en [PDR §2.12](../business/pdr.md#212-clientes-y-facturación-nominada).*

- **Order**
  - `id: UUID`, `type: enum(MESA, LLEVAR)` *(CUSTOM no es un tipo — es propiedad de la orden vía `isCustom`; ver [PDR §2.8](../business/pdr.md#28-comandas-tickets-factura-y-notificaciones) / §2.10)*
  - `tableNumber: string?`, `customerName: string?` *(nombre para mostrar en comanda/factura; "S/N" si el cliente no se identifica. Es **snapshot** de visualización: no cambia si luego se edita el `Customer`)*
  - `customerId: UUID?` *(referencia al `Customer` registrado; null si la venta es anónima/"S/N". **Agrupa** los pedidos del cliente para la vista del día — [PDR §2.1](../business/pdr.md#21-precios-y-sustituciones)2 / FR-019)*
  - `publicToken: string` *(token aleatorio no adivinable — ej. `crypto.randomBytes(16).toString('hex')`, 128 bits — generado al crear la orden, **único** e indexado. Es la **credencial** de la vista pública del cliente: NO se usa el `id` interno ni un valor secuencial. Espacio 2^128 → no enumerable, FR-015)*
  - `status: enum(created, confirmed, preparing, ready, delivered, closed, pendingPayment, cancelled, onHold)` *(`onHold` **reservado, SIN uso en V1** — ninguna regla de negocio lo define; el backend no lo produce ni lo acepta. Se activará con un caso real)*
  - `paymentStatus: enum(pending, paid, partial)` *(`partial` **reservado, SIN uso en V1** — mismo criterio)*, `paymentMethod: enum(cash, card, vale)?`
  - `originalAmount: decimal` *(precio original de la orden ANTES de cualquier descuento = `Σ(unitPrice × quantity)` de los ítems; [PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal))*
  - `total: decimal` *(total cobrado = `originalAmount − Σ(descuentos de los ítems)`; es el valor **derivado** y lo que entra a caja — [PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal))*
  - `isCustom: boolean` *([PDR §2.10](../business/pdr.md#210-ventas-custom-presas-surtidas) — true si la orden se creó vía endpoint custom; default false)*
  - *Nota de migración (v1.2): el descuento **ya NO vive en `Order`** — los antiguos `Order.discountId` / `Order.discountAmount` quedan **eliminados**. El descuento se aplica **por plato** y vive en `OrderItem.discountId` / `OrderItem.discountAmount` (ver `OrderItem` abajo). El antiguo `internalDiscount: boolean` sigue eliminado: el "descuento al personal" es una instancia del catálogo `Discount` (availability `endOfShift`, sin autorización). Ver [PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal).*
  - `cancelReason: string?`, `cancelDetails: string?`
  - `createdBy: userId`, `createdAt: datetime`, `paidAt: datetime?`, `cancelledAt: datetime?`
  - `readyAt: datetime?` *(timestamp de transición a `ready`; reemplaza una eventual entidad `NotificationLog`)*
  - `deliveredAt: datetime?`, `deliveredBy: userId?`
  - `shiftId: UUID`

- **OrderItem**
  - `id: UUID`, `orderId: UUID`, `productId: UUID?` *(null si custom)*, `variantId: UUID?`
  - `quantity: int`, `unitPrice: decimal`
  - `snapshot: Json?` *(nuevo campo — snapshot inmutable del ítem usado para impresión, auditoría y trazabilidad; contiene nombre, price snapshot, discount snapshot y composición que se imprimirá en el ticket)*
  - `components: OrderItemComponent[]` *(relación inversa: los componentes operacionales del ítem — presas/bebidas/extras — se modelan como filas separadas en `OrderItemComponent` y son la fuente de verdad para el decremento de inventario al pagar)*
  - `discountId: UUID?` *(el `Discount` aplicado **a este plato**; null sin descuento. Máximo **uno por ítem** — sin apilamiento; la mecánica de negocio vive en [PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal))*
  - `discountAmount: decimal?` *(**snapshot por unidad** del `fixedAmount` vigente — NO una resta: se congela para que editar el catálogo no altere ventas pasadas. Aplica a TODAS las unidades del ítem; para descuento parcial el POS parte el ítem en dos líneas)*
  - `totalPrice: decimal` *(**derivado**: `(unitPrice − (discountAmount ?? 0)) × quantity`)*
  - `notes: string?`, `substitutions: JSON?`
  - `customPieces: JSON?` *(ej. `[{type:"pecho",qty:2},{type:"ala",qty:1}]` — composición libre de presas para ítems de órdenes custom; ver [PDR §2.10](../business/pdr.md#210-ventas-custom-presas-surtidas))*

- **InventoryItem** *(inventario transaccional — para presas representa el plano COCIDO del expositor; ver [PDR §2.3](../business/pdr.md#23-inventario-por-presas))*
  - `id: UUID`, `productCode: string`, `name: string`
  - `unit: enum(presa, bolsa, unidad)`, `type: enum(pecho, ala, pierna, entrepierna, bebida, insumo)`
  - `currentStock: int`, `unitMeasure: string`
  - `salePrice: decimal?` *(precio de venta unitario configurado por el admin. Para `type ∈ {pecho, ala, pierna, entrepierna}` es el precio de venta por presa que alimenta el **precio sugerido** de la venta custom — **ahora V1**, [PDR §2.10](../business/pdr.md#210-ventas-custom-presas-surtidas). Es solo precio de VENTA: el sistema NO registra costo del pollo ni calcula margen.)*
  - *Nota: el ciclo CRUDO de presas (reproceso, procesado, sobrante crudo) se modela aparte en `ShiftChickenLog`. `InventoryItem` con `type ∈ {pecho, ala, pierna, entrepierna}` representa siempre el inventario cocido vendible.*
    - `orderItemComponents: OrderItemComponent[]` *(relación inversa: componentes de ítems que remiten a este `InventoryItem` cuando aplica)*
### OrderItemComponent (componentes operacionales de un ítem)

Para modelar de forma normalizada los consumos (presas, bebidas, extras) y facilitar las transacciones de inventario, existe la entidad `OrderItemComponent`. Cada fila representa una porción operativa consumida por un `OrderItem` (puede referir a un `InventoryItem` cuando es una presa vendida a granel, o a un `Product` cuando es una bebida/extra del catálogo).

Campos típicos (resumen): `id`, `orderItemId`, `inventoryItemId?`, `productId?`, `quantity`, `unitPrice`, `label`, `createdAt`, `updatedAt`. La regla de integridad aplicable es: cada componente debe referir exactamente a una de `inventoryItemId` o `productId` (pero no a ambas). Se recomienda aplicar un CHECK a nivel de base de datos para garantizar esto, por ejemplo:

```sql
ALTER TABLE order_item_components
ADD CONSTRAINT order_item_component_one_ref CHECK (
  (inventory_item_id IS NULL AND product_id IS NOT NULL)
  OR
  (inventory_item_id IS NOT NULL AND product_id IS NULL)
);
```

Esta estructura permite que el servicio de órdenes y el servicio de inventario consuman una lista clara de componentes por ítem para crear `InventoryTransaction` en la transacción que confirma el pago.


- **InventoryBatch** *(opcional)*
  - `id: UUID`, `inventoryItemId: UUID`, `batchCode: string`, `processedAt: datetime`, `quantityReceived: int`, `quantityRemaining: int`, `origin: string`

- **InventoryTransaction**
  - `id: UUID`, `inventoryItemId: UUID`, `delta: int`
  - `reason: enum(sale, adjustment, reception, vale, manualConsumption)`
  - *Nota: NO hay `reason` de descuento. Un descuento es **puramente monetario** ([PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal)): la venta con descuento descuenta inventario con `reason = sale` igual que cualquier otra, sobre el producto real vendido.*
  - `referenceId: UUID?`, `userId: UUID`, `note: string?`, `timestamp: datetime`

- **DailyManualConsumption** *(consumos anotados por turno — bolsas de papa, smile, vasos, etc.)*
  - `id: UUID`, `shiftId: UUID`, `inventoryItemId: UUID`, `quantity: int`, `recordedBy: userId`, `recordedAt: datetime`

- **ShiftChickenLog** *(ciclo CRUDO de presas anotado por el cocinero al cierre de turno — [PDR §2.3](../business/pdr.md#23-inventario-por-presas) / FR-017)*
  - `id: UUID`, `shiftId: UUID`, `pieceType: enum(pecho, ala, pierna, entrepierna)`
  - `reprocessRaw: int` *(pollo crudo sobrante del turno anterior — autopoblado con `rawLeftover` del último `ShiftChickenLog` cerrado para el mismo `pieceType`; editable por el cocinero antes de confirmar)*
  - `processedRaw: int` *(pollo fresco marinado en este turno)*
  - `rawLeftover: int` *(sobrante procesado crudo al cierre — se convierte en el `reprocessRaw` del turno siguiente)*
  - `cookedLeftover: int` *(sobrante cocido en expositor al cierre — habilita venta con descuento al personal §2.11)*
  - `recordedBy: userId`, `recordedAt: datetime`, `closedAt: datetime?`
  - *Cantidad cocinada en el turno (derivada, NO se almacena): `reprocessRaw + processedRaw − rawLeftover`*
  - *Constraint: `UNIQUE(shiftId, pieceType)` — un log por turno por tipo de presa*

- **Voucher (Vale)**
  - `id: UUID`, `code: string` *(generado por el backend)*
  - `workerId: UUID?` *(o `workerName: string` si el trabajador no es usuario del sistema)*
  - `productId: UUID?`, `productName: string` *(snapshot derivado de `productId`)*
  - `originalAmount: decimal` *(precio del producto, **derivado** de `productId`; el front NO lo envía)*
  - `discountId: UUID?` *(opcional — instancia `Discount` "Descuento personal" aplicada al vale; null si el vale no lleva descuento — [PDR §2.4](../business/pdr.md#24-vales-ventas-internas--descuento-por-nómina) / §2.11)*
  - `discountAmount: decimal?` *(**snapshot** del monto fijo del descuento al aplicarlo, ej. 7.00)*
  - `amount: decimal` *(monto final que se descuenta de nómina = `originalAmount − (discountAmount ?? 0)`; **derivado** por el backend, no lo manda el front)*
  - `issuedBy: userId`, `issuedAt: datetime`, `shiftId: UUID`
  - `status: enum(issued, redeemed, cancelled)` *(`redeemed` y `cancelled` **reservados, SIN uso en V1** — el vale solo se emite; [PDR §2.4](../business/pdr.md#24-vales-ventas-internas--descuento-por-nómina) no define redención ni anulación)*, `note: string?`
  - *El vale no es un descuento (no suma a caja, descuenta nómina — [PDR §2.4](../business/pdr.md#24-vales-ventas-internas--descuento-por-nómina)); puede llevar el "Descuento personal" con el mismo patrón snapshot de los ítems.*

- **Discount** *(catálogo de descuentos creado por el admin — [PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal). Catálogo mínimo, NO motor de reglas: monto fijo **por plato**, aplicado a nivel ítem, uno por plato, sin apilamiento.)*
  - `id: UUID`, `name: string`
  - `fixedAmount: decimal` *(monto fijo en Bs **por plato** — NO porcentaje en V1)*
  - `availability: enum(always, endOfShift)` *(`always` = todo el turno; `endOfShift` = solo a fin de turno)*
  - `requiresAuthorization: boolean` *(si `true`, la cajera solo puede aplicarlo si el admin la autorizó en ese turno — ver `DiscountAuthorization`)*
  - `active: boolean`
  - *Las dos instancias principales ("Descuento personal" y "Compensación al cliente") con sus configs, contextos y porqués viven en [PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal). Puramente monetario: ver nota de `InventoryTransaction`.*

- **DiscountAuthorization** *(habilitación que el admin otorga a la sesión de cajera de un turno para aplicar un `Discount` con `requiresAuthorization = true` — [PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal) / FR-016b)*
  - `id: UUID`, `discountId: UUID`
  - `shiftId: UUID`, `cashierId: UUID` *(sesión/cajera beneficiada del turno)*
  - `authorizedBy: UUID` *(admin que la otorgó)*, `authorizedAt: datetime`
  - *Alcance por turno, extinción al cierre y auditabilidad del acto de autorizar: reglas en [PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal) (subsección "Autorización de descuentos por turno").*
  - *Constraint: `UNIQUE(discountId, shiftId, cashierId)` — una autorización por descuento por sesión de cajera por turno.*

- **User**
  - `id: UUID`, `firstName: string`, `lastName: string`, `role: enum(SUPER_ADMIN, ADMIN, CASHIER, DISPATCHER, COOK)`
  - `email: string` *(único — credencial de login)*, `phone: string?` *(opcional — dato de contacto)*
  - `ci: string` *(único — cédula de identidad; su hash se almacena en `passwordHash` y funciona como contraseña)*
  - `passwordHash: string` *(hash bcrypt del CI — mecanismo de autenticación)*, `active: boolean`
  - `branchId: UUID?` *(sucursal asignada; nullable para `SUPER_ADMIN` con acceso global — multi-sucursal)*

- **ShiftPeriod** *(catálogo de períodos de turno — "Mañana", "Noche"; el dueño puede crear "Tarde" sin migración. Por eso es catálogo y NO enum.)*
  - `id: UUID`, `name: string` *(único)*, `displayOrder: int` *(orden dentro del día)*
  - `referenceStart: string?`, `referenceEnd: string?` *(horarios de REFERENCIA informativos, ej. "09:00"–"16:00" — **jamás se usan para clasificar**: el reloj puede estar mal configurado y los horarios cambian)*
  - `active: boolean`
  - *El período se **declara al abrir el turno** — nunca se infiere del reloj. Quién confirma, por qué NO es atributo del `User` y el descarte de la inferencia por hora: [PDR §13.3](../business/pdr.md#133-decisiones-residuales-pendientes-de-cierre-antes-de-v1); agenda semanal → V2 ([PDR §13.2](../business/pdr.md#132-versión-2-roadmap-futuro--diferido-explícitamente)).*

- **Shift / CashRegister**
  - `id: UUID`, `cashierId: UUID`, `cashRegisterId: UUID?`
  - `periodId: UUID` *(período del turno, del catálogo `ShiftPeriod` — asignado al abrir, nunca inferido del reloj)*
  - `startAt: datetime`, `endAt: datetime?`
  - `openingAmount: decimal`, `closingAmount: decimal?`, `expectedAmount: decimal?`, `discrepancy: decimal?`

- **Expense**
  - `id: UUID`, `description: string`, `amount: decimal`, `paidBy: enum(cash, register)`, `shiftId: UUID`, `createdBy: userId`, `createdAt: datetime`

- **AuditLog**
  - `id: UUID`, `entity: string`, `action: string`, `userId: UUID`, `timestamp: datetime`, `details: JSON?`
  - `entityId: string` *(**no** UUID: es una referencia **polimórfica** — apunta a distintas tablas según `entity`, por lo que **no lleva FK** y el tipo `uuid` no aportaba integridad alguna. Guarda el UUID cuando la entidad está persistida (`Order`, `Shift`, …) y una **clave legible** cuando es lógica (`Report` → `"sales:2026-07"`). Siempre requerido.)*
  - `shiftId: UUID?` *(turno en el que ocurrió la acción — el log **nace sabiendo su turno**, sin cálculos de ventana horaria. NULL = acción crítica fuera de una sesión de caja: `ADJUST_INVENTORY` / `GENERATE_REPORT` del admin. En `OPEN_SHIFT`/`CLOSE_SHIFT` es el propio turno.)*

## 3.2 Relaciones clave

- **Multi-sucursal:**
  - `Branch` 1..* `User` (vía `User.branchId`, nullable para SUPER_ADMIN)
  - `Branch` 1..* `Shift` (vía `Shift.branchId`, required)
  - `Branch` 1..* `CashRegister` (vía `CashRegister.branchId`, required)
  - `Branch` 1..* `InventoryItem` (vía `InventoryItem.branchId`, required)
- `Product` 1..* `Variant`
- `Customer` 1..* `Order` (vía `Order.customerId`, opcional — null si venta anónima "S/N")
- `Order` 1..* `OrderItem`
- `OrderItem` → `Product` / `Variant` (ambos opcionales si pertenece a una orden custom — `Order.isCustom = true` con item poblando `customPieces`)
- `InventoryTransaction` referencia `Order`, `Voucher` o `Expense` por `referenceId`
- `Shift` vincula `CashRegister`, `ShiftPeriod` (período del turno), `User` (cajera), `Expense`, `Voucher`, `Order`, `DailyManualConsumption`, `ShiftChickenLog`, `DiscountAuthorization`, `AuditLog` (vía `AuditLog.shiftId`, nullable)
- `ShiftPeriod` 1..* `Shift` (vía `Shift.periodId` — el turno se autodescribe: caja + período + cajera)
- `Discount` 1..* `OrderItem` (vía `OrderItem.discountId`, opcional — el descuento se aplica **por plato**; solo uno por ítem)
- `Discount` 1..* `Voucher` (vía `Voucher.discountId`, opcional — "Descuento personal" sobre el vale)
- `Discount` 1..* `DiscountAuthorization`
- `DiscountAuthorization` vincula `Discount`, `Shift` y `User` (cajera) — autorización por turno otorgada por un admin

## 3.3 Diagrama de relaciones (ER)

> **El ER no se dibuja a mano acá** — el modelo cambia seguido y un diagrama estático queda desactualizado en silencio. La fuente de verdad es [`prisma/schema.prisma`](../prisma/schema.prisma); el diagrama se **genera on-demand** desde el schema con una extensión de VS Code (ej. *Prisma ERD Visualizer*) o una herramienta externa ([`prisma-erd-generator`](https://github.com/keonik/prisma-erd-generator), dbdiagram.io). Las entidades y campos, con sus notas, están en [§3.1](#31-entidades-principales); las relaciones clave en [§3.2](#32-relaciones-clave).

> **Tres sutilezas de negocio que el modelo refleja** (y que hay que entender, no solo copiar):
> - `Order.isCustom` es un **flag**, no un valor de `type`. Una venta custom sigue siendo `MESA` o `LLEVAR` ([PDR §2.10](../business/pdr.md#210-ventas-custom-presas-surtidas)).
> - El descuento vive en el **ítem**, no en la orden: se aplica **por plato** — la cajera marca qué ítems lo llevan ([PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal)).
> - `OrderItem.discountAmount` es un **snapshot por unidad** del monto fijo, NO una resta. `OrderItem.totalPrice` y `Order.total` son los derivados ([PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal)).

---

# 4. Máquina de estados de pedidos (transaccional)

**Estados:**
`created → confirmed → preparing → ready → delivered → closed`
Estados adicionales: `pendingPayment`, `cancelled`, `onHold` *(reservado — SIN transiciones en V1, ver §3.1)*.

El flujo de vida de una orden. Negocio en [PDR §4](../business/pdr.md#4-máquina-de-estados-de-pedidos), efectos transaccionales en [§4.1](#41-transiciones-y-efectos).

```mermaid
stateDiagram-v2
    [*] --> created: cajera registra

    created --> confirmed: pago inmediato 💰
    created --> pendingPayment: LLEVAR/delivery sin pago

    note right of confirmed
        Decremento ATÓMICO de inventario
        + contabiliza ingreso
    end note

    pendingPayment --> confirmed: paga 💰 (recién aquí descuenta inventario)
    pendingPayment --> cancelled: cancelación MANUAL (sin motivo, sin timeout)

    confirmed --> preparing: comanda en panel despacho
    pendingPayment --> preparing: se prepara de inmediato

    preparing --> ready: despachadora marca listo 🔔 (pantalla pública)
    ready --> delivered: cliente recoge / delivery retira
    delivered --> closed: cierre administrativo

    confirmed --> cancelled: anulación (motivo+detalle OBLIGATORIO, revierte inventario)

    cancelled --> [*]
    closed --> [*]
```

> **Reglas clave que el diagrama codifica:**
> - El inventario se descuenta **al confirmar el pago**, nunca antes ([PDR §2.3](../business/pdr.md#23-inventario-por-presas)).
> - `pendingPayment` se prepara **igual** que un pedido pagado, pero sin tocar inventario ni caja ([PDR §2.5](../business/pdr.md#25-pedidos-delivery-y-pago-pendiente)).
> - Cancelar pendiente: **manual, sin motivo**. Anular pagado: **motivo + detalle obligatorios** + revierte inventario ([FR-011b](../business/requirements.md#fr-011b--anulación-de-pedido-pagado-alta)).

## 4.1 Transiciones y efectos

- **created → confirmed (con pago)**
  - Acción: cajera confirma pedido con pago inmediato.
  - Efecto: `paymentStatus = paid` → **decremento atómico de inventario** → contabiliza ingreso → genera comanda digital → (opcional) imprime factura si cliente la pide.

- **created → pendingPayment**
  - Acción: cajera registra pedido LLEVAR/delivery sin pago aún.
  - Efecto: `paymentStatus = pending`. **NO decrementa inventario, NO contabiliza ingreso**. Se genera comanda digital y el pedido pasa directamente a preparación. La cancelación, si ocurre, es siempre manual y la realiza la cajera ([PDR §2.5](../business/pdr.md#25-pedidos-delivery-y-pago-pendiente)).

- **confirmed → preparing / pendingPayment → preparing**
  - Acción: comanda digital aparece automáticamente en panel de despacho.
  - Efecto: ningún cambio en inventario (ya se hizo en confirmed con pago, o aún no se hace si es pendingPayment).

- **pendingPayment → confirmed**
  - Acción: delivery / cliente paga.
  - Efecto: `paymentStatus = paid`, `paidAt = now`. **Decremento atómico de inventario**. Contabiliza ingreso.

- **pendingPayment → cancelled (manual — única forma)**
  - Acción: cajera cancela manualmente. **No existe auto-cancelación por timeout** ([PDR §2.5](../business/pdr.md#25-pedidos-delivery-y-pago-pendiente)).
  - Efecto: `cancelledAt = now`, `cancelReason = "manual"`. Sin requerir motivo detallado. Inventario no se tocó, ingreso no se contabilizó.

- **preparing → ready**
  - Acción: despachadora marca listo.
  - Efecto: `Order.readyAt = now`. El pedido aparece en la pantalla pública mostrando **únicamente el número de pedido** (aplica tanto a MESA como a LLEVAR) y suena alerta breve.

- **ready → delivered**
  - Acción: cliente recoge / delivery retira / despachadora entrega en mesa; despachadora marca entregado.
  - Efecto: `Order.deliveredAt = now`, `Order.deliveredBy = userId` registrados.

- **delivered → closed**
  - Acción: cierre administrativo — lo ejecuta **`POST /shifts/close`**: al cerrar el turno, todas las órdenes `delivered` del turno transicionan a `closed` en la misma operación (no hay endpoint dedicado; es exactamente el "típicamente al cierre de turno" de [PDR §4](../business/pdr.md#4-máquina-de-estados-de-pedidos)).

- **(cualquier estado pagado) → cancelled (anulación)**
  - Acción: admin / cajera anula un pedido ya pagado.
  - Efecto requerido: `cancelReason` y `cancelDetails` obligatorios. **Reversión de inventario** (restituir presas y bebidas). Se registra en arqueo bajo `anulaciones` con monto. `AuditLog` obligatorio.

## 4.2 Reglas transaccionales

- El decremento de inventario y la marca de pago deben ocurrir en una **transacción atómica**. Si falla inventario (stock insuficiente), la orden permanece en su estado anterior y se notifica a la cajera con detalle del faltante.
- **No existe job de auto-cancelación**: los pedidos `pendingPayment` solo transitan a `cancelled` por acción manual de la cajera o a `paid` al confirmar el pago.
- **El registro de auditoría forma parte de la transacción.** En las acciones críticas, el `INSERT` en `AuditLog` ocurre **dentro de la misma `$transaction`** que la acción: si la operación se revierte, el audit tampoco queda (no hay constancia de algo que no pasó). Detalle en [§4.3](#43-auditoría--implementación-v1).

---

## 4.3 Auditoría — implementación (V1)

> Traducción técnica de la regla de negocio [PDR §2.9](../business/pdr.md#29-auditoría). La auditoría registra el rastro inmutable de las **acciones críticas** (quién, cuándo, qué entidad, qué cambió) sobre la entidad [`AuditLog`](#31-entidades-principales). **No confundir con el logging técnico** (errores/debug): la auditoría es un registro **de negocio**, persistido en BD, inmutable y consultable por el admin.

### Patrón V1: audit explícito dentro del service y la transacción
- La escritura del `AuditLog` se hace de forma **explícita dentro del service** de cada acción crítica, en la **misma `prisma.$transaction`** que la operación. Dos motivos lo imponen:
  1. **Atomicidad:** acción y audit se graban juntos o no se graban (§4.2). Evita auditar ventas que terminaron revertidas.
  2. **Estado *antes/después*:** el `details` necesita el valor previo, que solo está disponible **antes de mutar**, dentro del service.
- Recomendado: un `AuditService` con un único método `log(tx, { entity, entityId, action, userId, details })` invocado desde cada punto crítico, reutilizando la transacción activa.

### Las 6 acciones auditadas (§2.9) y su punto de captura
| Acción (`action`) | Punto de captura | `entity` |
|---|---|---|
| `CREATE_SALE` | `POST /orders` y `POST /orders/custom` (al confirmar pago). Los **descuentos por ítem** aplicados en la creación van en `details` (`discountId`, `discountAmount`, ítems afectados) — no hay acción de audit separada para "aplicar descuento" | `Order` |
| `CANCEL_SALE` | `POST /orders/{id}/cancel` | `Order` |
| `ADJUST_INVENTORY` | `POST /inventory/adjust` | `InventoryItem` |
| `CREATE_VOUCHER` | `POST /vouchers` | `Voucher` |
| `OPEN_SHIFT` / `CLOSE_SHIFT` | `POST /shifts/open` · `/close` | `Shift` |
| `GENERATE_REPORT` | `GET /reports/...` | `Report` (lógico — sin fila en BD; `entityId` es una clave legible, ver abajo) |

> El **acto de autorizar un descuento** ya queda auditado aparte (`AUTHORIZE_DISCOUNT`, §2.11 / FR-016b) — ver [§5.1](#51-endpoints-principales).

### Cómo se llena cada campo
- **`userId`** (quién): del JWT, `request.user.sub`. Disponible en toda petición autenticada.
- **`shiftId`** (en qué turno): del **turno activo de la sesión** que ejecuta la acción (en `OPEN_SHIFT`/`CLOSE_SHIFT` es el propio `Shift`). NULL en acciones de admin fuera de una sesión de caja (`ADJUST_INVENTORY`, `GENERATE_REPORT`). El log nace sabiendo su turno — la consulta por turno es una FK directa, sin ventanas horarias.
- **`timestamp`** (cuándo): reloj del server (`@default(now())`).
- **`entity` + `entityId`** (qué entidad): tipo e id del registro afectado. En una **creación**, el `entityId` está disponible **tras el insert dentro de la misma `tx`**.
  - `entityId` es **`string`, no `uuid`** (ver [§3.1](#31-entidades-principales)): al ser una referencia polimórfica no tiene FK, así que el tipo `uuid` no daba integridad — solo impedía representar entidades **lógicas**.
  - **Entidades persistidas** (`Order`, `Voucher`, `InventoryItem`, `Shift`, `DiscountAuthorization`): se guarda su UUID.
  - **Entidad lógica `Report`** (`GENERATE_REPORT` no crea fila en ninguna tabla): se guarda una **clave legible y consultable** con formato `<reporte>:<alcance>` — ej. `"sales:2026-07"`, `"inventory-presas:2026-07-08"`. Nunca un UUID inventado: un identificador falso en la tabla que existe para ser prueba destruye su valor. Así el admin puede filtrar por `entityId` y ver quién generó ese reporte exacto.
- **`action` + `details`** (qué cambió): `action` es el verbo fijo del endpoint; `details: JSON` guarda el cambio concreto:
  - **Creaciones** (venta, vale): qué se creó → `{ total, items, paymentMethod }`, `{ worker, product, amount }`.
  - **Mutaciones** (ajuste de inventario, cierre de caja): estado previo y nuevo → `{ before, after, reason }`, `{ expected, counted, difference }`.

### Inmutabilidad: tabla append-only
- A `AuditLog` solo se le hace **`INSERT`** y **`SELECT`**. **Nunca `UPDATE` ni `DELETE`.** Un registro de auditoría editable no sirve como prueba — la inmutabilidad **es** la feature.

### Consulta
- El rastro se consulta **como lo piensa el negocio, sin paginación** (admin): **`POST /api/v1/audit-logs/shift`** con `{ date, periodId, cashRegisterId? }` → los logs de ese turno (~50-80 filas; caja opcional — omitida = todas las cajas de ese período), y **`POST /api/v1/audit-logs/month`** con `{ month }` → el mes completo. Resolución por **FK directa**: `Shift` por fecha + período (+ caja) → `AuditLog WHERE shiftId IN (...)` — cero ventanas horarias. URLs limpias, datos por body, orden `timestamp DESC`. Ver [§5.1](#51-endpoints-principales) y payload en [§6.14](#614-auditlogsbyshiftresponse-consulta-del-rastro-por-turno--admin). Auditar sin poder consultar no aporta valor — por eso la consulta es parte del contrato V1.

### Por qué NO un interceptor genérico en V1
- Un `AuditInterceptor` global corre **fuera de la transacción** del service y **no tiene el estado previo**, así que no puede garantizar atomicidad ni llenar `details` con el *antes/después*. Por eso V1 usa audit explícito.
- Un interceptor (para las acciones simples, sin before/after) es una **optimización diferida a V2**, y se sumará **con un caso real** cuando la repetición lo justifique — misma disciplina que el catálogo de descuentos ([PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal)). No se introduce antes.

---

# 5. Contratos de la API

## 5.0 Principios de diseño de la API (el backend manda, el frontend renderiza)

Reglas transversales que **todos** los endpoints respetan. El frontend envía el **mínimo**; el backend resuelve el resto y devuelve respuestas **listas para pintar**.

1. **Lo que viene del token NUNCA viaja en el body.** El JWT lleva `{ sub: userId, email, role }`. El backend toma de `request.user` (no del request body) todos los campos de **actor/sesión**: `Order.createdBy`, `Voucher.issuedBy`, `Shift.cashierId`, `InventoryTransaction.userId`, `DiscountAuthorization.authorizedBy`. Si el front los manda, el backend los **ignora**.
2. **El `shiftId` se deriva del turno activo.** Las operaciones de venta (órdenes, vales, gastos) NO reciben `shiftId`: el backend resuelve el **turno abierto de la sesión de cajera** autenticada (1 sesión activa por turno, FR-008b) y lo asigna. Mismo criterio para cualquier vínculo deducible de la sesión.
3. **Precios y totales los calcula el backend desde la BD.** En la **orden estándar** el front **NO** envía `unitPrice` ni `total`: el backend los toma de `Product.basePrice` / `Variant` y calcula `totalPrice` y `total`. **Única excepción:** la **venta custom**, donde la cajera confirma un `unitPrice` (input de negocio legítimo, §2.10). Snapshots (`discountAmount`, `customerName`) también los congela el backend, no el front.
4. **El front manda referencias (ids), no datos copiados.** Para vincular un cliente, manda `customerId` (lo obtuvo de `GET /customers`), **no** `customerName`: el backend lee la tabla `Customer` y snapshotea el nombre. Idéntico criterio para los **descuentos**: el ítem lleva `discountId` (referencia al catálogo) y el backend valida, congela el snapshot y deriva los totales. El front jamás manda montos de descuento.
5. **Respuestas listas para renderizar.** El backend devuelve todo lo que la UI muestra, **ya calculado y con nombres resueltos**. Los campos de actor se devuelven como objeto `{ id, name }` (ej. `createdBy: { id, name }`), no como id suelto, para que el frontend **solo pinte** sin segundas consultas ni cálculos.
6. **Una operación de negocio = una llamada.** Todo lo que la cajera decide en una misma pantalla viaja en **un solo request** y el backend lo resuelve en **una sola transacción**. Los descuentos por plato van como `discountId` en cada ítem de `POST /orders` — **no existe** un endpoint separado para "aplicar descuento". Los endpoints separados se reservan para **momentos distintos en el tiempo** (`/pay` cuando el delivery paga al retirar, `/cancel`, `/status`), nunca para pasos de una misma operación.

## 5.1 Endpoints principales

> El rol requerido por cada endpoint está en la **matriz de autorización** de [§5.2](#52-autenticación-y-autorización). Todos exigen `Authorization: Bearer <token>` salvo los marcados **público**. Todos respetan los [principios de §5.0](#50-principios-de-diseño-de-la-api-el-backend-manda-el-frontend-renderiza).

- `POST /api/v1/auth/login` — **público** (`@Public()`): autentica y devuelve el JWT (payload `{ sub: userId, email, role, branchId }`) que el frontend envía como `Bearer` (FR-018). Login por **email + CI** (la contraseña es el CI hasheado con bcryptjs). Request/response en [§6.0](#60-authloginresponse).
- `POST /api/v1/auth/logout` — libera la **sesión activa del turno** del usuario autenticado (FR-008b): sin esto, quien terminó como cajera no podría reingresar como despachadora hasta que el turno cierre solo. La sesión también se extingue automáticamente al cerrar el turno.
- `POST /api/v1/users` · `GET /api/v1/users` · `PATCH /api/v1/users/{id}` · `PATCH /api/v1/users/{id}/toggle-active` — gestión de usuarios por el admin ([PDR §2.7](../business/pdr.md#27-roles-e-interfaces-v1-con-autenticación-jwt-y-control-de-permisos-por-rol-en-backend)): alta con rol, listado y edición (firstName, lastName, email, phone, ci, rol, branchId). `PATCH /api/v1/users/{id}` NO permite cambiar `active` — para activar/desactivar se usa el endpoint separado `toggle-active` (invierte el estado actual, sin body). El CI viaja solo en alta/edición y se guarda hasheado como `passwordHash` (bcryptjs, §5.2)
- `POST /api/v1/branches` — crear sucursal (**solo SUPER_ADMIN**, FR-000): `{ name, address }`, `active` por defecto `true`. Es el **prerrequisito** de `POST /users` (el admin se crea con `branchId`) y de todo lo que sigue (`Shift.branchId`, `CashRegister.branchId`, `InventoryItem.branchId` son required para entidades locales)
- `GET /api/v1/branches` — listar sucursales (**solo SUPER_ADMIN**; alimenta el selector de sucursal del frontend y la gestión). Devuelve `id`, `name`, `address`, `active`
- `PATCH /api/v1/branches/{id}` — editar sucursal (**solo SUPER_ADMIN**): `{ name?, address? }`. Editar no altera datos pasados (las entidades locales guardan su `branchId`)
- `PATCH /api/v1/branches/{id}/toggle-active` — **alternar** el estado de una sucursal (**solo SUPER_ADMIN**): si está `active: true` la desactiva (`active: false`) y si está inactiva la reactiva (`active: true`). Invierte el estado actual sin body. No borra datos; las entidades locales conservan su `branchId`
- `POST /api/v1/products` — crear producto
- `GET /api/v1/products` — listar productos
- `POST /api/v1/variants` — crear variante
- `POST /api/v1/orders` — crear orden estándar (MESA / LLEVAR) con **N ítems** (`productId` + `quantity`; sin `customPieces`). Cada ítem acepta `discountId?` opcional: el backend valida (disponibilidad + autorización — `DISCOUNT_NOT_AVAILABLE` / `DISCOUNT_NOT_AUTHORIZED`), congela el snapshot y deriva `totalPrice` y `total` — **una sola llamada y transacción** (§5.0 princ. 6; el front NO manda precios ni montos). Request/response y la cuenta completa en [§6.3](#63-ordercreateresponse-mesa-pagado-con-sustitución) / [§6.6](#66-ordercreatewithdiscountresponse-descuento-al-personal-por-plato-en-la-creación--una-sola-llamada).
  > **No existe endpoint separado para aplicar descuentos.** Descuento post-creación: sin soporte en V1 (sin caso real) — `pendingPayment` sin pagar → cancelar y recrear; pagada → anulación FR-011b.
- `POST /api/v1/orders/custom` — crear orden custom (MESA / LLEVAR): ítems con `customPieces`, extras/bebidas opcionales, **precio unitario confirmado** por la cajera y `discountId?` opcional. El **precio sugerido** lo calcula el POS en el cliente con los `piecePrices` de `pos/context`; se persiste el confirmado, nunca la sugerencia (§2.10). Endpoint **separado** para DTOs y validaciones limpias por flujo. Payload en [§6.5](#65-customordercreateresponse-orden-llevar-custom--presas-surtidas-vía-post-apiv1orderscustom).
- `GET /api/v1/orders/{id}` — obtener orden
- `GET /api/v1/orders?status=&date=&createdBy=&table=&customer=` — listado con filtros: es el **panel de despacho** (filtro por `status`: preparing/ready/delivered, §7.2 / FR-003) y el **historial de comandas con búsqueda** por fecha, responsable, mesa o cliente (FR-012). Un solo endpoint para ambos usos
- `GET /api/v1/public/orders/{token}` — **público**: vista de la comanda del cliente, accedida por el `publicToken` no adivinable del pedido (no por `id`). Devuelve solo campos seguros. Si la orden tiene `customerId`, incluye además los **otros pedidos del mismo cliente del día** (vista "mis pedidos del día"); el agrupado se hace por `customerId` + fecha, pero el acceso lo habilita el token, no el NIT (FR-015 / FR-019)
- `GET /api/v1/public/ready-orders` — **público**: alimenta la **pantalla "turnos de banco"** del local (FR-007). Devuelve ÚNICAMENTE los números de pedido en estado `ready` — sin nombre, mesa ni ningún otro dato (§2.8): `{ "data": [12, 15, 18] }`. Al marcarse `delivered`, el número desaparece
- `PATCH /api/v1/orders/{id}/status` — despacho marca `ready`/`delivered` ([§6.11b](#611b-orderstatusupdateresponse-despacho))
- `POST /api/v1/orders/{id}/pay` — confirmar pago: `pendingPayment` → `paid` ([§6.4b](#64b-payorderresponse-confirmar-pago-de-un-pendiente))
- `POST /api/v1/orders/{id}/cancel` — anular pedido pagado, motivo y detalle obligatorios ([§6.11](#611-cancelorderresponse-anulación-de-pedido-pagado))
- `GET /api/v1/customers?search=<ci|nit|nombre>` — buscar cliente registrado por CI, NIT o nombre (la cajera lo usa al facturar nominado)
- `POST /api/v1/customers` — registrar cliente ([§6.2a](#62a-customercreateresponse--customersearchresponse))
- `GET /api/v1/customers/{id}` — obtener datos del cliente
- `PATCH /api/v1/customers/{id}` — editar datos personales del cliente
- `POST /api/v1/inventory/adjust` — ajustar inventario (admin, con motivo)
- `GET /api/v1/inventory/dashboard` — **dashboard de stock cocido** por tipo de presa + delta del turno (vendido/ajustado desde la apertura) — FR-006
- `POST /api/v1/inventory/manual-consumption` — registrar consumos manuales por turno
- `GET /api/v1/inventory/shift-chicken-log/{shiftId}` — obtener el `ShiftChickenLog` del turno (al abrir, viene precargado con `reprocessRaw` = `rawLeftover` del último turno cerrado por `pieceType`)
- `POST /api/v1/inventory/shift-chicken-log` — registrar/actualizar el ciclo crudo del turno (reproceso, procesado, sobrante crudo, sobrante cocido en expositor) por tipo de presa
- `POST /api/v1/inventory/shift-chicken-log/{shiftId}/close` — cerrar el ShiftChickenLog del turno; dispara la reconciliación contra ventas y registra discrepancias
- `POST /api/v1/shifts/open` — abrir caja/turno **declarando el período** (el backend valida que exista y esté activo; **nunca lo infiere del reloj** — [PDR §13.3](../business/pdr.md#133-decisiones-residuales-pendientes-de-cierre-antes-de-v1)). Request en [§6.10](#610-cashopenresponse-éxito)
- `POST /api/v1/shifts/close` — cerrar caja/turno con arqueo ([§6.10b](#610b-cashcloseresponse-arqueo)). Además ejecuta el **cierre administrativo** de [PDR §4](../business/pdr.md#4-máquina-de-estados-de-pedidos): las órdenes `delivered` del turno transicionan a `closed` en la misma operación (extingue también las `DiscountAuthorization` y la sesión de cajera del turno)
- `GET /api/v1/shift-periods` — listar períodos del catálogo (admin y cajera — la pantalla de apertura los muestra)
- `POST /api/v1/shift-periods` — crear período (admin): `{ name, displayOrder, referenceStart?, referenceEnd? }`. Permite el tercer turno del futuro ("Tarde") **sin migración ni código nuevo**
- `PATCH /api/v1/shift-periods/{id}` — editar/desactivar período (admin). Los horarios de referencia son informativos: cambiarlos no reclasifica nada
- `POST /api/v1/expenses` — registrar gasto pagado desde caja (FR-009); error claro sin turno abierto. Aparece en arqueo y reportes; no se audita (§2.9). Sin GET de listado en V1 (se agrega con un caso real). Request en [§6.13](#613-expensecreateresponse-gasto-desde-caja--fr-009)
- `POST /api/v1/vouchers` — crear vale ([§6.7](#67-vouchercreateresponse))
- `GET /api/v1/vouchers` — listar vales con filtros
- `PATCH /api/v1/inventory/{id}/sale-price` — configurar el precio de venta por presa cocida (admin; alimenta el precio sugerido de la venta custom, §2.10)
- `POST /api/v1/discounts` — crear descuento (admin) ([§6.6b](#66b-discountcreateresponse-catálogo--admin))
- `GET /api/v1/reports/branches-summary` — **solo SUPER_ADMIN**: resumen consolidado de todas las sucursales (ventas, inventario, turnos activos).
- `GET /api/v1/discounts` — listar descuentos del catálogo (admin; filtros: `availability`, `active`). El POS **no consume este endpoint** en operación normal: los descuentos aplicables a la sesión llegan en `GET /pos/context`
- `PATCH /api/v1/discounts/{id}` — editar descuento (admin). Editar el `fixedAmount` NO afecta ventas pasadas: el snapshot quedó congelado en cada `OrderItem` (§2.11)
- `GET /api/v1/pos/context` — **carga del POS en UNA llamada** (§5.0, principio 6), liviana (solo datos activos, pocos KB): `products`+`variants`, `discounts` **ya filtrados por el backend** para la sesión (activos + ventana vigente + autorización si corresponde — el POS no filtra nada), `piecePrices` (para el precio sugerido custom **en el cliente**), `shiftPeriods` y `shift` activo (o `null`). Detalle y payload en [§6.12](#612-poscontextresponse-carga-del-pos-en-una-llamada)
- `POST /api/v1/discounts/{id}/authorize` — el admin otorga la **autorización por turno** a una sesión de cajera; deja `AuditLog` del acto de autorizar ([§6.6c](#66c-discountauthorizationresponse-admin-autoriza-a-la-sesión-de-cajera-por-turno))
- `GET /api/v1/discounts/authorizations` — listar autorizaciones vigentes del turno (filtro: `shiftId`, `cashierId`)
- `GET /api/v1/reports/sales` — reporte de ventas por turno/día y rango de fechas (FR-010a)
- `GET /api/v1/reports/inventory-presas` — reporte de inventario de presas: vendidas y restantes por tipo (FR-010b); consolida el inventario diario de ambos turnos (§2.3)
- `GET /api/v1/reports/cash-audit` — reporte de **arqueo** por turno o rango: apertura, cierre, ventas por método, gastos, vales, anulaciones y diferencia (FR-010c / §2.6)
  > Los tres reports aceptan `?format=csv` (default `json`) — FR-010 exige exportación a CSV
- `POST /api/v1/audit-logs/shift` — logs de auditoría de **UN turno** (admin; caja opcional = todas las del período). Sin paginación, resolución por FK directa (§4.3). Request/response en [§6.14](#614-auditlogsbyshiftresponse-consulta-del-rastro-por-turno--admin)
- `POST /api/v1/audit-logs/month` — logs de un **mes calendario** (admin), sin paginación; incluye los `shiftId = null` que no aparecen en `/shift`. Un **año** es export CSV de reportes (V2). Solo lectura en ambos; la consulta no se audita ([§6.14](#614-auditlogsbyshiftresponse-consulta-del-rastro-por-turno--admin))
- `POST /api/v1/print/invoice` — imprimir factura térmica (a demanda)
- `GET /api/v1/print/invoice/{orderId}/pdf` — descargar PDF factura (fallback)

## 5.2 Autenticación y autorización

> **Decisión V1 ([PDR §2.7](../business/pdr.md#27-roles-e-interfaces-v1-con-autenticación-jwt-y-control-de-permisos-por-rol-en-backend) / FR-018):** el control de permisos por rol se aplica **en el backend**, no solo en la UI. La UI oculta pantallas por comodidad, pero **la frontera de seguridad es el backend**: valida el token y el rol en **cada** petición.

### Enfoque elegido — liviano, sin Passport

Se usan los **guards de NestJS** de caja, con `@nestjs/jwt` directo (sin `@nestjs/passport`). Dos guards encadenados, ambos registrados **globales** vía `APP_GUARD` — así todo queda protegido por default y se abre solo lo necesario:

1. **`AuthGuard` (autenticación).** Corre primero. Extrae el token del header `Authorization: Bearer <token>`, lo verifica con `jwtService.verifyAsync(token)`:
   - sin token, o token **inválido / expirado** → lanza `UnauthorizedException` → **401**.
   - token OK → inyecta el payload en `request.user` (`{ sub, email, role, branchId }`) y deja pasar.
   - respeta el decorator **`@Public()`**: las rutas marcadas (ej. `POST /auth/login`) saltan la verificación.
2. **`RolesGuard` (autorización).** Corre después del `AuthGuard`. Lee los roles declarados con `@Roles(...)` usando `Reflector.getAllAndOverride([handler, class])`:
   - el endpoint **no declara** `@Roles` → pasa (autenticado alcanza).
   - declara roles y `request.user.role` **no** está en la lista → lanza `ForbiddenException` → **403**.

> **Bootstrap del sistema (SUPER_ADMIN):** el script de bootstrap (`pnpm bootstrap:admin` → `scripts/bootstrap-superadmin.ts`, reutilizado por el seeder) crea **siempre** un `SUPER_ADMIN` por defecto si no existe (idempotente), leyendo las credenciales de variables de entorno (`SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_FIRSTNAME`, `SUPER_ADMIN_LASTNAME`, `SUPER_ADMIN_CI`; defaults: `superadmin@wonderchicken.com` / CI `password123`, `branchId = null`). Es el usuario de **bootstrap**: tiene acceso global a todos los endpoints (el `RolesGuard` lo deja pasar siempre, sin importar el `@Roles` declarado) y es el que permite crear el resto de la jerarquía de usuarios (admins, cajeras, etc.) vía `POST /users`. El login se hace con **email + CI** (la contraseña es el CI hasheado con bcryptjs). **No se abre ningún endpoint sin token** aunque la BD esté vacía — el bootstrap se resuelve con el script/seeder, no debilitando la seguridad.

### Piezas (qué archivo hace qué)

| Pieza | Rol en el sistema |
|------|-------------------|
| `@Public()` | Marca una ruta como abierta (sin token). Vía `SetMetadata(IS_PUBLIC_KEY, true)`. |
| `@Roles(UserRole.ADMIN, ...)` | Declara qué roles pueden tocar el handler. Vía `SetMetadata(ROLES_KEY, roles)`. |
| `AuthGuard` | Verifica el JWT, inyecta `request.user`, respeta `@Public()`. → 401 |
| `RolesGuard` | Compara `request.user.role` contra `@Roles`. → 403 |
| `JwtModule` | Firma/verifica el token (secret + expiración). |
| `bcryptjs` | Hashea/compara contraseñas en el login (`User.passwordHash`). |
| `ValidationPipe` (global) | Valida el body contra los DTOs (class-validator). |

> **Regla para campos UUID en DTOs:** usar `@IsUUID()` (sin argumento de versión). No usar `@IsUUID('4')` — los IDs generados por la aplicación (especialmente con `uuid(7)` en Prisma) no son UUIDv4 y la validación fallaría innecesariamente.

> **Por qué guards y no middleware:** el middleware corre **antes** del routing y no conoce el handler destino, así que no puede leer el `@Roles` de ese endpoint. El guard corre **después** del routing, con `ExecutionContext` completo, y por eso puede leer los metadatos del decorator. La autorización por rol **va en guard**, no en middleware.

### Snippets de referencia (patrón NestJS estándar)

```typescript
// roles.decorator.ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// public.decorator.ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

```typescript
// roles.guard.ts (autorización)
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required) return true;               // endpoint sin @Roles → autenticado alcanza
    const { user } = ctx.switchToHttp().getRequest();
    return required.includes(user.role);      // false → 403 ForbiddenException
  }
}
```

```typescript
// app.module.ts — ambos guards globales, orden importa (Auth primero)
providers: [
  { provide: APP_GUARD, useClass: AuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
];
```

```typescript
// uso en un controller
@Roles(UserRole.CASHIER)
@Post('orders')                 // solo cajera
registrarVenta() { /* ... */ }

@Roles(UserRole.ADMIN, UserRole.CASHIER)
@Get('vouchers')                // dos roles, sin función nueva
listarVales() { /* ... */ }
```

### Matriz de autorización endpoint → roles

Es la **spec que el `RolesGuard` implementa** — aterriza la matriz de negocio del [PDR §2.7](../business/pdr.md#27-roles-e-interfaces-v1-con-autenticación-jwt-y-control-de-permisos-por-rol-en-backend) a roles por endpoint. `ADMIN` siempre puede operar lo administrativo; las lecturas que el POS necesita se abren a los roles que las consumen.

| Endpoint | Roles permitidos |
|----------|------------------|
| `POST /auth/login` | **público** (`@Public()`) |
| `POST /auth/logout` | cualquier rol autenticado |
| `POST /users`, `GET /users`, `PATCH /users/{id}`, `PATCH /users/{id}/toggle-active` | `ADMIN` |
| `POST /branches`, `GET /branches`, `PATCH /branches/{id}`, `PATCH /branches/{id}/toggle-active` | **`SUPER_ADMIN`** *(gestión de sucursales — FR-000; el `RolesGuard` deja pasar siempre al SUPER_ADMIN)* |
| `POST /products`, `POST /variants` | `ADMIN` |
| `GET /products` | `ADMIN`, `CASHIER` *(el POS lo consume)* |
| `POST /orders`, `POST /orders/custom` *(incluye descuentos por ítem vía `discountId`)* | `CASHIER` |
| `POST /orders/{id}/pay`, `POST /orders/{id}/cancel` | `CASHIER` |
| `GET /pos/context` | `CASHIER` |
| `GET /orders/{id}`, `GET /orders` *(panel despacho + historial)* | `CASHIER`, `DISPATCHER`, `ADMIN` |
| `PATCH /orders/{id}/status` (ready / delivered) | `DISPATCHER` |
| `GET /public/orders/{token}`, `GET /public/ready-orders` | **público** (token no adivinable / solo números de pedido) |
| `GET /customers`, `POST /customers`, `GET /customers/{id}`, `PATCH /customers/{id}` | `CASHIER`, `ADMIN` |
| `POST /shifts/open`, `POST /shifts/close` | `CASHIER` |
| `GET /shift-periods` | `CASHIER`, `ADMIN` *(la pantalla de apertura los muestra)* |
| `POST /shift-periods`, `PATCH /shift-periods/{id}` | `ADMIN` |
| `POST /expenses` | `CASHIER` |
| `POST /vouchers` | `CASHIER` |
| `GET /vouchers` | `CASHIER`, `ADMIN` |
| `POST /print/invoice`, `GET /print/invoice/{id}/pdf` | `CASHIER` |
| `POST /inventory/adjust` | `ADMIN` |
| `PATCH /inventory/{id}/sale-price` | `ADMIN` |
| `POST /inventory/manual-consumption` | `COOK` |
| `POST/GET /inventory/shift-chicken-log[...]` | `COOK` |
| `POST /discounts`, `PATCH /discounts/{id}` | `ADMIN` |
| `GET /discounts` | `ADMIN` *(el POS recibe los aplicables en `GET /pos/context`)* |
| `POST /discounts/{id}/authorize`, `GET /discounts/authorizations` | `ADMIN` |
| `GET /inventory/dashboard` | `ADMIN`, `COOK` *(FR-008: el cocinero ve el dashboard)* |
| `GET /reports/sales`, `GET /reports/inventory-presas`, `GET /reports/cash-audit` | `ADMIN` |
| `POST /audit-logs/shift`, `POST /audit-logs/month` | `ADMIN` |

> El **payload del JWT** lleva `{ sub: userId, email, role, branchId }`; el `RolesGuard` compara `role` contra la columna de arriba. El código de error de contrato para el 403 es `FORBIDDEN` (ver §5.4).

### Sesión única por turno (FR-008b)

Dentro de un mismo turno, un usuario solo puede tener **1 sesión activa con 1 rol** ([PDR §2.7](../business/pdr.md#27-roles-e-interfaces-v1-con-autenticación-jwt-y-control-de-permisos-por-rol-en-backend)). El login rechaza abrir una segunda sesión con otro rol en el turno vigente con un mensaje claro. No es responsabilidad del guard sino del servicio de auth/turnos.

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
- `code` será string estable: `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `INSUFFICIENT_STOCK`, `DISCOUNT_NOT_AVAILABLE` (descuento inactivo o fuera de su ventana de disponibilidad — rechaza la creación de la orden completa), `DISCOUNT_NOT_AUTHORIZED` (la sesión de cajera no tiene autorización vigente para ese descuento), etc. *Nota: no existe `DISCOUNT_ALREADY_APPLIED` — con un único campo `discountId` por ítem en el payload de creación, el apilamiento es **irrepresentable por construcción** (no hay estado inválido que validar).*
- En NestJS se implementará con `ValidationPipe` + excepciones HTTP + `ExceptionFilter` global para mantener este contrato en todos los endpoints.

---

# 6. JSON payloads de ejemplo (request/response por endpoint)

> Los requests son **ejemplos representativos**; los DTOs definitivos se validan con `class-validator`. Las notas por endpoint dicen solo el dato **propio** de ese endpoint — los principios transversales (actor/turno derivados, precios calculados por el backend, referencias no copias) viven en [§5.0](#50-principios-de-diseño-de-la-api-el-backend-manda-el-frontend-renderiza).

## 6.0 AuthLoginResponse

**`POST /api/v1/auth/login`** — **público**. Devuelve el JWT que el resto de llamadas envía como `Bearer`.

Request:
```json
{ "email": "roxana@wonderchicken.com", "password": "12345678" }
```
Response (200):
```json
{
  "isSuccess": true,
  "message": "Login exitoso",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
> La contraseña es el **CI** del usuario (se compara contra `passwordHash`, hash bcrypt del CI). Sin token o token expirado/inválido en el resto de endpoints → **401**. Rol no autorizado → **403** (`FORBIDDEN`).

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

## 6.2a CustomerCreateResponse / CustomerSearchResponse
> Alta de cliente para factura nominada (el cliente puede dictar CI o NIT). La búsqueda (`GET /customers?search=<ci|nit|nombre>`) devuelve un array con la misma forma en `data`.

Request (`POST /customers` — `nit`, `birthDate`, `phone` y `email` opcionales):
```json
{ "ci": "8351427", "nit": "120558027", "firstName": "MARCO", "lastName": "ORTEGA GUTIERREZ",
  "sex": "HOMBRE", "birthDate": "1990-03-14", "phone": "71234567", "email": "marco.ortega@example.com" }
```
Response (201):
```json
{
  "isSuccess": true,
  "message": "Cliente registrado correctamente",
  "data": {
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
}
```

## 6.3 OrderCreateResponse (mesa, pagado, con sustitución)

Request (`POST /orders` — datos mínimos según §5.0; `customerId` opcional = venta anónima "S/N"; el ítem que lleva descuento manda su `discountId`):
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
      "selectedPieces": [ {"type":"pecho","qty":2}, {"type":"ala","qty":2} ],
      "substitutions": [ {"from":"mixto","to":"arroz"} ]
    },
    { "productId": "uuid-product-fanta", "quantity": 1 }
  ]
}
```
Response:
```json
{
  "isSuccess": true,
  "message": "Pedido creado y pagado correctamente",
  "data": {
    "id": "uuid-order-001",
    "type": "MESA",
    "tableNumber": "70",
    "customerName": "GOMEZ",
    "customerId": "uuid-customer-001",
    "publicToken": "a3f9c2e81b4d7f60a9e35c8d2b1f4a7e",
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
    "createdBy": { "id": "uuid-user-roxana", "firstName": "Roxana", "lastName": "Fernández" },
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
    "createdBy": { "id": "uuid-user-roxana", "firstName": "Roxana", "lastName": "Fernández" }
  }
}
```

## 6.4b PayOrderResponse (confirmar pago de un pendiente)

**`POST /api/v1/orders/{id}/pay`** — transita `pendingPayment` → `paid`; **acá** se descuenta inventario y se contabiliza el ingreso (§4.1).

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

## 6.5 CustomOrderCreateResponse (orden LLEVAR custom — presas surtidas, vía `POST /api/v1/orders/custom`)

Request (la **única** excepción de precio de §5.0: el `unitPrice` es el **confirmado por la cajera**; el sugerido lo calculó el POS con los `piecePrices` de §6.12):
```json
{
  "type": "LLEVAR",
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
Response:
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
    "createdBy": { "id": "uuid-user-roxana", "firstName": "Roxana", "lastName": "Fernández" },
    "paidAt": "2026-05-01T13:20:00"
  }
}
```

## 6.6 OrderCreateWithDiscountResponse (descuento al personal POR PLATO en la creación — una sola llamada)
> El descuento viaja como **`discountId` en cada ítem** del request de `POST /orders` — **no existe llamada separada** para aplicarlo (§5.0, principio 6). El backend valida (disponibilidad + autorización), congela el snapshot por unidad y deriva los totales en la misma transacción. Acá: 3 Porciones Media (2 ítems: uno con qty 2 y otro con qty 1), las 3 con "Descuento personal" (7 Bs por plato, `endOfShift`) → `total = 90 − 21 = 69`. Los productos reales se registran tal cual y el inventario descuenta las presas reales.

Request (lo único que el front decide: referencias + cantidades):
```json
{
  "type": "MESA",
  "paymentStatus": "paid",
  "paymentMethod": "cash",
  "items": [
    {
      "productId": "uuid-product-porcion-media",
      "quantity": 2,
      "discountId": "uuid-discount-personal",
      "selectedPieces": [ {"type":"pierna","qty":2}, {"type":"entrepierna","qty":2} ]
    },
    {
      "productId": "uuid-product-porcion-media",
      "quantity": 1,
      "discountId": "uuid-discount-personal",
      "selectedPieces": [ {"type":"pecho","qty":1}, {"type":"ala","qty":1} ]
    }
  ]
}
```

Response (todo calculado por el backend, listo para pintar):
```json
{
  "isSuccess": true,
  "message": "Pedido creado y pagado correctamente",
  "data": {
    "id": "uuid-order-004",
    "type": "MESA",
    "status": "preparing",
    "paymentStatus": "paid",
    "originalAmount": 90.00,
    "items": [
      {
        "productId": "uuid-product-porcion-media",
        "quantity": 2,
        "unitPrice": 30.00,
        "discountId": "uuid-discount-personal",
        "discountAmount": 7.00,
        "totalPrice": 46.00,
        "selectedPieces": [
          {"type":"pierna","qty":2},
          {"type":"entrepierna","qty":2}
        ]
      },
      {
        "productId": "uuid-product-porcion-media",
        "quantity": 1,
        "unitPrice": 30.00,
        "discountId": "uuid-discount-personal",
        "discountAmount": 7.00,
        "totalPrice": 23.00,
        "selectedPieces": [
          {"type":"pecho","qty":1},
          {"type":"ala","qty":1}
        ]
      }
    ],
    "total": 69.00,
    "createdBy": { "id": "uuid-user-roxana", "firstName": "Roxana", "lastName": "Fernández" }
  }
}
```

## 6.6b DiscountCreateResponse (catálogo — admin)

Request (`POST /discounts`):
```json
{ "name": "Compensación al cliente", "fixedAmount": 7.00, "availability": "always",
  "requiresAuthorization": true, "active": true }
```
Response:
```json
{
  "isSuccess": true,
  "message": "Descuento creado correctamente",
  "data": {
    "id": "uuid-discount-compensacion",
    "name": "Compensación al cliente",
    "fixedAmount": 7.00,
    "availability": "always",
    "requiresAuthorization": true,
    "active": true
  }
}
```

## 6.6c DiscountAuthorizationResponse (admin autoriza a la sesión de cajera por turno)

Request (`POST /discounts/{id}/authorize` — solo `cashierId`; `shiftId` se deriva del turno activo de esa cajera, §5.0):
```json
{ "cashierId": "uuid-user-roxana" }
```
Response:
```json
{
  "isSuccess": true,
  "message": "Cajera autorizada para el descuento en este turno",
  "data": {
    "id": "uuid-auth-001",
    "discountId": "uuid-discount-compensacion",
    "shiftId": "uuid-shift-001",
    "cashierId": { "id": "uuid-user-roxana", "firstName": "Roxana", "lastName": "Fernández" },
    "authorizedBy": { "id": "uuid-user-admin", "firstName": "Admin", "lastName": "Sistema" },
    "authorizedAt": "2026-06-06T15:05:00"
  }
}
```

## 6.7 VoucherCreateResponse

Request (`POST /vouchers` — el `amount` **NO se envía**: el backend lo deriva de `productId` menos el snapshot del `discountId` si viene; `discountId` opcional):
```json
{ "workerName": "MARIA LOPEZ", "productId": "uuid-product-porcion-media", "discountId": "uuid-discount-personal" }
```
Response:
```json
{
  "isSuccess": true,
  "message": "Vale registrado correctamente",
  "data": {
    "id": "uuid-voucher-001",
    "code": "V-20260501-001",
    "workerName": "MARIA LOPEZ",
    "productName": "Porción Media",
    "originalAmount": 30.00,
    "discountId": "uuid-discount-personal",
    "discountAmount": 7.00,
    "amount": 23.00,
    "issuedBy": { "id": "uuid-user-roxana", "firstName": "Roxana", "lastName": "Fernández" },
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
    "userId": { "id": "uuid-user-roxana", "firstName": "Roxana", "lastName": "Fernández" }
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

Request (`POST /shifts/open` — el `periodId` viene preseleccionado en la pantalla como sugerencia **editable**, [PDR §13.3](../business/pdr.md#133-decisiones-residuales-pendientes-de-cierre-antes-de-v1); nunca inferido del reloj):
```json
{ "openingAmount": 200.00, "cashRegisterId": "uuid-caja-1", "periodId": "uuid-period-manana" }
```
Response:
```json
{
  "isSuccess": true,
  "message": "Caja abierta correctamente",
  "data": {
    "id": "uuid-shift-001",
    "cashierId": { "id": "uuid-user-roxana", "firstName": "Roxana", "lastName": "Fernández" },
    "cashRegister": { "id": "uuid-caja-1", "name": "Caja 1" },
    "period": { "id": "uuid-period-manana", "name": "Mañana" },
    "openingAmount": 200.00,
    "startAt": "2026-05-01T09:00:00"
  }
}
```

## 6.10b CashCloseResponse (arqueo)

**`POST /api/v1/shifts/close`** — cierra el turno y genera el arqueo con el desglose de §2.6 (PDR).

Request:
```json
{ "countedAmount": 1450.00 }
```
Response:
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

## 6.11 CancelOrderResponse (anulación de pedido pagado)

Request (`POST /orders/{id}/cancel` — `reason` y `details` obligatorios, FR-011b):
```json
{ "reason": "Cliente cambió de opinión", "details": "Se devolvió el dinero en efectivo. Sin factura emitida." }
```
Response:
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

## 6.11b OrderStatusUpdateResponse (despacho)

**`PATCH /api/v1/orders/{id}/status`** — la despachadora marca `ready` / `delivered`.

Request:
```json
{ "status": "ready" }
```
Response:
```json
{ "isSuccess": true, "message": "Estado actualizado",
  "data": { "id": "uuid-order-001", "status": "ready", "readyAt": "2026-05-01T22:15:00" } }
```

## 6.12 PosContextResponse (carga del POS en una llamada)
> `GET /api/v1/pos/context` — el POS carga con **una sola llamada liviana** (solo datos activos, sin históricos; el menú completo son ~15 productos → pocos KB). Los `discounts` ya vienen **filtrados por el backend** para esta sesión (activos + ventana vigente + autorización si corresponde): el POS pinta lo que recibe, no filtra nada (§5.0). Con `piecePrices` el POS calcula el **precio sugerido custom en el cliente**, sin más llamadas.
```json
{
  "isSuccess": true,
  "message": "Contexto POS",
  "data": {
    "shift": { "id": "uuid-shift-001", "orderCount": 27, "startAt": "2026-05-01T09:00:00",
               "period": { "id": "uuid-period-manana", "name": "Mañana" } },
    "shiftPeriods": [
      { "id": "uuid-period-manana", "name": "Mañana", "displayOrder": 1, "referenceStart": "09:00", "referenceEnd": "16:00" },
      { "id": "uuid-period-noche", "name": "Noche", "displayOrder": 2, "referenceStart": "16:00", "referenceEnd": "23:00" }
    ],
    "products": [
      {
        "id": "uuid-product-porcion-media",
        "name": "Porción Media",
        "basePrice": 30.00,
        "category": "Plato principal",
        "variants": [
          { "id": "uuid-variant-pm-mixto", "name": "Porción Media - Mixto",
            "components": [ {"type":"presa","count":2}, {"type":"acompanamiento","name":"mixto","count":1} ],
            "isDefault": true }
        ]
      },
      { "id": "uuid-product-coca-500", "name": "Coca Cola 500 ml", "basePrice": 8.00, "category": "Bebida", "variants": [] }
    ],
    "discounts": [
      { "id": "uuid-discount-personal", "name": "Descuento personal", "fixedAmount": 7.00, "availability": "endOfShift" }
    ],
    "piecePrices": [
      { "type": "pecho", "salePrice": 12.00 },
      { "type": "ala", "salePrice": 10.00 },
      { "type": "pierna", "salePrice": 11.00 },
      { "type": "entrepierna", "salePrice": 11.00 }
    ]
  }
}
```

## 6.13 ExpenseCreateResponse (gasto desde caja — FR-009)
> `POST /api/v1/expenses` — sin turno abierto → error claro (§5.0 para los derivados).

Request:
```json
{ "description": "Compra de arroz", "amount": 35.50, "paidBy": "cash" }
```
Response:
```json
{
  "isSuccess": true,
  "message": "Gasto registrado correctamente",
  "data": {
    "id": "uuid-expense-001",
    "description": "Compra de arroz",
    "amount": 35.50,
    "paidBy": "cash",
    "shiftId": "uuid-shift-001",
    "createdBy": { "id": "uuid-user-roxana", "firstName": "Roxana", "lastName": "Fernández" },
    "createdAt": "2026-05-01T11:20:00"
  }
}
```

## 6.14 AuditLogsByShiftResponse (consulta del rastro por turno — admin)
> `POST /api/v1/audit-logs/shift` — body mínimo `{ date, periodId, cashRegisterId? }`, **sin paginación** (un turno son ~50-80 filas). Resolución por **FK directa** (`Shift` por fecha+período+caja → `AuditLog.shiftId IN`), sin ventanas horarias. Filas **tal cual** están en `audit_logs` (rastro crudo), con `user` resuelto (§5.0), orden `timestamp DESC`. La respuesta **ecoa lo resuelto** (`period`, `shifts` con su caja) para transparencia.

Request (`cashRegisterId` opcional — omitido = todas las cajas de ese período):
```json
{ "date": "2026-07-07", "periodId": "uuid-period-noche" }
```

Response:
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
        "cashier": { "id": "uuid-user-roxana", "firstName": "Roxana", "lastName": "Fernández" } }
    ],
    "count": 2,
    "rows": [
      {
        "id": "uuid-audit-002",
        "entity": "Order",
        "entityId": "uuid-order-004",
        "action": "CREATE_SALE",
        "user": { "id": "uuid-user-roxana", "firstName": "Roxana", "lastName": "Fernández" },
        "timestamp": "2026-07-07T21:42:00",
        "details": {
          "total": 69.00,
          "paymentMethod": "cash",
          "discounts": [ { "discountId": "uuid-discount-personal", "amount": 7.00, "items": 3 } ]
        }
      },
      {
        "id": "uuid-audit-003",
        "entity": "Shift",
        "entityId": "uuid-shift-002",
        "action": "CLOSE_SHIFT",
        "user": { "id": "uuid-user-roxana", "firstName": "Roxana", "lastName": "Fernández" },
        "timestamp": "2026-07-07T23:05:00",
        "details": { "expected": 1455.00, "counted": 1450.00, "difference": -5.00 }
      }
    ]
  }
}
```

**`POST /api/v1/audit-logs/month`** — misma forma de fila, ventana = mes calendario:

Request / response (resumen):
```json
{ "month": "2026-07" }
```
```json
{ "isSuccess": true, "message": "Registros de auditoría del mes",
  "data": { "month": "2026-07", "count": 3180, "rows": [ "..." ] } }
```
> Día sin turnos en el período pedido → `shifts: []`, `rows: []` (no es error). `/month` incluye también los logs con `shiftId = null` (acciones de admin fuera de turno), que no aparecen en `/shift`. Un **año** completo no se consulta por acá: es un export CSV de reportes (V2).

**`GET /api/v1/shift-periods`** — catálogo para la pantalla de apertura y el admin:
```json
{ "isSuccess": true, "message": "Períodos de turno",
  "data": [
    { "id": "uuid-period-manana", "name": "Mañana", "displayOrder": 1, "referenceStart": "09:00", "referenceEnd": "16:00", "active": true },
    { "id": "uuid-period-noche", "name": "Noche", "displayOrder": 2, "referenceStart": "16:00", "referenceEnd": "23:00", "active": true }
  ] }
```

---

# 7. OpenAPI skeleton (recomendación)

El LLM debe generar `openapi: 3.0.3` con:
- `securitySchemes` JWT Bearer
- `paths` para todos los endpoints listados en §5.1
- `tags` para agrupar requests (Products, Orders, Pos, Inventory, Shifts, Expenses, Vouchers, Discounts, Reports, Audit, Print)
- `components/schemas` con los DTOs de request y response
- Ejemplos de request/response basados en los payloads de §6

---

# 8. Test cases E2E (casos prioritarios)

1. Crear producto + variante → aparece en POS.
2. Registrar venta MESA con sustitución → precio NO cambia; inventario decrementa al confirmar pago.
2b. Pedido estándar con bebida agregada y extras opcionales: `items = [Porción Media (30, sin bebida incluida), Bebida 2L (16)]` → `total = 46` (suma de ítems). Agregar también Porción de Papas (12) → `total = 58`. Un pedido de solo el plato (sin extras ni bebidas) → `total = 30`. Extras y bebidas sueltas son **opcionales**; cada uno es un `Product` y el backend calcula `Σ(unitPrice × quantity)`.
3. Registrar venta LLEVAR `pendingPayment` → comanda se prepara; inventario NO decrementa hasta confirmar pago.
4. Pedido `pendingPayment` cancelado manualmente por la cajera → inventario nunca tocado, ingreso nunca contabilizado, no requiere motivo. (No existe auto-cancelación por tiempo.)
5. Crear orden custom LLEVAR vía `POST /api/v1/orders/custom` (item con `customPieces`: 2 pechos + 1 ala + 1 papa + 1 cocacola) → el sistema devuelve un **precio sugerido** = `2×salePrice(pecho) + 1×salePrice(ala) + precio papa + precio cocacola`; la cajera lo **pisa** con un precio distinto → se persiste el precio **confirmado**, no la sugerencia. Al pagar, decrementa exactamente 2 pechos, 1 ala y 1 cocacola. La orden queda con `type = LLEVAR` y `isCustom = true` (no existe `type = CUSTOM`).
6. Abrir caja → registrar ventas (incl. vale, anulación, orden con descuento) → cerrar caja → arqueo correcto con desglose por método, vales y descuentos.
7. Emitir vale → el front manda `productId` (sin `amount`) → el backend deriva `originalAmount` del producto y el `amount` = original; aparece en arqueo y en listado de vales; decrementa inventario.
7b. Emitir vale con "Descuento personal": front manda `productId` + `discountId` → backend calcula `amount = originalAmount − discountAmount` (ej. 30 − 7 = 23, snapshot del descuento); el inventario descuenta las presas reales (no el equivalente al precio); el vale registra `originalAmount`, `discountAmount` y `amount`. Fuera de la ventana `endOfShift` el descuento no se ofrece.
8. Pedido `preparing` → comanda digital aparece en panel despacho → marcar `ready` → pantalla pública muestra → marcar `delivered`.
9. Cliente accede a `GET /public/orders/{token}` con el `publicToken` de su pedido → ve su comanda; probar un token aleatorio o el `id` interno → **404** (el token es no adivinable, FR-015).
9b. Registrar cliente nuevo vía `POST /customers` → queda buscable por CI **y** por NIT vía `GET /customers?search=`. Crear orden con ese `customerId` → al abrir el `publicToken` de uno de sus pedidos, la vista lista **todos sus pedidos del día** (agrupados por `customerId` + fecha). Acceder con el NIT crudo en la URL → no funciona (el NIT no es llave; FR-019).
9c. Venta anónima "S/N" (sin `customerId`) → su `publicToken` muestra **solo ese pedido**; no hay vista del día porque no hay identidad para agrupar.
10. Cliente pide factura → impresora térmica imprime; impresora desconectada → PDF se descarga.
11. Anular pedido pagado → motivo y detalles obligatorios → inventario revertido → aparece en arqueo.
12. Reconciliación diaria: comparar `InventoryTransaction` vs `InventoryItem.currentStock`.
13. Descuento al personal POR PLATO en **una sola llamada**: `POST /orders` con 3 Porciones Media (30 Bs c/u) donde cada ítem lleva `discountId` del "Descuento personal" (7 Bs por plato, `endOfShift`) → la orden se crea con `originalAmount = 90`, cada ítem con `discountAmount = 7` (snapshot por unidad) y `total = 90 − 21 = 69`, todo en la misma transacción (sin segunda llamada); los productos reales e inventario (6 presas) descuentan correcto; caja cuadra; el audit `CREATE_SALE` incluye los descuentos en `details`. Mandar `discountId` solo en 2 de los 3 platos → descuento 14, `total = 76`. Fuera de la ventana de fin de turno, la creación se rechaza completa con `DISCOUNT_NOT_AVAILABLE` (no se crea orden parcial).
13b. Descuento que requiere autorización: sin `DiscountAuthorization`, `POST /orders` con ítems que llevan `discountId` de "Compensación al cliente" (7 Bs por plato, `always`, `requiresAuthorization`) se rechaza con `DISCOUNT_NOT_AUTHORIZED`. El admin autoriza la sesión de cajera vía `POST /discounts/{id}/authorize` (queda `AuditLog`) → la cajera crea **una o varias órdenes** del turno con ese `discountId` en los platos afectados, sin renovar la autorización por orden ni por plato. Al cerrar el turno la autorización deja de estar vigente y no pasa al turno siguiente.
13c. Snapshot del monto: crear una orden con platos a 7 Bs de descuento → el admin luego edita el `Discount` a 10 Bs (`PATCH /discounts/{id}`) → los ítems viejos conservan `discountAmount = 7`; una orden nueva toma 10.
13d. Contexto POS: `GET /pos/context` con sesión de cajera autorizada para "Compensación al cliente" → `discounts` incluye ambas instancias vigentes; sin autorización → "Compensación al cliente" NO aparece (el backend filtra, el POS no); fuera de la ventana de fin de turno → "Descuento personal" NO aparece. `piecePrices` trae los 4 `salePrice` y el precio sugerido custom se calcula en el cliente sin llamadas adicionales.
14. Cocinero registra consumos manuales al cierre → se vinculan al `Shift` y aparecen en reporte diario.
14b. Ciclo crudo de presas — continuidad entre turnos: al cierre del turno mañana, cocinero registra `ShiftChickenLog` con `rawLeftover = 64` para cada `pieceType`. Al abrir el turno noche, `GET /api/v1/inventory/shift-chicken-log/{shiftIdNoche}` devuelve `reprocessRaw = 64` autopoblado por `pieceType`. Cocinero confirma o ajusta. Al cerrar el turno noche, el sistema reconcilia `(reprocessRaw + processedRaw − rawLeftover) − vendido_cocido_del_turno` vs `cookedLeftover` anotado y reporta discrepancia si existe.
15. Usuario logueado como CASHIER intenta logear como DISPATCHER en mismo turno → falla.
16. Registro de gastos (FR-009): `POST /expenses` con `{ description, amount, paidBy }` → el gasto queda ligado al turno activo de la cajera (`shiftId` derivado, no enviado) y aparece en el arqueo del cierre bajo `totals.expenses`; intentar registrar sin turno abierto → error claro; el gasto NO genera `AuditLog` (no es acción crítica §2.9).
17. Consulta de auditoría por turno (FK directa): generar ventas en turno Mañana y turno Noche del mismo día → `POST /audit-logs/shift` con `{ date, periodId: noche }` devuelve **solo** los logs con `shiftId` de ese turno (los de la mañana no aparecen), orden `timestamp DESC`, con `user`, `period` y `shifts` (con su `cashRegister`) resueltos; con **dos cajas** abiertas en el mismo período, agregar `cashRegisterId` al body separa los logs por caja y omitirlo devuelve ambas; día sin turnos → `shifts: []`, `rows: []` (no error); la respuesta NO tiene `page`/`pageSize` (sin paginación). Un `ADJUST_INVENTORY` del admin (sin turno, `shiftId = null`) NO aparece en `/shift` pero SÍ en `POST /audit-logs/month`. Con token de CASHIER → **403**. La consulta en sí NO crea filas de audit.
17b. Catálogo de períodos sin migración: el admin crea el período "Tarde" vía `POST /shift-periods` → aparece en `GET /shift-periods` y en `pos/context.shiftPeriods` → una cajera abre turno con ese `periodId` → `POST /audit-logs/shift` con ese período lo consulta normalmente. Todo sin tocar schema ni código. Los horarios de referencia son informativos: editarlos (`PATCH /shift-periods/{id}`) no reclasifica ningún turno existente.
17c. El período se declara, no se infiere: abrir un turno a las 20:00 declarando `periodId = Mañana` → el sistema lo acepta (el reloj NO clasifica); `shifts/open` sin `periodId` → `VALIDATION_ERROR`.

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
| Pedido estándar multi-ítem (§2.2 / FR-002) | `Order.items[]` con N `Product` (platos + extras + bebidas, por `category`), cada uno con `quantity`; `total = Σ(unitPrice × quantity)`, `unitPrice` tomado de `Product.basePrice` por el backend |
| Venta custom de presas surtidas (§2.10) | Endpoint `POST /api/v1/orders/custom`; flag `Order.isCustom = true`; ítem con `customPieces: JSON` |
| Tipo de pedido (MESA / LLEVAR) (§2.8) | `Order.type: enum(MESA, LLEVAR)` — CUSTOM **no** es un valor de `type` |
| Sustitución de acompañamiento sin afectar precio (§2.1) | `OrderItem.substitutions: JSON` con `{from, to}`; sin campo de ajuste de precio |
| Feature de descuentos — catálogo (§2.11 / FR-016) | Entidad `Discount`; CRUD vía `/api/v1/discounts` |
| Aplicar descuento POR PLATO (§2.11 / FR-016) | `discountId?` por ítem en `POST /orders[/custom]` (una llamada, §5.0 princ. 6) → `OrderItem.discountAmount` (snapshot) + totales derivados |
| Instancias: descuento al personal / compensación al cliente (§2.11) | Filas del catálogo `Discount` referenciadas vía `OrderItem.discountId` (configs en [PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal)). Los antiguos `Order.internalDiscount`/`discountId`/`discountAmount` quedan **eliminados** |
| Autorización de descuentos por turno (§2.11 / FR-016b) | `DiscountAuthorization`; `POST /discounts/{id}/authorize`; se extingue al cerrar turno; acto auditado |
| Precio sugerido en venta custom (§2.10) — **V1** | `InventoryItem.salePrice` por presa cocida (config admin vía `PATCH /inventory/{id}/sale-price`); cálculo `sum(customPieces[].qty × salePrice) + extras + bebidas`; la cajera puede pisarlo, se persiste el confirmado |
| Pedido con pago pendiente (§2.5) | `Order.status = pendingPayment` + `paymentStatus = pending`; cancelación solo manual |
| Confirmación de pago | Endpoint `POST /api/v1/orders/{id}/pay`; transición a `paid` + decremento atómico de inventario |
| Anulación de pedido pagado (FR-011b) | Endpoint `POST /api/v1/orders/{id}/cancel` con `reason` + `details`; reversión de `InventoryTransaction` |
| Notificación de pedido listo (§2.8 / FR-007) | `Order.readyAt` registrado; pantalla pública lee órdenes con `status = ready` |
| Entrega del pedido | `Order.deliveredAt` + `Order.deliveredBy` |
| Inventario por presas (§2.3) | `InventoryItem.type ∈ {pecho, ala, pierna, entrepierna}`; decremento vía `InventoryTransaction` con `reason = sale` |
| Consumos manuales por turno (FR-017) | `DailyManualConsumption` ligado a `Shift` |
| Ciclo crudo de presas por turno — plano crudo (§2.3, FR-017) | `ShiftChickenLog` ligado a `Shift`; campos `reprocessRaw`, `processedRaw`, `rawLeftover`, `cookedLeftover` por `pieceType`; regla de continuidad entre turnos: `rawLeftover(T) → reprocessRaw(T+1)` vía autopoblado en `GET /shift-chicken-log/{shiftId}` |
| Vales (§2.4) | Entidad `Voucher`; `amount` **derivado** de `productId` (`originalAmount`) menos `discountAmount` si lleva "Descuento personal" (`discountId`, snapshot); `InventoryTransaction.reason = vale`; NO suma al ingreso de `Shift` |
| Apertura/cierre de caja por turno (§2.6) | Entidad `Shift` con `openingAmount`, `closingAmount`, `expectedAmount`, `discrepancy` |
| Caja = 1 cajera por turno (§2.7) | `Shift.cashierId` único activo por `cashRegisterId` |
| Sesión única por turno (FR-008b) | Constraint a nivel servicio: 1 sesión activa por `userId` por `shiftId` |
| Roles funcionales (§2.7) | `User.role: enum(ADMIN, CASHIER, DISPATCHER, COOK)` — enforcement por rol en el backend vía `RolesGuard` + `@Roles` (V1, FR-018); ver §5.2 |
| Auditoría de acciones críticas (§2.9) | `AuditLog` (+`shiftId?`: el log nace sabiendo su turno); consulta sin paginación vía `POST /audit-logs/shift` y `/month` (§4.3, §6.14) |
| Turnos del día y tercer turno futuro (§13.3 PDR) | Catálogo `ShiftPeriod` (no enum); `Shift.periodId` **declarado al abrir**, nunca inferido del reloj |
| Registro de gastos desde caja (§2.6 / FR-009) | `POST /expenses`; `shiftId`/`createdBy` derivados (§5.0); aparece en arqueo y reportes |
| Clientes y facturación nominada (§2.12 / FR-019) | Entidad `Customer` (`ci` único, `nit?`, datos personales); búsqueda por CI/NIT vía `GET /customers?search=`; `Order.customerId` opcional (anónimo = "S/N", legal ≤ Bs 1.000) |
| Vista del cliente — por pedido y pedidos del día (§7.4 / FR-015 / FR-019) | `Order.publicToken` no adivinable; `GET /public/orders/{token}` (público); identidad (`customerId`) **agrupa** los pedidos del día, el **token** da acceso — el NIT no es llave |
| Visión V2: auto-servicio (§2.10) | El cliente arma su pedido custom; el total se calcula automáticamente con `InventoryItem.salePrice` (ya definido en V1), sin intervención de la cajera |
| Visión V2: cuenta de cliente (§2.12 / §7.4) | Auto-registro + login del cliente; `GET /me/orders` seguro por auth, sin token por pedido |

---

## Notas finales

- Este documento se mantiene sincronizado con el PDR. Cuando una regla de negocio cambia, esta guía se actualiza en consecuencia, **nunca al revés**.
- Las **decisiones residuales** (umbral de discrepancia de arqueo, política contable de vales, etc.) están en [PDR §13.3 / §14](../business/pdr.md) — no se duplican aquí.
- Las **decisiones de scope V1 vs V2** están en [PDR §13](../business/pdr.md) — este documento solo refleja **detalles técnicos** de cada decisión.


