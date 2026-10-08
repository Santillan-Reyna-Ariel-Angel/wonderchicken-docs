# Plan Sprint 2 — Inventario + venta custom

> Fecha: 2026-10-07 · Temporal (no es fuente de verdad: gana el PDR). Al cerrar el sprint, pasar lo permanente a `implementation_guide.md` / `technical_guide.md` y borrar este archivo.
> Base: [implementation_guide §4 y §10](../backend/implementation_guide.md), [technical_guide §6.8–6.11](../backend/technical_guide.md), PDR §2.3 y §2.10, y auditoría del código del 2026-10-07.
> Sin tests (regla del proyecto). Red de seguridad: `pnpm api:snapshot` + recorrido §9 Fase C por Postman.

## Decisiones tomadas (grill)

| # | Decisión |
|---|---|
| D1 | **Bebidas:** nueva columna `InventoryItem.productId` (FK nullable a `Product`, única por sucursal). El admin vincula la bebida al crear/editar el ítem. **Regla de catálogo (2026-10-07):** cada bebida es un `Product` con nombre único que incluye marca y tamaño ("Fanta Naranja 2 lt"); nada de "Bebida 500 ml" genérica. El seed se alineó (`seeders/domains/drink-catalog.ts`). |
| D2 | **Sin stock al pagar:** se bloquea el pago con `INSUFFICIENT_STOCK` (409), nombrando el ítem que falta. Todo o nada, en la misma transacción. |
| D3 | **Anular pagado:** `CASHIER` y `ADMIN`; solo si el turno del pedido sigue `OPEN`. Un único `POST /orders/{id}/cancel`: sin body si está pendiente; `reason` + `details` obligatorios si está pagado. |
| D4 | **Alcance §10 incluido:** #33 períodos por sucursal, #8 `paidAt`, #20 doble cancel, #7 `@HttpCode(200)`, #34 formato `HH:mm`, #21 código muerto, #5 `AuditService`. **Fuera:** #28, #29 (YAGNI). |
| D5 | **`selectedPieces`:** si la variante tiene presas, al pagar (create PAID o `/pay`) la suma de `qty` debe igualar `presas × quantity`. Un pendiente puede crearse sin ellas. |
| D6 | **"Vendido del período"** = filas `SALE` (netas de `CANCELLATION_REVERT`) unidas por `referenceId → Order.shiftId`. Limitación aceptada: un pendiente pagado en otro período se imputa al de su creación. |
| D7 | **DB de desarrollo se resetea + reseed.** Sin SQL de backfill. |
| D8 | **Decisión #24 reemplazada:** el ciclo crudo y los consumos manuales se anotan por **sucursal + fecha + período**, **no por `shiftId`**. Los horarios por rol no se modelan (`referenceStart/End` quedan informativos). Confirmada por la aclaración del 2026-10-07 (ver sección siguiente). |

## Modelo de turnos (aclaración del negocio, 2026-10-07)

**Wonder Chicken tiene dos turnos operativos: Mañana y Noche.** Es el único eje común de caja, inventario y cocina. Cada rol tiene su horario dentro de uno de ellos (cocina 9:00–16:00 de mañana y 16:00–23:00 de noche; cajera y despachadora comparten horario: 10:00–16:30 y 16:30–23:00). V1 **no** controla asistencia.

- **Clave del día operativo = `(branchId, periodId, businessDate)`.** Caja, ciclo crudo, consumos manuales y reportes se agrupan por ella. El código ya lo hace para la caja (`Shift.periodId`); D8 lo extiende a cocina.
- **`Shift` (turno de caja) ≠ período.** Un `Shift` es la sesión de **una cajera en una caja dentro de un período**; puede haber varios por período (dos cajas). El período es el turno del negocio.
- **Los horarios por rol NO se modelan.** `referenceStart/End` describen la ventana nominal del período (informativa; la usa el front para sugerir el período al abrir caja). No se agregan horarios por rol ni validaciones por reloj: sería código sin uso en V1 (YAGNI) y rígido ante cambios de horario.
- **Asistencia a futuro, sin retrabajo:** un módulo posterior agrega una tabla nueva (p. ej. `Attendance { userId, branchId, periodId, businessDate, checkIn, checkOut }` y, si se quiere, `WorkSchedule { role|userId, periodId, start, end }`). Se engancha a la **misma clave** `(branchId, periodId, businessDate)` y no toca ninguna tabla de este sprint.
- **Corrección de documentación:** `technical_guide §6.5` dice que "cocina y despacho no usan el período". Tras D8 **la cocina sí lo usa** (despacho sigue sin usarlo). Se corrige en F8.
- **Fecha operativa:** la fecha por defecto es la de hoy en la zona del servidor (on-premise, V1); el cliente puede enviarla, nunca futura. El Noche termina 23:30, antes de medianoche, así que no hay cruce de día en la operación actual.

