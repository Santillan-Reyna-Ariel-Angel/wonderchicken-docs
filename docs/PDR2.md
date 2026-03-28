# Product Requirements Document (PRD)  
**Sistema Informático de Ventas — Wonder Chicken**  
**Rol del autor:** Senior Product Manager / Arquitecto de Sistemas (digitalización de servicios de comida rápida)  
**Versión:** 1.0  
**Fecha:** 2026-03-19  
**Alcance:** Documento de negocio y requisitos funcionales / no funcionales para que un LLM genere backend y frontend coherentes con las reglas operativas del restaurante.

---

## CITAS TEXTUALES DEL DOCUMENTO
**SITUACIÓN PROBLEMÁTICA:** Después de haber realizado un análisis de observación al flujo de trabajo del restaurante Wonder Chicken, examinar el funcionamiento de su sistema informático genérico y haber sostenido una entrevista con el dueño del restaurante, se identificaron los siguientes problemas:
- El sistema actual no se adecua a la forma de trabajo del restaurante, pues no admite el registro de nuevas variantes de los productos, por ejemplo: Una porción media consta de 2 presas de pollo + 1 porción de papa frita; pero también la porción de papa frita puede ser sustituida por 1 porción de arroz o 1 porción de Smiles McCain. Además, el sistema actual no permite diferenciar entre los pedidos para llevar y los de mesa. También dicho sistema no contempla el registro de vales de productos que opcionalmente un trabajador puede solicitar. 
Estas limitaciones obligan a realizar anotaciones manuales en la comanda del pedido, lo que dificulta el trabajo y muchas veces genera confusiones.
- Actualmente, no existe un método rápido y sencillo para obtener la cantidad de pollo, es decir la cantidad de presas vendidas y las que permanecen en cocina. Para obtener esta información, el personal de cocina debe realizar un conteo manual de las presas restantes antes de cada cambio de turno.
- Interfaz sobrecargada que dificulta el trabajo de la cajera, actualmente el sistema muestra todas las opciones que posee; pero varias de estas opciones no son necesarias o no están disponibles debido a la falta de privilegios necesarios de la cajera. Esto genera dificultades en el aprendizaje del uso del sistema, ya sea para el personal actual o nuevo.
- Cuando el negocio está lleno y las despachadoras necesitan entregar un pedido, se ven obligadas a gritar el nombre del cliente o ir a buscarlo a su mesa. Esta situación resulta incómoda tanto para las despachadoras como para el cliente y además ralentiza el trabajo. Este escenario también ocurre debido a que algunos clientes eligen sentarse en mesas distantes.

**PROBLEMA CENTRAL:** El sistema de ventas en el restaurante “Wonder Chicken” no se adapta a las nuevas necesidades relacionadas con el flujo de atención al cliente, lo que ocasiona dificultades en la atención adecuada de los pedidos.

**OBJETIVO GENERAL:** Desarrollar un sistema informático de ventas para el restaurante Wonder Chicken para agilizar el proceso de venta y mejorar el flujo de atención al cliente.

**OBJETIVOS ESPECÍFICOS:**
- Analizar las funcionalidades del sistema actual para incorporar aquellas que sean de utilidad al nuevo desarrollo.
- Desarrollar un módulo de administración que permita la creación de nuevos productos y sus variantes para evitar las anotaciones manuales de las cajeras.
- Facilitar la información de las presas de pollo restantes en cocina como la cantidad vendida mediante una interfaz, para evitar la pérdida de tiempo que conlleva el conteo manual.
- Brindar interfaces limpias, de fácil uso y diferenciadas en base al tipo de usuario para mejorar su trabajo y el aprendizaje del sistema.
- Proporcionar un módulo para anunciar al cliente que su pedido está listo, con el fin de mejorar su experiencia y agilizar el trabajo de las despachadoras.

---

## WONDER CHICKEN - MENÚ (2026)
Platos pricipales:  
1. Cuarto de Pollo (2 presas) - 23 Bs.  
2. Porción Media (2 presas + porción mixto de papa y arroz) - 30 Bs.  
3. Wonder (2 presas + porción mixto + mocochinchi o gaseosa de 500 ml) - 36 Bs.  
4. Medio Pollo (4 presas) - 46 Bs.  
5. Porción Completa (4 presas + porción mixto) - 54 Bs.  
6. Super Wonder (4 presas + porción mixto + mocochinchi o gaseosa de 500 ml) - 58 Bs.  
7. Wonder Pop (300 g de trozos de filete de pechuga + porción de papa o arroz o mixto) - 33 Bs.

