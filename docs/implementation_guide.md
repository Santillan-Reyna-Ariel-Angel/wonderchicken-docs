# Implementation Guide — Backend Wonder Chicken (V1)

**Sistema Informático de Ventas — Guía de construcción paso a paso**
**Complementa:** [pdr.md](pdr.md) (reglas) · [requirements.md](requirements.md) (FR/NFR) · [technical_guide.md](technical_guide.md) (modelo + contrato) · [architecture_overview.md](architecture_overview.md) (capas y módulos)
**Versión:** 1.0 · **Fecha:** 2026-07-10

> **Qué es este documento:** el **orden ejecutable** para construir el backend V1 — qué archivo crear en cada paso, sprint por sprint (PDR §10), hasta cubrir todos los FR de V1 ([PDR §13.1](pdr.md#131-versión-1-mvp--incluido)). **Solo V1** — nada de V2.
>
> **Qué NO es:** no re-explica reglas ni contratos. Cada paso **referencia** dónde leerlos: la regla en `PDR §2.x`, el criterio en `FR-xxx`, el contrato en `tech guide §5/§6`, la capa en `architecture_overview §2`. Ante conflicto: **gana el PDR** en negocio; ante conflicto de implementación, gana el código.

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

---

## 0. Estado de partida

Lo que YA existe (no rehacer):

| Pieza | Estado | Nota |
|---|---|---|
| `prisma/schema.prisma` | ✅ completo y validado | Fuente de verdad del modelo. Todas las entidades de tech guide §3.1 |
| `seeders/` | ✅ funcional (gitignored) | `pnpm seed` puebla los 16 dominios. El patrón de conexión **Prisma 7 + driver adapter** (`@prisma/adapter-pg`) ya está resuelto en `seeders/prisma.ts` — **reutilizarlo** para el `PrismaService` |
| `src/` | scaffold NestJS pelado | `main.ts`, `app.module.ts`, `app.controller/service` (estos dos se eliminan al final del Sprint 0) |
| Deps | ✅ | NestJS 11, Prisma 7.8 + adapter-pg, TypeScript (stack: tech guide §1) |

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
    prisma/     common/      auth/       users/          ← Sprint 0
    products/   shifts/      orders/     audit/   pos/   ← Sprint 1
    inventory/                                           ← Sprint 2
    expenses/   vouchers/    discounts/  reports/        ← Sprint 3
    customers/  print/                                    ← Sprint 4
  ```

- **Transversales (leer ANTES de codear el primer endpoint):** principios de diseño [tech guide §5.0](technical_guide.md#50-principios-de-diseño-de-la-api-el-backend-manda-el-frontend-renderiza) · contrato de respuesta [§5.3](technical_guide.md#53-estructura-de-respuesta-estándar) · códigos de error [§5.4](technical_guide.md#54-reglas-del-contrato) · reglas transaccionales [§4.2](technical_guide.md#42-reglas-transaccionales).
- **Estados reservados sin uso en V1** (`onHold`, `partial`, `redeemed`/`cancelled` de vale): el backend **no los produce ni acepta** — ver notas en tech guide §3.1.
- **Prefijo global:** todos los endpoints bajo `/api/v1` (setear en `main.ts`).

---

## 2. Sprint 0 — Fundaciones

**Objetivo:** todo lo transversal que los demás sprints consumen (PDR §10 Sprint 0 = modelado, ya hecho; acá se agrega el arranque técnico).
**Cierra:** FR-018; base de FR-008 y FR-013 (backend como frontera de seguridad).
**Ajuste sobre PDR §10 (explicado):** el PDR no ubica la autenticación en ningún sprint, pero los guards son **globales** (`APP_GUARD`) y todos los endpoints los atraviesan → va primero o se retrofitea todo.

Archivos, en orden:

1. `src/prisma/prisma.service.ts` — cliente Prisma con **driver adapter pg** (copiar el patrón de `seeders/prisma.ts`); maneja `$connect`/`$disconnect` en el lifecycle.
2. `src/prisma/prisma.module.ts` — `@Global()`, exporta el service.
3. `src/common/filters/http-exception.filter.ts` — `ExceptionFilter` global: TODA respuesta (éxito la arma el controller; error lo arma este filter) cumple el contrato `{ isSuccess, message, data, error }` de [§5.3](technical_guide.md#53-estructura-de-respuesta-estándar) con códigos estables de [§5.4](technical_guide.md#54-reglas-del-contrato).
4. `src/common/decorators/public.decorator.ts` y `roles.decorator.ts` — snippets de referencia en [§5.2](technical_guide.md#52-autenticación-y-autorización).
5. `src/common/guards/auth.guard.ts` y `roles.guard.ts` — 401/403 según [§5.2](technical_guide.md#52-autenticación-y-autorización) (JWT directo, **sin Passport**).
6. `src/auth/` (module/controller/service + `dto/login.dto.ts`) — `POST /auth/login` ([§6.0](technical_guide.md#60-authloginresponse)) y `POST /auth/logout` (libera la sesión del turno, FR-008b; la validación de sesión única completa llega en Sprint 5). bcryptjs para comparar hashes.
7. `src/users/` — `POST/GET/PATCH /users` (admin; alta con rol, activar/desactivar — PDR §2.7).
8. `src/main.ts` — prefijo `/api/v1`, `ValidationPipe` global, filter global, CORS. `src/app.module.ts` — registra Prisma/Auth/Users + los dos guards vía `APP_GUARD` (orden: Auth primero). Eliminar `app.controller.ts`/`app.service.ts`.

**DoD:** login con seed (`pnpm seed` crea usuarios) devuelve JWT; endpoint protegido sin token → 401; con rol incorrecto → 403 (criterios FR-018); todo error respeta el contrato §5.3.

---

## 3. Sprint 1 — Catálogo + POS básico

**Objetivo:** PDR §10 Sprint 1 — productos/variantes y venta MESA/LLEVAR con pago y comanda digital.
**Cierra:** FR-001, FR-002, FR-003 (parcial: comanda digital), FR-011 (parcial: crear pendiente y pagar — sin inventario todavía, eso es Sprint 2 per PDR §10).
**Ajustes sobre PDR §10 (explicados):**
- *Shifts mínimo se adelanta:* crear una orden exige turno abierto y `orderNumber` atómico vía `Shift.lastOrderNumber` (PDR §2.8) — el arqueo completo queda en Sprint 3.
- *AuditService nace acá:* PDR §10 pone auditoría en Sprint 5, pero [§4.3](technical_guide.md#43-auditoría--implementación-v1) exige el `INSERT` **dentro de la misma transacción** de cada acción crítica — retrofitearlo en S5 significaría reabrir todos los services. Cada sprint cablea sus acciones; S5 solo completa y verifica.

Archivos, en orden:

1. `src/products/` (module/controller/service + `dto/create-product.dto.ts`, `create-variant.dto.ts`) — CRUD productos y variantes ([§6.1](technical_guide.md#61-productcreateresponse-éxito)/[§6.2](technical_guide.md#62-variantcreateresponse-éxito); componentes de variante: PDR §2.2).
2. `src/shifts/` **mínimo** — `GET /shift-periods` (catálogo; seed ya crea Mañana/Noche), `POST /shifts/open` ([§6.10](technical_guide.md#610-cashopenresponse-éxito); el período se **declara**, jamás se infiere del reloj — PDR §13.3) y el contador `lastOrderNumber`.
3. `src/audit/audit.module.ts` + `audit.service.ts` — único método `log(tx, { entity, entityId, action, userId, shiftId, details })` ([§4.3](technical_guide.md#43-auditoría--implementación-v1)); cablear `OPEN_SHIFT` en shifts.
4. `src/orders/` (module/controller/service + `dto/create-order.dto.ts`, `pay-order.dto.ts`) — `POST /orders` ([§6.3](technical_guide.md#63-ordercreateresponse-mesa-pagado-con-sustitución): N ítems, precios desde catálogo, sustituciones §2.1, `publicToken`, `orderNumber` en `$transaction`), `POST /orders/{id}/pay` ([§6.4b](technical_guide.md#64b-payorderresponse-confirmar-pago-de-un-pendiente)), `GET /orders/{id}` y `GET /orders` con filtros (panel despacho + historial — FR-003/FR-012), cancelación de pendiente (PDR §2.5: manual, sin motivo). Cablear `CREATE_SALE` en la transacción. *(Los ítems ya aceptan `discountId` en el DTO pero la validación/snapshot de descuentos llega en Sprint 3 — hasta entonces, rechazar si viene.)*
5. `src/pos/` — `GET /pos/context` v1: solo `products` y `shift` ([§6.12](technical_guide.md#612-poscontextresponse-carga-del-pos-en-una-llamada); crece en S2 y S3).

**DoD:** tests E2E §8: **1**, **2** (sin la parte de inventario), **2b**, **8** (hasta comanda en panel vía `GET /orders?status=`); criterios FR-001/FR-002.

---

## 4. Sprint 2 — Inventario + venta custom

**Objetivo:** PDR §10 Sprint 2 — los dos planos del pollo (§2.3), decremento atómico al pagar, flujo custom, dashboard y consumos manuales.
**Cierra:** FR-002b, FR-006, FR-017; completa FR-011 (inventario recién al confirmar pago).

Archivos, en orden:

1. `src/inventory/` (module/controller/service + dtos) — `POST /inventory/adjust` ([§6.8](technical_guide.md#68-inventoryadjustresponse-éxito), cablear `ADJUST_INVENTORY`), `PATCH /inventory/{id}/sale-price` (precio por presa — alimenta el sugerido custom, PDR §2.10), `GET /inventory/dashboard` (stock cocido + delta del turno, FR-006).
2. `inventory.service.ts`: método transaccional `decrementForOrder(tx, items)` — regla de pares y bebidas por unidad (PDR §2.3), lanza `INSUFFICIENT_STOCK` ([§4.2](technical_guide.md#42-reglas-transaccionales)).
3. **Integrar en orders**: el decremento entra a la MISMA `$transaction` de `create` (pagado) y de `/pay`; reversión en `POST /orders/{id}/cancel` de pagados (`CANCELLATION_REVERT` + `CANCEL_SALE`, FR-011b).
4. `src/orders/dto/create-custom-order.dto.ts` + `POST /orders/custom` ([§6.5](technical_guide.md#65-customordercreateresponse-orden-llevar-custom--presas-surtidas-vía-post-apiv1orderscustom): `customPieces`, precio confirmado por la cajera — regla PDR §2.10; descuenta exactamente las presas indicadas).
5. `src/inventory/` (continuación) — `POST /inventory/manual-consumption` ([§6.9](technical_guide.md#69-manualconsumptionresponse-cierre-turno-cocina), FR-017) y `shift-chicken-log`: `GET /{shiftId}` (autopoblado del reproceso desde el último log cerrado — "el cálculo automático es una ayuda", PDR §2.3), `POST` y `POST /{shiftId}/close` (reconciliación y discrepancias).
6. `pos/context` += `piecePrices` (el POS calcula el precio sugerido custom **en el cliente**).

**DoD:** tests E2E §8: **2** (completo), **3**, **4**, **5**, **12**, **14**, **14b**; criterios FR-006/FR-002b/FR-017.

---

## 5. Sprint 3 — Caja completa + descuentos

**Objetivo:** PDR §10 Sprint 3 — arqueo, gastos, vales, feature de descuentos con autorización por turno, reportes.
**Cierra:** FR-004, FR-005, FR-009, FR-010, FR-016, FR-016b.

Archivos, en orden:

1. `src/shifts/` (completar) — `POST /shifts/close` ([§6.10b](technical_guide.md#610b-cashcloseresponse-arqueo)): arqueo con desglose §2.6, **cierre administrativo** de las órdenes `delivered` → `closed` del turno ([§4.1](technical_guide.md#41-transiciones-y-efectos)), extinción de autorizaciones y sesión; cablear `CLOSE_SHIFT`.
2. `src/expenses/` — `POST /expenses` ([§6.13](technical_guide.md#613-expensecreateresponse-gasto-desde-caja--fr-009); sin turno abierto → error claro).
3. `src/vouchers/` — `POST /vouchers` ([§6.7](technical_guide.md#67-vouchercreateresponse): monto derivado del producto, PDR §2.4; con "Descuento personal" opcional) y `GET /vouchers` con filtros (visibilidad §2.4: cajera ve los suyos, admin todos). Cablear `CREATE_VOUCHER`. Vale NO suma a caja — aparece en el arqueo de (1).
4. `src/discounts/` — CRUD del catálogo ([§6.6b](technical_guide.md#66b-discountcreateresponse-catálogo--admin)), `POST /{id}/authorize` + `GET /authorizations` ([§6.6c](technical_guide.md#66c-discountauthorizationresponse-admin-autoriza-a-la-sesión-de-cajera-por-turno); cablear `AUTHORIZE_DISCOUNT`).
5. **Integrar en orders**: validación del `discountId` por ítem EN LA CREACIÓN (disponibilidad + autorización del turno → `DISCOUNT_NOT_AVAILABLE`/`DISCOUNT_NOT_AUTHORIZED`), snapshot por unidad y totales derivados ([§6.6](technical_guide.md#66-ordercreatewithdiscountresponse-descuento-al-personal-por-plato-en-la-creación--una-sola-llamada); regla completa PDR §2.11). Quitar el rechazo temporal del Sprint 1.
6. `src/reports/` — `GET /reports/sales`, `/inventory-presas`, `/cash-audit`, todos con `?format=csv` (FR-010); cablear `GENERATE_REPORT` (entityId legible, ej. `"sales:2026-07"` — §4.3).
7. `pos/context` += `discounts` **filtrados por el backend** para la sesión y `shiftPeriods`.

**DoD:** tests E2E §8: **6**, **7**, **7b**, **13**, **13b**, **13c**, **13d**, **16**; criterios FR-004/FR-005/FR-009/FR-010/FR-016/FR-016b.

---

## 6. Sprint 4 — Cliente, vistas públicas e impresión

**Objetivo:** PDR §10 Sprint 4 — notificaciones de pedido listo, vista del cliente, factura.
**Cierra:** FR-007, FR-014, FR-015, FR-019; completa FR-003.

Archivos, en orden:

1. `src/customers/` — `GET /customers?search=` (por CI/NIT/nombre), `POST`, `GET /{id}`, `PATCH /{id}` ([§6.2a](technical_guide.md#62a-customercreateresponse--customersearchresponse); reglas PDR §2.12 — snapshot de `customerName` en la orden, editar cliente NO altera pedidos pasados).
2. `src/orders/` (completar) — `PATCH /orders/{id}/status` ([§6.11b](technical_guide.md#611b-orderstatusupdateresponse-despacho): `ready` persiste `readyAt`, `delivered` persiste `deliveredAt`+`deliveredBy` — PDR §4).
3. Rutas públicas (`@Public()`, en orders o módulo `public/`): `GET /public/orders/{token}` (capability URL — FR-015; + pedidos del día si hay `customerId`, FR-019) y `GET /public/ready-orders` (SOLO números de pedido `ready` — FR-007, §2.8).
4. `src/print/` — `POST /print/invoice` (térmica, a demanda) y `GET /print/invoice/{orderId}/pdf` (fallback) — FR-014; formato del ticket: PDR §7.7 / business_context.

**DoD:** tests E2E §8: **8** (completo con pantalla pública), **9**, **9b**, **9c**, **10**; criterios FR-007/FR-014/FR-015/FR-019.

---

## 7. Sprint 5 — Auditoría completa + hardening

**Objetivo:** PDR §10 Sprint 5 — cerrar auditoría, sesión única, E2E y despliegue.
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
| FR-001 | Productos y variantes | 1 |
| FR-002 / FR-002b | POS estándar / venta custom | 1 / 2 |
| FR-003 | Comanda digital y factura opcional | 1 (comanda) + 4 (factura) |
| FR-004 | Control de caja por turno | 1 (open mínimo) + 3 (arqueo) |
| FR-005 | Vales | 3 |
| FR-006 | Inventario por presas (2 planos) | 2 |
| FR-007 | Pantalla pública de pedidos listos | 4 |
| FR-008 / FR-008b | Permisos por rol / sesión única | 0 (guards) + 5 (sesión) |
| FR-009 | Gastos desde caja | 3 |
| FR-010 | Reportes + CSV | 3 |
| FR-011 / FR-011b | Pago pendiente / anulación | 1-2 / 2 |
| FR-012 | Historial de comandas | 1 (`GET /orders`) |
| FR-013 | UI limpia por rol | transversal (la matriz §5.2 es la spec; UI = frontend) |
| FR-014 | Factura térmica + PDF | 4 |
| FR-015 | Vista pública del cliente | 4 |
| FR-016 / FR-016b | Descuentos / autorización por turno | 3 |
| FR-017 | Consumos manuales + ciclo crudo | 2 |
| FR-018 | JWT + autorización | 0 |
| FR-019 | Clientes | 4 |

**NFR transversales y dónde se materializan:** contrato estándar → filter (S0) · seguridad JWT+bcryptjs → auth (S0) · ≤300 ms en LAN → índices ya definidos en el schema + `pos/context` liviano (S1-S3) · español/Bs → mensajes de los services · CSV → reports (S3) · multiplataforma → `path.join` y fechas UTC (convención §1 tech guide) · despliegue local → S5.

---

> **Cómo usar esta guía:** avanzá sprint por sprint; dentro de cada sprint, respetá el orden numerado (cada paso asume los anteriores). Antes de codear un endpoint, leé su contrato en el §6.x referenciado y la regla de negocio en el PDR. El DoD de cada sprint son los tests E2E de [tech guide §8](technical_guide.md#8-test-cases-e2e-casos-prioritarios) — si no pasan, el sprint no terminó.
