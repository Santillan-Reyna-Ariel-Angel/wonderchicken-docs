# Architecture Overview — Wonder Chicken Backend

**Propósito:** Servir como **mapa visual** del backend.
**Audiencia:** Quien recién aterriza en el repo y necesita entender (a) cómo se organizan los archivos del backend NestJS, (b) cómo viaja un request desde el frontend hasta la base de datos, y (c) qué endpoints existen y a qué recursos golpean.

**Fuentes:**
- Contexto / material de origen → [`business_context.md`](../business/business_context.md)
- Reglas de negocio → [`pdr.md`](../business/pdr.md)
- Modelo de datos + contrato API → [`technical_guide.md`](technical_guide.md)
- Esquema real → [`prisma/schema.prisma`](../../prisma/schema.prisma)

> Si un diagrama no coincide con el código, gana el código. Este documento se actualiza, no al revés.
>
> **Altitud de este documento:** la [§3](#3-modelo-relacional-vista-resumida-del-prisma) resume las **decisiones de modelado** para ubicarte, no para implementar. El modelo lógico completo vive en [`technical_guide.md` §3](technical_guide.md#3-modelo-de-datos-esquema-lógico-para-la-bd); los diagramas ER **se generan** desde [`prisma/schema.prisma`](../../prisma/schema.prisma), no se dibujan a mano.

---

## Índice

- [1. Arquitectura modular del backend (NestJS)](#1-arquitectura-modular-del-backend-nestjs)
- [2. Flujo interno: como viaja un request (lifecycle)](#2-flujo-interno-como-viaja-un-request-lifecycle)
- [3. Modelo relacional (vista resumida del Prisma)](#3-modelo-relacional-vista-resumida-del-prisma)
- [4. Como leer este documento mientras codeas](#4-como-leer-este-documento-mientras-codeas)
- [Referencias cruzadas](#referencias-cruzadas)

---

## 1. Arquitectura modular del backend (NestJS)

NestJS organiza el backend en **módulos**. Cada módulo encapsula un dominio del negocio (productos, pedidos, inventario, etc.) y expone su funcionalidad al resto vía `imports/exports`. Esto NO es opcional, es la columna vertebral de NestJS — si lo entendés acá, el resto del backend cae solo.

```mermaid
graph TB
    subgraph CORE["NUCLEO TECNICO"]
        MAIN[main.ts<br/>bootstrap]
        APP[AppModule<br/>raiz]
        PRISMA[PrismaModule<br/>singleton ORM]
        AUTH[AuthModule<br/>JWT + bcryptjs]
    end

    subgraph DOMINIO["MODULOS DE DOMINIO"]
        USERS[UsersModule]
        PRODUCTS[ProductsModule<br/>productos + variantes]
        ORDERS[OrdersModule<br/>estandar + custom + pagos]
        INVENTORY[InventoryModule<br/>cocido + crudo + consumos]
        VOUCHERS[VouchersModule<br/>vales]
        SHIFTS[ShiftsModule<br/>caja + arqueo]
        EXPENSES[ExpensesModule]
        REPORTS[ReportsModule]
        PRINT[PrintModule<br/>termica + PDF fallback]
        AUDIT[AuditModule]
    end

    subgraph INFRA["INFRAESTRUCTURA TRANSVERSAL"]
        FILTERS[ExceptionFilter<br/>contrato estandar isSuccess]
        PIPES[ValidationPipe<br/>DTOs class-validator]
        GUARDS[AuthGuard JWT<br/>+ RolesGuard @Roles]
        AUDITSVC[AuditService<br/>log explicito en la tx<br/>interceptor V2]
    end

    MAIN --> APP
    APP --> PRISMA
    APP --> AUTH

    APP --> USERS
    APP --> PRODUCTS
    APP --> ORDERS
    APP --> INVENTORY
    APP --> VOUCHERS
    APP --> SHIFTS
    APP --> EXPENSES
    APP --> REPORTS
    APP --> PRINT
    APP --> AUDIT

    AUTH -.usa.-> USERS
    ORDERS -.usa.-> INVENTORY
    ORDERS -.usa.-> SHIFTS
    ORDERS -.usa.-> PRODUCTS
    VOUCHERS -.usa.-> INVENTORY
    VOUCHERS -.usa.-> SHIFTS
    EXPENSES -.usa.-> SHIFTS
    REPORTS -.lee.-> ORDERS
    REPORTS -.lee.-> INVENTORY
    REPORTS -.lee.-> SHIFTS
    PRINT -.lee.-> ORDERS
    AUDIT -.escucha.-> ORDERS
    AUDIT -.escucha.-> VOUCHERS
    AUDIT -.escucha.-> INVENTORY
    AUDIT -.escucha.-> SHIFTS

    APP --> FILTERS
    APP --> PIPES
    APP --> GUARDS
    APP --> AUDITSVC
```

**Decisiones que el grafico hace explicitas:**

- `OrdersModule` es el **modulo mas pesado** porque concentra: orden estandar, orden custom ([PDR §2.10](../business/pdr.md#210-ventas-custom-presas-surtidas)), confirmacion de pago, anulacion, descuento al personal ([PDR §2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal)) y comanda digital. Ahi vive la transaccion atomica `pago + decremento de inventario` ([technical guide §4.2](technical_guide.md#42-reglas-transaccionales)).
- `InventoryModule` es **compartido**: lo usan ordenes, vales y los cocineros. Maneja los **dos planos** del pollo (cocido transaccional + crudo anotado por turno via `ShiftChickenLog`).
- `AuditModule` en V1 expone un `AuditService.log(tx, ...)` que cada service crítico llama **explícitamente dentro de su misma transacción** (ver diagrama §2). Así el audit es **atómico** con la acción y tiene el estado *antes/después* para `details`. El patrón de **interceptor genérico** (que correría fuera de la transacción y sin estado previo) se **difiere a V2** con un caso real. Detalle en [`technical_guide.md` §4.3](technical_guide.md#43-auditoría--implementación-v1).
- **Control de permisos por rol enforced en el backend (V1)**. Dos guards globales (`APP_GUARD`): `AuthGuard` valida el JWT (401 si falta/expira) y `RolesGuard` valida el rol declarado con `@Roles()` (403 si no corresponde). La UI oculta pantallas, pero **no es la frontera de seguridad** ([PDR §2.7](../business/pdr.md#27-roles-e-interfaces-v1-con-autenticación-jwt-y-control-de-permisos-por-rol-en-backend) / [FR-018](../business/requirements.md#fr-018--autenticación-jwt-y-autorización-por-rol-alta); detalle en [technical_guide.md §5.2](technical_guide.md#52-autenticación-y-autorización)).

---

## 2. Flujo interno: como viaja un request (lifecycle)

Cuando el frontend dispara un `POST /api/v1/orders`, esto es lo que pasa **archivo por archivo**. Esta es la arquitectura clasica de NestJS: **Controller (HTTP) → Service (logica) → Prisma (DB)**. Si te saltas alguna capa, romper el modelo es cuestion de tiempo.

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend Next.js
    participant MW as main.ts<br/>middlewares
    participant GUARD as AuthGuard JWT
    participant ROLES as RolesGuard
    participant PIPE as ValidationPipe<br/>CreateOrderDto
    participant CTRL as OrdersController
    participant SVC as OrdersService
    participant INV as InventoryService
    participant TX as PrismaService<br/>transaction
    participant DB as PostgreSQL
    participant FILT as ExceptionFilter

    FE->>MW: POST /api/v1/orders<br/>Bearer JWT + body
    MW->>GUARD: validar token
    Note over GUARD: sin token/expirado → 401
    GUARD->>ROLES: token OK, request.user inyectado
    Note over ROLES: rol no autorizado (@Roles) → 403
    ROLES->>PIPE: rol OK
    PIPE->>CTRL: body validado contra DTO
    CTRL->>SVC: createOrder(dto, userId)

    Note over SVC,TX: Operacion atomica<br/>([technical guide §4.2](technical_guide.md#42-reglas-transaccionales))

    SVC->>TX: prisma.$transaction(async tx => ...)
    TX->>DB: lock filas de InventoryItem por presa
    SVC->>INV: validarStockSuficiente(items, tx)

    alt stock insuficiente
        INV-->>SVC: lanza InsufficientStockException
        SVC-->>FILT: excepcion sube
        FILT-->>FE: 422 isSuccess=false<br/>code=INSUFFICIENT_STOCK
    else stock OK
        SVC->>DB: incrementar Shift.lastOrderNumber
        SVC->>DB: insert Order + OrderItems
        SVC->>INV: decrementar stock + crear InventoryTransaction
        SVC->>DB: insert AuditLog (CREATE_SALE)
        TX-->>SVC: commit OK
        SVC-->>CTRL: orden creada
        CTRL-->>FE: 201 isSuccess=true<br/>data: { id, orderNumber, ... }
    end
```

**Capas (las que importan):**

| Capa | Archivo tipico | Responsabilidad unica |
|------|----------------|----------------------|
| Entry point | `main.ts` | Bootstrap, pipes globales, CORS, swagger |
| Module | `orders.module.ts` | Declarar controllers, providers, imports |
| Controller | `orders.controller.ts` | Definir rutas HTTP, leer DTOs, NO contiene logica |
| DTO | `dto/create-order.dto.ts` | Validacion con `class-validator` |
| Service | `orders.service.ts` | **TODA la logica de negocio vive aca** |
| Repository (opcional) | `orders.repository.ts` | Abstraer queries complejas si el service crece |
| Prisma | `prisma.service.ts` | Cliente compartido, transacciones |
| Filter | `http-exception.filter.ts` | Formatear errores al contrato `isSuccess` |

**Regla de oro:** el controller NO sabe de Prisma. El service NO sabe de HTTP. Si rompes esto, perdes testabilidad y la transaccion atomica se te va al pasto.

---

## 3. Modelo relacional (vista resumida del Prisma)

> **El ER no se dibuja a mano** — quedaba desactualizado en silencio con cada cambio del schema (pasó con `ShiftChickenLog`). Generalo on-demand desde [`prisma/schema.prisma`](../../prisma/schema.prisma) con una extensión de VS Code (ej. *Prisma ERD Visualizer*) o una herramienta externa (`prisma-erd-generator`, dbdiagram.io). Las decisiones de modelado que SÍ hay que tener en la cabeza están en la tabla de abajo.

**Decisiones modeladas que vale la pena tener en la cabeza:**

| Regla del negocio | Como queda en el schema |
|---|---|
| CUSTOM no es un tipo de pedido (§2.10) | `Order.type` solo tiene `MESA` y `LLEVAR`. El flag es `Order.isCustom: boolean`. |
| Cliente es entidad, no solo string ([§2.12](../business/pdr.md#212-clientes-y-facturación-nominada)) | `Customer` (CI/NIT, datos personales) habilita factura nominada y vista del dia. `Order.customerId: UUID?` es **opcional** (anónimo = "S/N", legal < Bs 1.000). Detalle en [technical_guide §3.1](technical_guide.md#31-entidades-principales). |
| Vista pública por token, no por id (FR-015) | `Order.publicToken` aleatorio no adivinable es la credencial de `GET /public/orders/:token`. El `customerId` **agrupa** los pedidos del día; el token **da acceso**. El NIT no es llave. |
| Sustitucion no cambia precio (§2.1) | `OrderItem.substitutions: Json` existe, pero **NO hay** campo `priceAdjustment`. |
| Inventario decrementa al pagar (§2.3) | El decremento se hace en el service de `POST /orders/:id/pay`, NO al pasar a `preparing`. La fuente de verdad operacional son las filas `OrderItemComponent` de cada ítem (una por presa/bebida/extra consumido), que el service usa para crear `InventoryTransaction` en la misma `$transaction`. |
| Snapshot de ítem para impresión/auditoría | Cada `OrderItem` persiste `snapshot: Json` con la información que se imprime en el ticket y se audita (nombre, precio confirmado, descuentos aplicados, composición). El `OrderItemComponent` normaliza los consumos que mueven inventario. |
| Numeracion por turno (FR-007) | `Order.orderNumber` con `@@unique([shiftId, orderNumber])` + `Shift.lastOrderNumber` como contador atomico. |
| Cocido vs crudo (§2.3) | `InventoryItem.type IN (PECHO,...)` = COCIDO transaccional. El plano CRUDO vive aparte en `ShiftChickenLog`, con `@@unique([shiftId, pieceType])`. |
| Vale no suma caja (§2.4) | `Voucher` no genera fila en ningun campo de monto de `Shift`. Aparece como linea separada en el arqueo via query. |
| Descuento al personal ya no es un flag, y aplica POR PLATO ([§2.11](../business/pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal)) | Se eliminó `Order.internalDiscount`. El descuento vive a **nivel ítem**: `OrderItem.discountId` apunta al catálogo `Discount` y `OrderItem.discountAmount` congela el snapshot por unidad; la cajera marca qué platos lo llevan. El `discountId` viaja en cada ítem al **crear** la orden — no hay endpoint aparte para aplicarlo ([technical guide §5.0](technical_guide.md#50-principios-de-diseño-de-la-api-el-backend-manda-el-frontend-renderiza)). La autorización por turno va en `DiscountAuthorization`. El descuento es puramente monetario (no hay `reason` de descuento en `InventoryTransaction`). |
| Producto: flags de venta e inventario | `Product.isSellable` controla si el producto aparece en el POS; `Product.isInventoryItem` controla si sus ventas generan `InventoryTransaction` (vía `OrderItemComponent`). Ambos `Boolean @default(true)`. |
| El período del turno se declara, no se infiere (§13.3) | `ShiftPeriod` es **catálogo** (no enum): un tercer turno no requiere migración. `Shift.periodId` se asigna al abrir la caja; el sistema **nunca** lo deriva del reloj ni de una API de hora. NO es atributo del `User`: el personal rota días, turnos y roles (§2.7). |
| Auditoría por turno sin ventanas horarias (§2.9) | `AuditLog.shiftId` (nullable) — el log **nace sabiendo su turno**; `null` = acción de admin fuera de una sesión de caja (`ADJUST_INVENTORY`, `GENERATE_REPORT`). La consulta por caja+período es una FK directa. |

---

## 4. Como leer este documento mientras codeas

- **Antes de crear un modulo nuevo:** mira el grafico §1 y ubicate. Si tu modulo no esta ahi, preguntate por que.
- **Antes de escribir logica en un controller:** parate y leelo de nuevo §2. La logica va al **service**, no al controller.
- **Antes de agregar un campo al schema:** revisa el §3 y verifica que la regla del negocio no este ya cubierta por un campo existente.
- **Lista de endpoints:** vive en [`../backend/technical_guide.md` §5.1](technical_guide.md); en el código se documenta con **Swagger/OpenAPI** generado desde los controllers reales.

---

## Referencias cruzadas

| Tema | Documento autoritativo |
|------|------------------------|
| Reglas de negocio (no negociables) | [`pdr.md` §2](../business/pdr.md) |
| Modelo de datos y entidades | [`../backend/technical_guide.md` §3](technical_guide.md) |
| Maquina de estados de pedidos | [`../backend/technical_guide.md` §4](technical_guide.md) + [`pdr.md` §4](../business/pdr.md) |
| Lista oficial de endpoints | [`../backend/technical_guide.md` §5.1](technical_guide.md) |
| Mapeo negocio to tecnica | [`../backend/technical_guide.md` §10](technical_guide.md) |
| Roadmap V1 vs V2 | [`pdr.md` §13](../business/pdr.md) |