Bebidas:  
- Mocochinchi 500 ml - 6 Bs.  
- Bebidas 500 ml - 8 Bs.  
- Bebidas 2 litros - 16 Bs.

Extras:  
- Porción de Arroz - 8 Bs.  
- Smiles McCain - 12 Bs.  
- Porción de Plátano - 8 Bs.  
- Porción de Papas - 12 Bs.  
- Mixto (papa y arroz) - 10 Bs.

NOTA: Combos mixtos por escasez de papa.  
OBSERVACIÓN: Venta de presas surtidas.

---

## EJEMPLO DE INVENTARIO DIARIO
(Se mantiene el ejemplo tal cual como figura en tu PDR; incluye reproceso, procesado, sobrante procesado y la tabla de inventario por códigos y productos — la información será usada para modelar la base de datos y reglas de inventario.)

---

## EJEMPLO DE COMANDAS/TICKETS (Impresas por el sistema actual a remplar)
(Se mantienen los ejemplos de tickets tal cual están en tu PDR; serán la referencia para el formato de impresión y los campos obligatorios en la factura/comanda.)

---

# 1. Resumen ejecutivo (versión para desarrollo LLM)
**Contexto:** Wonder Chicken es un restaurante de servicio rápido con alta rotación de pedidos y necesidad de control por presas de pollo. El sistema actual es genérico y no cubre variantes, control de presas, notificaciones eficientes ni manejo claro de vales.  
**Propósito del PRD:** Proveer al LLM un conjunto completo y no ambiguo de reglas de negocio, modelos de datos, flujos y criterios de aceptación para generar backend y frontend que cumplan con las operaciones reales del restaurante.  
**Alcance MVP:** Gestión de productos/variantes, POS (mesa/llevar), impresión de comandas, inventario por presas, control de caja por turno, vales, notificaciones de pedido listo, roles y permisos, reportes básicos, historial de comandas, soporte para impresoras térmicas locales.

---

# 2. Reglas de negocio (definitivas y no negociables)
> Estas reglas son la base para el diseño de la base de datos, la lógica de negocio y las pruebas. El LLM debe implementarlas tal cual.

## 2.1 Precios y sustituciones
- **Regla principal:** Si el cliente sustituye un acompañamiento, **el precio se recalcula** sumando el precio del componente elegido.  
- **Límite:** Por ítem se permite **1 sustitución principal** (acompañamiento). Sustituciones adicionales se registran como extras con su precio.  
- **Registro:** Cada sustitución queda registrada en `OrderItem.substitutions` con `from`, `to`, `priceDelta`.

## 2.2 Variantes y componentes
- **Variant** = componentes obligatorios (presas) + componentes por defecto (mixto) + opciones (bebida/extras).  
- **Precio final** = `product.basePrice + sum(variant.priceDelta) + sum(extras.price)`.  
- **Composición visible:** En el POS y en el ticket se debe mostrar la descomposición (ej.: 2 - PECHO-ALA; 1 - COCA COLA 500 ml).

## 2.3 Inventario por presas
- **Unidad:** presas (integer) por tipo: `pecho`, `ala`, `pierna`, `entrepierna`.  
- **Decremento automático:** Al confirmar la orden y pasar a `preparing` (o en la transición definida), el sistema decrementa inventario por tipo según la selección del cliente.  
- **Regla de pares:** Los platos que indican “2 presas” consumen exactamente 2 unidades; si el cliente especifica `pecho-ala`, se decrementa 1 pecho y 1 ala.  
- **Sobrante procesado:** Al cierre de día se registra `sobranteProcesado` y puede marcarse para venta interna (vale) con descuento.

## 2.4 Vales (ventas internas)
- **Naturaleza:** Registro como crédito a nómina (`Voucher`), no retiro inmediato de caja.  
- **Flujo:** Cajera registra el vale → `Voucher` creado con `issuedBy` → aparece en arqueo como `vale` → se descuenta en nómina mensual.  
- **Autorización:** Cajera puede emitir; vales por encima de un umbral requieren aprobación de `ADMIN` (umbral: POSPONIBLE).

