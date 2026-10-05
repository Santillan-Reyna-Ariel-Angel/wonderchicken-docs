# Plan — Integración Front ↔ Back con datos reales

> **Actualizado:** 2026-10-05
> **Objetivo:** que el front muestre **datos reales del API en la mayor parte de sus pantallas**, **sin modificar los componentes ni estilos ya definidos**, y que todo el API se pueda probar desde Postman sin armar datos a mano.
> **Dónde se trabaja:** todos los cambios de backend de este plan van en **esta misma rama** (`feature_sprint1_integrate_front`), sin rama aparte. El front, en `feature-test-cruds` (repo `wonderchicken-front`), creada desde `feature_sprint1_prototype_ui`; su plan está en [../frontend/plan-front-cruds-feature-test-cruds.md](../frontend/plan-front-cruds-feature-test-cruds.md).
> **Estado:** ✅ hecho: CRUDs de maestros, ejemplos de Swagger alineados con el seed, login por rol y sincronización con Postman · 🔲 pendiente: verificación en ejecución (§2.3), cambios de backend de §4 y el front (§5–6).
> **Convención:** ✅ verificado leyendo código/docs · ⚠️ no verificado todavía.
> **Fuente de verdad de contratos:** [technical_guide.md](technical_guide.md) §5 e [implementation_guide.md](implementation_guide.md). Si algo de acá las contradice, mandan las guías (y se actualizan junto con el código).

---

## 1. CRUDs que ya existen y se pueden probar

Base: `http://localhost:4000/api/v1` · Swagger: `/api/docs` · JSON: `/swagger.json`. El `RolesGuard` deja pasar siempre a `SUPER_ADMIN`, pero varios servicios locales le responden `400` porque no tiene sucursal (columna *Nota*).

