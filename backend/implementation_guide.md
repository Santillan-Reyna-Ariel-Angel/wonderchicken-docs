# Implementation Guide — Backend Wonder Chicken (V1)

> **⚠️ IMPORTANTE: No crear código o archivos de test como ser: `*.spec.ts` o archivos de Jest. Solo enfocarse en cumplir con la implementación de las features (requerimientos funcionales y no funcionales de cada sprint). Los tests serán realizados al finalizar la versión 1 del proyecto.**

**Sistema Informático de Ventas — Guía de construcción paso a paso**
**Complementa:** [pdr.md](../business/pdr.md) (reglas) · [requirements.md](../business/requirements.md) (FR/NFR) · [technical_guide.md](technical_guide.md) (modelo + contrato) · [architecture_overview.md](architecture_overview.md) (capas y módulos)
**Versión:** 1.0 · **Fecha:** 2026-07-10

> **Qué es este documento:** el **orden ejecutable** para construir el backend V1 — qué archivo crear en cada paso, sprint por sprint ([PDR §10](../business/pdr.md#10-prioridad-de-trabajo-y-roadmap-de-entregas-mvp-en-sprints)), hasta cubrir todos los FR de V1 ([PDR §13](../business/pdr.md#13-alcance-v1-mvp-vs-v2-futuro)). **Solo V1** — nada de V2.
>
> **Qué NO es:** no re-explica reglas ni contratos. Cada paso **referencia** dónde leerlos: la regla en [PDR §2](../business/pdr.md#2-reglas-de-negocio-definitivas-y-no-negociables), el criterio en [FR de requirements](../business/requirements.md#1-requerimientos-funcionales-completos-y-criterios-de-aceptación), el contrato en [technical guide §5](technical_guide.md#5-endpoints-contratos-y-seguridad-jwt), la capa en [architecture_overview §2](architecture_overview.md#2-flujo-interno-como-viaja-un-request-lifecycle). Ante conflicto: **gana el PDR** en negocio; ante conflicto de implementación, gana el código.

---

## Índice

- [0. Estado de partida](#0-estado-de-partida)
- [1. Convenciones](#1-convenciones)
- [2. Sprint 0 — Fundaciones](#2-sprint-0--fundaciones)
- [3. Sprint 1 — Catálogo + POS básico](#3-sprint-1--catálogo--pos-básico)
- [4. Sprint 2 — Inventario + venta custom](#4-sprint-2--inventario--venta-custom)
- [5. Sprint 3 — Caja completa + descuentos](#5-sprint-3--caja-completa--descuentos)
- [6. Sprint 4 — Cliente, vistas públicas e impresión](#6-sprint-4--cliente-vistas-públicas-e-impresión)
- [7. Sprint 5 — Auditoría completa + hardening](#7-sprint-5--auditoría-completa--hardening)
- [8. Mapa de cobertura FR → Sprint](#8-mapa-de-cobertura-fr--sprint)
- [9. Flujo funcional de prueba (orden usuario real)](#9-flujo-funcional-de-prueba-orden-usuario-real)

---

## 0. Estado de partida

Lo que YA existe (no rehacer):

| Pieza | Estado | Nota |
|---|---|---|
| `prisma/schema.prisma` | ✅ completo y validado | Fuente de verdad del modelo. Todas las entidades de [technical guide §3.1](technical_guide.md#31-entidades-principales). Incluye `OrderItem.snapshot` (Json, para impresión/auditoría) y `OrderItemComponent` (filas normalizadas por presa/bebida/extra que son la fuente de verdad para el decremento de inventario al pagar). `Product` lleva `isSellable` e `isInventoryItem`. |
| `seeders/` | ✅ funcional (gitignored) | `pnpm seed` puebla los 16 dominios. El patrón de conexión **Prisma 7 + driver adapter** (`@prisma/adapter-pg`) ya está resuelto en `seeders/prisma.ts` — **reutilizarlo** para el `PrismaService`. El seeder es **datos de demo, no prerrequisito**: todos los maestros que el operador necesita para vender tienen endpoint de alta (§9) — ver la [Fase B](#9-flujo-funcional-de-prueba-orden-usuario-real). |
| `src/` | scaffold NestJS pelado + Sprint 0/1 parcial | `main.ts`, `app.module.ts`, `app.controller/service` (se eliminan al final del Sprint 0). Ya existen y funcionan: `prisma/`, `common/`, `auth/`, `users/`, `branches/`, `products/`, `shifts/`, `orders/`, `pos/`, `customers/` (lookups), `cash-registers/` (solo `GET`), `audit/`. Faltan los CRUDs de maestros detallados en los sprints. |
| Deps | ✅ | NestJS 11, Prisma 7.8 + adapter-pg, TypeScript (stack: [technical guide §1](technical_guide.md#1-stack-y-decisiones-base)) |

Comandos base: `pnpm prisma generate` (tras cambiar schema) · `pnpm prisma db push` (sincronizar DB) · `pnpm seed` (poblar) · `pnpm start:dev` (server).

---

## 1. Convenciones

- **Patrón de módulo** (capas y responsabilidad única: [architecture_overview §2](architecture_overview.md#2-flujo-interno-como-viaja-un-request-lifecycle) — el controller no sabe de Prisma, el service no sabe de HTTP):

  ```
  src/<dominio>/
    <dominio>.module.ts
    <dominio>.controller.ts
    <dominio>.service.ts
    dto/*.dto.ts          ← class-validator
  ```

- **Estructura final de `src/`** (la construyen los sprints, en este orden de aparición):

  ```
  src/
    main.ts  app.module.ts
    prisma/     common/      auth/       users/   branches/   cash-registers/  ← Sprint 0-1
    products/   shifts/      orders/     audit/   pos/   ← Sprint 1
    inventory/                                           ← Sprint 2
    expenses/   vouchers/    discounts/  reports/        ← Sprint 3
    customers/  print/                                    ← Sprint 4
  ```

- **Transversales (leer ANTES de codear el primer endpoint):** principios de diseño [tech guide §5.0](technical_guide.md#50-principios-de-diseño-de-la-api-el-backend-manda-el-frontend-renderiza) · contrato de respuesta [§5.3](technical_guide.md#53-estructura-de-respuesta-estándar) · códigos de error [§5.4](technical_guide.md#54-reglas-del-contrato) · reglas transaccionales [§4.2](technical_guide.md#42-reglas-transaccionales).
- **Orden de los CRUDs = orden de las dependencias FK.** El recorrido completo está en la [§9](#9-flujo-funcional-de-prueba-orden-usuario-real); en resumen, el orden natural es:
  1. `Branch` → 2. `User` → 3. `CashRegister` → 4. `ShiftPeriod` → 5. `Product` + `Variant` → 6. `InventoryItem` (con stock inicial) → 7. `Customer` → 8. **recién acá** `Shift` (turno) → `Order`/`Voucher`/`Expense`.
  Cada tabla tiene su endpoint de alta antes de que cualquier otra la referencie. Los catálogos que son **globales** (`Product`, `Variant`, `Customer`, `ShiftPeriod`, `Discount`) no llevan `branchId`; las **locales** (`Branch`, `CashRegister`, `InventoryItem`, `Shift`, `Order`) sí, y derivan la sucursal del actor ([§5.0](technical_guide.md#50-principios-de-diseño-de-la-api-el-backend-manda-el-frontend-renderiza) principio 1) — el body nunca lleva `branchId` del actor.
- **El seeder es dato de demo, no prerrequisito.** Ningún flujo de §9 debería necesitar `pnpm seed`: todo lo que se necesita para vender se crea por endpoints.
- **Regla UUID en DTOs:** usar siempre `@IsUUID()` (sin argumento). No usar `@IsUUID('4')` — los IDs de la app (especialmente `uuid(7)` de Prisma) no son UUIDv4 y la validación fallaría.
- **Estados reservados sin uso en V1** (`onHold`, `partial`, `redeemed`/`cancelled` de vale): el backend **no los produce ni acepta** — ver notas en [technical guide §3.1](technical_guide.md#31-entidades-principales).
- **Prefijo global:** todos los endpoints bajo `/api/v1` (setear en `main.ts`).

---

## 2. Sprint 0 — Fundaciones

**Objetivo:** todo lo transversal que los demás sprints consumen ([PDR §10](../business/pdr.md#10-prioridad-de-trabajo-y-roadmap-de-entregas-mvp-en-sprints), Sprint 0 = modelado, ya hecho; acá se agrega el arranque técnico).
**Cierra:** FR-018, FR-000; base de FR-008 y FR-013 (backend como frontera de seguridad).
**Ajuste sobre [PDR §10](../business/pdr.md#10-prioridad-de-trabajo-y-roadmap-de-entregas-mvp-en-sprints) (explicado):** el PDR no ubica la autenticación en ningún sprint, pero los guards son **globales** (`APP_GUARD`) y todos los endpoints los atraviesan → va primero o se retrofitea todo. **FR-000 (gestión de sucursales) tampoco está ubicado en el PDR**, pero es **prerrequisito** de `POST /users` (el admin necesita una sucursal asignada) y de todo lo que sigue (`Shift.branchId`, `CashRegister.branchId`, `InventoryItem.branchId` son required para entidades locales) → se adelanta a Sprint 0.

Archivos, en orden:

1. `src/prisma/prisma.service.ts` — cliente Prisma con **driver adapter pg** (copiar el patrón de `seeders/prisma.ts`); maneja `$connect`/`$disconnect` en el lifecycle.
2. `src/prisma/prisma.module.ts` — `@Global()`, exporta el service.
3. `src/common/filters/http-exception.filter.ts` — `ExceptionFilter` global: TODA respuesta (éxito la arma el controller; error lo arma este filter) cumple el contrato `{ isSuccess, message, data, error }` de [§5.3](technical_guide.md#53-estructura-de-respuesta-estándar) con códigos estables de [§5.4](technical_guide.md#54-reglas-del-contrato).
4. `src/common/decorators/public.decorator.ts` y `roles.decorator.ts` — snippets de referencia en [§5.2](technical_guide.md#52-autenticación-y-autorización).
5. `src/common/guards/auth.guard.ts` y `roles.guard.ts` — 401/403 según [§5.2](technical_guide.md#52-autenticación-y-autorización) (JWT directo, **sin Passport**).
6. `src/auth/` (module/controller/service + `dto/login.dto.ts`) — `POST /auth/login` ([§6.0](technical_guide.md#60-authloginresponse)) y `POST /auth/logout` (libera la sesión del turno, FR-008b; la validación de sesión única completa llega en Sprint 5). bcryptjs para comparar hashes.
7. `src/users/` — `POST/GET/PATCH /users`, `PATCH /users/{id}/toggle-active` (admin; alta con rol, activar/desactivar vía toggle — [PDR §2.7](../business/pdr.md#27-roles-e-interfaces-v1-con-autenticación-jwt-y-control-de-permisos-por-rol-en-backend)). `PATCH /users/{id}` edita firstName, lastName, email, phone, ci, rol y branchId pero **no** `active` — el toggle de estado es un endpoint separado. El CI se guarda hasheado como `passwordHash` (la contraseña de login ES el CI). ✅ **IMPLEMENTADO** (login por email + CI)
8. `src/branches/` (module/controller/service + `dto/create-branch.dto.ts`, `update-branch.dto.ts`) — **FR-000**: `POST /branches`, `GET /branches`, `PATCH /branches/{id}`, `PATCH /branches/{id}/toggle-active` — **solo SUPER_ADMIN** (gestión de sucursales: nombre, dirección, estado activa/inactiva — [PDR §2.7](../business/pdr.md#27-roles-e-interfaces-v1-con-autenticación-jwt-y-control-de-permisos-por-rol-en-backend); `toggle-active` invierte el estado actual, sin body). Es el **prerrequisito** de `POST /users` (el admin se crea con `branchId`) y de todo lo que sigue. El `RolesGuard` deja pasar siempre al SUPER_ADMIN sin importar el `@Roles` declarado (§5.2). ✅ **IMPLEMENTADO**
9. `src/main.ts` — prefijo `/api/v1`, `ValidationPipe` global, filter global, CORS. `src/app.module.ts` — registra Prisma/Auth/Users/Branches + los dos guards vía `APP_GUARD` (orden: Auth primero). Eliminar `app.controller.ts`/`app.service.ts`.

**DoD:** login con seed (`pnpm seed` crea usuarios) devuelve JWT; endpoint protegido sin token → 401; con rol incorrecto → 403 (criterios FR-018); el SUPER_ADMIN crea una sucursal y los usuarios asignados a ella solo ven datos de su sucursal (criterios FR-000); todo error respeta el contrato §5.3.

---

## 3. Sprint 1 — Catálogo + POS básico

**Objetivo:** [PDR §10](../business/pdr.md#10-prioridad-de-trabajo-y-roadmap-de-entregas-mvp-en-sprints), Sprint 1 — productos/variantes y venta MESA/LLEVAR con pago y comanda digital.
**Cierra:** [FR-001](../business/requirements.md#fr-001--gestión-de-productos-y-variantes-alta), [FR-002](../business/requirements.md#fr-002--registro-de-pedidos-pos-alta), [FR-003](../business/requirements.md#fr-003--comanda-digital-y-factura-opcional-alta) (parcial: comanda digital), [FR-011](../business/requirements.md#fr-011--pedidos-con-pago-pendiente-alta) (parcial: crear pendiente y pagar — sin inventario todavía, eso es Sprint 2 según [PDR §10](../business/pdr.md#10-prioridad-de-trabajo-y-roadmap-de-entregas-mvp-en-sprints)).
**Ajustes sobre [PDR §10](../business/pdr.md#10-prioridad-de-trabajo-y-roadmap-de-entregas-mvp-en-sprints) (explicados):**
- *Shifts mínimo se adelanta:* crear una orden exige turno abierto y `orderNumber` atómico vía `Shift.lastOrderNumber` ([PDR §2.8](../business/pdr.md#28-comandas-tickets-factura-y-notificaciones)) — el arqueo completo queda en Sprint 3.
- *AuditService nace acá:* [PDR §10](../business/pdr.md#10-prioridad-de-trabajo-y-roadmap-de-entregas-mvp-en-sprints) pone auditoría en Sprint 5, pero [§4.3](technical_guide.md#43-auditoría--implementación-v1) exige el `INSERT` **dentro de la misma transacción** de cada acción crítica — retrofitearlo en S5 significaría reabrir todos los services. Cada sprint cablea sus acciones; S5 solo completa y verifica.
- *CRUDs de datos maestros se completan acá:* el operador **no tiene DB abierta** — todo lo que necesita para vender (cajas, períodos, catálogo, stock) se crea por endpoints. Por eso S1 cierra el CRUD de `Product`/`Variant` (editar y dar de baja, [FR-001](../business/requirements.md#fr-001--gestión-de-productos-y-variantes-alta)) y agrega los maestros de **preparación del turno** (`ShiftPeriod`, `CashRegister`) que hoy solo existían por seeder. Sin ellos, `POST /shifts/open` no tiene con qué funcionar y el flujo "crear datos → vender" no se puede probar de punta a punta.
- *`POST /customers` se adelanta de S4:* la cajera **registra al cliente en el POS antes de cobrar** ([PDR §2.12](../business/pdr.md#212-clientes-y-facturación-nominada), atajo F9) — es parte de la venta, no una tarea posterior. Con los lookups solos (S1 original) el alta quedaba huérfana hasta S4. En S4 quedan solo las capacidades **administrativas** (listado paginado, edición, activar/desactivar, historial de pedidos).

Archivos, en orden:

1. `src/products/` (module/controller/service + `dto/create-product.dto.ts`, `update-product.dto.ts`, `create-variant.dto.ts`, `update-variant.dto.ts`) — **CRUD completo** de productos y variantes ([§6.1](technical_guide.md#61-productcreateresponse-éxito)/[§6.2](technical_guide.md#62-variantcreateresponse-éxito); componentes de variante: [PDR §2.2](../business/pdr.md#22-variantes-y-componentes)):
   - `POST /products`, `GET /products`, `GET /products/{id}`, `PATCH /products/{id}`, `PATCH /products/{id}/toggle-active`.
   - `POST /variants`, `GET /variants`, `PATCH /variants/{id}`, `PATCH /variants/{id}/toggle-active`.
   - **Editar y dar de baja son parte de [FR-001](../business/requirements.md#fr-001--gestión-de-productos-y-variantes-alta)** ("crear, editar y dar de baja") — `PATCH` no cambia `active`; la baja va por `toggle-active`, igual que en usuarios/sucursales/clientes. `Product` y `Variant` son **globales** (sin `branchId`): el menú es el mismo para todas las sucursales.
   - El **precio no lo manda el front** en `PATCH`: se revalida en el backend contra el catálogo (§5.0 principio 3). La baja (`active: false`) retira el producto del POS (`GET /pos/context` filtra por `active` + `isSellable`) sin tocar las órdenes ya creadas — esas conservan su `snapshot`.
2. `src/shifts/` **mínimo** — `GET /shifts/shift-periods` (catálogo; seed ya crea Mañana/Noche), **`POST /shifts/shift-periods`** y **`PATCH /shifts/shift-periods/{id}`** (admin; catálogo ampliable sin migración — [§5.1](technical_guide.md#51-endpoints-principales)), `POST /shifts/open` ([§6.10](technical_guide.md#610-cashopenresponse-éxito); el período se **declara**, jamás se infiere del reloj — [PDR §13.3](../business/pdr.md#133-decisiones-residuales-pendientes-de-cierre-antes-de-v1)) y el contador `lastOrderNumber`. Los horarios de referencia (`referenceStart`/`referenceEnd`) son **informativos**: editarlos no reclasifica ningún turno existente.
3. `src/cash-registers/` (module/controller/service + `dto/create-cash-register.dto.ts`, `update-cash-register.dto.ts`) — **CRUD de cajas** (`GET /cash-registers` ✅ ya implementado, `POST /cash-registers`, `PATCH /cash-registers/{id}`, `PATCH /cash-registers/{id}/toggle-active`).
   - **Es prerrequisito directo de `POST /shifts/open`**: el `cashRegisterId` que la cajera declara al abrir el turno tiene que existir. Hoy solo se crea por seeder — con la DB vacía no se puede abrir caja por API.
   - **`branchId` derivado del actor** ([§5.0](technical_guide.md#50-principios-de-diseño-de-la-api-el-backend-manda-el-frontend-renderiza) principio 1): la caja pertenece a la sucursal del admin que la crea; no se acepta `branchId` en el body. `ADMIN` opera en su sucursal; el `SUPER_ADMIN` puede crear en cualquiera (acompañado de un endpoint admin equivalente, si hace falta).
   - `productCode` es único por sucursal en inventario; acá la analogía es `name` único por sucursal (`@@unique([branchId, name])` en `CashRegister`): duplicado → `CASH_REGISTER_ALREADY_EXISTS`.
   - Rol: `ADMIN` (el `SUPER_ADMIN` pasa siempre por la regla global del `RolesGuard` — [§5.2](technical_guide.md#52-autenticación-y-autorización)).
4. `src/audit/audit.module.ts` + `audit.service.ts` — único método `log(tx, { entity, entityId, action, userId, shiftId, details })` ([§4.3](technical_guide.md#43-auditoría--implementación-v1)); cablear `OPEN_SHIFT` en shifts.
5. `src/orders/` (module/controller/service + `dto/create-order.dto.ts`, `pay-order.dto.ts`) — `POST /orders` ([§6.3](technical_guide.md#63-ordercreateresponse-mesa-pagado-con-sustitución): N ítems, precios desde catálogo, sustituciones §2.1, `publicToken`, `orderNumber` en `$transaction`), `POST /orders/{id}/pay` ([§6.4b](technical_guide.md#64b-payorderresponse-confirmar-pago-de-un-pendiente)), `GET /orders/{id}` y `GET /orders` con filtros (panel despacho + historial — FR-003/FR-012; **el filtro `customerId` se acepta desde Sprint 1** porque el POS asocia clientes pre-cargados a la orden), cancelación de pendiente ([PDR §2.5](../business/pdr.md#25-pedidos-delivery-y-pago-pendiente): manual, sin motivo). El DTO de creación acepta `customerId?: string` (nullable; `null` ⇒ orden "S/N" — [PDR §2.12](../business/pdr.md#212-clientes-y-facturación-nominada)). Cablear `CREATE_SALE` en la transacción. Cada `OrderItem` persiste `snapshot: Json` al crearse (nombre, precio confirmado, descuentos aplicados, composición) para impresión y auditoría. *(Los ítems ya aceptan `discountId` en el DTO pero la validación/snapshot de descuentos llega en Sprint 3 — hasta entonces, rechazar si viene.)* ✅ **IMPLEMENTADO** (`POST /orders` con `customerId?`, `GET /orders` con filtro `customerId`)
6. `src/pos/` — `GET /pos/context` v1: solo `products` y `shift` ([§6.12](technical_guide.md#612-poscontextresponse-carga-del-pos-en-una-llamada); crece en S2 y S3).
7. `src/customers/` — **mínimo operativo: alta + lookup exacto** — habilita el componente G del POS (selector de cliente en el resumen de la orden) para que la cajera registre al cliente y lo asocie a la orden en curso. **Tres endpoints, todos cross-sucursal, sin búsqueda con prefijo** para evitar llamadas innecesarias al backend mientras la cajera tipea. ✅ **IMPLEMENTADO** (los dos lookups)
   - **`POST /customers`** — alta rápida desde el POS (atajo F9), [§6.2a](technical_guide.md#62a-customercreateresponse--customerssearchresponse): `ci` UNIQUE (devolver `CUSTOMER_CI_ALREADY_EXISTS` si ya existe — la **primera registración gana**, no se permite duplicado cross-sucursal); `passwordHash` se mantiene `null` en V1 (reservado para V2 según [PDR §13.2](../business/pdr.md#132-versión-2-roadmap-futuro--diferido-explícitamente)). **Adelantado desde Sprint 4** (ver "Ajustes" arriba). 🔲 **PENDIENTE**
   - **`GET /customers/by-ci/:ci`** — lookup exacto por CI. Devuelve el cliente activo cuyo `ci` coincide exacto con `:ci`, o 404 si no existe / está inactivo. Pensado para el flujo normal: cajera tipea el CI y presiona Enter / sale del campo. ✅
   - **`GET /customers/by-nit/:nit`** — lookup exacto por NIT, mismo patrón que `by-ci`. Pensado para ventas a "Razón Social" donde la cajera factura con NIT. ✅
   - `@Roles('CASHIER', 'ADMIN')` para los tres endpoints; `SUPER_ADMIN` pasa siempre por la regla global del `RolesGuard` ([§5.2](technical_guide.md#52-autenticación-y-autorización)).
   - **Cross-sucursal:** el `Customer` es una entidad global sin `branchId` ([schema.prisma:667](../..)) — la búsqueda no filtra por sucursal.
   - **Solo clientes `active: true`** aparecen. Los desactivados devuelven 404 (no se filtra existencia a roles no administrativos).
   - **404 con código estable:** `error.code = 'CUSTOMER_NOT_FOUND'` para que el frontend pueda mostrar un mensaje claro ("No se encontró — usa S/N o intentá de nuevo").
   - **Validación mínima:** `:ci` o `:nit` con menos de 3 caracteres tras `trim` → 404. Evita llamadas inútiles desde inputs vacíos.
   - **Rutas estáticas (`by-ci`, `by-nit`) declaradas ANTES** de cualquier futura `:id` (UUID) para evitar colisión con `GET /customers/{id}` que llega en Sprint 4.
   - Los endpoints **administrativos** (`GET /customers` con búsqueda paginada, `GET /customers/{id}`, `PATCH /customers/{id}`, `PATCH /customers/{id}/toggle-active`) y `GET /customers/{id}/orders` llegan en Sprint 4 (paso 1).

**DoD:** tests E2E §8: **1**, **2** (sin la parte de inventario), **2b**, **8** (hasta comanda en panel vía `GET /orders?status=`), **9b** (alta de cliente); criterios FR-001/FR-002. **Además, el recorrido de la [§9](#9-flujo-funcional-de-prueba-orden-usuario-real) Fase A + B completo por API desde DB vacía** (sin `pnpm seed`): sucursal → usuarios → caja → períodos → catálogo → cliente → turno → venta pagada. Ese recorrido es la prueba de que los maestros se crean por endpoints y no dependen del seeder.

---

## 4. Sprint 2 — Inventario + venta custom

**Objetivo:** [PDR §10](../business/pdr.md#10-prioridad-de-trabajo-y-roadmap-de-entregas-mvp-en-sprints) Sprint 2 — los dos planos del pollo (§2.3), decremento atómico al pagar, flujo custom, dashboard y consumos manuales.
**Cierra:** FR-002b, FR-006, FR-017; completa FR-011 (inventario recién al confirmar pago).
**Ajuste sobre [PDR §10](../business/pdr.md#10-prioridad-de-trabajo-y-roadmap-de-entregas-mvp-en-sprints) (explicado):** *el CRUD de ítems de inventario se completa acá.* Igual que los maestros del Sprint 1, el admin **no tiene DB abierta**: sin `POST /inventory/items` no hay forma de dar de alta una presa, una bebida o un insumo por API — el stock solo existiría por seeder. Y sin stock cargado no se puede probar ni el decremento al pagar ni el precio sugerido custom ([PDR §2.10](../business/pdr.md#210-ventas-custom-presas-surtidas), que se alimenta de `InventoryItem.salePrice`).

Archivos, en orden:

1. `src/inventory/` (module/controller/service + dtos) — **CRUD de ítems** + las operaciones de stock. Es el primer módulo donde el `branchId` **se deriva del actor** ([§5.0](technical_guide.md#50-principios-de-diseño-de-la-api-el-backend-manda-el-frontend-renderiza) principio 1): el inventario es **local por sucursal**, así que cada ítem pertenece a la del admin que lo crea y no se acepta `branchId` en el body.
   - **`POST /inventory/items`** — alta de ítem: `{ productCode, name, unit, type, unitMeasure?, salePrice?, initialStock? }`. `productCode` es único **por sucursal** (`@@unique([branchId, productCode])`): duplicado → `INVENTORY_ITEM_CODE_ALREADY_EXISTS`.
     - **`initialStock` crea la `InventoryTransaction` de `RECEPTION` en la MISMA transacción** que el alta (delta = `initialStock`, `reason: RECEPTION`). Razón: el `currentStock` nunca se escribe directo sin rastro — el campo es un **cache del libro de transacciones**, y el dashboard/delta del turno se calcula desde las `InventoryTransaction`. Cargar stock inicial por un endpoint aparte (`/adjust`) obligaría a dos llamadas y dejaría una ventana donde el ítem existe con stock 0 sin que conste el ingreso.
     - `salePrice` es **solo VENTA** y solo tiene sentido en `type ∈ {PECHO, ALA, PIERNA, ENTREPIERNA}` (alimenta el precio sugerido custom — [PDR §2.10](../business/pdr.md#210-ventas-custom-presas-surtidas)); se rechaza en `INSUMO`. No es costo ni margen (fuera de alcance).
   - **`GET /inventory/items`** — listado con filtros `?type=&active=&search=` del **usuario autenticado** (ADMIN ve su sucursal, SUPER_ADMIN filtra por sucursal). Es lo que consume el selector de insumos del cocinero (FR-017).
   - **`PATCH /inventory/items/{id}`** — edita **solo** `name`, `unit`, `unitMeasure`, `salePrice`. **`currentStock` NO es editable por acá**: cualquier cambio de stock pasa por `POST /inventory/adjust` con motivo, que es la vía auditable y el único mecanismo que mueve el libro de transacciones.
   - **`POST /inventory/adjust`** ([§6.8](technical_guide.md#68-inventoryadjustresponse-éxito), cablear `ADJUST_INVENTORY`), **`PATCH /inventory/{id}/sale-price`** (atajo para el precio por presa, [PDR §2.10](../business/pdr.md#210-ventas-custom-presas-surtidas)) y **`GET /inventory/dashboard`** (stock cocido + delta del turno, FR-006).
   - **Roles:** `ADMIN` para `POST /inventory/items`, `PATCH /inventory/items/{id}`, `POST /inventory/adjust`, `PATCH /inventory/{id}/sale-price` (gestión de inventario con motivo — [PDR §2.7](../business/pdr.md#27-roles-e-interfaces-v1-con-autenticación-jwt-y-control-de-permisos-por-rol-en-backend)). `GET /inventory/items` y `GET /inventory/dashboard` para `ADMIN` **y** `COOK` — el cocinero necesita **listar** insumos para su formulario de consumos manuales y **ver** el stock del expositor ([FR-008](../business/requirements.md#fr-008--interfaces-diferenciadas-por-rol-alta)), pero no crea ni edita ítems. `SUPER_ADMIN` pasa siempre por la regla global del `RolesGuard` ([§5.2](technical_guide.md#52-autenticación-y-autorización)).
2. `inventory.service.ts`: método transaccional `decrementForOrder(tx, items)` — regla de pares y bebidas por unidad ([PDR §2.3](../business/pdr.md#23-inventario-por-presas)), lanza `INSUFFICIENT_STOCK` ([§4.2](technical_guide.md#42-reglas-transaccionales)). La fuente de verdad son las filas `OrderItemComponent` de cada ítem (una por presa/bebida/extra consumido); el service itera esas filas para crear `InventoryTransaction` en la misma `$transaction` que confirma el pago. El `OrderItem.snapshot` (Json) se usa para impresión y auditoría, no para mover stock.
3. **Integrar en orders**: el decremento entra a la MISMA `$transaction` de `create` (pagado) y de `/pay`; reversión en `POST /orders/{id}/cancel` de pagados (`CANCELLATION_REVERT` + `CANCEL_SALE`, FR-011b).
4. `src/orders/dto/create-custom-order.dto.ts` + `POST /orders/custom` ([§6.5](technical_guide.md#65-customordercreateresponse-orden-llevar-custom--presas-surtidas-vía-post-apiv1orderscustom): `customPieces`, precio confirmado por la cajera — regla [PDR §2.10](../business/pdr.md#210-ventas-custom-presas-surtidas); descuenta exactamente las presas indicadas).
5. `src/inventory/` (continuación) — `POST /inventory/manual-consumption` ([§6.9](technical_guide.md#69-manualconsumptionresponse-cierre-turno-cocina), FR-017) y `shift-chicken-log`: `GET /{shiftId}` (autopoblado del reproceso desde el último log cerrado — "el cálculo automático es una ayuda", [PDR §2.3](../business/pdr.md#23-inventario-por-presas)), `POST` y `POST /{shiftId}/close` (reconciliación y discrepancias).
6. `pos/context` += `piecePrices` (el POS calcula el precio sugerido custom **en el cliente**).

**DoD:** tests E2E §8: **2** (completo), **3**, **4**, **5**, **12**, **14**, **14b**; criterios FR-006/FR-002b/FR-017. **Además, la [§9](#9-flujo-funcional-de-prueba-orden-usuario-real) Fase C por API:** alta de las 4 presas (con `salePrice`) + bebidas + insumos vía `POST /inventory/items`, y una venta pagada que **descuenta stock** verificable en `GET /inventory/dashboard` — sin `pnpm seed` de por medio.

---

## 5. Sprint 3 — Caja completa + descuentos

**Objetivo:** [PDR §10](../business/pdr.md#10-prioridad-de-trabajo-y-roadmap-de-entregas-mvp-en-sprints) Sprint 3 — arqueo, gastos, vales, feature de descuentos con autorización por turno, reportes.
**Cierra:** FR-004, FR-005, FR-009, FR-010, FR-016, FR-016b.

Archivos, en orden:

1. `src/shifts/` (completar) — `POST /shifts/close` ([§6.10b](technical_guide.md#610b-cashcloseresponse-arqueo)): arqueo con desglose §2.6, **cierre administrativo** de las órdenes `delivered` → `closed` del turno ([§4.1](technical_guide.md#41-transiciones-y-efectos)), extinción de autorizaciones y sesión; cablear `CLOSE_SHIFT`.
2. `src/expenses/` — `POST /expenses` ([§6.13](technical_guide.md#613-expensecreateresponse-gasto-desde-caja--fr-009); sin turno abierto → error claro).
3. `src/vouchers/` — `POST /vouchers` ([§6.7](technical_guide.md#67-vouchercreateresponse): monto derivado del producto, [PDR §2.4](../business/pdr.md#24-vales-ventas-internas--descuento-por-nómina); con "Descuento personal" opcional) y `GET /vouchers` con filtros (visibilidad §2.4: cajera ve los suyos, admin todos). Cablear `CREATE_VOUCHER`. Vale NO suma a caja — aparece en el arqueo de (1).
4. `src/discounts/` — CRUD del catálogo ([§6.6b](technical_guide.md#66b-discountcreateresponse-catálogo--admin)), `POST /{id}/authorize` + `GET /authorizations` ([§6.6c](technical_guide.md#66c-discountauthorizationresponse-admin-autoriza-a-la-sesión-de-cajera-por-turno); cablear `AUTHORIZE_DISCOUNT`).
5. **Integrar en orders**: validación del `discountId` por ítem EN LA CREACIÓN (disponibilidad + autorización del turno → `DISCOUNT_NOT_AVAILABLE`/`DISCOUNT_NOT_AUTHORIZED`), snapshot por unidad y totales derivados ([§6.6](technical_guide.md#66-ordercreatewithdiscountresponse-descuento-al-personal-por-plato-en-la-creación--una-sola-llamada); regla completa [PDR §2.1](../business/pdr.md#21-precios-y-sustituciones)1). Quitar el rechazo temporal del Sprint 1.
6. `src/reports/` — `GET /reports/sales`, `/inventory-presas`, `/cash-audit`, todos con `?format=csv` (FR-010); cablear `GENERATE_REPORT` (entityId legible, ej. `"sales:2026-07"` — §4.3).
7. `pos/context` += `discounts` **filtrados por el backend** para la sesión y `shiftPeriods`.

**DoD:** tests E2E §8: **6**, **7**, **7b**, **13**, **13b**, **13c**, **13d**, **16**; criterios FR-004/FR-005/FR-009/FR-010/FR-016/FR-016b.

---

## 6. Sprint 4 — Cliente, vistas públicas e impresión

**Objetivo:** [PDR §10](../business/pdr.md#10-prioridad-de-trabajo-y-roadmap-de-entregas-mvp-en-sprints) Sprint 4 — notificaciones de pedido listo, vista del cliente, factura.
**Cierra:** FR-007, FR-014, FR-015, FR-019; completa FR-003.

Archivos, en orden:

1. `src/customers/` — **completar** el módulo sobre el `Customer` global (entidad sin `branchId`, cross-sucursal — [PDR §2.12](../business/pdr.md#212-clientes-y-facturación-nominada), [schema.prisma:667](../..)). El **alta ya está en Sprint 1** (paso 7, parte del flujo operativo del POS); acá llegan las capacidades **administrativas**. Endpoints:
   - `GET /customers?search=&page=&pageSize=&status=&from=&to=` ([§6.2a](technical_guide.md#62a-customercreateresponse--customerssearchresponse)) — **un solo endpoint de listado compartido por POS (Sprint 4 operativa) y admin (Sprint 4 administrativa)**. Coincidencia por prefijo case-insensitive en `ci`, `nit`, `firstName` o `lastName`; paginación con `page` + `pageSize`; filtros opcionales `status`, `from`, `to` (rango de fecha de registro). Devuelve como máximo 20 resultados por página. Sin `registeredBranchId` — el `Customer` no tiene `branchId` (es global); "sucursal de registro" se deriva del primer `Order` del cliente si se necesita, **fuera del alcance V1**. **Reemplaza la idea anterior** de tener endpoints separados por pantalla (era duplicación: misma forma, distintos solo por `@Roles`/campos del DTO). Aquí aplica el principio: **1 endpoint por operación**.
   - `GET /customers/{id}` — consulta.
   - `PATCH /customers/{id}` — edición. `ci` y `nit` **no editables** (son las claves de búsqueda y uniqueness). El snapshot `Order.customerName` **no se altera** al editar el cliente ([PDR §2.12](../business/pdr.md#212-clientes-y-facturación-nominada) — regla de inmutabilidad).
   - `PATCH /customers/{id}/toggle-active` — mismo patrón que `PATCH /users/{id}/toggle-active` y `PATCH /branches/{id}/toggle-active`: invierte el flag `active` actual, sin body. El `ADMINISTRADOR` puede desactivar clientes que no quiere que aparezcan en búsquedas futuras; las órdenes pasadas siguen mostrando el `customerName` snapshot. Clientes desactivados se pueden reactivar.
   - `GET /customers/{id}/orders?from=&to=` — historial de pedidos del cliente (todas las sucursales, cross-sucursal). Reutiliza la query del módulo `orders` filtrada por `customerId` + rango de fechas opcional; el endpoint dedicado expone una vista resumida optimizada para el modal "Ver historial" de la UI administrativa.
   - **Roles:** `@Roles('CASHIER', 'ADMIN')` para `GET /customers` y `GET /customers/{id}` (y `POST /customers`, que ya vive en Sprint 1). `@Roles('ADMIN')` para `PATCH /customers/{id}` y `PATCH /customers/{id}/toggle-active`. `@Roles('CASHIER', 'ADMIN')` para `GET /customers/{id}/orders` (la cajera puede ver el historial del cliente asociado a la orden actual). `SUPER_ADMIN` pasa siempre por la regla global.
   - **Cablear `AuditLog`** (`§4.3`): acciones críticas — `CREATE_CUSTOMER`, `UPDATE_CUSTOMER`, `TOGGLE_CUSTOMER_ACTIVE`.
2. `src/orders/` (completar) — `PATCH /orders/{id}/status` ([§6.11b](technical_guide.md#611b-orderstatusupdateresponse-despacho): `ready` persiste `readyAt`, `delivered` persiste `deliveredAt`+`deliveredBy` — [PDR §4](../business/pdr.md#4-máquina-de-estados-de-pedidos)).
3. Rutas públicas (`@Public()`, en orders o módulo `public/`): `GET /public/orders/{token}` (capability URL — FR-015; + pedidos del día si hay `customerId`, FR-019) y `GET /public/ready-orders` (SOLO números de pedido `ready` — FR-007, §2.8).
4. `src/print/` — `POST /print/invoice` (térmica, a demanda) y `GET /print/invoice/{orderId}/pdf` (fallback) — FR-014; formato del ticket: [PDR §7.7](../business/pdr.md#77-factura-impresión--pdf) / business_context.

**DoD:** tests E2E §8: **8** (completo con pantalla pública), **9**, **9b**, **9c**, **10**; criterios FR-007/FR-014/FR-015/FR-019.

---

## 7. Sprint 5 — Auditoría completa + hardening

**Objetivo:** [PDR §10](../business/pdr.md#10-prioridad-de-trabajo-y-roadmap-de-entregas-mvp-en-sprints) Sprint 5 — cerrar auditoría, sesión única, E2E y despliegue.
**Cierra:** FR-008b; completa FR-008 y la auditoría (§2.9).

Archivos, en orden:

1. `src/audit/` (completar) — `audit.controller.ts`: `POST /audit-logs/shift` y `POST /audit-logs/month` ([§6.14](technical_guide.md#614-auditlogsbyshiftresponse-consulta-del-rastro-por-turno--admin): FK directa por `shiftId`, sin paginación). Verificar las **8 acciones** cableadas en S1-S3 (tabla §4.3) y la inmutabilidad (solo INSERT/SELECT).
2. `src/auth/` (completar) — **sesión única por turno** (FR-008b): registro de sesión activa por usuario/turno; login con otro rol en el mismo turno → error claro; `logout` y `shifts/close` la liberan.
3. Suite E2E completa (`test/`): los 30+ casos de [tech guide §8](technical_guide.md#8-test-cases-e2e-casos-prioritarios) — es la spec ejecutable; correr contra DB con seed.
4. OpenAPI/Swagger generado desde los controllers ([§7](technical_guide.md#7-openapi-skeleton-recomendación)) y despliegue local según [§9](technical_guide.md#9-despliegue-backups-y-sincronización) (on-premise, sin nube en V1).

**DoD:** tests E2E §8: **11**, **15**, **17**, **17b**, **17c** + suite completa en verde; criterios FR-008/FR-008b; arranque limpio en Windows 10 local.

---

## 8. Mapa de cobertura FR → Sprint

Ningún FR de V1 queda huérfano:

| FR | Título corto | Sprint |
|---|---|---|
| [FR-000](../business/requirements.md#fr-000--gestión-de-sucursales-alta) | Gestión de sucursales | 0 ✅ |
| [FR-001](../business/requirements.md#fr-001--gestión-de-productos-y-variantes-alta) | Productos y variantes (alta, edición y baja) | 1 |
| [FR-002](../business/requirements.md#fr-002--registro-de-pedidos-pos-alta) / [FR-002b](../business/requirements.md#fr-002b--venta-custom-de-presas-surtidas-alta) | POS estándar / venta custom | 1 / 2 |
| [FR-003](../business/requirements.md#fr-003--comanda-digital-y-factura-opcional-alta) | Comanda digital y factura opcional | 1 (comanda) + 4 (factura) |
| [FR-004](../business/requirements.md#fr-004--control-de-caja-por-turno-alta) | Control de caja por turno | 1 (cajas + períodos + open) + 3 (arqueo) |
| [FR-005](../business/requirements.md#fr-005--vales-de-trabajadores-media) | Vales | 3 |
| [FR-006](../business/requirements.md#fr-006--inventario-por-presas-alta) | Inventario por presas (2 planos) + CRUD de ítems | 2 |
| [FR-007](../business/requirements.md#fr-007--notificación-de-pedido-listo-alta) | Pantalla pública de pedidos listos | 4 |
| [FR-008](../business/requirements.md#fr-008--interfaces-diferenciadas-por-rol-alta) / [FR-008b](../business/requirements.md#fr-008b--sesión-única-por-turno-alta) | Permisos por rol / sesión única | 0 (guards) + 5 (sesión) |
| [FR-009](../business/requirements.md#fr-009--registro-de-gastos-media) | Gastos desde caja | 3 |
| [FR-010](../business/requirements.md#fr-010--reportes-alta) | Reportes + CSV | 3 |
| [FR-011](../business/requirements.md#fr-011--pedidos-con-pago-pendiente-alta) / [FR-011b](../business/requirements.md#fr-011b--anulación-de-pedido-pagado-alta) | Pago pendiente / anulación | 1-2 / 2 |
| [FR-012](../business/requirements.md#fr-012--historial-de-comandas-media) | Historial de comandas | 1 (`GET /orders`) |
| [FR-013](../business/requirements.md#fr-013--ui-limpia-por-rol-alta) | UI limpia por rol | transversal (la matriz §5.2 es la spec; UI = frontend) |
| [FR-014](../business/requirements.md#fr-014--impresión-de-factura-y-descarga-pdf-media) | Factura térmica + PDF | 4 |
| [FR-015](../business/requirements.md#fr-015--vista-pública-del-cliente-alta) | Vista pública del cliente | 4 |
| [FR-016](../business/requirements.md#fr-016--gestión-de-descuentos-y-aplicación-en-pos-media) / [FR-016b](../business/requirements.md#fr-016b--autorización-de-descuentos-por-turno-media) | Descuentos / autorización por turno | 3 |
| [FR-017](../business/requirements.md#fr-017--registro-de-consumos-manuales-y-ciclo-crudo-de-presas-por-turno-media) | Consumos manuales + ciclo crudo | 2 |
| [FR-018](../business/requirements.md#fr-018--autenticación-jwt-y-autorización-por-rol-alta) | JWT + autorización | 0 |
| [FR-019](../business/requirements.md#fr-019--registro-y-búsqueda-de-clientes-alta) | Clientes (alta operativa / gestión admin) | 1 (alta + lookups) + 4 (listado, edición, baja, historial) |

**NFR transversales y dónde se materializan:** contrato estándar → filter (S0) · seguridad JWT+bcryptjs → auth (S0) · ≤300 ms en LAN → índices ya definidos en el schema + `pos/context` liviano (S1-S3) · español/Bs → mensajes de los services · CSV → reports (S3) · multiplataforma → `path.join` y fechas UTC (convención §1 tech guide) · despliegue local → S5.

---

## 9. Flujo funcional de prueba (orden usuario real)

> **Qué es:** el recorrido **paso a paso** para probar la API de punta a punta como lo haría un **usuario del sistema**, no como lo haría un desarrollador con la DB abierta. La diferencia es una sola y es la clave: **primero se crea la data, después se vende usando esa data.** Nada de esto requiere `pnpm seed`.
>
> **Por qué importa:** los CRUDs de maestros (cajas, períodos, catálogo, stock) existen justamente para esto. Si un flujo de acá necesita tocar la DB o correr el seeder, es que falta un endpoint de alta.
>
> **Cómo se ejecuta:** los payloads concretos, paso a paso, están en **[api-testing-guide.md](api-testing-guide.md)** — esa es la guía práctica de pruebas. Esta § es el **orden** y el **por qué**; la otra es el **cómo**. Los pasos marcados 🔲 se habilitan a medida que el sprint correspondiente se implemente.

### 9.1 Principio: crear la data antes de vender

El orden lo fija la **FK**, no la conveniencia:

```
Branch ──► User ──► CashRegister ──► ShiftPeriod
   │          │                          │
   │          │                          ├──► Shift (turno)
   │          │                          │        │
   │          │                          │        ├──► Order ──► (pay/cancel/custom)
   │          │                          │        ├──► Voucher
   │          │                          │        └──► Expense
   │          │                          │
   │          └──► Discount (+ DiscountAuthorization)
   │                 ▲
   └──► InventoryItem (con stock inicial)
            │
            └──► OrderItemComponent (al vender)
```

### 9.2 Fase A — Bootstrap y jerarquía de usuarios

*Qué hace el usuario:* entra por primera vez, crea la sucursal y al equipo. Solo el `SUPER_ADMIN` puede; se crea con `pnpm bootstrap:admin` (ver [§5.2](technical_guide.md#52-autenticación-y-autorización)).

| Paso | Acción | Endpoint | Rol | Sprint |
|---|---|---|---|---|
| A1 | Login del `SUPER_ADMIN` | `POST /auth/login` | público | 0 ✅ |
| A2 | Crear la sucursal | `POST /branches` | SUPER_ADMIN | 0 ✅ |
| A3 | Ver la sucursal | `GET /branches` | SUPER_ADMIN | 0 ✅ |
| A4 | Crear el `ADMIN` de esa sucursal | `POST /users` (rol `ADMIN`, `branchId`) | SUPER_ADMIN | 0 ✅ |
| A5 | Crear `CASHIER` / `DISPATCHER` / `COOK` | `POST /users` (×3) | SUPER_ADMIN | 0 ✅ |
| A6 | Ver el equipo | `GET /users` | ADMIN | 0 ✅ |

> **Guardar los ids** de `branchId`, `adminId`, `cashierId`, `dispatcherId`, `cookId` — los referencian todas las fases siguientes.

### 9.3 Fase B — Configuración del negocio (todo maestro, vía ADMIN)

*Qué hace el usuario:* el `ADMIN` configura **antes de abrir caja**. Acá está el corazón del pedido: **cada maestro se crea por endpoint**, en orden de dependencia, sin tocar la DB.

| Paso | Qué configura | Endpoint | Rol | Sprint |
|---|---|---|---|---|
| B1 | Períodos de turno (Mañana/Noche ya vienen del seed; acá se crean/amplían) | `GET /shifts/shift-periods` · `POST /shifts/shift-periods` · `PATCH /shifts/shift-periods/{id}` | ADMIN | 1 |
| B2 | Caja(s) de la sucursal | `POST /cash-registers` · `GET /cash-registers` · `PATCH /cash-registers/{id}` | ADMIN | 1 |
| B3 | Catálogo: platos, bebidas, extras | `POST /products` · `GET /products` | ADMIN | 1 ✅ |
| B4 | Variantes de cada plato (composición de presas + mixto) | `POST /variants` | ADMIN | 1 ✅ |
| B5 | Editar / dar de baja catálogo | `PATCH /products/{id}` · `PATCH /products/{id}/toggle-active` · `PATCH /variants/{id}` | ADMIN | 1 |
| B6 | **Ítems de inventario**: 4 presas (con `salePrice`), bebidas, insumos | `POST /inventory/items` (con `initialStock`) | ADMIN | 2 |
| B7 | Ver stock (cocinero) | `GET /inventory/items` · `GET /inventory/dashboard` | ADMIN, COOK | 2 |
| B8 | **Descuentos** del catálogo (Descuento personal / Compensación al cliente) | `POST /discounts` | ADMIN | 3 |
| B9 | Registrar un cliente (facturación nominada) | `POST /customers` | CASHIER, ADMIN | 1 |

> **B6 en detalle (el ajuste clave):** el alta del ítem acepta `initialStock` y **crea la `InventoryTransaction` de `RECEPTION` en la misma transacción**. Razón: `currentStock` es un cache del libro de transacciones; el stock no se escribe directo sin rastro. Cargar el stock inicial por `/adjust` aparte obligaría a dos llamadas y dejaría una ventana con el ítem en 0 sin constar el ingreso.

### 9.4 Fase C — Operación de venta (caja abierta → vender)

*Qué hace el usuario:* la `CASHIER` abre su turno y registra ventas.

| Paso | Acción | Endpoint | Rol | Sprint |
|---|---|---|---|---|
| C1 | Login de la cajera | `POST /auth/login` | público | 0 ✅ |
| C2 | Cargar el POS (productos + turno + descuentos filtrados) | `GET /pos/context` | CASHIER | 1 ✅ |
| C3 | Ver períodos y cajas para abrir el turno | `GET /shifts/shift-periods` · `GET /cash-registers` | CASHIER, ADMIN | 1 |
| C4 | **Abrir caja** declarando período + caja + monto inicial | `POST /shifts/open` | CASHIER | 1 ✅ |
| C5 | Registrar venta **MESA pagada** (N ítems, desde el catálogo) | `POST /orders` | CASHIER | 1 ✅ |
| C6 | Registrar venta **LLEVAR con pago pendiente** (se prepara igual) | `POST /orders` (`paymentStatus: PENDING`) | CASHIER | 1 ✅ |
| C7 | **Confirmar pago** del pendiente → descuenta stock | `POST /orders/{id}/pay` | CASHIER | 1 ✅ |
| C8 | **Cancelar** un pendiente (manual, sin motivo) | `POST /orders/{id}/cancel` | CASHIER | 1 ✅ |
| C9 | Venta **custom** de presas surtidas (precio confirmado por la cajera) | `POST /orders/custom` | CASHIER | 2 |
| C10 | Aplicar **descuento por plato** (viaja en el ítem de la orden) | `POST /orders` con `discountId` | CASHIER | 3 |
| C11 | **Autorizar** a la cajera para un descuento del turno | `POST /discounts/{id}/authorize` | ADMIN | 3 |
| C12 | Registrar un **vale** (descuenta stock, no suma a caja) | `POST /vouchers` | CASHIER | 3 |
| C13 | Registrar un **gasto** desde caja | `POST /expenses` | CASHIER | 3 |
| C14 | Consumos manuales + ciclo crudo (cocina) | `POST /inventory/manual-consumption` · `shift-chicken-log` | COOK | 2 |

### 9.5 Fase D — Despacho y cierre

*Qué hace el usuario:* la `DISPATCHER` entrega, la `CASHIER` cierra caja, el `ADMIN` consulta.

| Paso | Acción | Endpoint | Rol | Sprint |
|---|---|---|---|---|
| D1 | Ver cola de comandas | `GET /orders?status=` | CASHIER, DISPATCHER, ADMIN | 1 ✅ |
| D2 | Marcar **listo** (→ pantalla pública, solo el número) | `PATCH /orders/{id}/status` (`ready`) | DISPATCHER | 4 |
| D3 | Marcar **entregado** | `PATCH /orders/{id}/status` (`delivered`) | DISPATCHER | 4 |
| D4 | Ver la comanda del cliente por token / pantalla pública | `GET /public/orders/{token}` · `GET /public/ready-orders` | público | 4 |
| D5 | **Cerrar caja** → arqueo + cierre administrativo | `POST /shifts/close` | CASHIER | 3 |
| D6 | Reportes (JSON / CSV) | `GET /reports/sales` · `/inventory-presas` · `/cash-audit` | ADMIN | 3 |
| D7 | Auditoría por turno / mes | `POST /audit-logs/shift` · `/month` | ADMIN | 5 |

### 9.6 El recorrido mínimo "de punta a punta" (sin seed)

Este es el **criterio de aceptación** de que los CRUDs de maestros funcionan. Con la DB vacía:

```
SUPER_ADMIN: login → POST /branches → POST /users (×4)
ADMIN:       login → POST /cash-registers → POST /products → POST /variants
             → POST /inventory/items (presas + bebidas, con stock inicial)
CASHIER:     login → POST /customers → POST /shifts/open
             → POST /orders (MESA pagada)  ─┐  usa la data creada arriba
             → POST /orders (LLEVAR pend.)  │
             → POST /orders/{id}/pay        ─┘
             → GET /inventory/dashboard  (stock descontado)
```

Si alguno de estos pasos necesita `pnpm seed` o tocar la DB, **falta un CRUD de maestro** — volvé a la §1 ("orden de los CRUDs = orden de las FK") y agregalo al sprint que corresponda.

### 9.7 Corolario: qué NO se agrega por esto

Para que este flujo sea navegable se agregaron **solo los CRUDs de maestros**. Explícitamente **fuera de alcance** (YAGNI — entra con un caso real, no antes):
- **Ningún `DELETE`**: toda baja es `PATCH /{id}/toggle-active` (mismo patrón en branches/users/customers) — el negocio no borra, desactiva.
- **Ningún listado que la UI no consuma**: no se crean endpoints de lectura "por las dudas"; lo que la pantalla necesita, `GET /pos/context` y los listados del admin ya cubren.
- **No se toca el schema**: todos los campos que este flujo necesita ya existen (`CashRegister`, `ShiftPeriod`, `InventoryItem.salePrice`, `InventoryTxnReason.RECEPTION`).

---

> **Cómo usar esta guía:** avanzá sprint por sprint; dentro de cada sprint, respetá el orden numerado (cada paso asume los anteriores). Antes de codear un endpoint, leé su contrato en el §6.x referenciado y la regla de negocio en el PDR. El DoD de cada sprint son los tests E2E de [tech guide §8](technical_guide.md#8-test-cases-e2e-casos-prioritarios) — si no pasan, el sprint no terminó. **Y antes de escribir código, mirá la [§9](#9-flujo-funcional-de-prueba-orden-usuario-real):** si el flujo de usuario necesita un maestro que no tiene endpoint, ese endpoint es parte del sprint.