## 2.5 Pedidos delivery y pago pendiente
- **Estados:** `pendingPayment` permitido.  
- **Inventario:** No se decrementa inventario hasta confirmación de pago (configurable).  
- **Cancelación:** Si el delivery no paga al retirar, la orden se marca `cancelled` y no se contabiliza.

## 2.6 Caja y arqueo
- **Turno:** Cada `Shift` tiene `openingAmount` y `closingAmount`.  
- **Arqueo:** Debe listar ventas por método (efectivo, tarjeta, vale), gastos, vales emitidos y discrepancias.  
- **Discrepancias:** Se registran para auditoría; umbral de alerta: POSPONIBLE (definir con administrador).

## 2.7 Roles y permisos
- **Roles:** `ADMIN`, `CASHIER`, `DISPATCHER`, `COOK`.  
- **Permisos clave:**  
  - `ADMIN`: modificar inventario, anular facturas, aprobar vales.  
  - `CASHIER`: registrar ventas, emitir vales (registro), abrir/cerrar caja.  
  - `DISPATCHER`: ver cola, marcar `ready`/`delivered`.  
  - `COOK`: ver pedidos en preparación, registrar entradas de presas (si autorizado).

## 2.8 Tickets y notificaciones
- **Campos obligatorios en ticket:** `orderId`, `customerName` (si aplica), `dateTime`, `items` (con componentes y sustituciones), `total`, `responsible`.  
- **Notificación:** Al pasar a `ready`, se publica en pantalla pública y suena alerta breve; la despachadora marca `delivered`.

## 2.9 Auditoría
- **Registro obligatorio:** `AuditLog` con `userId`, `shiftId`, `timestamp`, `action`, `details`. Todas las acciones críticas (registro de venta, anular venta, ajuste inventario, emisión de vale) quedan registradas.

---

# 3. Modelo de datos (esquema lógico para la BD)
> Entidades principales y campos mínimos. Diseñado para ORM (Prisma/TypeORM) y para que el LLM genere migraciones.

### 3.1 Entidades principales (resumen)
- **Product**  
  - `id: UUID`, `name: string`, `basePrice: decimal`, `category: string`, `active: boolean`, `description: string`

- **Variant**  
  - `id: UUID`, `productId: UUID`, `name: string`, `components: JSON`, `priceDelta: decimal`, `isDefault: boolean`

- **Component** *(opcional)*  
  - `id: UUID`, `name: string`, `type: enum(presa, acompanamiento, bebida, extra)`, `unitPrice: decimal`

- **Order**  
  - `id: UUID`, `type: enum(MESA,LLEVAR)`, `tableNumber: string?`, `customerName: string?`, `status: enum(created,confirmed,preparing,ready,delivered,closed,pendingPayment,cancelled,onHold)`, `paymentStatus: enum(pending,paid,partial)`, `total: decimal`, `createdBy: userId`, `createdAt: datetime`, `shiftId: UUID`

- **OrderItem**  
  - `id: UUID`, `orderId: UUID`, `productId: UUID`, `variantId: UUID?`, `quantity: int`, `unitPrice: decimal`, `totalPrice: decimal`, `notes: string?`, `substitutions: JSON?`

- **InventoryItem**  
  - `id: UUID`, `sku: string`, `name: string`, `unit: enum(presa,bolsa,unidad)`, `type: enum(pecho,ala,pierna,entrepierna,insumo)`, `currentStock: int`, `unitMeasure: string`

- **InventoryBatch** *(opcional)*  
  - `id: UUID`, `inventoryItemId: UUID`, `batchCode: string`, `processedAt: datetime`, `quantityReceived: int`, `quantityRemaining: int`, `origin: string`

- **InventoryTransaction**  
  - `id: UUID`, `inventoryItemId: UUID`, `delta: int`, `reason: enum(sale,adjustment,reception,vale)`, `referenceId: UUID?`, `userId: UUID`, `timestamp: datetime`

- **Voucher (Vale)**  
  - `id: UUID`, `code: string`, `employeeId: UUID`, `amount: decimal`, `issuedBy: UUID`, `issuedAt: datetime`, `status: enum(issued,redeemed,cancelled)`, `note: string?`