## Hallazgos que condicionan el plan

- `buildOrderItemComponents` (`orders.helpers.ts:193`) no setea `inventoryItemId`, no multiplica por `quantity` y no genera filas para bebidas ni `selectedPieces`. **Hoy no puede ser la fuente de verdad** que declaran la guía y el PDR.
- No existe mapeo Product → InventoryItem. Las presas se resuelven por `type` (una por tipo y sucursal; si hay dos activas del mismo tipo es ambiguo → error).
- `DailyManualConsumption` y `ShiftChickenLog` existen, pero con `shiftId` (D8 lo reemplaza).
- `InventoryService.adjust` (`inventory.service.ts:288`) es la plantilla: `updateMany` con guarda `currentStock >= n` + `InventoryTransaction` + audit.
- Anular el pagado revierte desde el **libro** (`SALE` por `referenceId = order.id`), no recalculando: es el inverso exacto aunque cambie el catálogo.
- Limitaciones documentadas: el componente "bebida" de una variante (sin `productId`), acompañamientos y extras **no descuentan** (PDR §2.3: sin inventario granular).

## Fases (en orden de dependencia)

### F0 — Schema y datos base
1. `prisma/schema.prisma`:
   - `ShiftPeriod`: `branchId`, relación en `Branch`, `@@unique([branchId, name])`, índice `[branchId, active, displayOrder]`.
   - `Shift`: `businessDate` (`@db.Date`, se fija al abrir caja con la fecha de hoy del servidor) + índice `[branchId, periodId, businessDate]`. `open()` lo escribe. D9: decidido 2026-10-07.
   - `InventoryItem`: `productId?` + `@@unique([branchId, productId])`.
   - `ShiftChickenLog` y `DailyManualConsumption`: reemplazar `shiftId` por `branchId`, `periodId`, `businessDate` (`@db.Date`). Único del log: `[branchId, periodId, businessDate, pieceType]`.
2. Nueva migración + `pnpm prisma generate`; reset + reseed.
3. Seeders (períodos por sucursal, vínculo bebida→`productId`, consumos), `SEED_IDS`, `example-data.ts`, `order.entity.ts`.

### F1 — Higiene barata
- `@Matches(/^([01]\d|2[0-3]):[0-5]\d$/)` en `referenceStart/End` (create y update) — #34.
- `AuditService.log`: tipar `action: AuditAction` y lanzar `Error` en vez de `BadRequestException` — #5.
- Catálogo de errores (`error-codes.ts`): `ORDER_ALREADY_CANCELLED`, `CANCEL_REASON_REQUIRED`, `ORDER_SHIFT_CLOSED`, `INVENTORY_MAPPING_MISSING`, `INVALID_PIECE_SELECTION`, `CHICKEN_LOG_CLOSED`, `INVALID_CUSTOM_PRICE`, `PERIOD_REQUIRED/OUT_OF_BRANCH`. Mensaje de `INSUFFICIENT_STOCK` pasa a ser genérico (hoy dice "el ajuste…"). Retirar `ORDER_ALREADY_PAID_USE_ANULL` al final de F4.

