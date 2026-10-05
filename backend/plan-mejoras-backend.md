# Plan — Mejoras del backend (duplicación, contrato, tipos y entornos)

> **Fecha:** 2026-10-05 · **Estado:** ✅ **ejecutado** (pasos 0 a 6; ver §8) · Rama: `feature_sprint1_integrate_front`
> **Origen:** revisión del backend (2026-10-05) y entrevista de decisiones, una pregunta por vez.
> **Relación con otros planes:** complementa [plan-integracion-front-datos-reales.md](plan-integracion-front-datos-reales.md) (§4: cambios #1 a #16 del backend). Si hay conflicto de orden, manda la sección 5 de este documento.
> **Convención:** el código, los identificadores y las referencias a código en la documentación van en **inglés**; la documentación en sí, en español.

---

## 1. Por qué

La revisión midió, sobre 74 archivos y ~6.200 líneas de `src/`:

| Hallazgo | Medición |
|---|---|
| Respuestas de éxito armadas a mano | 40 literales `{ isSuccess: true, ... }`, 38 mensajes distintos |
| Errores de negocio sin código estable | 37 de 72 salen como `"Bad Request"` / `"Not Found"` |
| `resolveUserBranchId()` | 4 copias **idénticas** (cash-registers, inventory, orders, shifts) |
| `@Transform` para recortar texto | 33, todos con la misma lógica (2 variantes) |
| `orders.service.create()` | 226 líneas en un solo método |
| Errores de lint de `src/` | 22, todos `no-unsafe-*` |
| `@ApiResponse` sin tipo de `data` | 123 (ninguno declara `type`) |
| Swagger en producción | `/api/docs` y `/swagger.json` públicos, con emails de usuarios del seed y `password123` |

Además se detectó que el `AuthGuard` **no consulta la base**: un usuario desactivado con un token vigente sigue operando hasta que el token vence (2 h en `development`, 8 h en `production`).

---

## 2. Decisiones

| # | Tema | Decisión |
|---|---|---|
| 1 | Respuesta de éxito | Helper explícito `ok(message, data)`. Devuelve `{ isSuccess: true, message, data, error: null }`. |
| 2 | Contrato final | **Errores como la guía** (`details` = array `[{ field, message }]`); **éxito como el código** (`error: null`, 38 de 38 respuestas hoy). Se corrige la guía. |
| 3 | Excepción de negocio | Una clase `BusinessException` con `code` obligatorio. |
| 4 | Códigos de error | Catálogo central `ErrorCode`. |
| 5 | Status HTTP | Lo declara el catálogo (cada código tiene su status). `BusinessException` no recibe `status`. Un decorador `@ApiErrors(...)` genera los `@ApiResponse` desde el mismo catálogo. |
| 6 | Sucursal del usuario | El `AuthGuard` resuelve el usuario **una vez por request** (existe, está activo, sucursal vigente) y la deja en `request.user`. Los services leen `actor.branchId`. |
| 7 | Dividir `orders.create()` | Pasos con nombre dentro del módulo (métodos privados y funciones puras en `orders.helpers.ts`). Sin clases nuevas ni DI nueva. |
| 8 | Red de seguridad | Script de "foto" de la API en `scripts/api-snapshot/`. No es Jest ni `*.spec.ts`; se puede convertir en E2E real al cerrar V1. |
| 9 | Tipos de éxito en Swagger | Incremental por módulo, empezando por los que consume el front. Decorador genérico `@ApiOkEnvelope(Dto)`. Los endpoints nuevos nacen tipados. |
| 10 | Swagger en producción | Oculto en `production`. Variable `SWAGGER_ENABLED_PRODUCTION` para encenderlo a propósito. El archivo en `docs/` se escribe solo en `development`. |
| 11 | Superadmin en producción | `bootstrap:admin` se niega con `APP_ENV=production` si `SUPER_ADMIN_CI` falta, es la de por defecto (`password123`) o es corta. |
| 12 | Idioma | Código y referencias a código en docs: inglés. Lo nuevo y lo que se toca se escribe en inglés, sin traducción masiva. La documentación de `docs/` sigue en español. |

Sin decisión (mecánicos): decorador `Trim()`, los 22 errores de lint, extraer `setupSwagger()`.

---

## 3. Diseño resultante

### 3.1 Contrato de respuesta

```jsonc
// Success (as the code already emits it)
{ "isSuccess": true, "message": "Caja creada correctamente", "data": { "cashRegister": {} }, "error": null }

// Error (as the guide specifies)
{
  "isSuccess": false,
  "message": "Error de validación",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [{ "field": "name", "message": "..." }]
  }
}
```

- Los errores de validación (`ValidationPipe`) se convierten a `details` con el nombre del campo mediante un `exceptionFactory` (hoy salen como `{ fields: string[] }`, sin saber qué campo falló).
- Los errores de negocio de un solo campo (`{ name }`, `{ ci }`, `{ type }`) pasan a `[{ field, message }]`. Los que no corresponden a un campo llevan `details: []`.

### 3.2 Catálogo y excepción

```ts
// src/common/errors/error-codes.ts: the single source of truth
export const ERRORS = {
  CASH_REGISTER_NOT_FOUND:      { status: 404, message: 'Caja registradora no encontrada' },
  CASH_REGISTER_ALREADY_EXISTS: { status: 400, message: 'Ya existe una caja con ese nombre' },
  ORDER_ALREADY_PAID:           { status: 409, message: 'El pedido ya está pagado' },
} as const satisfies Record<string, { status: number; message: string }>;
export type ErrorCode = keyof typeof ERRORS;

// service
throw new BusinessException({ code: 'CASH_REGISTER_NOT_FOUND' });
// controller: Swagger and Postman come from the same catalog
@ApiErrors('CASH_REGISTER_NOT_FOUND')
```

**Por qué el status sale del catálogo:** hoy se lanzan 75 errores (400×44, 404×20, 403×5, 409×4, 401×2) y el 41 % no es 400. Swagger y Postman **no detectan** un status equivocado: la colección de Postman tiene 123 respuestas de ejemplo, idénticas una por una a los 123 `@ApiResponse` escritos a mano. Con un `400` por defecto, olvidar el status de un "no encontrado" lo convertiría en 400 sin aviso. Ya hay deriva hoy: `shifts.controller.ts` lanza 409 y no lo documenta.

### 3.3 Sucursal y usuario activo

```ts
// auth.guard.ts: once per request
const user = await prisma.user.findUnique({
  where: { id: payload.sub },
  select: { active: true, branchId: true, role: true },
});
if (!user?.active) throw new BusinessException({ code: 'USER_INACTIVE' }); // 401
request.user = { ...payload, branchId: user.branchId };

// service: no query, no copy
const { branchId } = actor;
```

- Una sola creación de pedido resuelve hoy la sucursal al menos 2 veces; `pay`, `cancel`, `findById` y `list` repiten la consulta.
- `SUPER_ADMIN` tiene `branchId: null`: los services que lo necesiten responden con un error del catálogo (relacionado con el cambio #5 del plan de integración: `?branchId=` solo para SA).
- Costo: 1 consulta por clave primaria por request autenticado, despreciable con PostgreSQL local.

### 3.4 `orders.create()` como receta

```ts
async create(dto, actor) {
  assertPaymentConsistency(dto);                                   // pure
  const shift = await this.shiftsService.findActiveForUserOrThrow(actor);
  validateSubstitutions(dto.items);

  const orderId = await this.prisma.$transaction(async (tx) => {
    const products = await this.loadSellableProducts(tx, dto.items);
    const variants = await this.loadVariants(tx, dto.items);
    const rows     = priceItems(dto.items, products, variants);    // pure
    const customer = await this.resolveCustomerName(tx, dto.customerId);
    const order    = await this.persistOrder(tx, { dto, shift, actor, rows, customer });
    await this.persistItems(tx, order.id, rows);
    // Sprint 2: await this.inventory.decrementForOrder(tx, rows);
    await this.auditSale(tx, /* ... */);
    return order.id;
  });
  return this.findById(orderId, actor);
}
```

La guía ya planifica sumar a esta transacción el descuento de inventario (Sprint 2) y la validación de descuentos por ítem (Sprint 3): el método iba a crecer a ~300 líneas. Cada paso nuevo será una línea más en la receta.

### 3.5 Swagger por entorno

| Valor | development | qa | production |
|---|---|---|---|
| `/api/docs` y `/swagger.json` | sí | sí | **no** (salvo `SWAGGER_ENABLED_PRODUCTION=true`) |
| Escribir `docs/swagger-postman/swagger.json` al arrancar | sí | no | no |

**Por qué ocultarlo en producción:** Swagger no es una vulnerabilidad por sí mismo (la protección real es la autenticación y los roles), pero entrega el reconocimiento hecho: lista cada ruta, campo, regla y rol (por ejemplo, anuncia que `POST /users` acepta `role`, justo la brecha del cambio #2). Y hoy publica los emails del seed y `password123`. Como `pnpm bootstrap:admin` crea `superadmin@gmail.com` con `password123` si nadie define `SUPER_ADMIN_CI`, el documento público podría anunciar el usuario y la clave de un SUPER_ADMIN (de ahí la decisión 11). Quitar solo la descripción no alcanza: el email y la clave también están en el **esquema** y en los ejemplos del body del login, que se fijan al cargar el código. Ocultar Swagger es más simple y seguro que depurar el documento.

El front y Postman trabajan con el `swagger.json` **versionado** en `docs/swagger-postman/`, no con el del servidor, así que en producción la interfaz no aporta nada.

---

## 4. Red de seguridad: foto de la API

Los cambios tocan casi todos los endpoints y el proyecto no tiene tests (regla de `AGENTS.md`: se hacen al cerrar V1). Para este caso excepcional se usa un script, no Jest:

- `scripts/api-snapshot/` con 3 archivos chicos: la lista de endpoints, la normalización (ids, fechas, tokens, número de pedido) y el comparador.
- Contra la base **sembrada** (`pnpm seed`) y la API levantada, se loguea por rol, recorre ~40 endpoints y guarda **status + forma** de cada respuesta.
- La **línea base se commitea antes de cualquier refactor**; después de cada paso se corre de nuevo y las diferencias son exactamente lo que cambió. Las esperadas se revisan una por una y se actualiza la base a propósito.
- No valida reglas de negocio: solo detecta cambios.

**Por qué no un E2E real ahora:** necesita una base de pruebas **separada** (el seed borra la base de desarrollo) y una configuración de Jest en ESM que no está comprobada; además la forma de las respuestas va a cambiar de todos modos.

---

## 5. Orden de ejecución

Un commit por paso. La foto después de cada uno.

| Paso | Qué | Diferencias esperadas en la foto |
|---|---|---|
| 0 | Script de foto y línea base (**antes de tocar nada**) | — |
| 1 | `Trim()` y los 22 errores de lint (tipar `orders.helpers.ts`, `current-user.decorator.ts`, extraer `setupSwagger()` con handler tipado) | Ninguna |
| 2 | `ErrorCode`, `BusinessException`, filtro, `exceptionFactory` del `ValidationPipe` y `ok()`, **módulo por módulo** (un commit por módulo). Actualizar la guía §5.3 y §5.4 | `details` como array y los 37 códigos nuevos |
| 3 | `AuthGuard` con sucursal y usuario activo; eliminar las 4 copias de `resolveUserBranchId` | Solo los usuarios desactivados reciben 401 |
| 4 | Dividir `orders.create()` | **Cero** |
| 5 | `@ApiOkEnvelope` y `@ApiErrors`, módulo por módulo (primero los que consume el front: branches, users, cash-registers, shifts, products, variants, inventory, customers; después orders, pos, auth) | Ninguna en runtime; la colección de Postman gana respuestas |
| 6 | Swagger por entorno (`SWAGGER_ENABLED_PRODUCTION`), escritura en `docs/` solo en development, guard de `bootstrap:admin` en producción | Ninguna en development |

Durante todos los pasos: lo nuevo y lo que se toca se escribe (y sus comentarios se traducen) en inglés.

### Interacción con el plan de integración (§4)

| Cambio del plan de integración | Efecto |
|---|---|
| #7 (códigos de error estables) | **Absorbido** por el paso 2 |
| #5 (`?branchId=` para SA) y #2 (alcance de `/users`) | Van **después** del paso 3: el guard les da el rol y la sucursal vigentes |
| #1, #4, #3, #12, #15 | Se implementan con los patrones nuevos: errores del catálogo y respuestas tipadas desde el primer día |

### Impacto en el front

El formato de `error.details` cambia (de objeto `{ fields: string[] }` a array `[{ field, message }]`): hay que ajustar el mapa de errores del plan del front (`docs/frontend/plan-front-cruds-feature-test-cruds.md`, paso 1) para usar el nombre del campo en los formularios.

---

## 6. Archivos nuevos o modificados (estimado)

- **Nuevos:** `src/common/errors/error-codes.ts`, `src/common/errors/business.exception.ts`, `src/common/http/api-result.ts` (`ok()`), `src/common/swagger/api-ok-envelope.decorator.ts`, `src/common/swagger/api-errors.decorator.ts`, `src/common/decorators/trim.decorator.ts`, `src/common/swagger/setup-swagger.ts`, `scripts/api-snapshot/*`.
- **Modificados:** `http-exception.filter.ts`, `main.ts` (`exceptionFactory`, `setupSwagger`), `auth.guard.ts`, `src/config/app.config.ts` (perfil `swagger`), `scripts/bootstrap-superadmin.ts`, los 12 services y controllers, los DTOs con `@Transform`, `technical_guide.md` §5.3 y §5.4.

---

## 7. Decisiones que siguen pendientes

1. ~~Si un ADMIN puede crear otro ADMIN~~ — **resuelto**: no. SUPER_ADMIN crea cualquier rol; ADMIN solo CASHIER, DISPATCHER y COOK de su sucursal; `branchId` sigue siendo obligatorio para todo rol salvo SUPER_ADMIN (sin repositorio global de empleados) y el traslado es solo de SUPER_ADMIN.
2. ~~Si se hacen `branches-summary` (#16) y el toggle de inventario (#6)~~ — **resuelto**: #6 hecho; #16 postergado, el dashboard (datos resumen) es lo último que se hace en la aplicación.
3. **Tokens de 2 h en `development`:** con turnos de 7 horas y sin renovación, la cajera se desloguea unas 3 veces por turno. En producción serán 8 h. **Decidido: más adelante se hará un token de renovación** (token de acceso corto + token de renovación, que además emite el nuevo token con los datos frescos). Mientras tanto, para trabajar sin cortes en local alcanza con `JWT_EXPIRES_IN=8h` en el `.env`. Pendiente de diseñar: dónde se guarda el token de renovación, su vida útil y cómo se revoca.
4. **Decidido: se define cuando se cambie a QA o producción.** Si el front llama directo al API hay que fijar `CORS_ORIGINS` (sin eso, `qa` y `production` no aceptan ningún origen externo); si pasa por el proxy de Next no hace falta.
5. `PrismaService` todavía lee `DATABASE_URL` de `process.env` directamente; migrarlo a la configuración validada.

---

## 8. Ejecución (2026-10-05)

Los pasos 0 a 6 están hechos, en la misma rama. Después de cada uno se corrió la foto (`pnpm seed` + `pnpm api:snapshot`) y las diferencias fueron exactamente las esperadas. Los pasos 1, 3, 4, 5 y 6 terminaron sin diferencias de runtime salvo las previstas.

| Paso | Resultado |
|---|---|
| 0 | `scripts/api-snapshot/` (4 archivos) y línea base de 109 pasos. Para que fuera reproducible hubo que corregir `chance()` del seeder, que usaba `Math.random()` y rompía el `faker.seed(42)`. |
| 1 | `@Trim()` reemplaza 32 `@Transform`; lint de `src/` de 22 errores a 0; `setupSwagger()` extraído. |
| 2 | `ERRORS`, `BusinessException`, `ok()`, `exceptionFactory` y filtro simplificado. Los 81 `throw` y los 40 literales de éxito migrados; el formato viejo se eliminó del filtro. Guía §5.3 y §5.4 actualizadas. |
| 3 | `AuthGuard` resuelve usuario activo, rol y sucursal una vez por request. `requireBranchId(actor)` reemplaza las 4 copias. Un usuario desactivado recibe `401 USER_INACTIVE` (verificado a mano). |
| 4 | `orders.create()` pasó de 226 líneas a una receta de ~35; las reglas puras viven en `orders.helpers.ts`. Foto: cero diferencias. |
| 5 | `@ApiOkEnvelope` y `@ApiErrors` en los 10 controllers; 10 entidades de respuesta; la colección de Postman pasó de 123 a 169 respuestas de ejemplo y sigue siendo determinística. |
| 6 | `SWAGGER_ENABLED_PRODUCTION`; Swagger oculto en producción y `swagger.json` solo se reescribe en `development`; `bootstrap:admin` se niega en producción con CI faltante, por defecto o de menos de 12 caracteres. Verificado levantando la app en cada entorno. |

### Desviaciones respecto del plan

- **Commits por lote, no por módulo** en los pasos 2 y 5 (el catálogo `error-codes.ts` es un solo archivo compartido). Hay un commit por lote de módulos.
- **Un código, un status.** Se encontró que `CASH_REGISTER_NOT_FOUND`, `SHIFT_PERIOD_NOT_FOUND`, `PRODUCT_NOT_FOUND` y `VARIANT_NOT_FOUND` salían con **404** cuando el id va en la URL y con **400** cuando va en el body (`POST /shifts/open`, `POST /orders`, `POST /variants`). Como el catálogo asigna un solo status por código, se adoptó la convención `X_NOT_FOUND` (URL, 404) / `X_REFERENCE_NOT_FOUND` (body, 400). **Ningún status HTTP cambió.**
- ```@UseGuards(AuthGuard)``` se quitó de `POST /auth/logout`: el guard ya es global y se ejecutaría dos veces.
- `GET /orders`, `POST /orders/:id/pay` y `/cancel` documentan el status que **realmente** devuelven (201, no 200).

### Cambios de códigos que afectan al front

| Antes | Ahora |
|---|---|
| `error.details` = `{ fields: [...] }` o `{ name: "..." }` | siempre un array `[{ field, message }]` (vacío si no hay campo) |
| `POST /shifts/open`: `SHIFT_PERIOD_NOT_FOUND`, `CASH_REGISTER_NOT_FOUND` | `SHIFT_PERIOD_REFERENCE_NOT_FOUND`, `CASH_REGISTER_REFERENCE_NOT_FOUND` |
| `POST /orders`: `PRODUCT_NOT_FOUND`, `VARIANT_NOT_FOUND`, `CUSTOMER_NOT_FOUND` | `PRODUCT_REFERENCE_NOT_FOUND`, `VARIANT_REFERENCE_NOT_FOUND`, `CUSTOMER_REFERENCE_NOT_FOUND` |
| 401: `Unauthorized` | `INVALID_CREDENTIALS`, `TOKEN_REQUIRED`, `TOKEN_INVALID`, y nuevo `USER_INACTIVE` |
| 404 sin código (`Not Found`) en branches, users, orders, turnos | `BRANCH_NOT_FOUND`, `USER_NOT_FOUND`, `ORDER_NOT_FOUND`, `SHIFT_NOT_FOUND` |
| `Bad Request` en duplicados de users y productos | `USER_EMAIL_ALREADY_EXISTS`, `USER_CI_ALREADY_EXISTS`, `USER_PHONE_ALREADY_EXISTS`, `DUPLICATE_PRODUCT_NAME` |
| `Bad Request`/`Forbidden` genéricos | `BAD_REQUEST` (ids con formato inválido) y `FORBIDDEN` |

La lista completa y vigente es `src/common/errors/error-codes.ts`.

### Hallazgos que NO se tocaron (fuera del alcance del plan)

1. ~~`POST /shifts/open` no valida que la cajera ya tenga un turno abierto~~ — **corregido después**: ahora responde `409 SHIFT_ALREADY_OPEN` (una cajera, un turno abierto a la vez).
2. **Un pedido creado ya pagado queda con `paidAt: null`**; solo `/pay` lo completa.
3. **`POST /orders/:id/pay` y `/cancel` responden 201** en vez de 200 (falta `@HttpCode(200)`; el Swagger anterior decía 200). Corregirlo cambia el status que ve el front.
4. `AuditService.log` lanza `BadRequestException` ante una acción desconocida: es un error de programación, no del cliente; debería ser un `Error` (500).
5. El ejemplo de `pnpm api:snapshot` necesita `pnpm seed` antes de cada corrida (los pasos crean y modifican filas).

### Después de la ejecución: alcance de usuarios y pedidos (cambio #2)

- `POST/GET/PATCH /users` y `toggle-active` respetan el rol y la sucursal de quien llama. Fuera de alcance responde **404** (no se revela que existe); asignar un rol o sucursal no permitido responde **403** (`ROLE_NOT_ALLOWED`, `BRANCH_OUT_OF_SCOPE`).
- Traslado o cambio de rol con un turno abierto: **409** `USER_HAS_OPEN_SHIFT`.
- Arreglados: `PATCH ci` ahora actualiza la CI (y la contraseña, que es la CI); `phone: null` borra el teléfono; `branchId: null` ya no da 500; `null` en campos obligatorios da 400.
- Se quitó el código `USER_TOGGLE_NOT_ALLOWED`: un ADMIN que apunta a un ADMIN o SUPER_ADMIN ahora recibe `USER_NOT_FOUND`.
- `GET /orders` y `GET /orders/:id` ya no dejan al ADMIN ver otras sucursales (solo SUPER_ADMIN).

### Después de la ejecución: `GET /auth/me` e inventario (cambios #1 y #6)

- `GET /auth/me` devuelve el perfil fresco desde la base (`branchName` incluido) para cualquier rol.
- `PATCH /inventory/items/:id/toggle-active` (ADMIN, de su sucursal): el negocio no borra, desactiva.

### Después de la ejecución: alcance de SUPER_ADMIN, períodos y sucursales (cambios #5, #4 y #3)

- **#5.** Cajas e inventario: el SUPER_ADMIN usa `?branchId=` (opcional; sin él ve todas las sucursales) y manda `branchId` en el body al crear (obligatorio: `BRANCH_REQUIRED`; sucursal inexistente: `BRANCH_REFERENCE_NOT_FOUND`). Edita y activa/desactiva en cualquier sucursal. Un rol de sucursal que nombre otra recibe 403 `BRANCH_OUT_OF_SCOPE`. La lógica vive en `src/common/auth/branch-scope.ts` (`readableBranchId`, `resolveWriteBranchId`, `assertBranchExists`).
- **#4.** `GET /shifts/shift-periods?includeInactive=true` (default sin cambios; la cajera nunca ve inactivos). Un valor que no sea `true`/`false` da 400; lo mismo vale ahora para `?active=` en inventario (antes `?active=abc` se leía como `false`).
- **#3.** `GET /branches` agrega `cashRegistersCount` y `admin` por sucursal. Se expone como `cashRegistersCount` y no como el `_count` de Prisma, para no filtrar detalles del ORM al contrato.

### Después de la ejecución: clientes administrativos (cambio #12)

- `GET /customers` (ADMIN) con búsqueda libre, estado, fechas de alta y paginación; `GET /customers/:id`, `PATCH /customers/:id` (sin `ci` ni `nit`), `PATCH /customers/:id/toggle-active` y `GET /customers/:id/orders`.
- La cajera nunca ve ni edita un cliente desactivado; el ADMIN sí.
- **Excepción deliberada al alcance por sucursal:** el historial de pedidos de un cliente (`/customers/:id/orders`) trae los de **todas** las sucursales y es solo para ADMIN, porque el PDR §2.12 define la vista del administrador sobre el cliente como cross-sucursal. Cada pedido indica su sucursal.
- Paginación común en `src/common/http/pagination-query.dto.ts` (`?page=&pageSize=`, máximo 100), reutilizable por las listas que vengan.
- Los rechazos de `forbidNonWhitelisted` ("property x should not exist") ahora salen en español.

### Después de la ejecución: ajuste y dashboard de inventario (cambio #15)

- `POST /inventory/adjust`: movimiento manual con motivo (`ADJUSTMENT` o `RECEPTION`) y nota obligatoria; no deja el stock en negativo; stock, libro y auditoría en una transacción.
- `GET /inventory/dashboard`: stock cocido por tipo de presa y variación desde la apertura del turno.
- **Decisión de diseño tomada sin consulta y fácil de cambiar:** la ventana del delta empieza en el turno **abierto más antiguo** de la sucursal (no por cajera). Es una regla de lectura, así que cambiarla no toca datos.
- **`PATCH /inventory/:id/sale-price` no se creó:** `PATCH /inventory/items/:id` ya acepta `salePrice`. Si el front prefiere una ruta propia, es un alias de una línea.
- **Sigue pendiente (Sprint 2, fuera de #15):** que pagar un pedido descuente el inventario (`decrementForOrder`, la línea que la receta de `orders.create()` ya deja prevista), los consumos manuales y el ciclo crudo. Hasta entonces, `sold` del dashboard solo refleja lo que ya está en el libro.
