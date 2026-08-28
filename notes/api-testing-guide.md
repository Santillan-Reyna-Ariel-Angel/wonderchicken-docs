# Flujo de Prueba — Endpoints Sprint 0 + Sprint 1

> Servidor: `http://localhost:4000/api/v1`
> Base URL completa: `http://localhost:4000/api/v1`
> Auth: `Authorization: Bearer <token>` (excepto login)

---

## Fase 1 — Bootstrap y Sucursal

| #   | Método | Endpoint      | Auth              | Body                                                                     | Esperado                                                                         |
| --- | ------ | ------------- | ----------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 1   | `POST` | `/auth/login` | —                 | `{ "email": "superadmin@wonderchicken.com", "password": "password123" }` | `200` → `{ data: { accessToken }, isSuccess: true }` — guardar `superAdminToken` |
| 2   | `POST` | `/branches`   | `superAdminToken` | `{ "name": "Sucursal Central", "address": "Av. Central 123" }`           | `201` → guardar `branchId` del `data.branch.id`                                  |
| 3   | `GET`  | `/branches`   | `superAdminToken` | —                                                                        | `200` → la sucursal creada aparece en la lista                                   |

---

## Fase 2 — Crear Usuarios

| #   | Método | Endpoint            | Auth              | Body                                                                                                                                                      | Esperado                                                        |
| --- | ------ | ------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 4   | `POST` | `/users`            | `superAdminToken` | `{ "firstName": "Ana", "lastName": "Admin", "email": "ana@wonderchicken.com", "ci": "1111111", "role": "ADMIN", "branchId": "{{branchId}}" }`             | `201` → guardar `adminId`                                       |
| 5   | `POST` | `/users`            | `superAdminToken` | `{ "firstName": "Carla", "lastName": "Cajera", "email": "carla@wonderchicken.com", "ci": "2222222", "role": "CASHIER", "branchId": "{{branchId}}" }`      | `201` → guardar `cashierId`                                     |
| 6   | `POST` | `/users`            | `superAdminToken` | `{ "firstName": "Diana", "lastName": "Despacho", "email": "diana@wonderchicken.com", "ci": "3333333", "role": "DISPATCHER", "branchId": "{{branchId}}" }` | `201` → guardar `dispatcherId`                                  |
| 7   | `GET`  | `/users`            | `superAdminToken` | —                                                                                                                                                         | `200` → 4 usuarios (SUPER_ADMIN + ADMIN + CASHIER + DISPATCHER) |
| 8   | `GET`  | `/users/:cashierId` | `superAdminToken` | —                                                                                                                                                         | `200` → datos de la cajera                                      |

---

## Fase 3 — Catálogo (ADMIN)

| #   | Método | Endpoint    | Auth              | Body                                                                                                               | Esperado                      |
| --- | ------ | ----------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| 9   | `POST` | `/products` | `superAdminToken` | `{ "name": "Pollo Entero", "basePrice": 85.00, "category": "POLLO", "isSellable": true, "isInventoryItem": true }` | `201` → guardar `productId`   |
| 10  | `POST` | `/variants` | `superAdminToken` | `{ "productId": "{{productId}}", "name": "1/2 Pollo", "components": ["1/2 pollo"], "isDefault": false }`           | `201` → guardar `variantId`   |
| 11  | `GET`  | `/products` | `superAdminToken` | —                                                                                                                  | `200` → producto con variante |

---

## Fase 4 — Flujo Cajera (Shift → Orden → Pago)

> **Nota:** Requiere que existan `CashRegister` en la DB (se crean con `pnpm seed`).

| #   | Método | Endpoint                | Auth           | Body                                                                                                                           | Esperado                                                              |
| --- | ------ | ----------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 12  | `POST` | `/auth/login`           | —              | `{ "email": "carla@wonderchicken.com", "password": "2222222" }`                                                                | `200` → guardar `cashierToken`                                        |
| 13  | `GET`  | `/shifts/shift-periods` | `cashierToken` | —                                                                                                                              | `200` → lista de períodos (Mañana, Noche)                             |
| 14  | `GET`  | `/pos/context`          | `cashierToken` | —                                                                                                                              | `200` → `products` + `shiftPeriods` + `shift: null`                   |
| 15  | `POST` | `/shifts/open`          | `cashierToken` | `{ "periodId": "{{periodId}}", "cashRegisterId": "{{cashRegisterId}}", "openingAmount": 100 }`                                 | `201` → guardar `shiftId`                                             |
| 16  | `GET`  | `/shifts/active`        | `cashierToken` | —                                                                                                                              | `200` → shift con `status: "OPEN"`                                    |
| 17  | `POST` | `/orders`               | `cashierToken` | `{ "type": "MESA", "paymentStatus": "PENDING", "tableNumber": 5, "items": [{ "productId": "{{productId}}", "quantity": 2 }] }` | `201` → guardar `orderId`, `publicToken`                              |
| 18  | `GET`  | `/orders/:orderId`      | `cashierToken` | —                                                                                                                              | `200` → status `CREATED`, sin pago                                    |
| 19  | `POST` | `/orders/:orderId/pay`  | `cashierToken` | `{ "paymentMethod": "CASH" }`                                                                                                  | `200` → status `CONFIRMED`                                            |
| 20  | `GET`  | `/orders`               | `cashierToken` | `?status=CONFIRMED`                                                                                                            | `200` → órdenes pagadas (sin datos hasta tener flujo de despachadora) |

---

## Fase 5 — Cancelación y Permisos de Otros Roles