### F2 — Períodos por sucursal (#33)
- `shifts.service`: `listPeriods/createPeriod/updatePeriod` acotados con `readableBranchId` / `resolveWriteBranchId` (patrón de cajas); `open()` valida `period.branchId === actor.branchId`.
- Roles de `/shifts/shift-periods`; SUPER_ADMIN indica `branchId`.
- `pos.getContext` pasa el actor para listar los períodos de su sucursal.
- Borrar `requireShiftForBranch` y sus códigos huérfanos (#21): con D8 ya no se usa.
- Retirar el aviso "afecta a todas las sucursales" en docs.

### F3 — Núcleo de inventario
- `InventoryService`:
  - `decrementForOrder(tx, order, actor)` y `revertForOrder(tx, orderId, actor)`.
  - Reglas: agrupar por `inventoryItemId`, **ordenar por id** (evita deadlocks), guarda `updateMany` atómica, `SALE` con `referenceId = order.id`, nota `Venta orden #N`.
  - Presas por `type + branch`, bebidas por `productId`. Sin mapeo → `INVENTORY_MAPPING_MISSING`.
- Corregir `buildOrderItemComponents`: expandir `selectedPieces`/`customPieces` y `drinks` con `inventoryItemId`, `quantity × item.quantity`. **Una sola fuente de verdad: las filas de componentes** (PDR §2.3). El decremento itera esas filas.
- Validación D5 (`INVALID_PIECE_SELECTION`).
- `OrdersModule` importa `InventoryModule`.

### F4 — Integración en `orders`
- `create()` PAID y `pay()`: llamar a `decrementForOrder` dentro de la misma `$transaction`, antes del audit. `paidAt` en create-paid (#8).
- `cancel()` unificado (D3): pendiente → igual que hoy; pagado → exige `reason/details`, verifica turno `OPEN`, `revertForOrder` (`CANCELLATION_REVERT`), persiste `cancelReason/cancelDetails/cancelledAt`, audit `CANCEL_SALE` con `shiftId`. Rechaza ya cancelado (#20). Atar `CancelOrderDto` al controller.
- `@HttpCode(200)` en `pay` y `cancel` + ajustar `ApiOkEnvelope` (#7). **Coordinar con el front.**
- `dashboard()`: `sold = −(SALE + CANCELLATION_REVERT)`.

### F5 — `POST /orders/custom`
- `create-custom-order.dto.ts`: `customPieces[]`, `extras?`, `drinks?`, `quantity`, `unitPrice` confirmado (≥ 0, 2 decimales). `type` forzado a `LLEVAR`.
- Reusar la receta de `create()` (número de turno, cliente, pago, audit); `isCustom: true`; `unitPrice` desde el DTO; `customPieces` persistido; `productId` nulo. Adaptar `auditSale` para líneas sin producto.
- Mismo descuento y mismo bloqueo por stock que F3/F4.

### F6 — `pos/context` += `piecePrices`
- `[{ type, salePrice }]` de las presas **activas con `salePrice`** de la sucursal del actor (string). Documentar el caso "sin precio cargado".

### F7 — Cocina (COOK / ADMIN)
- `POST /inventory/manual-consumption` — `{ periodId, date?, entries[] }` (fecha por defecto hoy, no futura). Todo o nada, `MANUAL_CONSUMPTION` en el libro, guarda atómica.
- `GET /inventory/shift-chicken-log?periodId=&date=` — cuatro filas; `reprocessRaw` autopoblado con el `rawLeftover` del período anterior (por `displayOrder`; el primero del día toma el último del día previo).
- `POST /inventory/shift-chicken-log` (upsert) y `POST …/close`. El cierre reconcilia con **D6** (suma las ventas de todos los `Shift` con `branchId + periodId + businessDate` iguales — D9). No bloquea ante discrepancias. Log cerrado inmutable.
- Cocinero necesita listar períodos de su sucursal: habilitar `GET /shifts/shift-periods` para `COOK` (solo activos).

### F8 — Cierre
- Corregir `technical_guide §6.5` ("cocina no usa el período") y agregar el modelo de turnos (clave `(branchId, periodId, businessDate)`) a PDR §2.3 / architecture_overview.
- Actualizar `implementation_guide` (§4 estado, §10: #5, #7, #8, #20, #21, #33, #34 resueltos; #24 → "cerrada: por período"), `technical_guide` (§6.5, §6.9, §6.10, §6.11, §4.3 `CANCEL_SALE`), `api-testing-guide` (Fase C).
- `pnpm exec eslint "src/**/*.ts"`, `pnpm seed`, `pnpm api:snapshot` (revisar diferencias y `--update`), regenerar `swagger.json` y `pnpm postman:sync --no-push`.
- Avisar al front: `HttpCode 200`, períodos por sucursal (SUPER_ADMIN elige sucursal), `piecePrices`, `/orders/custom`, selector de período del cocinero.

## DoD (sin tests automáticos)
Recorrido §9 Fase C por Postman desde DB vacía: alta de 4 presas (con `salePrice`) + bebida vinculada + insumos → venta pagada que **descuenta** (visible en `GET /inventory/dashboard`) → venta sin stock **rechazada** → pendiente pagado descuenta → anulación de pagado **repone** → venta custom con precio pisado → ciclo crudo del período cerrado con discrepancia calculada.

## Información de negocio confirmada por el dueño (2026-10-07, segunda tanda)

Pendiente de pasar al PDR/`business_context.md` cuando el dueño lo apruebe (el PDR es fuente de verdad; no se editó).

- **Dos turnos:** Mañana y Noche. La **caja se abre en cualquier momento** dentro del turno (mañana: normalmente ~11:00, la venta empieza ~11:30; noche: 16:30, 18:30 o más tarde). No siempre inician puntual.
- **Horarios:** cocina 9:00–16:00 / 16:00–23:00. Cajera y despachadora **comparten** horario: 10:00–16:30 / 16:30–23:00.
- **Rotación:** las cajeras y despachadoras son las mismas personas y **rotan** (un día abren caja, otro usan solo las pestañas de despachadora). Los cocineros no rotan y casi no usan el sistema.
- **Planilla "Inventario diario"** (una por turno, [business_context.md](../business/business_context.md#ejemplo-de-inventario-diario)), con dos partes:
  1. **Ciclo del pollo** (reproceso, procesado, sobrante crudo, vendido cocido, sobrante cocido): la anotan **los cocineros** —cualquiera de los dos—, junto con las bolsas de papa usadas.
  2. **Tabla de inventario** (bebidas, bolsas, papeles, servilletas, vasos… con saldo anterior, ingreso, gasto, sobrante): la anotan también **cajeras y despachadoras**.
- **Cada sucursal define sus propios turnos y horarios** (por si otra sucursal abre con otros).
- **El ciclo del pollo lo anota SOLO el rol `COOK`** (no el ADMIN). Cajera y despachadora editan su parte de la planilla (consumos de bolsas, papeles, etc.); cocina, solo el ciclo del pollo y lo suyo.
- **El ADMIN lee toda la planilla** (lo de cocina y lo de cajeras/despachadoras) **pero no escribe**: solo lector.
- **En el front los turnos se muestran solo como "Mañana" y "Noche", sin horario.** Quien entra elige el turno sin ver horas. Hoy solo la cajera elige turno y caja; cocinero y despachadora entran directo a sus pantallas.
- **Los turnos NO se crean automáticamente:** cada ADMIN crea sus turnos y sus horarios de referencia a mano (decisión del dueño, 2026-10-07). El seed de demo sigue creándolos.
- **Los horarios del turno son REFERENCIALES, nunca fijos:** la caja puede abrirse en cualquier momento del turno y quien abre declara el período. Ningún código los lee como regla.
- **Asistencia:** V2 o V3. **Despachadora extra vie–dom a las 18:00:** sin confirmar y no documentada; es una excepción de persona y día (asistencia futura).

## Planilla de inventario diario (2026-10-07) · implementada

Objetivo: que `GET /inventory/daily-sheet?periodId=&date=` devuelva todo lo necesario para pintar la planilla de [business_context.md](../business/business_context.md#ejemplo-de-inventario-diario) (tabla 1: ciclo del pollo; tabla 2: ítems con `SALDO ANT.`, `INGRESO`, `TOTAL MESÓN`, `GASTO`, `SOBRANTE`). La ven ADMIN, COOK, CASHIER y DISPATCHER; **escribe cada rol solo lo suyo**.

**Decisiones del dueño (respuestas a las 4 preguntas):**
1. Va la opción completa **O1** (la planilla se calcula; no se teclea entera).
2. **Sí se guarda el conteo físico del sobrante.** El **sobrante cocido en expositor** lo anotan **despachadoras o cajeras**, no el cocinero.
3. El **ingreso de insumos** lo registran **despachadoras y cajeras** (normalmente despachadoras). El ADMIN **no** lo registra por ahora (se confirmará más adelante).
4. Un ajuste o recepción del ADMIN **no** forma parte de la planilla (queda fuera de las columnas de turno).

**Quién escribe qué (refinado):**

| Dato | Escribe |
|---|---|
| Reproceso crudo, procesado crudo, sobrante procesado crudo | `COOK` (cualquiera de los dos cocineros) |
| Sobrante **cocido** en expositor | `DISPATCHER` o `CASHIER` ⚠️ cambia el diseño actual (hoy lo escribe el cocinero) |
| Vendido cocido | Nadie: lo calcula el sistema |
| Consumos (gasto manual) de la tabla 2 | `COOK`, `CASHIER`, `DISPATCHER` |
| Ingreso de insumos | `CASHIER`, `DISPATCHER` (endpoint nuevo) |
| Conteo físico del sobrante de la tabla 2 | `CASHIER`, `DISPATCHER` (¿y COOK para sus ítems? — a confirmar) |
| Lectura de toda la planilla | `ADMIN`, `COOK`, `CASHIER`, `DISPATCHER` |

**Implicaciones de diseño detectadas:**
- **`SALDO ANT.` = sobrante contado del turno anterior** (como en el papel), no el stock reconstruido: así un ajuste del ADMIN fuera de turno no rompe la cadena. Con esto **no hace falta marcar cada movimiento del libro con turno** (la migración es más liviana que la planteada en O1).
- Tablas nuevas (propuestas): ingresos del turno y conteos del turno, con `(branchId, periodId, businessDate, ítem)`. El ingreso sigue escribiendo `RECEPTION` en el libro.
- **El ciclo del pollo se parte en dos escritores:** cocina escribe las 3 filas crudas y despacho/caja el cocido en expositor. El **cierre** del ciclo y la reconciliación (`cooked − vendido` vs `cookedLeftover`) necesitan que ambos hayan escrito: hay que definir **quién cierra** y qué pasa si falta uno.
- **Responsable de la planilla:** la planilla muestra fecha, turno y **un** responsable aunque escriban varias personas; el dueño dice que es "quien estuvo en caja". Probable fuente: la cajera del turno (`Shift.cashier`). A confirmar con la imagen.
- El ciclo del pollo debe salir en el orden de la planilla: **ALA, PECHO, PIERNA, ENTREPIERNA** (hoy es PECHO, ALA, PIERNA, ENTREPIERNA).
- El `SOBRANTE` de la planilla no es aritmético (compras no anotadas): se guarda como conteo y el sistema calcula el esperado (`total − gasto`) y la diferencia.

**Lo que muestra la foto de la planilla real (Lunes 20 de abril de 2026, turno Mañana, elaborada por "Erika"):**
- **Encabezado:** logo, "Av. Las Americas Nº 317 — Teléfonos: 6464864" (= `Branch.address` y `Branch.phone`), título "INVENTARIO DIARIO", **Elaborado por** (un solo nombre), **"Sucre, 20 de Abril de 2026"** (ciudad + fecha), **Día: Lunes** (se deriva de la fecha), **Turno: Mañana**. La **ciudad no está en el modelo** (`Branch` solo tiene nombre, dirección y teléfono).
- **Tabla 1:** columnas **ALA, PECHO, PIERNA, ENTREPIERNA y TOTAL** (hay una columna TOTAL que el ejemplo de `business_context.md` no tenía: suma de las cuatro por fila). Filas: Reproceso crudo, Procesado crudo, Sobrante procesado crudo, Vendido cocido, Sobrante cocido en expositor.
- **Tabla 2:** `COD | PRODUCTO | TIPO | SALDO ANTERIOR (A) | INGRESO (B) | TOTAL EN MESON (A+B) | GASTO | SOBRANTE`. Las fórmulas están impresas en el encabezado: `TOTAL EN MESON = A + B`.
- **El sobrante SÍ coincide con `total − gasto` en las filas legibles** (B1: 29−8=21; B2: 1−1=0; B3: 16−1=15; B5: 13−2=11; B6: 6; B9: 13; B10: 11). ⚠️ Esto **corrige** mi lectura anterior, basada solo en el ejemplo de `business_context.md`, donde no cuadraba. Falta confirmar si en la práctica es un conteo que casualmente coincide o un cálculo.
- **El catálogo real difiere del seed:** la foto tiene B4 "Fanta Mandarina" y B9 "Agua", y los códigos se corrieron (B5 Fanta Guaraná, B6 Fanta Papaya, B7 Fanta Limón, B8 Sprite, B10 Aquarius Pera). Los ítems y códigos los define cada ADMIN; el seed solo es demo.
- Los ítems sin movimiento se escriben con "—".

**Decisiones cerradas tras ver la foto (2026-10-07):**
1. **El sobrante se cuenta físicamente** (cocineros: pollo; despacho/caja: lo suyo). Hace falta guardar el conteo.
2. **No hay "cierre" del ciclo del pollo:** son campos **editables y se sobrescriben**. Pasa que un cocinero cuenta mal, se va, y la cajera —que se queda más tiempo— corrige. **La cajera tiene más poder de edición que el cocinero.**
3. **"Elaborado por" = la cajera del turno** (la que abrió caja).
4. **Se agrega `Branch.city`** para el encabezado ("Sucre, 20 de abril de 2026").

### Plan de implementación de la planilla — ✅ G1 a G8 IMPLEMENTADOS (2026-10-07)

> Reemplaza lo de cocina de F7: se pasa de "registros que se suman y un cierre" a "celdas editables que se sobrescriben".

- **G1 — Modelo** (se corrige la migración `20261007120000…`, que nunca se commiteó; hay que volver a resetear la DB):
  - `Branch.city` (texto, opcional en la API).
  - `ShiftChickenLog`: **quitar `closedAt`** y el concepto de cierre.
  - Una sola tabla de **celdas por ítem** `DailyInventoryItemEntry` con clave `(branchId, periodId, businessDate, inventoryItemId)` y campos `received`, `consumed` y `leftoverCount` (todos opcionales), `recordedById`, `updatedAt`. **Reemplaza** a `DailyManualConsumption`.
- **G2 — Escritura por celda con sobrescritura:** un único `PUT` que fija el valor de las celdas indicadas. Para `received` y `consumed` el libro registra la **diferencia** contra el valor anterior (así corregir un error no duplica el stock). `leftoverCount` **no mueve el stock**: se compara contra lo esperado.
- **G3 — Ciclo del pollo sin cierre:** se quita `POST …/close` y los errores `CHICKEN_LOG_CLOSED` / `CHICKEN_LOG_INCOMPLETE`. El **autopoblado** del reproceso pasa a usar el último ciclo anterior con datos (ya no "cerrado"). La reconciliación (`cocido − vendido` vs el cocido en expositor) se calcula **en vivo** en la lectura.
- **G4 — Permisos por campo** (a confirmar la matriz de abajo).
- **G5 — `GET /inventory/daily-sheet?periodId=&date=`** (solo lectura): encabezado (sucursal con dirección, teléfono y ciudad; fecha y día de la semana; turno; **elaborado por** = cajera del turno), tabla 1 (**ALA, PECHO, PIERNA, ENTREPIERNA + TOTAL**, 5 filas, con el vendido cocido calculado) y tabla 2 agrupada por la letra del código, con `previousBalance` (sobrante contado del turno anterior), `received`, `available` (= A+B), `consumed` (automático por ventas + manual), `expectedLeftover`, `countedLeftover` y `difference`.
- **G6 — Roles abiertos:** listado de insumos y de períodos para `CASHIER` y `DISPATCHER`; el ADMIN solo lee.
- **G7 — Quién modificó por última vez:** el dueño descartó la auditoría de sobrescrituras por ahora; solo se guarda `recordedById` (y `updatedAt`) de cada fila.
- **G8 — Seeds, `api:snapshot`, docs** (PDR §2.3 y §2.7, technical guide §6.9, guías) y verificación por la API como la de antes.

**Matriz de permisos por campo (FINAL, confirmada):** despacho y caja también corrigen las filas del cocinero; el cocinero no escribe el cocido en expositor ni el ingreso.

| Campo | Escribe |
|---|---|
| Reproceso, procesado y sobrante **crudo** (pollo) | `COOK`, `CASHIER`, `DISPATCHER` (caja y despacho corrigen) |
| Sobrante **cocido** en expositor | `CASHIER` y `DISPATCHER` |
| `consumed` y `leftoverCount` de la tabla 2 | `COOK`, `CASHIER`, `DISPATCHER` |
| `received` (ingreso) de la tabla 2 | `CASHIER`, `DISPATCHER` |
| Leer la planilla | `ADMIN`, `COOK`, `CASHIER`, `DISPATCHER` |

## Pendiente del FRONT para cerrar el Sprint 2 de punta a punta (traspaso, 2026-10-08)

El backend del Sprint 2 está cerrado y verificado (`api:snapshot` de 248 pasos, determinístico). Esto es lo que el front debe hacer; los contratos están en [technical_guide.md §6.5, §6.9, §6.10 y §6.11](../backend/technical_guide.md) y los pasos de prueba en [api-testing-guide.md](../backend/api-testing-guide.md).

**Los que hacen que el descuento de stock funcione de punta a punta (primero):**
- **F5 — Bebida de Wonder y Super Wonder:** hoy va en las `notes`, así que su stock nunca baja. Mandarla en `drinks[]`.
- **F9 — Formulario de ítems de inventario:** vincular cada bebida a su producto (`productId`) y marcar los ítems de cocina (`kitchenManaged`, ej. bolsas de papa). Debe haber un ítem activo por tipo de presa.
- **F4 — POS, `selectedPieces`:** verificar que sea **por unidad** cuando la cantidad es mayor a 1 y que los platos con presas **nunca** viajen sin él (error `INVALID_PIECE_SELECTION`).

**Pantallas nuevas:**
- **F1 — Planilla de inventario diario** (`GET /inventory/daily-sheet`, `PUT …/chicken`, `PUT …/items`) para ADMIN (solo lectura), cocinero, cajera y despachadora. Habilitar cada celda según el rol: el cocinero escribe lo crudo del pollo y el ingreso y gasto de los ítems con `kitchenManaged`; despacho y caja escriben el resto y pueden corregir al cocinero. Mostrar los turnos como "Mañana" y "Noche" **sin horas**.
- **F2 — Pantalla del cocinero** (hoy no existe ninguna para ese rol).
- **F3 — Venta custom** ("V. Custom"): `piecePrices` de `/pos/context` y `POST /orders/custom`. El tipo puede ser `MESA` o `LLEVAR`.
- **F6 — Anular un pedido pagado:** `POST /orders/{id}/cancel` con `reason` y `details` (hoy el front manda `{}`).

**Ajustes:**
- **F7 — Mensajes de error en español:** solo `INSUFFICIENT_STOCK` está traducido. Faltan `INVALID_PIECE_SELECTION`, `INVENTORY_MAPPING_MISSING`, `CANCEL_REASON_REQUIRED`, `ORDER_SHIFT_CLOSED`, `ORDER_ALREADY_CANCELLED`, `SHEET_FIELD_FORBIDDEN`, `SHEET_ITEM_INVALID`, `SHEET_EMPTY_UPDATE`, `INVALID_BUSINESS_DATE`, `INVENTORY_PRODUCT_ALREADY_LINKED` e `INVENTORY_PRODUCT_LINK_NOT_ALLOWED`.
- **F8 — Períodos por sucursal:** el SUPER_ADMIN necesita elegir sucursal (`?branchId=` y `branchId` en el alta); quitar el aviso "afecta a todas las sucursales". Cocinero y despachadora ya pueden listar los períodos.
- **F10 — Formulario de sucursal:** `city` es real ahora (el front la marca como "solo mock").
- **F11 — `pay` y `cancel` responden 200** (antes 201): verificar el cliente HTTP.

**Decisiones que ya están tomadas (no re-discutir):** las celdas de la planilla se sobrescriben y solo se guarda quién modificó por última vez; no hay cierre del ciclo; el sobrante cocido en expositor lo anotan despacho y caja; los turnos no se crean solos (los crea cada ADMIN); los horarios de los turnos son solo de referencia y no se muestran; la rotación cajera/despachadora (R2) y la asistencia quedan para el Sprint 5 / V2.

## Estado (2026-10-07)

F0–F8 implementadas y documentadas, **sin commits**. Falta lo que exige ejecutar la API y la DB:
1. `pnpm prisma migrate reset` + `pnpm seed` (la migración nueva no corre sobre datos viejos).
2. Recorrido §9 Fase C por Postman ([api-testing-guide.md](../backend/api-testing-guide.md)), en especial: venta sin stock rechazada, anulación que repone, venta custom, ciclo crudo con discrepancia.
3. `pnpm exec eslint "src/**/*.ts"`, `pnpm api:snapshot` (revisar cada diferencia y aceptar con `--update` solo si es esperada), `pnpm postman:sync --no-push`.
4. Avisar al front (ver "Riesgos abiertos").
5. Al cerrar el sprint: borrar este archivo (la documentación permanente ya está en la guía y el technical guide).

Decisiones tomadas durante la implementación que no estaban en el plan: `selectedPieces` es **por unidad** y se exige al **crear**; custom admite MESA y LLEVAR (gana el PDR); bebidas = un `Product` por marca y tamaño.

## Riesgos abiertos
- D2 bloquea ventas si el stock cocido no está cargado: el negocio debe cargar el stock inicial antes de operar.
- D6: imputación de pendientes pagados en otro período.
- Dos ítems activos del mismo tipo de presa en una sucursal rompen el mapeo → validar al crear/activar el ítem.
- Cambios de contrato visibles al front: #7, F2, F7.
