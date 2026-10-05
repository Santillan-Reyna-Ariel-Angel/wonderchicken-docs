# Plan — Pantallas CRUD del front (rama `feature-test-cruds`)

> **Actualizado:** 2026-10-05 · Repo `wonderchicken-front` · Rama `feature-test-cruds`, creada desde `feature_sprint1_prototype_ui` (árbol limpio).
> Plan hermano del backend: `docs/backend/plan-integracion-front-datos-reales.md` (los cambios de backend se hacen en la rama `feature_sprint1_integrate_front`).

## Contexto

El backend expone los CRUDs de datos maestros (cajas, períodos de turno, productos/variantes, inventario, alta de clientes, más sucursales y usuarios). El front (Next 16 + React 19 + MUI 9 + Zustand 5 + Zod 4) **corre 100% con mocks**: no hay cliente HTTP, el login es falso y el middleware solo entiende tokens demo. Objetivo: implementar las pantallas CRUD para ADMIN y SUPER_ADMIN contra el API real, respetando el theme, `docs/frontend/frontend_code_style.md` y los patrones del código actual.

**Decisiones:**
1. Incluir una base real mínima (cliente HTTP + login real + middleware con JWT).
2. SUPER_ADMIN = Sucursales + Usuarios + Catálogo + Períodos.
3. Convertir las pantallas mock existentes; crear nuevas solo para cajas, períodos, inventario y clientes.
4. Editor de variantes simplificado sobre `components`: sin precio de sustitución y sin temperatura de bebida (es un comentario del pedido, fuera de alcance).
5. **Restricción que prevalece sobre el resto:** cubrir con el API real todo lo posible y **completar con datos falsos lo que el backend no tiene**. **No eliminar componentes ni cambiar cómo se ven**: columnas, campos, botones y modales actuales se conservan.

**Contratos:** la fuente de verdad son las docs del repo **back** (`docs/backend/*`); las copias viejas del front están desactualizadas. Sin tests (`docs/index.md`).

### Estrategia híbrida (API real + complemento falso)
- Los tipos de dominio (`lib/domain/types.ts`: `Branch`, `Operator`, `Product`, `Customer`…) y los componentes que los consumen **no cambian**. Cada `features/<x>/api/` suma un **mapper** `ApiX → X`: toma los campos reales y completa los faltantes desde un **complemento local** (`features/<x>/mock-extras.ts`).
- El complemento se genera de forma determinista a partir del `id` (código de sede `S-01`, ciudad, terminales, SKU `P-001`, turno asignado, último acceso…) y se persiste en localStorage por `id` (zustand `persist`) para que sea estable y editable en los formularios existentes.
- Al guardar, el store separa el payload: lo que el backend soporta va por API; el resto queda solo en el complemento local.
- Todo campo falso lleva el comentario `// MOCK-ONLY` y está listado en `lib/mock-only-fields.ts` (registro único) para reemplazarlo cuando el backend lo soporte.
- Botones sin endpoint (p. ej. resetear clave) siguen visibles y muestran un `toast.info` "Disponible próximamente".
- Las pantallas **nuevas** sin componente previo (cajas, inventario) solo hacen lo que el backend permite; no se inventan acciones.

## Paso 1 — Base de API (`src/lib/http/`, `src/config/api.ts`, `next.config.ts`)
- `config/api.ts`: `API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? '/api/v1'`.
- `next.config.ts`: `rewrites()` de `/api/v1/:path*` → `${API_PROXY_TARGET ?? 'http://localhost:4000'}/api/v1/:path*` (evita CORS; el browser llama same-origin).
- `lib/http/api-error.ts`: `ApiError {status, code, message, details}` + `getErrorMessage(err)` con un mapa `error.code` → español (`CASH_REGISTER_ALREADY_EXISTS`, `SHIFT_PERIOD_ALREADY_EXISTS`, `DUPLICATE_PRODUCT_NAME`, `INVENTORY_ITEM_CODE_ALREADY_EXISTS`, `SALE_PRICE_NOT_ALLOWED_FOR_TYPE`, `CUSTOMER_CI/NIT_ALREADY_EXISTS`, `*_NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`…). Fallback al `message` del backend: algunos módulos aún devuelven códigos planos (`"Bad Request"`, `"Not Found"`).
- `lib/http/http-client.ts`: `apiRequest<T>(method, path, {body, query})` con `Authorization: Bearer` desde `useAuthStore.getState().user?.token`; desempaqueta `{isSuccess,message,data,error}` y lanza `ApiError`; en 401 → `logout()` + redirect a `/login`. Los errores de validación llegan como `error.details.fields: string[]` (sin nombre de campo) → se muestran en un `Alert` del formulario, además de la validación Zod previa.
- **Login real** (`features/auth/api/auth.api.ts`, `LoginScreen.tsx`): `POST /auth/login` → `accessToken`; decodificar el payload JWT `{sub,email,role,branchId}`; mapear `CASHIER→CAJERA`, `DISPATCHER→DESPACHADORA`; `COOK` → mensaje "rol sin pantallas todavía". Nombre: `GET /users/{sub}` solo para ADMIN/SA (cajera/despachadora no tienen permiso → parte local del email). `branchName` no está disponible para ADMIN → texto de respaldo. Usuarios de prueba del seed: contraseña `password123`.
- **`middleware.ts`**: reemplazar `getRoleFromToken` (sufijos demo) por decodificación del JWT (`atob`, solo para ruteo, validar `exp`) con el mapeo de roles. Mantener `rolePrefixFor`.