| Recurso | Endpoints | Roles (`@Roles`) | Alcance | Nota |
|---|---|---|---|---|
| **Auth** | `POST /auth/login` · `POST /auth/logout` | público / autenticado | — | Login por email + contraseña. `LoginDto` exige mínimo 6 caracteres. |
| **Sucursales** | `POST/GET /branches` · `PATCH /branches/:id` · `PATCH /branches/:id/toggle-active` | SUPER_ADMIN | global | Campos: `name`, `address`, `phone?`. |
| **Usuarios** | `POST/GET /users` · `GET/PATCH /users/:id` · `PATCH /users/:id/toggle-active` | ADMIN (+SA) | ⚠️ hoy **sin** alcance por sucursal (§4, cambio 2) | `branchId` va en el body. |
| **Productos** | `POST/GET /products` · `GET/PATCH /products/:id` · `PATCH /products/:id/toggle-active` | ADMIN (+SA); `GET` también CASHIER | global | CASHIER solo ve activos y vendibles. |
| **Variantes** | `POST/GET /variants` · `PATCH /variants/:id` · `PATCH /variants/:id/toggle-active` | ADMIN (+SA) | global | `components: [{type,name?,count}]`. |
| **Cajas** | `GET/POST /cash-registers` · `PATCH /cash-registers/:id` · `PATCH …/toggle-active` | `GET` CASHIER+ADMIN; resto ADMIN | sucursal del actor | SA → 400. |
| **Períodos de turno** | `GET/POST /shifts/shift-periods` · `PATCH /shifts/shift-periods/:id` | `GET` CASHIER+ADMIN; resto ADMIN | global | `GET` devuelve **solo activos**. |
| **Turnos** | `POST /shifts/open` · `GET /shifts/active` | CASHIER | sucursal | El cierre llega en Sprint 3. |
| **Inventario (ítems)** | `GET/POST /inventory/items` · `PATCH /inventory/items/:id` | `GET` ADMIN+COOK; resto ADMIN | sucursal del actor | SA → 400. `initialStock` crea la transacción `RECEPTION`. |
| **Clientes** | `GET /customers/by-ci/:ci` · `GET /customers/by-nit/:nit` · `POST /customers` | CASHIER+ADMIN | global | No hay listado (Sprint 4). |
| **Operativos** | `POST/GET /orders` · `GET /orders/:id` · `POST /orders/:id/pay` · `POST /orders/:id/cancel` · `GET /pos/context` | ver [§5.2](technical_guide.md#52-autenticación-y-autorización) | sucursal | Fuera del alcance de los CRUDs de maestros. |

**Cómo probarlos:** con datos de prueba, `pnpm seed` + [sincronizar-swagger-postman.md](sincronizar-swagger-postman.md); sin seed, [api-testing-guide.md](api-testing-guide.md) (Fases A→E). Faltan en el API: `DELETE` (por diseño), `POST /inventory/adjust`, listado de clientes, `GET /shifts` (lista), reportes y cierre de turno.

---

## 2. Swagger ↔ datos del seed ✅ implementado

Los ejemplos de Swagger coinciden con lo que crea `pnpm seed`, así que lo que se exporta a Postman se puede ejecutar sin editar valores.

**Qué se hizo**
- **Fuente única versionada:** `src/common/swagger/example-data.ts` exporta `SEED_IDS` (UUID v7 válidos y **fijos**: los `uuid(7)` por defecto no son deterministas), `SEED_PASSWORD`, `SEED_LOGINS` y `SEED_CUSTOMER`. La usan los DTOs/controllers **y** los seeders, así no hay dos copias que se desfasen.
- **Seeders** (`seeders/domains/*`): crean sucursal, usuarios, cajas, períodos, productos, variantes e ítems con esos ids. Se agregó el cocinero `cocinero1@gmail.com` y un **cliente fijo** (MARCO ORTEGA, CI `8351427`, NIT `120558027`) para `by-ci`/`by-nit`.
- **Ejemplos de DTOs:** los de **lectura/edición/ruta** apuntan a filas sembradas; los de **alta** (`POST`) usan valores **nuevos** para no chocar con la unicidad del seed (`cajera2@gmail.com`, `Sucursal Sur`, `Caja 3`, `PRESA-PECHO-2`, cliente `LUCIA FERNANDEZ`, variante `1/2 con arroz`).
- **`@ApiIdParam(id, descripción)`** (`src/common/swagger/api-id-param.decorator.ts`) en las 14 rutas con `:id`. `orders/:id` queda sin ejemplo: los pedidos no se siembran con id fijo.
- **`POST /auth/login`** documenta un ejemplo de body **por rol** y la tabla de usuarios sembrados.

**Datos del seed:** sucursal "Sucursal Principal"; usuarios `admin1@`, `cajera1@`, `despachadora1@`, `cocinero1@gmail.com` (más `superadmin@gmail.com` de `bootstrap:admin`), **todos con contraseña `password123`, no con su CI** (solo los creados por `POST /users` entran con su CI); cajas "Caja 1"/"Caja 2"; períodos Mañana y Noche; 8 productos con 5 variantes; 12 ítems de inventario; 10 clientes (9 aleatorios + el fijo).

**A tener en cuenta:** `seeders/` **está versionado** (decisión en §7) junto con `example-data.ts`: cualquier clon puede correr `pnpm seed` y los ejemplos de Swagger apuntan a ids que ese seed crea. `pnpm seed` se **niega** a correr si `APP_ENV` no es `development` o si `DATABASE_URL` no apunta a `localhost` (borra datos); `--force` lo permite. Con `--no-reset` los ids fijos chocan al re-sembrar (usar `pnpm seed` completo, que limpia antes). `swagger.json` lo escribe `main.ts` en `docs/swagger-postman/swagger.json` (versionado y compartido con el front).

### 2.3 Verificación pendiente (en ejecución)
BD limpia → `pnpm prisma db push` → `pnpm seed` (confirma que Prisma acepta los ids explícitos) → `pnpm start:dev` → ejecutar la colección de Postman por rol **sin editar valores**: sin `400` por UUID/ejemplo inválido ni `404` por ids inexistentes, y con un duplicado (p. ej. `POST /cash-registers` repetido) devolviendo `error.code` como **string**.

---

## 3. Postman ✅ implementado

**Cómo se usa y qué trae:** ver [sincronizar-swagger-postman.md](sincronizar-swagger-postman.md) (pasos, comandos `pnpm postman:sync` / `postman:watch`, variables de `.env`, `start:dev` con sincronización).

**Por qué un script y no importar el Swagger directo (verificado):** `swagger.json` **no puede llevar los scripts de Postman**. Se revisó el código de `openapi-to-postmanv2` v6.3.3 (el conversor de código abierto que usa Postman): no genera ningún `event`/`listen`/`prerequest`/`test`, y la única extensión `x-` que lee en un request, `x-postman-meta`, solo configura el helper de autenticación. Por eso `scripts/postman-sync.ts` convierte el Swagger por código, inyecta el script que guarda el token (en `bearerToken` y en la variable de su rol) y **reemplaza la colección** con `PUT /collections/{uid}`. *Salvedad: no se verificó la versión interna de la app de Postman.*

**Por qué no el sync de Spec Hub:** solo aplica a colecciones generadas desde *Specs*; esta se importó con *Resources → Import*. El sync nativo es además manual (botón *Update*).

**Pendiente de verificar (⚠️):** la subida real (`PUT`) y que el plan de Postman permita usar la API con la key; que `atob` exista en el sandbox de scripts (el script está en `try/catch`: si falla, igual guarda `bearerToken`); `pnpm start:dev` completo. Riesgo conocido: un usuario creado con un CI de menos de 6 caracteres **no puede loguearse** (`LoginDto` exige ≥6).

---

## 4. Cambios en el backend para maximizar datos reales en el front

**Criterio:** cada cambio se contrastó con `implementation_guide.md`, `technical_guide.md` y el PDR. Los ya previstos en la guía son **adelantos**; los no previstos pero compatibles son **complementarios** (hay que documentarlos); los que se solapan o violan YAGNI se **difieren** y el front los mantiene como datos falsos `MOCK-ONLY`.

### 4.1 Grupo A — ya previstos en la guía (adelantos o brechas doc ↔ código)

| # | Cambio | Evidencia en la doc | Efecto en el front |
|---|---|---|---|
| 2 | ✅ **HECHO**. **Alcance de `/users` por sucursal** + ADMIN no asigna roles superiores. Corregir además: `PATCH ci` no actualiza `ci`; `phone:null`/`branchId:null` fallan. | PDR §2.7: ADMIN crea usuarios "en su sucursal"; el backend valida rol **y sucursal**. DoD Sprint 0. **Hoy el código incumple la doc** (un ADMIN puede crear un SUPER_ADMIN). | Sin filtros ni restricciones de seguridad en el cliente. |
| 5 | ✅ **HECHO**. **`?branchId=` opcional solo para SUPER_ADMIN** en cajas e inventario | `implementation_guide` (inventario: "SUPER_ADMIN filtra por sucursal"; cajas: "puede crear en cualquiera"); `technical_guide` §5.2: "el SUPER_ADMIN opera global". **El código no lo hace.** | SA puede usar las pantallas de cajas e inventario. |
| 7 | ✅ **HECHO** (plan-mejoras-backend, paso 2). **Códigos de error estables** en users, branches, alta de producto y de variante, y errores planos → `NOT_FOUND`/`FORBIDDEN`. *(El filtro global ya desanida `error.code` y los 404 de cajas, períodos, productos, variantes e inventario ya tienen código estable.)* | `technical_guide` §5.4: `code` será string estable. Hoy en esos módulos salen `"Not Found"`, `"Bad Request"`. | Un solo mapa de mensajes en español. |
| 4 | ✅ **HECHO**. `?includeInactive=true` en `GET /shifts/shift-periods` (default sin cambios) | La doc prevé "editar/**desactivar** período (admin)"; reactivar exige verlo. | Reactivar períodos sin caché local. |
| 12 | ✅ **HECHO**. **Clientes admin:** `GET /customers?search=&page=&pageSize=&status=&from=&to=`, `GET /:id`, `PATCH /:id` (`ci`/`nit` no editables), `PATCH /:id/toggle-active`, `GET /:id/orders` | Sprint 4 paso 1, contrato exacto en §6.2a. Precedente: `POST /customers` ya se adelantó del Sprint 4 al 1. | La pantalla de clientes pasa a ser 100% real. |
| 15 | **Inventario:** `POST /inventory/adjust`, `PATCH /inventory/:id/sale-price`, `GET /inventory/dashboard` | Sprint 2, `implementation_guide` línea 158. Falta implementarlos. | Ajuste de stock y dashboard de cocina reales. |
| 16 | ⏸️ **POSTERGADO**. `GET /reports/branches-summary` (solo SA) | `technical_guide` §5.1 (línea 505). Es mayor (agregaciones). **Decidido: el dashboard (datos resumen) es lo último que se hace en la aplicación**; hasta entonces el front mantiene esos KPIs como complemento local. | KPIs del dashboard global. |

### 4.2 Grupo B — complementarios (no previstos, compatibles; documentar en `technical_guide` §5.1)

| # | Cambio | Nota |
|---|---|---|
| 1 | ✅ **HECHO**. `GET /auth/me` → `{ id, firstName, lastName, email, role, branchId, branchName }` | Hoy el nombre solo sale de `GET /users/:id` (ADMIN) y el ADMIN no puede leer su sucursal (`GET /branches` es solo SA). Cumple §9.7 ("ningún listado que la UI no consuma"): el header lo usa. |
| 3 | ✅ **HECHO** (expuesto como `cashRegistersCount` y `admin`). `GET /branches` + `_count.cashRegisters` (terminales) y ADMIN de la sede | Campos derivados, **sin tocar el schema**. |
| 6 | ✅ **HECHO**. `PATCH /inventory/items/:id/toggle-active` | Sigue el patrón "el negocio no borra, desactiva" (§9.7). Decidido: sí. |

### 4.3 Grupo C — se solapan o violan YAGNI: **diferir**

| # | Cambio | Por qué se difiere | En el front |
|---|---|---|---|
| 8 | `User.lastLoginAt` | Toca el schema, sin FR; el Sprint 5 ya planifica el registro de sesión activa (FR-008b) → duplicaría. | "Último acceso" falso |
| 9 | `Branch.code` / `city` | Sin FR; §9.7: "no se toca el schema", lo nuevo entra "con un caso real". | Código y ciudad falsos |
| 10 | `Product.code` (SKU) / `imageUrl` | Ídem. | SKU e imagen falsos |
| 11 | `PATCH /users/:id/reset-password` | Sin FR; `PATCH /users/:id {ci}` ya re-hashea la clave (= CI). | Botón con aviso "próximamente" |
| 13 | `GET /shifts` (lista) | Se solapa con Sprint 3 (`/reports/cash-audit`) y Sprint 5 (`/audit-logs/shift`); §9.7 pide 1 endpoint por operación. | Estado de cajas con mock |
| 14 | `components.options` (piezas permitidas) | La doc no define reglas de composición más allá de `{type,name,count}`; riesgo de contradecir la lógica del POS. | Reglas extra solo locales |

### 4.4 Orden de implementación y actualización de docs

1. **Orden:** **#2** ✅ → **#7** ✅ → **#1** ✅ → **#5** ✅ → **#4** ✅ → **#3** ✅ → **#12** ✅ → **#15**. **#6** ✅ hecho; **#16** postergado al final (§7).
2. **Dónde:** en **esta misma rama** (`feature_sprint1_integrate_front`), como un nuevo change de openspec (mismo flujo que `add-master-data-cruds`).
3. **Docs:** en el mismo cambio, actualizar `implementation_guide` (mover #12 del Sprint 4 y, si aplica, #16 al sprint actual, como ya hace la guía con sus "Ajuste sobre PDR"), `technical_guide` §5.1/§5.2/§6.x, y agregar casos E2E en §8.
4. **Ejemplos de Swagger:** cada endpoint nuevo debe sumar sus ids/ejemplos a `src/common/swagger/example-data.ts` (§2) para que la colección de Postman siga ejecutándose sin editar valores.

---

## 5. Front: estado y plan

- **Estado:** `main` y `feature_sprint1_prototype_ui` (rama actual) funcionan **100% con mocks**: no hay cliente HTTP, el login infiere el rol del email y el middleware solo entiende tokens demo (✅ verificado leyendo `src/`). No hay ninguna sección con datos reales.
- **Rama descartada:** `feature_sprint1_prototype_ui_integration_partial` (local, sin subir) ya trae cliente API, login real y turnos/POS/órdenes/clientes reales, pero **eliminó componentes del front**, y por eso se dejó de lado. Sirve solo como **referencia** de cómo mapear los endpoints; no se mergea ni es base.
- **Plan:** [../frontend/plan-front-cruds-feature-test-cruds.md](../frontend/plan-front-cruds-feature-test-cruds.md): base de API (cliente HTTP, login real, middleware con JWT), conversión de las pantallas mock existentes a datos reales y pantallas nuevas de cajas, períodos, inventario y alta de cliente, **sin eliminar ni cambiar el aspecto de los componentes**. Los datos que el backend no tiene se completan con un complemento falso `MOCK-ONLY`.

---

## 6. Cambios futuros del front alineados con los sprints del backend

| Sprint backend | Entrega del backend | Cambio en el front |
|---|---|---|
| **2 — Inventario + venta custom** | `adjust`, `sale-price`, `dashboard`; `POST /orders/custom`; `manual-consumption`; `shift-chicken-log`; `pos/context.piecePrices` | Dashboard de stock de cocina (COOK/ADMIN); formulario de consumos manuales (FR-017); ciclo crudo; venta custom con precio sugerido calculado en el cliente (`CustomItemModal`); ajuste de stock con motivo en la pantalla de inventario. |
| **3 — Caja completa + descuentos** | `POST /shifts/close`; `expenses`; `vouchers`; `discounts` (CRUD + autorizar); `reports/*` (+CSV); `pos/context.discounts` | Cierre de turno con arqueo (`ShiftSummaryScreen`); gastos; vales; catálogo de descuentos y autorización por turno; descuento por ítem en el POS; reportes (`ShiftControlScreen`) con export CSV; KPIs del dashboard global si se adelanta `branches-summary`. |
| **4 — Cliente, vistas públicas, impresión** | Clientes admin (si no se adelantó); `PATCH /orders/:id/status`; `GET /public/orders/:token`, `/public/ready-orders`; `POST /print/invoice` y PDF | `ClientsScreen` admin 100% real; KDS con `ready`/`delivered` reales (`KitchenScreen`); `PublicOrderScreen` y pantalla de turnos de banco; impresión de ticket/factura. |
| **5 — Auditoría + hardening** | `POST /audit-logs/shift` y `/month`; sesión única por turno; E2E; Swagger final | Pantalla de auditoría por turno/mes; manejo del error de sesión duplicada en el login; retirar los últimos datos `MOCK-ONLY` que ya tengan campo en el backend. |

**Regla transversal:** cada vez que el backend incorpore un campo que hoy es `MOCK-ONLY`, se reemplaza el complemento falso por el dato real en el mapper de ese feature; los componentes no se tocan.

---

## 7. Decisiones pendientes

1. ✅ **Decidido — `seeders/` se versiona** (se quitó de `.gitignore` el 2026-10-05; antes se había decidido ignorarlo). Motivo: Swagger y los seeders cambian juntos, y versionados viajan en el mismo commit, donde un desfase se ve en la revisión; ignorados, el desfase es invisible. Además cualquier clon puede correr `pnpm seed`. No contienen secretos (solo el hash de `password123`). Se agregó una **guarda** (`seeders/guard.ts`): `pnpm seed` se niega si `APP_ENV` no es `development` o si la base no es `localhost`; `--force` la omite.
2. ✅ **Decidido — ADMIN no crea ADMIN.** SUPER_ADMIN crea cualquier rol; ADMIN solo CASHIER, DISPATCHER y COOK de su sucursal; la cajera solo registra clientes (entidad `Customer`, `POST /customers`). `branchId` sigue siendo obligatorio para todo rol salvo SUPER_ADMIN y el traslado es solo de SUPER_ADMIN.
3. ✅ **Decidido — alcance de §4:** se hace **#6**; **#16** (`branches-summary`) se posterga: el dashboard con datos resumen es lo último de la aplicación.
4. ✅ **Decidido — `swagger.json` y la colección de Postman en `docs/swagger-postman/`.** `main.ts` escribe `swagger.json` ahí en cada arranque y `scripts/postman-sync.ts` genera `wonder-chicken.postman_collection.json` a partir de él; ambos están versionados y se comparten con el front por el subtree de `docs/`. Para que la colección no ensucie el historial se hizo **determinista**: se escribe sin ids y los valores que el conversor elegía al azar (filtro `role` de usuarios, `status` y `date` de pedidos, `birthDate` de clientes) ahora tienen un `example` fijo en los DTOs (verificado: 3 corridas idénticas). Cuando cambie la API hay que commitear ambos archivos y subir el subtree. Se quitaron del `.gitignore` las entradas de `swagger.json` y `postman/`.
5. ✅ **Decidido — `docs/` es un subtree compartido con el front y ya no se sincroniza en `start:dev`** (ni en backend ni en frontend): `git subtree pull` exige todo el árbol limpio y crea un commit de merge. Ahora `start:dev` **avisa** si el repo de docs tiene novedades (`pnpm docs:check`); se sincroniza a mano con `pnpm docs:pull` (traer) y `pnpm docs:push` (subir), con mensajes claros. El aviso es **no bloqueante** por defecto; se cambia a bloqueante con `DEFAULT_CHECK_MODE` en `scripts/docs-subtree.js` o `DOCS_CHECK_MODE=block`. Detalle en [sincronizar-swagger-postman.md](sincronizar-swagger-postman.md) §5. 🔲 A futuro: modo `ask` (preguntar si sincronizar al arrancar).
6. **Sin tests** por regla del proyecto hasta cerrar V1: la verificación es manual (recorrido por rol) y la corrida de §2.3.