- **User**  
  - `id: UUID`, `name: string`, `role: enum(ADMIN,CASHIER,DISPATCHER,COOK)`, `username: string`, `passwordHash: string`, `active: boolean`

- **Shift / CashRegister**  
  - `id: UUID`, `userId: UUID`, `startAt: datetime`, `endAt: datetime?`, `openingAmount: decimal`, `closingAmount: decimal?`

- **Expense**  
  - `id: UUID`, `description: string`, `amount: decimal`, `paidBy: enum(cash,register)`, `shiftId: UUID`, `createdAt: datetime`

- **NotificationLog**  
  - `id: UUID`, `orderId: UUID`, `channel: string`, `deliveredAt: datetime`, `acknowledgedBy: UUID?`

- **AuditLog**  
  - `id: UUID`, `entity: string`, `entityId: UUID`, `action: string`, `userId: UUID`, `timestamp: datetime`, `details: JSON?`

### 3.2 Relaciones clave
- `Product` 1..* `Variant`  
- `Order` 1..* `OrderItem`  
- `OrderItem` → `Product` / `Variant`  
- `InventoryTransaction` referencia `Order` o `Expense` por `referenceId`  
- `Shift` vincula `CashRegister` y `User`

---

# 4. Máquina de estados de pedidos (detallada)
**Estados:**  
`created → confirmed → preparing → ready → delivered → closed`  
Estados adicionales: `pendingPayment`, `cancelled`, `onHold`.

**Transiciones y reglas (detalladas):**
- **created → confirmed**  
  - Acción: cajera confirma pedido o se confirma pago inmediato.  
  - Efecto: genera comprobantes; si es pago inmediato, `paymentStatus = paid`.

- **confirmed → preparing**  
  - Acción: impresión de comanda para cocina; notificación a cocina.  
  - Efecto: **decremento atómico de inventario** por `OrderItem` (si `pendingPayment` no aplica).

- **preparing → ready**  
  - Acción: despachadora marca listo.  
  - Efecto: notificación a pantalla pública; `NotificationLog` creado.

- **ready → delivered**  
  - Acción: cliente recoge o delivery retira; despachadora marca entregado.  
  - Efecto: si pago pendiente, confirmar pago; registrar `deliveredAt`.

- **delivered → closed**  
  - Acción: cierre administrativo; orden archivada.

**Reglas transaccionales:**  
- El decremento de inventario y la confirmación de la venta deben ocurrir en una transacción atómica. Si falla inventario, la orden queda en `created`/`confirmed` con error y se notifica al usuario.

---

# 5. Requerimientos funcionales (completos) y criterios de aceptación
> Cada FR incluye criterio de aceptación mínimo, pensado para pruebas automáticas y E2E.

### FR-001 — Gestión de productos y variantes (Alta)
- **Funcionalidad:** CRUD de productos; crear variantes con componentes obligatorios/opcionales; definir precio base y `priceDelta`.  
- **Criterio de aceptación:** Administrador crea producto + variante; variante aparece en POS en <2s; variante muestra componentes y precio calculado.

### FR-002 — Registro de pedidos (POS) (Alta)
- **Funcionalidad:** POS para `CASHIER` con flujo rápido (selección → variante → pago/confirmación). Soporta mesa y llevar. Permite 1 sustitución por ítem y extras.  
- **Criterio de aceptación:** Crear pedido en ≤3 pasos; total correcto; `Order` creado y visible en cola de cocina.

### FR-003 — Emisión de comprobantes (Alta)
- **Funcionalidad:** Generar 2 comprobantes (cliente + cocina) imprimibles; guardar PDF en historial.  
- **Criterio de aceptación:** Al confirmar pedido, se generan 2 PDFs; ticket incluye sustituciones y responsable.

### FR-004 — Control de caja por turno (Alta)
- **Funcionalidad:** Apertura/cierre de caja; registrar ingresos/egresos; arqueo.  
- **Criterio de aceptación:** Apertura crea `Shift`; cierre bloquea ventas; arqueo exportable CSV.

### FR-005 — Vales de empleados (Media)
- **Funcionalidad:** Registrar vales, emitir `Voucher`, marcar `redeemed`.  
- **Criterio de aceptación:** Vale aparece en arqueo y reportes; puede marcarse `redeemed`.