## Paso 2 — Patrón común por feature
`features/<x>/{types.ts, schemas/<x>.schemas.ts, api/<x>.api.ts, stores/<x>.store.ts, components/<X>Screen.tsx, <X>FormModal.tsx}` según el style guide:
- `types.ts`: tipos que reflejan el DTO real (los decimales llegan como string → `Number()` al mostrar; enviar números JSON).
- `schemas`: Zod 4 espejo de las restricciones del DTO; mapear `issues[].path[0]` → `error`/`helperText` por campo.
- `api`: una función por endpoint. `store`: `items`, `isLoading`, `isSaving`, `error`, `load/create/update/toggle` async; selectores por slice.
- Screens: `PageHeader` + `SectionCard` + `CommonTable` (≤4 columnas) o `MuiDataGridTable` (>4); `AppModal` para formularios con `confirmLoading`; `ConfirmDialog` solo al desactivar; toasts solo en éxito crítico/error; estados loading (Skeleton) / error / empty.
- Formularios: copiar el patrón **correcto** de `CustomerFormModal` (reset al abrir / `key={selected?.id ?? 'new'}`), filas `{xs:'column', sm:'row'}`; **no** copiar los bugs de `BranchFormModal` (form obsoleto, sin Zod, sin async, línea muerta `Switch`).
- Nuevo componente común: `commonComponents/ActiveChip.tsx` (Activo/Inactivo; `StatusBadge` es solo de órdenes). Solo tokens del theme, sin hex; `size="small"`, iconos `@mui/icons-material/*Rounded`, textos de UI en español y código en inglés.
- Nunca enviar `null` en PATCH de users/branches (siguen con `@IsOptional`; el backend daría 500): omitir los campos vacíos.

## Paso 3 — Pantallas

| Ruta | Rol | Feature | Endpoints | Notas |
|---|---|---|---|---|
| `/super-admin/branches` | SA | `branches` (convertir) | `GET/POST/PATCH /branches`, `toggle-active` | Reales: `name`, `address`, `phone?`, `active`. **Se conservan** código, ciudad, administrador, terminales y sync con datos del complemento local. PATCH exige ≥1 campo. Duplicado en PATCH → 409 `CONFLICT`. |
| `/super-admin/users` y `/branch-admin/users` | SA / ADMIN | `users` (convertir `PersonnelScreen`) | `GET /users?role=`, `POST`, `PATCH /users/:id`, `toggle-active`, `GET /branches` (SA) | SA: selector de sucursal + todos los roles. ADMIN: roles limitados a CASHIER/DISPATCHER/COOK, `branchId` del JWT, listado filtrado por `branchId` en cliente, toggle oculto en filas ADMIN/SA y en la propia. CI visible pero solo lectura al editar (el backend no la actualiza, solo re-hashea la clave). Turno asignado y último acceso: complemento local; botón de clave: `toast.info`. |
| `/super-admin/products` y `/branch-admin/products` | SA / ADMIN | `catalog` (convertir `CatalogScreen`) | `GET/POST /products`, `GET/PATCH /products/:id`, `toggle-active`; `GET/POST /variants`, `PATCH /variants/:id`, `toggle-active` | Producto: `name` 3-80, `basePrice` ≥0.01 (2 dec.), `category` (Autocomplete freeSolo con las existentes), `description` ≤500, `isSellable`, `isInventoryItem`. Filtros (categoría/estado/búsqueda) en cliente: el backend no filtra. Variantes: `name`, `isDefault`, `components` (`{type: presa\|acompanamiento\|bebida\|extra, name?, count ≥1}`, mínimo 1) y toggle. **Se conservan** SKU, imagen y `ProductRulesModal`: lo que cabe en `components` (presas, acompañamiento, bebida) va al backend; piezas permitidas y sustituciones (sin precio extra) quedan en el complemento local. |
| `/super-admin/shift-periods` y `/branch-admin/shift-periods` | SA / ADMIN | `shifts` (nuevo `ShiftPeriodsScreen`) | `GET/POST/PATCH /shifts/shift-periods` | `name`, `displayOrder` ≥1, `referenceStart/End` (HH:mm informativo). El GET solo devuelve activos → el store persiste en localStorage los períodos ya vistos; al desactivar queda en la lista como inactivo y se reactiva con `PATCH {active:true}`. Es catálogo global: aviso de que afecta a todas las sucursales. |
| `/branch-admin/cash-registers` | ADMIN | `cash-registers` (nuevo) | `GET/POST /cash-registers`, `PATCH :id`, `toggle-active` | Solo `name` 1-100; `CASH_REGISTER_ALREADY_EXISTS` junto al campo. |
| `/branch-admin/inventory` | ADMIN | `inventory` (nuevo, `MuiDataGridTable`) | `GET/POST /inventory/items`, `PATCH :id` | Filtros `type`/`active`/`search` al servidor. Alta: `productCode` (`/^[A-Za-z0-9_-]+$/`), `name`, `unit` (PRESA/BOLSA/PAQUETE/UNIDAD/VASO/DOYPACK), `type`, `unitMeasure?`, `salePrice?` (solo PECHO/ALA/PIERNA/ENTREPIERNA; deshabilitado en otros), `initialStock?` (entero ≥0). Edición: solo `name`, `unit`, `unitMeasure`, `salePrice`. `currentStock` solo lectura; sin toggle (no existe). |
| `/branch-admin/customers` | ADMIN | `customers` (nuevo `CustomersAdminScreen`) | `POST /customers`, `GET /customers/by-ci/:ci`, `by-nit/:nit` | Sin listado en el backend: `ClientsScreen` (variante admin) y `CustomerFormModal` **se conservan**; el alta y la búsqueda por CI/NIT van al API real y la lista mezcla los clientes mock con los creados/consultados (persistidos localmente). Validación: CI `^\d{4,20}$`, NIT `^\d{3,20}$`, nombres ≤80, sexo HOMBRE/MUJER, `birthDate` YYYY-MM-DD, teléfono ≤30 (opcional), email. El flujo de la cajera no se toca. |

