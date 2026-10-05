# Guía de Pruebas de API — Flujo de Usuario Real

> **Servidor:** `http://localhost:4000/api/v1`
> **Auth:** `Authorization: Bearer <token>` (salvo login y endpoints públicos)
>
> **El principio:** se prueba **como lo haría un usuario del sistema**, no como lo haría un desarrollador con la DB abierta. **Primero se crea la data, después se vende usando esa data.** Cada fase depende de la anterior por **FK**.
>
> **Nada de esto requiere `pnpm seed`.** Si algún paso necesita seed o SQL directo, es que falta un endpoint de alta — anotalo como bug del CRUD.
>
> **Estado:** ✅ implementado (se puede probar hoy) · 🔲 pendiente (llega con el sprint indicado)
> **Orden completo y razonamiento:** [implementation_guide.md §9](implementation_guide.md#9-flujo-funcional-de-prueba-orden-usuario-real)

---

## Mapa de fases

```
Fase A — Bootstrap y usuarios          SUPER_ADMIN   ✅
Fase B — Maestros del negocio          ADMIN         ✅ / 🔲
Fase C — Operación de venta            CASHIER       ✅ / 🔲
Fase D — Despacho, cierre y consulta   DISPATCHER+    ✅ / 🔲
Fase E — Permisos y errores            todos         ✅
Fase F — Vistas públicas e impresión   público       🔲 S4
```

---

## Fase A — Bootstrap y jerarquía de usuarios ✅

*Lo que hace el usuario:* entra por primera vez, crea la sucursal y su equipo.

### A1. Login del SUPER_ADMIN

| #   | Método | Endpoint      | Auth | Body                                                             | Esperado                                                        |
| --- | ------ | ------------- | ---- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | `POST` | `/auth/login` | —    | `{ "email": "superadmin@gmail.com", "password": "password123" }` | `200` → guardar **`superAdminToken`**                           |

### A2. Crear la sucursal

| #   | Método | Endpoint    | Auth              | Body                                                                 | Esperado                                            |
| --- | ------ | ----------- | ----------------- | -------------------------------------------------------------------- | --------------------------------------------------- |
| 2   | `POST` | `/branches` | `superAdminToken` | `{ "name": "Sucursal Central", "address": "Av. Central 123", "phone": "+591 2 2223344" }` | `201` → guardar **`branchId`**  |
| 3   | `GET`  | `/branches` | `superAdminToken` | —                                                                     | `200` → la sucursal creada aparece en la lista      |

### A3. Crear el equipo (4 roles)

| #   | Método | Endpoint   | Auth              | Body                                                                                                                          | Esperado                              |
| --- | ------ | ---------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 4   | `POST` | `/users`   | `superAdminToken` | `{ "firstName": "Ana", "lastName": "Admin", "email": "ana@wonderchicken.com", "ci": "1111111", "role": "ADMIN", "branchId": "{{branchId}}" }`     | `201` → guardar **`adminId`**        |
| 5   | `POST` | `/users`   | `superAdminToken` | `{ "firstName": "Carla", "lastName": "Cajera", "email": "carla@wonderchicken.com", "ci": "2222222", "role": "CASHIER", "branchId": "{{branchId}}" }` | `201` → guardar **`cashierId`**      |
| 6   | `POST` | `/users`   | `superAdminToken` | `{ "firstName": "Diana", "lastName": "Despacho", "email": "diana@wonderchicken.com", "ci": "3333333", "role": "DISPATCHER", "branchId": "{{branchId}}" }` | `201` → guardar **`dispatcherId`**   |
| 7   | `POST` | `/users`   | `superAdminToken` | `{ "firstName": "Elena", "lastName": "Cocina", "email": "elena@wonderchicken.com", "ci": "4444444", "role": "COOK", "branchId": "{{branchId}}" }` | `201` → guardar **`cookId`**         |
| 8   | `GET`  | `/users`   | `adminToken`     | —                                                                                                                              | `200` → 5 usuarios                  |

> El `COOK` se crea acá (paso 7) para poder probar el consumo manual y el ciclo crudo en la Fase C sin seeders.

---

## Fase B — Maestros del negocio (ADMIN configura antes de vender) ✅/🔲

*Lo que hace el usuario:* el `ADMIN` configura todo lo que la cajera necesita para poder vender. **Acá está el corazón del flujo: cada maestro se crea por endpoint.**

### B0. Login del ADMIN

| #   | Método | Endpoint      | Auth | Body                                                             | Esperado                                             |
| --- | ------ | ------------- | ---- | ---------------------------------------------------------------- | ---------------------------------------------------- |
| 9   | `POST` | `/auth/login` | —    | `{ "email": "ana@wonderchicken.com", "password": "1111111" }`   | `200` → guardar **`adminToken`**                    |

### B1. Períodos de turno ✅ Sprint 1

| #   | Método   | Endpoint                 | Auth        | Body                                                          | Esperado                                       |
| --- | -------- | ------------------------ | ----------- | ------------------------------------------------------------- | ---------------------------------------------- |
| 10  | `GET`    | `/shifts/shift-periods`  | `adminToken`| —                                                              | `200` → Mañana, Noche (del seed)               |
| 11  | `POST`   | `/shifts/shift-periods`  | `adminToken`| `{ "name": "Tarde", "displayOrder": 3, "referenceStart": "13:00", "referenceEnd": "17:00" }` | `201` → **`periodTardeId`** |
| 12  | `PATCH`  | `/shifts/shift-periods/:id` | `adminToken` | `{ "name": "Tarde extendida" }`                            | `200` → editado                                 |

> Los horarios de referencia son **informativos**: cambiarlos no reclasifica ningún turno ya abierto.

### B2. Cajas registradoras ✅ Sprint 1

| #   | Método   | Endpoint                      | Auth        | Body                          | Esperado                              |
| --- | -------- | ----------------------------- | ----------- | ----------------------------- | ------------------------------------- |
| 13  | `POST`   | `/cash-registers`             | `adminToken`| `{ "name": "Caja 1" }`         | `201` → guardar **`cashRegisterId`**  |
| 14  | `POST`   | `/cash-registers`             | `adminToken`| `{ "name": "Caja 2" }`         | `201` → **`cashRegisterId2`**         |
| 15  | `POST`   | `/cash-registers`             | `adminToken`| `{ "name": "Caja 1" }`         | `4xx` → `CASH_REGISTER_ALREADY_EXISTS` |
| 16  | `GET`    | `/cash-registers`             | `adminToken`| —                             | `200` → Caja 1, Caja 2                 |
| 17  | `PATCH`  | `/cash-registers/:id`         | `adminToken`| `{ "name": "Caja Principal" }` | `200` → renombrada                     |

> **El `branchId` NO va en el body** — se deriva del admin que la crea. La caja pertenece a su sucursal.

### B3. Catálogo: platos, bebidas y extras ✅

| #   | Método | Endpoint    | Auth        | Body                                                                                                       | Esperado                                  |
| --- | ------ | ----------- | ----------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| 18  | `POST` | `/products` | `adminToken`| `{ "name": "Porción Media", "basePrice": 30.00, "category": "Plato principal", "description": "2 presas + mixto", "isSellable": true, "isInventoryItem": true }` | `201` → **`productPorcionMediaId`**       |
| 19  | `POST` | `/products` | `adminToken`| `{ "name": "Coca Cola 500 ml", "basePrice": 8.00, "category": "Bebida", "isSellable": true, "isInventoryItem": true }` | `201` → **`productCocaId`**               |
| 20  | `POST` | `/products` | `adminToken`| `{ "name": "Porción de Papas", "basePrice": 12.00, "category": "Extra", "isSellable": true, "isInventoryItem": false }` | `201` → **`productPapasId`**              |
| 21  | `POST` | `/products` | `adminToken`| `{ "name": "Coca Cola 2 L", "basePrice": 16.00, "category": "Bebida", "isSellable": true, "isInventoryItem": true }` | `201` → **`productCoca2LId`**             |
| 22  | `GET`  | `/products` | `adminToken`| —                                                                                                           | `200` → los 4 con sus variantes           |

### B4. Variantes de cada plato ✅

| #   | Método | Endpoint   | Auth        | Body                                                                                        | Esperado                        |
| --- | ------ | ---------- | ----------- | --------------------------------------------------------------------------------------------- | ------------------------------- |
| 23  | `POST` | `/variants` | `adminToken`| `{ "productId": "{{productPorcionMediaId}}", "name": "Porción Media - Mixto", "components": [{ "type": "presa", "count": 2 }, { "type": "acompanamiento", "name": "mixto", "count": 1 }], "isDefault": true }` | `201` → **`variantPorcionMediaId`** |
| 24  | `POST` | `/variants` | `adminToken`| `{ "productId": "{{productCocaId}}", "name": "Coca Cola 500 ml", "components": [], "isDefault": true }` | `201` → **`variantCocaId`**    |

### B5. Editar y dar de baja el catálogo ✅ Sprint 1

| #   | Método  | Endpoint                          | Auth        | Body                                              | Esperado                        |
| --- | ------- | --------------------------------- | ----------- | ------------------------------------------------- | ------------------------------- |
| 25  | `GET`   | `/products/:productPorcionMediaId` | `adminToken`| —                                                 | `200` → producto + variantes    |
| 26  | `PATCH` | `/products/:productPorcionMediaId` | `adminToken`| `{ "basePrice": 32.00 }`                         | `200` → precio actualizado      |
| 27  | `PATCH` | `/variants/:variantPorcionMediaId` | `adminToken`| `{ "name": "Porción Media - Mixto (2026)" }`      | `200` → variante actualizada    |
| 28  | `PATCH` | `/products/:productPapasId/toggle-active` | `adminToken`| —                                         | `200` → `active: false`         |
| 29  | `PATCH` | `/products/:productPapasId/toggle-active` | `adminToken`| —                                         | `200` → `active: true`          |
| 30  | `GET`   | `/pos/context`                     | `adminToken`| —                                                 | `200` → producto dado de baja **ya no aparece** (Sprint 2, Fase C2) |

> **Dar de baja no borra historia:** las órdenes ya creadas con ese producto conservan su `snapshot` y su precio congelado.

### B6. Ítems de inventario con stock inicial ✅ Sprint 2 (solo alta/listado/edición; el decremento al pagar llega en el resto de S2)

*Lo que hace el usuario:* el admin da de alta las presas cocidas, las bebidas y los insumos, y carga cuánto hay.

| #   | Método | Endpoint            | Auth        | Body                                                                                                                                                             | Esperado                                |
| --- | ------ | ------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 31  | `POST` | `/inventory/items`  | `adminToken`| `{ "productCode": "PRESA-PECHO", "name": "Pechos cocidos", "unit": "UNIDAD", "type": "PECHO", "unitMeasure": "1 presa", "salePrice": 12.00, "initialStock": 40 }` | `201` → **`invPechoId`**                |
| 32  | `POST` | `/inventory/items`  | `adminToken`| `{ "productCode": "PRESA-ALA", "name": "Alas cocidas", "unit": "UNIDAD", "type": "ALA", "unitMeasure": "1 presa", "salePrice": 10.00, "initialStock": 40 }` | `201` → **`invAlaId`**                  |
| 33  | `POST` | `/inventory/items`  | `adminToken`| `{ "productCode": "PRESA-PIERNA", "name": "Piernas cocidas", "unit": "UNIDAD", "type": "PIERNA", "unitMeasure": "1 presa", "salePrice": 11.00, "initialStock": 40 }` | `201` → **`invPiernaId`**               |
| 34  | `POST` | `/inventory/items`  | `adminToken`| `{ "productCode": "PRESA-ENTREPIERNA", "name": "Entrepiernas cocidas", "unit": "UNIDAD", "type": "ENTREPIERNA", "unitMeasure": "1 presa", "salePrice": 11.00, "initialStock": 40 }` | `201` → **`invEntrepiernaId`**         |
| 35  | `POST` | `/inventory/items`  | `adminToken`| `{ "productCode": "BEBIDA-COCA500", "name": "Coca Cola 500 ml", "unit": "UNIDAD", "type": "BEBIDA", "unitMeasure": "500 ml", "initialStock": 60 }` | `201` → **`invCoca500Id`**              |
| 36  | `POST` | `/inventory/items`  | `adminToken`| `{ "productCode": "INSUMO-PAPA", "name": "Bolsas de papa", "unit": "BOLSA", "type": "INSUMO", "unitMeasure": "1 bolsa", "initialStock": 25 }` | `201` → **`invPapasBolsaId`**           |
| 37  | `POST` | `/inventory/items`  | `adminToken`| `{ "productCode": "INSUMO-SMILE", "name": "Bolsas de smile", "unit": "BOLSA", "type": "INSUMO", "initialStock": 20 }` | `201` → **`invSmileId`**                |
| 38  | `POST` | `/inventory/items`  | `adminToken`| `{ "productCode": "PRESA-PECHO", "name": "Duplicado", "unit": "UNIDAD", "type": "PECHO" }` | `4xx` → `INVENTORY_ITEM_CODE_ALREADY_EXISTS` |
| 39  | `POST` | `/inventory/items`  | `adminToken`| `{ "productCode": "INSUMO-VASOS", "name": "Vasos", "unit": "VASO", "type": "INSUMO", "salePrice": 5.00 }` | `4xx` → `salePrice` rechazado en `INSUMO`     |
| 40  | `GET`  | `/inventory/items` | `adminToken`| `?type=PECHO`                                                                                      | `200` → la presa con su stock           |
| 41  | `GET`  | `/inventory/items` | `cookToken`  | `?type=INSUMO`                                                                                      | `200` → el cocinero lista insumos       |
| 42  | `PATCH`| `/inventory/items/:invPechoId` | `adminToken`| `{ "name": "Pechos cocidos (turno día)" }`                                                          | `200` → nombre actualizado              |
| 43  | `GET`  | `/inventory/dashboard` | `adminToken`| —                                                                                                   | `200` → stock cocido por tipo + delta    |

> **Puntos clave:**
> - **`initialStock` crea la `InventoryTransaction` de `RECEPTION` en la misma transacción.** El `currentStock` nunca se escribe sin rastro.
> - **`PATCH` no toca el stock.** Para moverlo: `POST /inventory/adjust` con motivo (Fase C14).
> - El **`branchId` no va en el body** — se deriva del admin.
> - `salePrice` solo aplica a presas (alimenta el precio sugerido custom, Fase C9).

### B7. Ajustes manuales de stock 🔲 Sprint 2

| #   | Método | Endpoint             | Auth        | Body                                                                       | Esperado                             |
| --- | ------ | -------------------- | ----------- | ---------------------------------------------------------------------------- | ------------------------------------ |
| 44  | `POST` | `/inventory/adjust`  | `adminToken`| `{ "inventoryItemId": "{{invPechoId}}", "delta": 10, "reason": "RECEPTION", "note": "Ingreso de mañana" }` | `200` → `InventoryTransaction` creada  |
| 45  | `POST` | `/inventory/adjust`  | `adminToken`| `{ "inventoryItemId": "{{invPechoId}}", "delta": -2, "reason": "ADJUSTMENT", "note": "Merma por almacenamiento" }` | `200` → ajuste con motivo        |
| 46  | `PATCH`| `/inventory/:invPechoId/sale-price` | `adminToken`| `{ "salePrice": 13.00 }`                                            | `200` → precio de venta actualizado   |

### B8. Catálogo de descuentos 🔲 Sprint 3

| #   | Método | Endpoint                  | Auth        | Body                                                                                                     | Esperado                                 |
| --- | ------ | ------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| 47  | `POST` | `/discounts`              | `adminToken`| `{ "name": "Descuento personal", "fixedAmount": 7.00, "availability": "END_OF_SHIFT", "requiresAuthorization": false, "active": true }` | `201` → **`discountPersonalId`**         |
| 48  | `POST` | `/discounts`              | `adminToken`| `{ "name": "Compensación al cliente", "fixedAmount": 7.00, "availability": "ALWAYS", "requiresAuthorization": true, "active": true }` | `201` → **`discountCompensacionId`**   |
| 49  | `GET`  | `/discounts`              | `adminToken`| —                                                                                                          | `200` → el catálogo                     |

---

## Fase C — Operación de venta (CASHIER) ✅/🔲

*Lo que hace el usuario:* la cajera abre su turno y registra ventas usando **toda la data de la Fase B**.

### C1. Login y contexto del POS ✅

| #   | Método | Endpoint                | Auth          | Body                                                    | Esperado                                    |
| --- | ------ | ----------------------- | ------------- | --------------------------------------------------------- | ------------------------------------------- |
| 50  | `POST` | `/auth/login`           | —             | `{ "email": "carla@wonderchicken.com", "password": "2222222" }` | `200` → guardar **`cashierToken`**      |
| 51  | `GET`  | `/pos/context`          | `cashierToken`| —                                                        | `200` → productos + turno (`null` si no hay) |
| 52  | `GET`  | `/shifts/shift-periods` | `cashierToken`| —                                                        | `200` → períodos para elegir              |
| 53  | `GET`  | `/cash-registers`       | `cashierToken`| —                                                       | `200` → cajas de su sucursal              |

### C2. Abrir caja ✅

| #   | Método | Endpoint        | Auth          | Body                                                                    | Esperado                          |
| --- | ------ | --------------- | ------------- | ------------------------------------------------------------------------- | --------------------------------- |
| 54  | `POST` | `/shifts/open`  | `cashierToken`| `{ "periodId": "{{periodId}}", "cashRegisterId": "{{cashRegisterId}}", "openingAmount": 100.00 }` | `201` → guardar **`shiftId`**    |
| 55  | `GET`  | `/shifts/active`| `cashierToken`| —                                                                        | `200` → `status: "OPEN"`          |
| 56  | `POST` | `/shifts/open`  | `cashierToken`| `{ "cashRegisterId": "{{cashRegisterId}}", "openingAmount": 100.00 }` (sin `periodId`) | `400` → `VALIDATION_ERROR` (el período se **declara**, nunca se infiere) |
| 57  | `GET`  | `/pos/context`  | `cashierToken`| —                                                                        | `200` → ahora trae el turno abierto |

### C3. Registrar cliente para factura nominada ✅ Sprint 1

| #   | Método | Endpoint             | Auth          | Body                                                                                                     | Esperado                                     |
| --- | ------ | -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| 58  | `POST` | `/customers`         | `cashierToken`| `{ "ci": "8351427", "firstName": "MARCO", "lastName": "ORTEGA GUTIERREZ", "sex": "HOMBRE", "birthDate": "1990-03-14", "phone": "71234567" }` | `201` → guardar **`customerId`**              |
| 59  | `GET`  | `/customers/by-ci/8351427` | `cashierToken`| —                                                                                                    | `200` → el cliente                            |
| 60  | `POST` | `/customers`         | `cashierToken`| `{ "ci": "8351427", "firstName": "MARCO", ... }`                                                        | `4xx` → `CUSTOMER_CI_ALREADY_EXISTS` (primera registración gana) |
| 61  | `GET`  | `/customers/by-nit/1023456789` | `cashierToken`| —                                                                                               | `404` → `CUSTOMER_NOT_FOUND`                  |
| 62  | `GET`  | `/customers/by-ci/ab` | `cashierToken`| —                                                                                                    | `404` → `CUSTOMER_NOT_FOUND` (menos de 3 chars) |

> Venta **sin** cliente = `"S/N"` (anónimo): en `POST /orders` se omite `customerId` y la orden queda sin identificar (regla legal de nominatividad, PDR §2.12).

### C4. Venta MESA pagada ✅

| #   | Método | Endpoint    | Auth          | Body                                                                                                                                                                                                                                                                            | Esperado                                            |
| --- | ------ | ----------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 63  | `POST` | `/orders`   | `cashierToken`| `{ "type": "MESA", "tableNumber": "70", "customerId": "{{customerId}}", "paymentStatus": "PAID", "paymentMethod": "CASH", "items": [{ "productId": "{{productPorcionMediaId}}", "variantId": "{{variantPorcionMediaId}}", "quantity": 2, "selectedPieces": [{ "type": "PECHO", "qty": 2 }, { "type": "ALA", "qty": 2 }], "substitutions": [{ "from": "mixto", "to": "arroz" }] }, { "productId": "{{productCoca2LId}}", "quantity": 1 }] }` | `201` → **`orderId`**, **`publicToken`**, `total: 80.00` |
| 64  | `GET`  | `/orders/:orderId` | `cashierToken`| —                                                                                                                                                                                                        | `200` → detalle de la orden                        |
| 65  | `GET`  | `/orders`   | `cashierToken`| `?status=PREPARING`                                                                                                                                                                                          | `200` → aparece en el panel de despacho            |

> **La sustitución no cambia el precio** (PDR §2.1): 2×30 (Porción Media) + 16 (Coca 2L) = **80**, sin ajuste por el cambio de mixto a arroz. El backend calcula el total desde el catálogo — el front no manda precios (§5.0).

### C5. Venta LLEVAR con pago pendiente ✅

| #   | Método | Endpoint      | Auth          | Body                                                                                                                                                                | Esperado                                          |
| --- | ------ | ------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 66  | `POST` | `/orders`     | `cashierToken`| `{ "type": "LLEVAR", "paymentStatus": "PENDING", "items": [{ "productId": "{{productPorcionMediaId}}", "quantity": 1, "selectedPieces": [{ "type": "PIERNA", "qty": 1 }, { "type": "ENTREPIERNA", "qty": 1 }] }] }` | `201` → **`orderIdPendiente`**, `paymentStatus: PENDING` |
| 67  | `GET`  | `/orders/:orderIdPendiente` | `cashierToken`| —                                                                                                    | `200` → se prepara igual, **sin** descontar stock  |

> Con pago pendiente **no se descuenta inventario ni se contabiliza ingreso** hasta confirmar el pago (PDR §2.5).

### C6. Confirmar pago ✅

| #   | Método | Endpoint           | Auth          | Body                    | Esperado                                                          |
| --- | ------ | ------------------ | ------------- | ----------------------- | ----------------------------------------------------------------- |
| 68  | `POST` | `/orders/:orderIdPendiente/pay` | `cashierToken`| `{ "paymentMethod": "CARD" }` | `200` → `paymentStatus: PAID`, **stock descontado**           |
| 69  | `GET`  | `/inventory/dashboard` | `adminToken` | —                       | `200` → el stock cocido bajó respecto a la Fase B6                |

### C7. Cancelar pago pendiente ✅

| #   | Método | Endpoint                   | Auth          | Body | Esperado                                                              |
| --- | ------ | -------------------------- | ------------- | ---- | --------------------------------------------------------------------- |
| 70  | `POST` | `/orders`                  | `cashierToken`| `{ "type": "LLEVAR", "paymentStatus": "PENDING", "items": [{ "productId": "{{productCocaId}}", "quantity": 3 }] }` | `201` → **`orderIdCancelar`** |
| 71  | `POST` | `/orders/:orderIdCancelar/cancel` | `cashierToken`| — (sin body: pendiente se cancela sin motivo)              | `200` → `status: CANCELLED`                             |
| 72  | `GET`  | `/orders/:orderIdCancelar` | `cashierToken`| —                     | `200` → cancelado, el stock **nunca** se tocó                      |

> **La cancelación de un pendiente es manual y sin motivo** — no existe auto-cancelación por tiempo (PDR §2.5). El paso 71 no lleva body porque en un pendiente no se contabilizó nada.

### C8. Ver el turno completo ✅

| #   | Método | Endpoint      | Auth          | Body | Esperado                                    |
| --- | ------ | ------------- | ------------- | ---- | ------------------------------------------- |
| 73  | `GET`  | `/orders`     | `cashierToken`| `?customerId={{customerId}}`                | `200` → historial del cliente               |
| 74  | `GET`  | `/orders`     | `cashierToken`| `?status=PREPARING&date=2026-07-10`         | `200` → comandas del día                    |

### C9. Venta custom de presas surtidas 🔲 Sprint 2

*Lo que hace el usuario:* la cajera arma un plato fuera del menú, ve el precio **sugerido** (calculado por el POS con los `piecePrices` de `pos/context`) y lo **pisa** si quiere.

| #   | Método | Endpoint          | Auth          | Body                                                                                                                                                              | Esperado                                                          |
| --- | ------ | ----------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 75  | `GET`  | `/pos/context`    | `cashierToken`| —                                                                                                                                                                 | `200` → `piecePrices` con los 4 `salePrice`                        |
| 76  | `POST` | `/orders/custom`  | `cashierToken`| `{ "type": "LLEVAR", "paymentStatus": "PAID", "paymentMethod": "CASH", "items": [{ "customPieces": [{ "type": "PECHO", "qty": 2 }, { "type": "ALA", "qty": 1 }], "extras": [{ "name": "papa", "qty": 1 }], "drinks": [{ "productId": "{{productCoca500Id}}", "qty": 1 }], "quantity": 1, "unitPrice": 35.00 }] }` | `201` → `isCustom: true`, `type: LLEVAR`, guarda el precio **confirmado** (35) |
| 77  | `GET`  | `/inventory/dashboard` | `adminToken`| —                                                                                                                                                                 | `200` → descontó 2 pechos + 1 ala + 1 coca 500 exactos            |

> Sugerido = 2×12 (pecho) + 1×10 (ala) + extras + bebida ≈ 42; la cajera lo pisa a 35 y **eso** se persiste (FR-002b). El inventario descuenta lo real, no el precio.

### C10. Venta con descuento por plato 🔲 Sprint 3

| #   | Método | Endpoint             | Auth          | Body                                                                                                                                                                                             | Esperado                                                  |
| --- | ------ | -------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 78  | `POST` | `/orders`            | `cashierToken`| `{ "type": "MESA", "paymentStatus": "PAID", "paymentMethod": "CASH", "items": [{ "productId": "{{productPorcionMediaId}}", "quantity": 2, "discountId": "{{discountPersonalId}}", "selectedPieces": [{ "type": "PIERNA", "qty": 2 }, { "type": "ENTREPIERNA", "qty": 2 }] }, { "productId": "{{productPorcionMediaId}}", "quantity": 1, "discountId": "{{discountPersonalId}}", "selectedPieces": [{ "type": "PECHO", "qty": 1 }, { "type": "ALA", "qty": 1 }] }] }` | `201` → `originalAmount: 90.00`, `total: 69.00` (3 platos − 7 c/u) |
| 79  | `POST` | `/orders`            | `cashierToken`| como el 78 pero con `discountId` de un descuento `ALWAYS` **sin autorizar** para esta cajera                                     | `4xx` → `DISCOUNT_NOT_AUTHORIZED` (rechaza la orden completa) |
| 80  | `POST` | `/discounts/:discountCompensacionId/authorize` | `adminToken`| `{ "cashierId": "{{cashierId}}" }`                                              | `200` → autorización creada para el turno                     |
| 81  | `POST` | `/orders`            | `cashierToken`| ítems con `discountId` de "Compensación al cliente" (ahora autorizada)                                                               | `201` → total con descuento aplicado                         |
| 82  | `GET`  | `/discounts/authorizations` | `adminToken`| `?shiftId={{shiftId}}`                                                                                        | `200` → autorización vigente del turno                       |
| 83  | `POST` | `/orders`            | `cashierToken`| ítems con `discountId` de "Descuento personal" (`END_OF_SHIFT`) **fuera** de la ventana de fin de turno                          | `4xx` → `DISCOUNT_NOT_AVAILABLE`                              |

> El descuento viaja **en el ítem de la orden** — una sola llamada, una sola transacción. El inventario sigue descontando el producto real (nunca el equivalente al precio). El `discountAmount` queda **congelado** por ítem: si el admin luego sube el descuento a 10, las ventas viejas conservan 7.

### C11. Vale de trabajador 🔲 Sprint 3

| #   | Método | Endpoint     | Auth          | Body                                                                                                | Esperado                                                       |
| --- | ------ | ------------ | ------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| 84  | `POST` | `/vouchers`  | `cashierToken`| `{ "workerName": "MARIA LOPEZ", "productId": "{{productPorcionMediaId}}", "discountId": "{{discountPersonalId}}" }` | `201` → `originalAmount: 30.00`, `discountAmount: 7.00`, `amount: 23.00` |
| 85  | `POST` | `/vouchers`  | `cashierToken`| `{ "workerName": "PEDRO", "productId": "{{productPorcionMediaId}}" }`                               | `201` → `amount: 30.00` (sin descuento)                        |
| 86  | `GET`  | `/vouchers`  | `cashierToken`| —                                                                                                   | `200` → **solo los que emitió esta cajera**                    |
| 87  | `GET`  | `/vouchers`  | `adminToken` | —                                                                                                   | `200` → **todos**, incluye quién emitió cada uno               |

> El vale **descuenta inventario** pero **NO suma** al ingreso de caja (PDR §2.4). El monto se **deriva** del producto — el front no lo manda.

### C12. Gasto desde caja 🔲 Sprint 3

| #   | Método | Endpoint   | Auth          | Body                                          | Esperado                                        |
| --- | ------ | ---------- | ------------- | ---------------------------------------------- | ----------------------------------------------- |
| 88  | `POST` | `/expenses` | `cashierToken`| `{ "description": "Compra de arroz", "amount": 35.50, "paidBy": "CASH" }` | `200` → gasto ligado al turno activo |
| 89  | `POST` | `/expenses` | `cashierToken`| `{ ... }` **sin turno abierto**               | `4xx` → error claro                             |

> El `shiftId` y el `createdBy` se **derivan** del turno activo y del token — no van en el body (§5.0).

### C13. Cocina: consumos manuales y ciclo crudo 🔲 Sprint 2

| #   | Método | Endpoint                                  | Auth      | Body                                                                                    | Esperado                                              |
| --- | ------ | ----------------------------------------- | --------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 90  | `POST` | `/auth/login`                             | —         | `{ "email": "elena@wonderchicken.com", "password": "4444444" }`                          | `200` → guardar **`cookToken`**                       |
| 91  | `GET`  | `/inventory/items?type=INSUMO`            | `cookToken`| —                                                                                       | `200` → insumos para el formulario                    |
| 92  | `POST` | `/inventory/manual-consumption`            | `cookToken`| `{ "entries": [{ "inventoryItemId": "{{invPapasBolsaId}}", "quantity": 3 }, { "inventoryItemId": "{{invSmileId}}", "quantity": 1 }] }` | `200` → consumos ligados al turno |
| 93  | `GET`  | `/inventory/shift-chicken-log/{{shiftId}}`| `cookToken`| —                                                                                       | `200` → `reprocessRaw` autopoblado del turno anterior   |
| 94  | `POST` | `/inventory/shift-chicken-log`            | `cookToken`| `{ "pieceType": "PECHO", "reprocessRaw": 10, "processedRaw": 30, "rawLeftover": 5, "cookedLeftover": 8 }` | `200` → ciclo crudo registrado  |
| 95  | `POST` | `/inventory/shift-chicken-log/{{shiftId}}/close` | `cookToken`| —                                                                               | `200` → reconciliación + discrepancias               |

> El `reprocessRaw` del turno nuevo **se autopobla** con el `rawLeftover` del turno anterior (PDR §2.3). El cocinero puede ajustarlo antes de confirmar.

---

## Fase D — Despacho, cierre y consulta ✅/🔲

### D1. Cola de comandas ✅

| #   | Método | Endpoint     | Auth              | Body                                  | Esperado                                    |
| --- | ------ | ------------ | ----------------- | --------------------------------------- | ------------------------------------------- |
| 96  | `POST` | `/auth/login`| —                 | `{ "email": "diana@wonderchicken.com", "password": "3333333" }` | `200` → **`dispatcherToken`**  |
| 97  | `GET`  | `/orders`    | `dispatcherToken` | `?status=PREPARING`                     | `200` → cola de comandas de su sucursal     |

### D2. Marcar listo y entregado 🔲 Sprint 4

| #   | Método | Endpoint              | Auth              | Body                    | Esperado                                                    |
| --- | ------ | --------------------- | ----------------- | ------------------------ | ----------------------------------------------------------- |
| 98  | `PATCH`| `/orders/:orderId/status` | `dispatcherToken`| `{ "status": "READY" }`   | `200` → `readyAt` registrado, aparece en pantalla pública     |
| 99  | `PATCH`| `/orders/:orderId/status` | `dispatcherToken`| `{ "status": "DELIVERED" }` | `200` → `deliveredAt` + `deliveredBy`, desaparece de la pantalla |

### D3. Cerrar caja (arqueo) 🔲 Sprint 3

| #   | Método | Endpoint        | Auth          | Body                    | Esperado                                                        |
| --- | ------ | --------------- | ------------- | ----------------------- | --------------------------------------------------------------- |
| 100 | `POST` | `/shifts/close` | `cashierToken`| `{ "countedAmount": 1450.00 }` | `200` → arqueo con ventas, gastos, vales, anulaciones, diferencia |
| 101 | `POST` | `/orders`       | `cashierToken`| venta con turno cerrado                                        | `4xx` → no se pueden registrar ventas en caja cerrada           |

> El cierre **extingue** las autorizaciones de descuentos del turno y la sesión de la cajera (no pasa al turno siguiente).

### D4. Reportes 🔲 Sprint 3

| #   | Método | Endpoint                   | Auth        | Body                              | Esperado                        |
| --- | ------ | -------------------------- | ----------- | ---------------------------------- | ------------------------------- |
| 102 | `GET`  | `/reports/sales`           | `adminToken`| `?from=2026-07-01&to=2026-07-10`   | `200` → ventas por turno/día    |
| 103 | `GET`  | `/reports/inventory-presas`| `adminToken`| `?date=2026-07-10`                 | `200` → vendidas y restantes    |
| 104 | `GET`  | `/reports/cash-audit`      | `adminToken`| `?date=2026-07-10`                 | `200` → arqueo con anulaciones y vales |
| 105 | `GET`  | `/reports/sales`           | `adminToken`| `?from=2026-07-01&to=2026-07-10&format=csv` | `200` → descarga CSV    |

### D5. Auditoría 🔲 Sprint 5

| #   | Método | Endpoint             | Auth        | Body                                                  | Esperado                                              |
| --- | ------ | -------------------- | ----------- | ------------------------------------------------------ | ----------------------------------------------------- |
| 106 | `POST` | `/audit-logs/shift`  | `adminToken`| `{ "date": "2026-07-10", "periodId": "{{periodId}}", "cashRegisterId": "{{cashRegisterId}}" }` | `200` → rastro del turno con `user` resuelto |
| 107 | `POST` | `/audit-logs/month`  | `adminToken`| `{ "month": "2026-07" }`                              | `200` → el mes, incluye `shiftId: null` (acciones de admin) |
| 108 | `POST` | `/audit-logs/shift`  | `cashierToken`| idem                                                    | `403` → el rastro es solo de ADMIN                   |

---

## Fase E — Permisos y errores ✅

| #   | Método | Endpoint          | Auth           | Body                                                              | Esperado                                   |
| --- | ------ | ----------------- | -------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| 109 | `POST` | `/auth/login`     | —              | `{ "email": "carla@wonderchicken.com", "password": "9999999" }`     | `401` → `Credenciales inválidas`           |
| 110 | `POST` | `/auth/login`     | —              | `{ "email": "noexiste@wonderchicken.com", "password": "0000000" }`  | `401` → `Credenciales inválidas`           |
| 111 | `GET`  | `/branches`       | `cashierToken` | —                                                                 | `403` → `FORBIDDEN`                        |
| 112 | `POST` | `/users`          | `cashierToken` | `{ ... }`                                                         | `403` → CASHIER no crea usuarios           |
| 113 | `GET`  | `/users`          | _(sin token)_  | —                                                                 | `401` → `Token de autenticación requerido` |
| 114 | `POST` | `/orders`         | `adminToken`   | `{ "type": "MESA", "items": [...] }`                               | `403` → ADMIN no crea órdenes              |
| 115 | `POST` | `/shifts/open`    | `adminToken`   | `{ ... }`                                                         | `403` → solo CASHIER abre turno            |
| 116 | `POST` | `/products`       | `cashierToken` | `{ ... }`                                                         | `403` → CASHIER no crea productos          |
| 117 | `POST` | `/cash-registers` | `cashierToken` | `{ ... }`                                                         | `403` → CASHIER no crea cajas              |
| 118 | `POST` | `/inventory/items`| `cashierToken` | `{ ... }`                                                         | `403` → CASHIER no crea ítems de inventario |
| 119 | `POST` | `/customers`      | `dispatcherToken` | `{ ... }`                                                       | `403` → DISPATCHER no registra clientes    |
| 120 | `POST` | `/auth/logout`    | `cashierToken` | —                                                                 | `200` → libera la sesión del turno         |

> **401 vs 403:** sin token o token inválido/expirado → **401**. Con token válido pero rol no autorizado → **403** (`FORBIDDEN`).

---

## Fase F — Vistas públicas e impresión 🔲 Sprint 4

| #   | Método | Endpoint                        | Auth  | Body                       | Esperado                                                        |
| --- | ------ | ------------------------------- | ----- | -------------------------- | --------------------------------------------------------------- |
| 121 | `GET`  | `/public/orders/{{publicToken}}`| —    | —                          | `200` → comanda del cliente + sus otros pedidos del día (si tiene `customerId`) |
| 122 | `GET`  | `/public/orders/token-inventado`| —   | —                          | `404` → el token no es adivinable (ni el `id` interno sirve)     |
| 123 | `GET`  | `/public/ready-orders`          | —    | —                          | `200` → **solo números**: `{ "data": [12, 15, 18] }`             |
| 124 | `POST` | `/print/invoice`                | `cashierToken` | `{ "orderId": "{{orderId}}" }` | `200` → factura térmica       |
| 125 | `GET`  | `/print/invoice/{{orderId}}/pdf`| `cashierToken`| —                        | `200` → PDF (fallback si falla la impresora)                     |

> El acceso a la vista del cliente es **por token**, nunca por `customerId` ni NIT en la URL — **identidad agrupa, el token da acceso** (PDR §2.12).

---

## Placeholders — reemplazar en orden

| Placeholder                | Valor obtenido de                        | Sprint |
| -------------------------- | ---------------------------------------- | ------ |
| `{{superAdminToken}}`      | Paso 1 — `data.accessToken`               | 0      |
| `{{adminToken}}`           | Paso 9 — `data.accessToken`               | 0      |
| `{{cashierToken}}`         | Paso 50 — `data.accessToken`              | 0      |
| `{{dispatcherToken}}`      | Paso 96 — `data.accessToken`              | 0      |
| `{{cookToken}}`            | Paso 90 — `data.accessToken`              | 0      |
| `{{branchId}}`             | Paso 2 — `data.branch.id`                 | 0      |
| `{{adminId}}`              | Paso 4 — `data.user.id`                   | 0      |
| `{{cashierId}}`            | Paso 5 — `data.user.id`                   | 0      |
| `{{dispatcherId}}`         | Paso 6 — `data.user.id`                   | 0      |
| `{{cookId}}`               | Paso 7 — `data.user.id`                   | 0      |
| `{{periodId}}`             | Paso 52 — Mañana (del seed)               | 0      |
| `{{periodTardeId}}`        | Paso 11 — `data.id`                       | ✅   |
| `{{cashRegisterId}}`       | Paso 13 — `data.id`                       | ✅   |
| `{{cashRegisterId2}}`      | Paso 14 — `data.id`                       | ✅   |
| `{{productPorcionMediaId}}`| Paso 18 — `data.id`                       | 1 ✅   |
| `{{productCocaId}}`        | Paso 19 — `data.id`                       | 1 ✅   |
| `{{productPapasId}}`       | Paso 20 — `data.id`                       | 1 ✅   |
| `{{productCoca2LId}}`      | Paso 21 — `data.id`                       | 1 ✅   |
| `{{variantPorcionMediaId}}`| Paso 23 — `data.id`                       | 1 ✅   |
| `{{variantCocaId}}`        | Paso 24 — `data.id`                       | 1 ✅   |
| `{{invPechoId}}`           | Paso 31 — `data.id`                       | ✅ (S2)   |
| `{{invAlaId}}`             | Paso 32 — `data.id`                       | ✅ (S2)   |
| `{{invPiernaId}}`          | Paso 33 — `data.id`                       | ✅ (S2)   |
| `{{invEntrepiernaId}}`     | Paso 34 — `data.id`                       | ✅ (S2)   |
| `{{invCoca500Id}}`         | Paso 35 — `data.id`                       | ✅ (S2)   |
| `{{invPapasBolsaId}}`      | Paso 36 — `data.id`                       | ✅ (S2)   |
| `{{invSmileId}}`           | Paso 37 — `data.id`                       | ✅ (S2)   |
| `{{discountPersonalId}}`   | Paso 47 — `data.id`                       | 3 🔲   |
| `{{discountCompensacionId}}`| Paso 48 — `data.id`                      | 3 🔲   |
| `{{customerId}}`           | Paso 58 — `data.id`                       | ✅   |
| `{{shiftId}}`              | Paso 54 — `data.id`                       | 1 ✅   |
| `{{orderId}}`              | Paso 63 — `data.id` + `publicToken`       | 1 ✅   |
| `{{orderIdPendiente}}`     | Paso 66 — `data.id`                       | 1 ✅   |
| `{{orderIdCancelar}}`      | Paso 70 — `data.id`                       | 1 ✅   |

> Los `{{variantId}}` / `{{cashRegisterId}}` **antes venían del seed o de la DB**. Desde los CRUDs de maestros, **todos se obtienen por endpoint** — si alguno te falta, es que ese CRUD no está implementado todavía.

---

## Prerrequisitos

Antes de la Fase A, una sola vez:

```bash
pnpm prisma db push      # sincroniza el schema con la DB
pnpm prisma generate     # genera el cliente
pnpm bootstrap:admin     # crea el SUPER_ADMIN (idempotente)
pnpm start:dev           # servidor en :4000
```

`pnpm seed` es **opcional** — sirve para tener datos de demo, no para poder probar este flujo. Lo único que sí viene del bootstrap es el `SUPER_ADMIN` (se crea por script con credenciales del `.env`, nunca por endpoint: no se abre ningún endpoint sin token aunque la BD esté vacía — ver [technical guide §5.2](technical_guide.md#52-autenticación-y-autorización)).

---

> **El recorrido completo de punta a punta sin seed** está en [implementation_guide.md §9.6](implementation_guide.md#96-el-recorrido-mínimo-de-punta-a-punta-sin-seed). Si algún paso de esta guía necesita `pnpm seed` o SQL directo, **anotalo como bug del CRUD faltante**.