### FR-006 — Inventario por presas (Alta)
- **Funcionalidad:** Registrar entradas de presas; decrementar por venta; dashboard de stock.  
- **Criterio de aceptación:** Venta decrementa stock; dashboard muestra `currentStock` por tipo; reconciliación diaria posible.

### FR-007 — Notificación de pedido listo (Alta)
- **Funcionalidad:** Pantalla pública con lista de pedidos `ready`; sonido breve; marcar `delivered`.  
- **Criterio de aceptación:** Pedido `ready` aparece en pantalla y suena alerta; despachadora marca `delivered`.

### FR-008 — Roles y permisos (Alta)
- **Funcionalidad:** Control de acceso por rol; vistas y acciones restringidas.  
- **Criterio de aceptación:** Intento de acción no permitida devuelve 403 y se registra en `AuditLog`.

### FR-009 — Registro de gastos (Media)
- **Funcionalidad:** Registrar gastos pagados desde caja; asociar a turno.  
- **Criterio de aceptación:** Gasto aparece en arqueo y reportes.

### FR-010 — Resumen y reportes (Alta)
- **Funcionalidad:** Reportes: ventas por turno, inventario de presas, arqueo de caja; export CSV.  
- **Criterio de aceptación:** Generar reporte por rango de fechas; export CSV.

### FR-011 — Pedidos con pago pendiente (Alta)
- **Funcionalidad:** Registrar pedidos `pendingPayment`; confirmar pago posteriormente.  
- **Criterio de aceptación:** `pendingPayment` no decrementa inventario; al confirmar pago, orden transita y decrementa inventario.

### FR-012 — Historial de comandas (Media)
- **Funcionalidad:** Guardar comandas del día; búsqueda por orderId/fecha/responsable.  
- **Criterio de aceptación:** Buscar y recuperar comanda en <2s.

### FR-013 — Interfaz limpia por rol (Alta)
- **Funcionalidad:** POS y paneles con vistas simplificadas por rol.  
- **Criterio de aceptación:** Usuarios ven solo opciones permitidas; pruebas de usabilidad muestran reducción de errores.

### FR-014 — Integración con impresoras de comandas (Media)
- **Funcionalidad:** Soporte para impresoras térmicas locales; fallback a PDF.  
- **Criterio de aceptación:** Impresión local funciona; si falla, PDF disponible y error registrado.

---

# 6. Requerimientos no funcionales (NFR)
- **Usabilidad:** POS en 3 pasos máximo; botones grandes; español por defecto.  
- **Rendimiento:** Respuesta objetivo en LAN: ≤300 ms para operaciones de venta; tolerancia a picos.  
- **Disponibilidad:** Modo local (on‑premise) con opción de sincronización a nube; objetivo 99.5% uptime en horario operativo.  
- **Seguridad:** Autenticación JWT; contraseñas hasheadas; roles y control de acceso por endpoint.  
- **Escalabilidad:** Backend modular; separación de servicios (productos, pedidos, inventario, notificaciones).  
- **Mantenibilidad:** Código TypeScript; pruebas unitarias y E2E.  
- **Localización:** Soporte para español; moneda Bs.  
- **Impresión:** Soporte para impresoras térmicas 7cm; PDF fallback.  
- **Auditoría:** Retención de logs de auditoría por al menos 1 año (configurable).

---

# 7. UX / UI — requisitos y pantallas clave
> Diseñar pantallas con foco en velocidad y claridad para personal con baja tolerancia a errores.

## 7.1 POS (Cajera)
- **Objetivo:** Registrar venta en ≤3 pasos.  
- **Elementos:** Categorías, búsqueda rápida, botones de producto, selección de variante, selector de sustitución (1), keypad numérico, total visible, botones: `Registrar Venta`, `Guardar Pendiente`, `Imprimir Comanda`, `Vale`.  
- **Atajos:** (opcional) teclas para categorías, confirmar venta, abrir caja, aplicar vale.

## 7.2 Panel Cocina / Despacho
- **Objetivo:** Cola clara de pedidos en preparación; marcar `ready` y `delivered`.  
- **Elementos:** Lista ordenada por emisión; filtros (preparando, listo); detalle por pedido; botón `Marcar listo` con confirmación.