## Paso 4 — Navegación y rutas
- `super-admin/layout.tsx`: Dashboard, Sucursales, Personal y Roles, Catálogo, Períodos de turno → todos bajo `/super-admin/*` (eliminar los 4 links muertos a `/branch-admin/*`). Las páginas son finas: solo renderizan el Screen.
- `branch-admin/layout.tsx`: agregar Cajas, Períodos de turno, Inventario; Clientes apunta a la pantalla nueva. Los links a `/cashier/*` ya estaban muertos por el middleware: fuera de alcance.
- **Antes de convertir cada store, `rg` de consumidores** (conteo de sedes en dashboards/layouts, POS, órdenes mock): los ids pasan de mock (`p-1`) a UUID; si algo no convertido depende de la forma mock, mantener esos selectores compatibles o separar el store.

## Mientras el backend no cambie (el front funciona igual)
- Períodos inactivos invisibles → caché local + reactivación por PATCH.
- `GET/PATCH /users` sin alcance por sucursal ni límite de roles → filtros y restricciones en el cliente.
- Sin listado de clientes → lista mock + creados localmente. Sin toggle/ajuste de inventario → no se ofrecen esas acciones.
- Datos que el backend no tiene (código/ciudad/terminales de sede, SKU, imagen, turno asignado, último acceso, reglas extra de variante) → complemento `MOCK-ONLY`.
- Dashboards (KPIs, auditar cajas) → siguen con mock; solo el conteo de sucursales es real.

## Cuando llegue cada cambio de backend (plan del back §4) → qué se simplifica aquí
| Cambio en el backend | Se simplifica en el front |
|---|---|
| **#1** `GET /auth/me` | Nombre y `branchName` reales en login/header; se van el respaldo por email y el texto "Sucursal asignada". |
| **#2** alcance de `/users` + roles | Se quitan el filtro por `branchId`, la restricción de roles y el toggle oculto del lado del cliente. |
| **#3** `GET /branches` con terminales y admin | Terminales y administrador reales en `BranchesScreen`. |
| **#4** `?includeInactive=true` en períodos | Se elimina la caché local de períodos. |
| **#5** `?branchId=` para SA | SA puede usar cajas e inventario (con selector de sucursal). |
| **#7** códigos de error estables | Se elimina el respaldo por `message`. |
| **#12** clientes admin | Listado real; se elimina la lista mock + local. |
| **#15** `adjust` / `dashboard` de inventario | Ajuste de stock con motivo y dashboard en la pantalla de inventario. |

## Verificación
1. Back: `pnpm start:dev` (puerto 4000). Front: `pnpm dev` con `API_PROXY_TARGET` apuntando al back.
2. Login real con el SUPER_ADMIN → `/super-admin`; verificar que `/branch-admin/*` redirige y que no quedan links muertos.
3. SA: crear sucursal → crear usuario ADMIN con esa sucursal → editar/desactivar; probar duplicados (mensaje en español junto al campo).
4. Login ADMIN (`admin1@gmail.com`): períodos (crear/editar/desactivar), cajas (duplicado → `CASH_REGISTER_ALREADY_EXISTS`), producto + variante con `components`, ítems de inventario (presa con `salePrice` y `initialStock`; `salePrice` en INSUMO bloqueado), cliente (CI duplicado), usuarios de su sede.
5. 401 con token vencido → vuelve a `/login`. Confirmar en la red que ningún PATCH envía `null`.
6. Revisión visual en claro/oscuro y ancho móvil (playwright-cli); `pnpm lint` solo sobre archivos tocados, sin sumar errores a los 15 previos. Sin build.