| #   | Método | Endpoint                   | Auth              | Body                                                                                                           | Esperado                                                                  |
| --- | ------ | -------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 21  | `POST` | `/orders`                  | `cashierToken`    | `{ "type": "LLEVAR", "paymentStatus": "PENDING", "items": [{ "productId": "{{productId}}", "quantity": 1 }] }` | `201` → guardar `orderId2`                                                |
| 22  | `POST` | `/orders/:orderId2/cancel` | `cashierToken`    | —                                                                                                              | `200` → status `CANCELLED`                                                |
| 23  | `GET`  | `/orders/:orderId`         | `cashierToken`    | —                                                                                                              | `200` → orden pagada visible para la cajera                               |
| 24  | `POST` | `/auth/login`              | —                 | `{ "email": "diana@wonderchicken.com", "password": "3333333" }`                                                | `200` → guardar `dispatcherToken`                                         |
| 25  | `GET`  | `/orders/`                 | `dispatcherToken` | —                                                                                                              | `200` → DISPATCHER ve órdenes de su sucursal(verificar con multisucursal) |
| 26  | `POST` | `/auth/login`              | —                 | `{ "email": "ana@wonderchicken.com", "password": "1111111" }`                                                  | `200` → guardar `adminToken`                                              |
| 27  | `GET`  | `/orders`                  | `adminToken`      | —                                                                                                              | `200` → ADMIN ve órdenes de su sucursal                                   |

---

## Fase 6 — Gestión de Usuarios y Sucursales

| #   | Método  | Endpoint                          | Auth              | Body                             | Esperado                            |
| --- | ------- | --------------------------------- | ----------------- | -------------------------------- | ----------------------------------- |
| 28  | `PATCH` | `/users/:cashierId`               | `adminToken`      | `{ "phone": "+591 70000001" }`   | `200` → teléfono actualizado        |
| 29  | `PATCH` | `/users/:cashierId/toggle-active` | `adminToken`      | —                                | `200` → `active: false`             |
| 30  | `PATCH` | `/users/:cashierId/toggle-active` | `adminToken`      | —                                | `200` → `active: true` (reactivado) |
| 31  | `PATCH` | `/branches/:branchId`             | `superAdminToken` | `{ "address": "Av. Nueva 456" }` | `200` → dirección actualizada       |

---

## Fase 7 — Pruebas de Error (401 / 403)

| #   | Método | Endpoint       | Auth           | Body                                                               | Esperado                                          |
| --- | ------ | -------------- | -------------- | ------------------------------------------------------------------ | ------------------------------------------------- |
| 32  | `POST` | `/auth/login`  | —              | `{ "email": "carla@wonderchicken.com", "password": "9999999" }`    | `401` → `Credenciales inválidas`                  |
| 33  | `POST` | `/auth/login`  | —              | `{ "email": "noexiste@wonderchicken.com", "password": "0000000" }` | `401` → `Credenciales inválidas`                  |
| 34  | `GET`  | `/branches`    | `cashierToken` | —                                                                  | `403` → `Privilegios insuficientes`               |
| 35  | `POST` | `/users`       | `cashierToken` | `{ ... }`                                                          | `403` → CASHIER no puede crear usuarios           |
| 36  | `GET`  | `/users`       | _(sin token)_  | —                                                                  | `401` → `Token de autenticación requerido`        |
| 37  | `POST` | `/orders`      | `adminToken`   | `{ "type": "MESA", "items": [...] }`                               | `403` → ADMIN no puede crear órdenes              |
| 38  | `POST` | `/shifts/open` | `adminToken`   | `{ ... }`                                                          | `403` → ADMIN no puede abrir turno (solo CASHIER) |
| 39  | `POST` | `/products`    | `cashierToken` | `{ ... }`                                                          | `403` → CASHIER no puede crear productos          |

---

## Fase 8 — Logout

| #   | Método | Endpoint       | Auth           | Body | Esperado               |
| --- | ------ | -------------- | -------------- | ---- | ---------------------- |
| 40  | `POST` | `/auth/logout` | `cashierToken` | —    | `200` → logout exitoso |

---

## Placeholders — Reemplazar en orden

| Placeholder          | Valor obtenido de                                     |
| -------------------- | ----------------------------------------------------- |
| `{{branchId}}`       | Paso 2 — `data.branch.id`                             |
| `{{productId}}`      | Paso 9 — `data.product.id`                            |
| `{{variantId}}`      | Paso 10 — `data.variant.id`                           |
| `{{periodId}}`       | Paso 13 — `data.periods[0].id`                        |
| `{{cashRegisterId}}` | DB (seeder) — `GET /cash-registers` o consultar la DB |
| `{{shiftId}}`        | Paso 15 — `data.shift.id`                             |
| `{{orderId}}`        | Paso 17 — `data.order.id`                             |
| `{{orderId2}}`       | Paso 21 — `data.order.id`                             |
| `{{cashierId}}`      | Paso 5 — `data.user.id`                               |
| `{{adminId}}`        | Paso 4 — `data.user.id`                               |
| `{{dispatcherId}}`   | Paso 6 — `data.user.id`                               |

---

## Cash Register — Cómo obtener el ID

Si el seeder creó cajas, consultá directo en la DB:

```sql
SELECT id, name, "branchId" FROM cash_registers;
```

O verificá en el seeder:
`seeders/domains/cash-registers.seeder.ts`

> **Si no tenés cajas en la DB**, el paso 15 (`POST /shifts/open`) fallará con 400. Corridas `pnpm seed` primero.