## 7.3 Pantalla pública (clientes)
- **Objetivo:** Mostrar números/fichas listos; estilo tipo “turnos” de banco.  
- **Elementos:** Número/ficha, mesa (si aplica), sonido breve al aparecer.

## 7.4 Administración
- **Objetivo:** CRUD productos/variantes, inventario, usuarios, reportes.  
- **Elementos:** Formularios de producto, definición de variantes (componentes y precios), panel de inventario por presas, gestión de vales.

## 7.5 Impresión / Tickets
- **Formato:** Similar a ejemplos del PDR; incluir sustituciones y responsable.  
- **Fallback:** PDF descargable/visualizable.

---

# 8. API y contratos (resumen para LLM)
> El LLM debe generar un OpenAPI v3 skeleton. Aquí se listan endpoints críticos y payloads de ejemplo (anexo).

## 8.1 Endpoints principales (resumen)
- `POST /api/v1/products` — crear producto  
- `GET /api/v1/products` — listar productos  
- `POST /api/v1/variants` — crear variante  
- `POST /api/v1/orders` — crear orden (mesa/llevar)  
- `GET /api/v1/orders/{id}` — obtener orden  
- `PATCH /api/v1/orders/{id}/status` — cambiar estado  
- `POST /api/v1/inventory/adjust` — ajustar inventario  
- `POST /api/v1/shifts/open` — abrir caja/turno  
- `POST /api/v1/shifts/close` — cerrar caja/turno (arqueo)  
- `POST /api/v1/vouchers` — crear vale  
- `GET /api/v1/reports/sales` — reporte ventas  
- `POST /api/v1/print` — enviar a impresora / generar PDF

**Seguridad:** `Authorization: Bearer <token>` (JWT) en endpoints protegidos.

---

# 9. Anexos técnicos útiles (para LLM) — ejemplos y artefactos listos

**Estructura de exito**
```json
{
  "isSuccess": true,
  "message": "Operacion exitosa",
  "data": {}
}
```

**Estructura de error**
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

