# Plan — Integración Front ↔ Back con datos reales

> **Actualizado:** 2026-10-05
> **Objetivo:** que el front muestre **datos reales del API en la mayor parte de sus pantallas**, **sin eliminar componentes ni cambiar cómo se ven**, y que todo el API se pueda probar desde Postman sin armar datos a mano.
> **Fuentes de verdad:** el negocio, en el [PDR](../business/pdr.md); el contrato del API, en [technical_guide.md](technical_guide.md) (§5 endpoints, §6 request/response, §5.5 errores); el orden y lo que falta, en [implementation_guide.md](implementation_guide.md). Este plan solo dice **cómo conecta el front** con ellos: si algo de acá los contradice, mandan las guías y esto se corrige.
> **Principio:** el backend manda y el front renderiza. El front no filtra por seguridad, no calcula precios ni totales y no inventa reglas: muestra lo que devuelve el API.
> **Convención:** ✅ hecho y verificado · 🔲 pendiente · `MOCK-ONLY` dato que el backend todavía no tiene y el front completa con un complemento falso.

---

## 1. Dónde estamos

| | Estado |
|---|---|
| **Backend** | ✅ Sprint 0 y Sprint 1 completos; del Sprint 2, el CRUD de inventario, el ajuste manual y el dashboard; y la administración de clientes. 🔲 Falta lo de los Sprints 2 a 5 ([§3](#3-qué-falta-en-el-backend)). El contrato vigente de cada endpoint está en [technical_guide §5.1](technical_guide.md#51-endpoints-principales) y [§6](technical_guide.md#6-contratos-por-módulo-requestresponse). |
| **API** | ✅ Respuestas, errores y alcance por rol y sucursal estandarizados ([technical_guide §5.2 a §5.6](technical_guide.md#52-autenticación-y-autorización)); Swagger y colección de Postman alineados con el seed. |
| **Front** | 🔲 **Funciona 100 % con mocks**: no hay cliente HTTP, el login infiere el rol del email y el middleware solo entiende tokens demo. Repo `wonderchicken-front`, rama `feature_sprint1_prototype_ui`. |

**Ramas.** El backend trabaja en `feature_sprint1_integrate_front`. El front necesita una **rama nueva** desde `feature_sprint1_prototype_ui` (sugerida: `feature-test-cruds`; todavía no existe). La rama local `feature_sprint1_prototype_ui_integration_partial` ya trae cliente API y pantallas reales, pero **eliminó componentes** y por eso no sirve de base: se consulta solo como referencia de cómo mapear endpoints y **no se mergea**.

---

## 2. Lo que el front consume hoy

### 2.1 Cómo conectarse

- **Base del API:** `http://localhost:4000/api/v1`. Swagger en `/api/docs` y el documento crudo en `/swagger.json`.
- **Datos de prueba:** `pnpm seed` (borra y siembra la base local). Usuarios: `superadmin@gmail.com`, `admin1@gmail.com`, `cajera1@gmail.com`, `despachadora1@gmail.com` y `cocinero1@gmail.com`, **todos con contraseña `password123`**. Los usuarios creados por `POST /users` entran con su CI como contraseña (mínimo 6 caracteres).
- **Probar el API sin front:** la colección de Postman versionada (`docs/swagger-postman/`; un login por rol y ejemplos con los ids del seed), [sincronizar-swagger-postman.md](sincronizar-swagger-postman.md); el recorrido por rol de [api-testing-guide.md](api-testing-guide.md); y `pnpm api:snapshot`, que ejecuta ~200 pasos y avisa de cualquier cambio de comportamiento.

### 2.2 Contrato que el front debe respetar

El detalle está en [technical_guide §5.3 a §5.6](technical_guide.md#53-estructura-de-respuesta-estándar). Lo que cambia cómo se escribe el front:

- **Sobre de respuesta:** `{ isSuccess, message, data, error }`. El éxito trae `data` con una clave por entidad (`{ order }`) o por colección (`{ users, total }`).
- **Errores:** `error.code` es un **código estable**, siempre un string del [catálogo](technical_guide.md#55-catálogo-de-códigos-de-error); `error.details` es **siempre un arreglo** `[{ field, message }]` (vacío si no corresponde a un campo; `field` marca el input). Se decide por `code`, nunca por el texto.
- **Errores genéricos:** `BAD_REQUEST` (id con formato inválido), `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT` e `INTERNAL_SERVER_ERROR`. Los mensajes de `BAD_REQUEST` y `NOT_FOUND`, y los de algunas reglas de validación poco comunes, llegan **en inglés**: el front muestra su propio texto en español para esos códigos.
- **Sesión:** `401` con `TOKEN_REQUIRED`, `TOKEN_INVALID` (vencido o alterado) o `USER_INACTIVE` → volver al login. El token dura 2 h en `development` y `qa`, y 8 h en `production`; **no hay renovación** (aplazada). Rol y sucursal los lee el backend de la base en cada request: un cambio aplica al instante.
- **Perfil para el header:** `GET /auth/me` (`{ user: { id, firstName, lastName, email, role, branchId, branchName } }`). No hace falta decodificar el JWT ni llamar a `GET /users/{id}`.
- **Formatos:** enums en MAYÚSCULAS (`PREPARING`, `CASH`); los `Decimal` viajan como **string** (`"45"`) y los importes que el front envía van como número; fechas en ISO UTC; los `POST /orders/{id}/pay` y `/cancel` responden **201**.
- **Paginación:** solo en la lista de clientes y en el historial de pedidos de un cliente (`?page=&pageSize=`, máximo 100); el resto de las listas no se pagina.
- **Alcance:** el backend ya impone qué ve y qué hace cada rol ([technical_guide §5.6](technical_guide.md#56-alcance-por-rol-y-sucursal)). El front puede **ocultar** acciones como ayuda visual, pero no necesita filtrar usuarios por sucursal, limitar roles ni esconder toggles para que sea correcto. El `SUPER_ADMIN` no tiene sucursal: en cajas e inventario elige una con un selector (`?branchId=` en las listas, `branchId` en el body al crear).

### 2.3 Swagger y Postman

- `swagger.json` y la colección se **versionan** en `docs/swagger-postman/` y viajan al front por el subtree de `docs/`. El primero lo escribe la API en cada arranque con `APP_ENV=development`; la colección se genera de él con `pnpm postman:sync --no-push`. Son **deterministas** (sin ids, ejemplos fijos): en git solo cambian cuando cambia la API y entonces se commitean juntos.
- **Por qué un script y no importar el Swagger directo:** un `swagger.json` no puede llevar los scripts de Postman (el conversor `openapi-to-postmanv2` no genera `event`/`prerequest`/`test`). `scripts/postman-sync.ts` convierte el Swagger, inyecta el script que guarda el token (en `bearerToken` y en la variable de su rol) y reemplaza la colección con `PUT /collections/{uid}`. El sync de Spec Hub no aplica: es manual y solo para colecciones generadas desde *Specs*.
- **🔲 Sin verificar:** la subida real a Postman con una cuenta real, que el plan de Postman permita usar la API con la key, y la ejecución completa de la colección **dentro de Postman** (sin `400` por UUID ni `404` por ids inexistentes). La generación del archivo y el recorrido por la API sí están verificados.

---

## 3. Qué falta en el backend

La lista completa, con su porqué y cuándo entra, es [implementation_guide §10](implementation_guide.md#10-mejoras-del-backend-pendientes-y-decisiones-abiertas); el detalle por sprint, sus secciones 4 a 7. Para el front:

| Sprint | Entrega del backend | Cambio en el front |
|---|---|---|
| **2 — Inventario + venta custom** | Descuento de inventario al pagar y su reversión; `POST /orders/custom`; consumos manuales y ciclo crudo; `piecePrices` en `GET /pos/context` | Venta custom con precio sugerido calculado en el cliente (`CustomItemModal`); formulario de consumos manuales y ciclo crudo del cocinero; el stock y el dashboard reflejan las ventas; anulación de pedidos pagados. |
| **3 — Caja completa + descuentos** | `POST /shifts/close`; gastos; vales; descuentos (catálogo y autorización); reportes con CSV; `discounts` en `GET /pos/context` | Cierre de turno con arqueo (`ShiftSummaryScreen`); gastos y vales; catálogo de descuentos y autorización por turno; descuento por ítem en el POS; reportes (`ShiftControlScreen`) con exportación CSV. |
| **4 — Cliente, vistas públicas, impresión** | `PATCH /orders/{id}/status`; `GET /public/orders/{token}` y `/public/ready-orders`; impresión de factura y PDF; auditoría de clientes | Estados `READY` y `DELIVERED` reales en el panel de despacho (`KitchenScreen`); `PublicOrderScreen` y pantalla de turnos de banco; impresión de ticket y factura. |
| **5 — Auditoría + hardening** | `POST /audit-logs/shift` y `/month`; sesión única por turno | Pantalla de auditoría por turno y mes; manejo del error de sesión duplicada en el login; retirar los últimos `MOCK-ONLY` que ya tengan campo en el backend. |
| **Al final** | `GET /reports/branches-summary` (KPIs globales del `SUPER_ADMIN`) y token de renovación | KPIs del dashboard global (hasta entonces siguen locales). El **dashboard con datos resumen es lo último que se hace en la aplicación**. |

**Regla transversal:** cuando el backend incorpora un campo que hoy es `MOCK-ONLY`, se reemplaza el complemento falso por el dato real en el mapper de ese feature; los componentes no se tocan.

---

## 4. Plan del front

### 4.1 Decisiones

1. Incluir una **base real mínima**: cliente HTTP, login real y middleware con JWT.
2. El `SUPER_ADMIN` gestiona Sucursales, Usuarios, Catálogo y Períodos; el `ADMIN`, además, cajas, inventario y clientes de su sucursal.
3. **Convertir** las pantallas mock existentes; crear pantallas nuevas solo para cajas, períodos de turno e inventario.
4. Editor de variantes simplificado sobre `components`, sin precio de sustitución (la sustitución nunca cambia el precio) y sin temperatura de bebida (es un comentario del pedido).
5. **Restricción que prevalece sobre el resto:** cubrir con el API real todo lo posible y completar con datos falsos lo que el backend no tiene. **No eliminar componentes ni cambiar su aspecto**: columnas, campos, botones y modales actuales se conservan.

Sin tests hasta cerrar V1 ([AGENTS.md](../../AGENTS.md)): se verifica a mano con el recorrido de [§4.7](#47-verificación).

### 4.2 Estrategia híbrida (API real + complemento falso)

- Los tipos de dominio (`lib/domain/types.ts`: `Branch`, `Operator`, `Product`, `Customer`…) y los componentes que los consumen **no cambian**. Cada `features/<x>/api/` suma un **mapper** `ApiX → X`: toma los campos reales y completa los faltantes desde un **complemento local** (`features/<x>/mock-extras.ts`).
- El complemento se genera de forma determinista a partir del `id` (código de sede `S-01`, ciudad, SKU `P-001`, turno asignado, último acceso…) y se persiste en `localStorage` por `id` (Zustand `persist`) para que sea estable y editable en los formularios existentes.
- Al guardar, el store separa el payload: lo que el backend soporta va por API; el resto queda solo en el complemento.
- Todo campo falso lleva el comentario `// MOCK-ONLY` y se lista en `lib/mock-only-fields.ts` (registro único) para reemplazarlo cuando el backend lo soporte.
- Los botones sin endpoint (p. ej. resetear la clave) siguen visibles y muestran un `toast.info` "Disponible próximamente".
- Las pantallas **nuevas** sin componente previo (cajas, inventario) solo hacen lo que el backend permite; no se inventan acciones.

**Lo que sigue siendo `MOCK-ONLY`** (no hay campo ni endpoint, ni se planifican para V1): código y ciudad de la sucursal; último acceso y turno asignado de un usuario; SKU e imagen del producto y las reglas extra de variante (`ProductRulesModal`: piezas permitidas); y los KPIs de los dashboards (hasta `branches-summary`, ver [§3](#3-qué-falta-en-el-backend)).

### 4.3 Paso 1 — Base de API (`src/lib/http/`, `src/config/api.ts`, `next.config.ts`)

- **`config/api.ts`:** `API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? '/api/v1'`.
- **`next.config.ts`:** `rewrites()` de `/api/v1/:path*` hacia `${API_PROXY_TARGET ?? 'http://localhost:4000'}/api/v1/:path*`. El navegador llama al mismo origen (sin CORS) y en `qa` o `production` no hace falta definir `CORS_ORIGINS` en el backend.
- **`lib/http/api-error.ts`:** `ApiError { status, code, message, details }` y `getErrorMessage(err)` con un mapa `error.code` → español para **todo el catálogo** ([technical_guide §5.5](technical_guide.md#55-catálogo-de-códigos-de-error)), más los códigos genéricos. Es la **única** fuente de textos de error: con un `code` desconocido cae al `message` del backend. `details` (`[{ field, message }]`) se usa para marcar el input de cada formulario, además de la validación Zod previa.
- **`lib/http/http-client.ts`:** `apiRequest<T>(method, path, { body, query })` con `Authorization: Bearer` desde `useAuthStore.getState().user?.token`; desempaqueta `{ isSuccess, message, data, error }` y lanza `ApiError`; ante `TOKEN_REQUIRED`, `TOKEN_INVALID` o `USER_INACTIVE` → `logout()` y redirección a `/login`.
- **Login real** (`features/auth/api/auth.api.ts`, `LoginScreen.tsx`): `POST /auth/login` → `accessToken`; luego `GET /auth/me` para el nombre, el rol, la sucursal y `branchName` del header. Mapeo de roles: `CASHIER → CAJERA`, `DISPATCHER → DESPACHADORA`; `COOK` → mensaje "rol sin pantallas todavía" hasta el Sprint 2.
- **`middleware.ts`:** reemplazar `getRoleFromToken` (sufijos demo) por la decodificación del JWT (`atob`, **solo para ruteo**, validando `exp`) con el mismo mapeo de roles; mantener `rolePrefixFor`. El rol que cuenta para la seguridad es el del backend, no el del token.

### 4.4 Paso 2 — Patrón común por feature

`features/<x>/{types.ts, schemas/<x>.schemas.ts, api/<x>.api.ts, stores/<x>.store.ts, components/<X>Screen.tsx, <X>FormModal.tsx}` según [frontend_code_style.md](../frontend/frontend_code_style.md):

- **`types.ts`:** tipos que reflejan el DTO real (los decimales llegan como string: `Number()` al mostrar, números JSON al enviar).
- **`schemas`:** Zod 4 espejo de las restricciones del DTO ([technical_guide §6](technical_guide.md#6-contratos-por-módulo-requestresponse)); mapear `issues[].path[0]` → `error`/`helperText` por campo.
- **`api`:** una función por endpoint. **`store`:** `items`, `isLoading`, `isSaving`, `error`, `load/create/update/toggle` asíncronos; selectores por slice.
- **Screens:** `PageHeader` + `SectionCard` + `CommonTable` (hasta 4 columnas) o `MuiDataGridTable` (más de 4); `AppModal` para formularios con `confirmLoading`; `ConfirmDialog` solo al desactivar; toasts solo en éxito crítico y error; estados de carga (Skeleton), error y vacío.
- **Formularios:** el patrón correcto de `CustomerFormModal` (reset al abrir o `key={selected?.id ?? 'new'}`), filas `{ xs: 'column', sm: 'row' }`. **No** copiar los problemas de `BranchFormModal` (form obsoleto, sin Zod, sin async, línea muerta `Switch`).
- **Común:** `commonComponents/ActiveChip.tsx` (Activo/Inactivo; `StatusBadge` es solo de órdenes). Solo tokens del theme, sin hex; `size="small"`, íconos `@mui/icons-material/*Rounded`, textos de UI en español y código en inglés.
- **PATCH:** enviar solo los campos que cambian. `null` solo donde el contrato lo documenta (`phone`, `branchId` de un `SUPER_ADMIN`, `description`, `salePrice`, `birthDate`, `email` de cliente y los horarios de un período); en el resto es un `400`.

### 4.5 Paso 3 — Pantallas

| Ruta | Rol | Feature | Endpoints | Notas |
|---|---|---|---|---|
| `/super-admin/branches` | SA | `branches` (convertir) | `GET/POST/PATCH /branches`, `toggle-active` | Reales: `name`, `address`, `phone?`, `active`, `cashRegistersCount` y `admin` (el ADMIN de la sede). El `PATCH` exige al menos un campo y un nombre repetido da `409 CONFLICT`. **Se conservan** código y ciudad como `MOCK-ONLY`. |
| `/super-admin/users` y `/branch-admin/users` | SA / ADMIN | `users` (convertir `PersonnelScreen`) | `GET /users?role=`, `POST`, `PATCH /users/{id}`, `toggle-active`, `GET /branches` (SA) | **El backend impone el alcance**: el ADMIN recibe solo el personal de su sede y solo puede crear `CASHIER`, `DISPATCHER` y `COOK`; el SA elige sucursal y rol. `branchId` es obligatorio salvo para el SA. La CI es **editable** y cambiarla cambia también la contraseña de login (avisarlo). Nadie se desactiva a sí mismo salvo el SA (`CANNOT_TOGGLE_SELF`). Cambiar rol o sucursal con un turno abierto da `USER_HAS_OPEN_SHIFT`. Turno asignado y último acceso: `MOCK-ONLY`; el botón de clave: `toast.info`. |
| `/super-admin/products` y `/branch-admin/products` | SA / ADMIN | `catalog` (convertir `CatalogScreen`) | `GET/POST /products`, `GET/PATCH /products/{id}`, `toggle-active`; `GET/POST /variants`, `PATCH /variants/{id}`, `toggle-active` | Producto: `name` 3–80, `basePrice` ≥ 0.01 (2 decimales), `category` (Autocomplete libre con las existentes), `description` ≤ 500, `isSellable`, `isInventoryItem`. El listado del ADMIN trae todo (con variantes inactivas, para reactivarlas); filtros de categoría, estado y búsqueda en el cliente (el backend no filtra). Variantes: `name`, `isDefault`, `components` (`{ type: presa \| acompanamiento \| bebida \| extra, name?, count ≥ 1 }`, mínimo 1) y toggle. **Se conservan** SKU, imagen y `ProductRulesModal`: lo que cabe en `components` va al backend; el resto, `MOCK-ONLY`. |
| `/super-admin/shift-periods` y `/branch-admin/shift-periods` | SA / ADMIN | `shifts` (nuevo `ShiftPeriodsScreen`) | `GET/POST/PATCH /shifts/shift-periods` | `name`, `displayOrder` ≥ 1, `referenceStart/End` (horarios informativos). Se lista con **`?includeInactive=true`** para poder reactivar con `PATCH { active: true }`. Es un catálogo **global**: avisar que afecta a todas las sucursales. |
| `/branch-admin/cash-registers` | ADMIN | `cash-registers` (nuevo) | `GET/POST /cash-registers`, `PATCH /{id}`, `toggle-active` | Solo `name` (1–100). `CASH_REGISTER_ALREADY_EXISTS` junto al campo. El nombre es único por sucursal. El SA ve todas o elige con `?branchId=`. |
| `/branch-admin/inventory` | ADMIN | `inventory` (nuevo, `MuiDataGridTable`) | `GET/POST /inventory/items`, `PATCH /{id}`, `toggle-active`, `POST /inventory/adjust`, `GET /inventory/dashboard` | Filtros `type`, `active` y `search` al servidor. Alta: `productCode` (`A-Z a-z 0-9 _ -`), `name`, `unit`, `type`, `unitMeasure?`, `salePrice?` (solo `PECHO`/`ALA`/`PIERNA`/`ENTREPIERNA`; deshabilitado en el resto), `initialStock?` (entero ≥ 0). Edición: solo `name`, `unit`, `unitMeasure`, `salePrice`. `currentStock` es de **solo lectura**: se mueve únicamente con el alta o con el **ajuste** (`delta` entero ≠ 0, `reason` `ADJUSTMENT` o `RECEPTION`, `note` obligatoria). El dashboard de stock cocido es para `ADMIN` y `COOK`. El SA elige sucursal. |
| `/branch-admin/customers` | ADMIN | `customers` (convertir `ClientsScreen` y `CustomerFormModal`) | `GET /customers`, `GET/PATCH /customers/{id}`, `toggle-active`, `GET /customers/{id}/orders`, `POST /customers` | **100 % real**: lista paginada con `search`, `status` y rango de alta; edición de nombres, sexo, nacimiento y contacto (**`ci` y `nit` no se editan**); activar/desactivar; historial de pedidos de todas las sucursales en el modal "Ver historial". Validación: CI `^\d{4,20}$`, NIT `^\d{3,20}$`, nombres ≤ 80, sexo `HOMBRE`/`MUJER`, `birthDate` `YYYY-MM-DD`, teléfono ≤ 30, email válido. El flujo de la cajera (lookups por CI/NIT y alta con F9) no se toca. |
| `/cashier/*`, `/dispatcher`, `/order/[token]` | CAJERA, DESPACHADORA, público | `shifts`, `pos`, `orders`, `public-order` | ver [§3](#3-qué-falta-en-el-backend) | Fuera de esta etapa: se convierten a medida que el backend entrega su Sprint. Ya existen `POST /shifts/open`, `GET /shifts/active`, `GET /pos/context`, `POST /orders`, `/pay`, `/cancel`, `GET /orders` y los lookups de clientes. |

### 4.6 Paso 4 — Navegación y rutas

- `super-admin/layout.tsx`: Dashboard, Sucursales, Personal y Roles, Catálogo y Períodos de turno, todo bajo `/super-admin/*` (hoy hay 4 links a `/branch-admin/*` que el middleware bloquea). Las páginas son finas: solo renderizan el Screen.
- `branch-admin/layout.tsx`: agregar Cajas, Períodos de turno e Inventario; Clientes apunta a la pantalla convertida.
- **Antes de convertir cada store, buscar con `rg` sus consumidores** (conteo de sedes en dashboards y layouts, POS, órdenes mock): los ids pasan de mock (`p-1`) a UUID; si algo no convertido depende de la forma mock, mantener esos selectores compatibles o separar el store.

### 4.7 Verificación

1. Backend: `pnpm seed` y `pnpm start:dev` (puerto 4000). Front: `pnpm dev` con `API_PROXY_TARGET` apuntando al backend.
2. Login real con el SUPER_ADMIN → `/super-admin`; `/branch-admin/*` redirige y no quedan links muertos.
3. SA: crear sucursal → crear su ADMIN → editar y desactivar; probar duplicados (mensaje en español junto al campo).
4. ADMIN (`admin1@gmail.com`): períodos (crear, editar, desactivar y reactivar), cajas (duplicado → `CASH_REGISTER_ALREADY_EXISTS`), producto + variante con `components`, ítems de inventario (presa con `salePrice` e `initialStock`; `salePrice` en un insumo bloqueado) y un ajuste de stock, personal de su sede, clientes (CI duplicado, edición, historial).
5. `401` con el token vencido o el usuario desactivado → vuelve a `/login`. Comprobar en la red que ningún `PATCH` envía `null` donde el contrato no lo permite.
6. Revisión visual en claro y oscuro y a ancho móvil; `pnpm lint` solo sobre los archivos tocados, sin sumar errores a los que ya tenía el front. Sin build.

---

## 5. Decisiones vigentes

1. **`seeders/` está versionado.** Swagger y seeders cambian juntos y, versionados, viajan en el mismo commit. No contienen secretos (solo el hash de `password123`). `pnpm seed` se niega a correr si `APP_ENV` no es `development` o si la base no es `localhost` (`--force` lo permite); con `--no-reset` los ids fijos chocan, por eso se usa siempre el seed completo.
2. **Usuarios por rol:** el SUPER_ADMIN crea cualquier rol; el ADMIN solo `CASHIER`, `DISPATCHER` y `COOK` de su sucursal; el traslado de personal es solo del SUPER_ADMIN; `branchId` es obligatorio salvo para el SUPER_ADMIN (no hay repositorio global de empleados). Los clientes son la entidad `Customer`, no un rol.
3. **Alcance por sucursal:** el ADMIN no ve otras sucursales, ni en usuarios ni en pedidos. La única excepción deliberada es el historial de pedidos de un cliente ([PDR §2.12](../business/pdr.md#212-clientes-y-facturación-nominada)).
4. **`docs/` es un subtree compartido con el front.** No se sincroniza en `start:dev`: este solo **avisa** si hay novedades (`pnpm docs:check`, no bloqueante); se trae con `pnpm docs:pull` y se sube con `pnpm docs:push`. Detalle en [sincronizar-swagger-postman.md](sincronizar-swagger-postman.md).
5. **Aplazado:** `GET /reports/branches-summary` y el dashboard con datos resumen (lo último de la aplicación), el token de renovación y `CORS_ORIGINS` (al pasar a QA o producción).
6. **Sin tests** por regla del proyecto hasta cerrar V1.