**Reglas que se usaran**
- Frontend validara flujo con `isSuccess`.
- `error` sera singular.
- `details` sera array.
- `code` sera string estable (`VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, etc.).
- En NestJS se implementara con `ValidationPipe` + excepciones HTTP + `ExceptionFilter` global para mantener este contrato en todos los endpoints.


## 9.1 JSON payloads de ejemplo (6)

**ProductCreateResponse (exito)**
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

**VariantCreateResponse (exito)**
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
    "priceDelta": 0.00,
    "isDefault": true
  }
}
```

**OrderCreateResponse (mesa, exito)**
```json
{
  "isSuccess": true,
  "message": "Pedido creado correctamente",
  "data": {
    "id": "uuid-order-001",
    "type": "MESA",
    "tableNumber": "70",
    "customerName": "GOMEZ",
    "status": "confirmed",
    "paymentStatus": "paid",
    "items": [
      {
        "productId": "uuid-product-wonder",
        "variantId": "uuid-variant-wonder",
        "quantity": 2,
        "unitPrice": 36.00,
        "totalPrice": 72.00,
        "substitutions": [
          {"from":"mixto","to":"mixto"}
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
    "createdBy": "user-roxana"
  }
}
```

**OrderCreateResponse (llevar, pendingPayment, exito)**
```json
{
  "isSuccess": true,
  "message": "Pedido creado en estado pendiente de pago",
  "data": {
    "id": "uuid-order-002",
    "type": "LLEVAR",
    "customerName": "MARCO ORTEGA",
    "status": "pendingPayment",
    "paymentStatus": "pending",
    "items": [
      {
        "productId": "uuid-product-porcion-media",
        "quantity": 3,
        "unitPrice": 30.00,
        "totalPrice": 90.00
      }
    ],
    "total": 90.00,
    "createdBy": "user-roxana"
  }
}
```

**InventoryAdjustResponse (exito)**
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

**CashOpenResponse (exito)**
```json
{
  "isSuccess": true,
  "message": "Caja abierta correctamente",
  "data": {
    "id": "uuid-shift-001",
    "userId": "user-admin",
    "openingAmount": 200.00,
    "startAt": "2026-03-19T09:00:00"
  }
}
```

## 9.2 OpenAPI skeleton (recomendación)
- El LLM debe generar `openapi: 3.0.3` con `securitySchemes` JWT Bearer, paths para los endpoints listados en la sección 8.1 y ejemplos de request/response basados en los payloads anteriores.

## 9.3 E2E test cases (resumen de 10 casos prioritarios)
1. Crear producto + variante → aparece en POS.  
2. Registrar venta mesa (combo con sustitución) → inventario decrementa correctamente.  
3. Registrar venta llevar `pendingPayment` → no decrementa inventario; confirmar pago → decrementa.  
4. Abrir caja → registrar ventas → cerrar caja → arqueo correcto.  
5. Emitir vale → aparece en arqueo; marcar `redeemed`.  
6. Pedido `preparing` → imprimir comanda cocina → marcar `ready` → pantalla pública muestra número.  
7. Impresora falla → PDF disponible y error registrado.  
8. Usuario sin permiso intenta anular venta → 403 y `AuditLog`.  
9. Reconciliación diaria: comparar `InventoryTransaction` vs `InventoryItem.currentStock`.  
10. Venta con descuento interno (personal) → registro con etiqueta `internalDiscount`.

---

# 10. Prioridad de trabajo y roadmap de entregas (MVP en sprints)
**Sprint 0 (planificación + DB):** Modelado de datos, decisiones POSPONIBLE (vales umbral, pendingPayment timeout), DDL/ER.  
**Sprint 1:** Productos/Variantes + POS básico (crear pedido, confirmar, imprimir comanda).  
**Sprint 2:** Inventario por presas (transacciones atómicas) + dashboard stock.  
**Sprint 3:** Caja/Shift/Arqueo + reportes básicos.  
**Sprint 4:** Notificaciones (pantalla pública) + impresoras + vales.  
**Sprint 5:** Auditoría, tests E2E, optimizaciones y despliegue local.

---

# 11. Despliegue, backups y sincronización
- **Modo inicial:** on‑premise (Linux o Windows) con Docker Compose recomendado.  
- **Sincronización:** Operar localmente; sincronización a nube en fases posteriores.  
- **Backups:** Copia diaria de BD y backups de logs; retención configurable.  
- **Conflictos de sincronización:** Priorizar cambios locales recientes; registrar conflictos para resolución manual.

---

# 12. Criterios de aceptación del MVP (resumen)
- POS funcional que permita registrar y confirmar ventas (mesa/llevar) con variantes y 1 sustitución.  
- Inventario por presas decrementado automáticamente y dashboard visible.  
- Apertura/cierre de caja con arqueo exportable.  
- Notificación de pedidos listos en pantalla pública.  
- Registro de vales y su aparición en arqueo.  
- Impresión de comandas (o PDF fallback) y almacenamiento de historial.

---

# 13. Riesgos y decisiones POSPONIBLES (para definir con administrador)
- Umbral de vales que requieren aprobación.  
- Tiempo máximo para `pendingPayment` antes de cancelar.  
- Umbral de discrepancia en arqueo que dispara auditoría.  
- Política exacta de contabilización de vales (contabilidad local).

---

# 14. Siguientes entregables que puedo generar (elige uno)
- **A.** Modelo ER y DDL listo para Prisma/TypeORM (recomendado como siguiente paso).  
- **B.** OpenAPI skeleton v1 con paths, schemas y ejemplos.  
- **C.** Anexo A: 6 JSON payloads ampliados y ejemplos de respuestas.  
- **D.** Anexo B: 10 E2E test cases con datos concretos y pasos.  

---

## Observación final (para el LLM y el equipo)
Este PRD está centrado en **reglas de negocio** y en la **consistencia transaccional** (ventas ↔ inventario ↔ arqueo). Mantén la implementación técnica separada en un documento de arquitectura. Antes de generar código, confirma las decisiones marcadas como **POSPONIBLE** con el administrador del restaurante (sesión 1–2 horas).  

Si confirmas, preparo de inmediato el **Modelo ER + DDL** (Prisma/TypeORM) y el **OpenAPI skeleton v1** para que el LLM pueda empezar a generar controladores, servicios y UI. ¿Cuál entregable quieres primero?