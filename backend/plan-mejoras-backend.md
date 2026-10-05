# Plan — Mejoras del backend (duplicación, contrato, tipos y entornos)

> **Fecha:** 2026-10-05 · **Estado:** ✅ **ejecutado y verificado** (§1) · Rama: `feature_sprint1_integrate_front`
> **Origen:** revisión del backend (2026-10-05) y entrevista de decisiones, una pregunta por vez.
> **Relación con otros documentos:** complementa [plan-integracion-front-datos-reales.md](plan-integracion-front-datos-reales.md) (§4: cambios #1 a #16 del backend, todos hechos salvo #16). Lo que quedó **pendiente** vive en [implementation_guide.md §10](implementation_guide.md#10-mejoras-del-backend-pendientes-y-decisiones-abiertas).
> **Convención:** el código, los identificadores y las referencias a código en la documentación van en **inglés**; la documentación en sí, en español.

---

## 1. ¿Se cumplió el propósito? Verificación (2026-10-05)

El plan nació de medir problemas concretos del backend. Se **volvieron a medir** sobre el código actual (no se confió en el historial de commits):

| Problema | Antes | Ahora | Cómo se verifica |
|---|---|---|---|
| Respuestas de éxito armadas a mano | 40 literales, 38 mensajes distintos | **0** literales: todo pasa por `ok(message, data)` (47 usos en services) | `rg "isSuccess: true" src` solo da `api-result.ts` |
| Errores de negocio sin código estable | 37 de 72 salían como `"Bad Request"` / `"Not Found"` | **0** excepciones sueltas de Nest en services y guards: 90 `BusinessException`, 58 códigos en un catálogo | `rg "new (BadRequest\|NotFound\|Conflict\|Forbidden\|Unauthorized)Exception" src` |
| `resolveUserBranchId()` | 4 copias idénticas | **0**: `requireBranchId(actor)` lee la sucursal que el guard ya resolvió | `rg resolveUserBranchId src` |
| `@Transform` para recortar texto | 33 | **0** en DTOs; 37 usos de `@Trim()` | `rg "@Transform" src --glob "*.dto.ts"` |
| `orders.create()` | 226 líneas | **41 líneas**, una receta de pasos con nombre | conteo del método |
| Errores de lint de `src/` | 22 | **0** | `pnpm exec eslint "src/**/*.ts"` |
| `@ApiResponse` sin tipo de `data` | 123 | **0** escritos a mano; las **50** operaciones de `swagger.json` tienen su 2xx tipado | `swagger.json` |
| Swagger en producción | público, con los usuarios y la clave del seed | **oculto** salvo `SWAGGER_ENABLED_PRODUCTION=true` | se levantó la app en `production`, `qa` y `development` |
| `AuthGuard` sin consultar la base | un usuario desactivado seguía operando hasta que vencía el token | **`401 USER_INACTIVE`** al instante; rol y sucursal siempre vigentes | prueba manual: desactivar → 401 → reactivar → 200 |

**Resultado: el propósito se cumplió.** Quedan dos excepciones conocidas y deliberadas, ambas anotadas en [implementation_guide.md §10](implementation_guide.md#10-mejoras-del-backend-pendientes-y-decisiones-abiertas):

- `AuditService.log` todavía lanza un `BadRequestException` (es un error de programación, no del cliente; debería ser un `Error`).
- `PrismaService` todavía lee `DATABASE_URL` de `process.env` en vez de la configuración validada.

**Red de seguridad:** `pnpm api:snapshot` (200 pasos) da cero diferencias en corridas consecutivas. La colección de Postman se genera idéntica dos veces seguidas (55 requests, 211 respuestas de ejemplo).

---

## 2. Decisiones

| # | Tema | Decisión |
|---|---|---|
| 1 | Respuesta de éxito | Helper explícito `ok(message, data)`. Devuelve `{ isSuccess: true, message, data, error: null }`. |
| 2 | Contrato final | **Errores como la guía** (`details` = array `[{ field, message }]`); **éxito como el código** (`error: null`). Se corrigió la guía (§5.3 y §5.4). |
| 3 | Excepción de negocio | Una clase `BusinessException` con `code` obligatorio. |
| 4 | Códigos de error | Catálogo central `ERRORS` en `src/common/errors/error-codes.ts`. |
| 5 | Status HTTP | Lo declara el catálogo (cada código tiene **un** status). `BusinessException` no recibe `status`. `@ApiErrors(...)` genera los `@ApiResponse` desde el mismo catálogo. |
| 6 | Usuario, rol y sucursal | El `AuthGuard` consulta la base **una vez por request** (existe, está activo) y deja en `request.user` el **rol y la sucursal vigentes** (los del token se descartan; el token solo aporta `sub`). Los services leen `actor.branchId` con `requireBranchId(actor)`. |
| 7 | Dividir `orders.create()` | Pasos con nombre dentro del módulo (métodos privados y funciones puras en `orders.helpers.ts`). Sin clases nuevas ni DI nueva. |
| 8 | Red de seguridad | Script de "foto" de la API en `scripts/api-snapshot/`. No es Jest ni `*.spec.ts`; se puede convertir en E2E real al cerrar V1. |
| 9 | Tipos de éxito en Swagger | Decorador `@ApiOkEnvelope(message, data, status?)` y entidades de respuesta en `src/<módulo>/entities/`. Los endpoints nuevos nacen tipados. |
| 10 | Swagger en producción | Oculto en `production`; `SWAGGER_ENABLED_PRODUCTION=true` lo enciende a propósito. El archivo en `docs/` se reescribe solo en `development`. |
| 11 | Superadmin en producción | `bootstrap:admin` se niega con `APP_ENV=production` si `SUPER_ADMIN_CI` falta, es la de por defecto (`password123`) o tiene menos de 12 caracteres. |
| 12 | Idioma | Código y referencias a código en docs: inglés. Lo nuevo y lo que se toca se escribe en inglés. La documentación de `docs/` sigue en español. |

### Decisiones tomadas durante la ejecución

| # | Tema | Decisión |
|---|---|---|
| 13 | Un código, un status | `X_NOT_FOUND` = el recurso va en la URL (404); `X_REFERENCE_NOT_FOUND` = va referenciado en el body (400). Ningún status HTTP cambió respecto del comportamiento anterior. |
| 14 | Usuarios por rol y sucursal | SUPER_ADMIN crea cualquier rol; ADMIN solo `CASHIER`, `DISPATCHER` y `COOK` de **su** sucursal. `branchId` sigue siendo obligatorio para todo rol salvo SUPER_ADMIN (**sin** repositorio global de empleados: `null` significa "acceso global" y nada más). Cambiar la sucursal de alguien (traslado) es solo de SUPER_ADMIN. |
| 15 | Un turno, una caja | Una cajera no puede tener dos turnos abiertos (`SHIFT_ALREADY_OPEN`) y una caja no puede estar abierta por dos cajeras (`CASH_REGISTER_IN_USE`). |
| 16 | ADMIN no ve otras sucursales | Ni en usuarios ni en pedidos. Única excepción deliberada: el historial de pedidos de un cliente (PDR §2.12). |
| 17 | `sale-price` | No se crea `PATCH /inventory/:id/sale-price`: `PATCH /inventory/items/:id` ya acepta `salePrice`. |
| 18 | Aplazado | `branches-summary` (#16): el dashboard con datos resumen es lo último que se hace en la aplicación. Token de renovación: más adelante. `CORS_ORIGINS`: al pasar a QA o producción. |

---

## 3. Diseño resultante

### 3.1 Contrato de respuesta

```jsonc
// Success
{ "isSuccess": true, "message": "Caja creada correctamente", "data": { "cashRegister": {} }, "error": null }

// Error
{
  "isSuccess": false,
  "message": "Error de validación",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [{ "field": "items[0].quantity", "message": "..." }]
  }
}
```

- Los errores de validación pasan por `validationExceptionFactory` (`ValidationPipe`): un `{ field, message }` por regla fallida, con la ruta del campo (`items[0].quantity`). El mensaje de nivel superior es el primero.
- Los errores de un solo campo (`{ name }`, `{ ci }`, `{ type }`) también salen como `[{ field, message }]`. Los que no corresponden a un campo llevan `details: []`.
- Los errores que lanza Nest por sí mismo (id con formato inválido, ruta inexistente) salen con un código genérico: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`.

### 3.2 Catálogo y excepción

```ts
// src/common/errors/error-codes.ts: the single source of truth (58 codes)
export const ERRORS = {
  CASH_REGISTER_NOT_FOUND: { status: 404, message: 'Caja registradora no encontrada' },
  ORDER_ALREADY_PAID:      { status: 409, message: 'La orden ya está pagada' },
  // ...
} as const satisfies Record<string, ErrorEntry>;

// service
throw new BusinessException({ code: 'CASH_REGISTER_NOT_FOUND' });
throw new BusinessException({ code: 'CUSTOMER_CI_ALREADY_EXISTS', message: `…"${ci}"`, details: [{ field: 'ci', message: 'CI ya registrada' }] });

// controller: Swagger and Postman come from the same catalog
@ApiErrors('CASH_REGISTER_NOT_FOUND', 'VALIDATION_ERROR')
```

**Por qué el status sale del catálogo:** Swagger y Postman **no detectan** un status equivocado (la colección de Postman repetía uno a uno los `@ApiResponse` escritos a mano). Con un `400` por defecto, olvidar el status de un "no encontrado" lo convertía en 400 sin aviso. Antes del plan, el 41 % de los errores no eran 400.

### 3.3 Usuario, rol y sucursal por request

```ts
// src/common/guards/auth.guard.ts: once per request
const payload = await this.verifyToken(token);               // signature + expiry, or TOKEN_INVALID
const user = await this.prisma.user.findUnique({
  where: { id: payload.sub },
  select: { active: true, role: true, branchId: true },
});
if (!user?.active) throw new BusinessException({ code: 'USER_INACTIVE' }); // 401
request.user = { ...payload, role: user.role, branchId: user.branchId };

// service: no query, no copy
const branchId = requireBranchId(actor);     // USER_WITHOUT_BRANCH for SUPER_ADMIN
```

- Costo: una consulta por clave primaria por request autenticado, despreciable con PostgreSQL local.
- Efecto: desactivar a alguien, cambiarle el rol o trasladarlo aplica **al instante**, sin esperar a que venza el token. El token sigue llevando `sub`, `email`, `role` y `branchId`, pero el guard no los usa para decidir.
- Alcance por sucursal (`src/common/auth/branch-scope.ts`): `readableBranchId(actor, requested?)` para lecturas (SUPER_ADMIN elige con `?branchId=` o ve todas; los demás ven la suya y reciben `BRANCH_OUT_OF_SCOPE` si nombran otra) y `resolveWriteBranchId(prisma, actor, requested?)` para altas (SUPER_ADMIN debe indicar `branchId`; los demás usan la suya).

### 3.4 `orders.create()` como receta

```ts
async create(dto, actor) {
  assertPaymentConsistency(dto);                                   // pure
  requireBranchId(actor);
  const shift = await this.shiftsService.findActiveForUserOrThrow(actor);
  validateSubstitutions(dto.items);                                // pure

  const orderId = await this.prisma.$transaction(async (tx) => {
    const products = await this.loadSellableProducts(tx, dto.items);
    const variants = await this.loadVariants(tx, dto.items);
    const rows     = priceItems(dto.items, products, variants);    // pure
    const total    = rows.reduce((sum, row) => sum + row.totalPrice, 0);
    const customerName = await this.resolveCustomerName(tx, dto.customerId);
    const id = await this.persistOrder(tx, { dto, shiftId: shift.id, actorId: actor.sub, customerName, total });
    await this.persistItems(tx, id, rows);
    // Sprint 2: await this.inventory.decrementForOrder(tx, rows);
    if (dto.paymentStatus === 'PAID') await this.auditSale(tx, { /* ... */ });
    return id;
  });
  return this.findById(orderId, actor);
}
```

La guía ya planifica sumar a esta transacción el descuento de inventario (Sprint 2) y la validación de descuentos por ítem (Sprint 3): cada paso nuevo es una línea más en la receta, no 70 líneas más en un método.

### 3.5 Swagger y archivos de `docs/` por entorno

| Valor | development | qa | production |
|---|---|---|---|
| `/api/docs` y `/swagger.json` | sí | sí | **no** (salvo `SWAGGER_ENABLED_PRODUCTION=true`) |
| Reescribe `docs/swagger-postman/swagger.json` al arrancar | sí | no | no |

**Por qué ocultarlo en producción:** Swagger no es una vulnerabilidad por sí mismo (la protección real es la autenticación y los roles), pero entrega el reconocimiento hecho: lista cada ruta, campo, regla y rol, y los ejemplos traen los usuarios del seed y `password123`. Quitar solo la descripción no alcanza: el email y la clave también están en el **esquema** y en los ejemplos del body del login. Ocultar Swagger es más simple y seguro que depurar el documento. El front y Postman trabajan con el `swagger.json` **versionado** en `docs/swagger-postman/`, no con el del servidor.

### 3.6 Swagger tipado

- `@ApiOkEnvelope('Caja creada correctamente', { cashRegister: CashRegisterEntity }, 201)` describe `data` con el sobre estándar; las clases viven en `src/<módulo>/entities/*.entity.ts` y llevan `example` fijo (`SEED_IDS`, `SEED_TIMESTAMP`) para que la colección de Postman salga **determinística**.
- `@ApiErrors('CODE', …)` agrupa por status y genera un ejemplo por código. `@ApiAuthErrors()` (a nivel de controller) documenta los 401 y el 403 comunes.

---

## 4. Red de seguridad: foto de la API

El proyecto no tiene tests (regla de `AGENTS.md`: se hacen al cerrar V1). Para los refactors de este plan se usó un script, no Jest.

**Cómo funciona** (`scripts/api-snapshot/`: `endpoints.ts`, `normalize.ts`, `compare.ts`, `run.ts` y `baseline.json`):

```bash
pnpm seed                    # datos conocidos (resetea la base)
pnpm start                   # API corriendo
pnpm api:snapshot            # compara con la línea base (sale con 1 si hay diferencias)
pnpm api:snapshot --update   # acepta las respuestas actuales como nueva línea base
```

- Se loguea por cada rol, recorre **200 pasos** y guarda **status + cuerpo normalizado** (ids nuevos, fechas, tokens y números de pedido se reemplazan por marcadores; las listas largas se recortan).
- Los pasos **crean y modifican filas**: hay que correr `pnpm seed` antes de cada corrida. El seed es reproducible (`faker.seed(42)`; se corrigió `chance()`, que usaba `Math.random()`).
- Se niega a correr contra un host que no sea local.
- La línea base se commitea; después de cada cambio las diferencias son **exactamente** lo que cambió y se revisan una por una. No valida reglas de negocio: solo detecta cambios.
- Para agregar un caso: sumar un `step(...)` en `endpoints.ts` (acepta ids guardados por pasos anteriores, como `{branch}`, en la ruta y en el body).

**Por qué no un E2E real ahora:** necesita una base de pruebas **separada** (el seed borra la base de desarrollo) y una configuración de Jest en ESM no comprobada. Al cerrar V1 el script se puede convertir en E2E real.

---

## 5. Ejecución

Las diferencias esperadas se compararon con la foto después de cada paso.

| Paso | Qué | Resultado |
|---|---|---|
| 0 | Script de foto y línea base, **antes de tocar nada** | ✅ |
| 1 | `Trim()`, 22 errores de lint a 0, `setupSwagger()` extraído | ✅ foto sin diferencias |
| 2 | `ERRORS`, `BusinessException`, `ok()`, `exceptionFactory`, filtro simplificado; guía §5.3 y §5.4 | ✅ solo `details` como array y códigos nuevos |
| 3 | `AuthGuard` con usuario activo, rol y sucursal; `requireBranchId` | ✅ solo los desactivados reciben 401 |
| 4 | Dividir `orders.create()` | ✅ cero diferencias |
| 5 | `@ApiOkEnvelope` y `@ApiErrors`, entidades de respuesta | ✅ cero diferencias de runtime; Postman de 123 a 211 respuestas |
| 6 | Swagger por entorno, `docs/` solo en development, guard de `bootstrap:admin` | ✅ verificado levantando la app en cada entorno |

### Desviaciones respecto del plan original

- **Commits por lote, no por módulo** en los pasos 2 y 5 (el catálogo `error-codes.ts` es un solo archivo compartido).
- **La foto creció:** 4 archivos (no 3) y 200 pasos (no ~40). Guarda el cuerpo normalizado, no solo la "forma".
- **Un código, un status** (decisión 13): se encontró que `CASH_REGISTER_NOT_FOUND`, `SHIFT_PERIOD_NOT_FOUND`, `PRODUCT_NOT_FOUND` y `VARIANT_NOT_FOUND` salían con **404** cuando el id va en la URL y con **400** cuando va en el body.
- `@UseGuards(AuthGuard)` se quitó de `POST /auth/logout`: el guard ya es global y se ejecutaba dos veces.
- `GET /orders`, `POST /orders/:id/pay` y `/cancel` documentan el status que **realmente** devuelven (201, no 200).

### Interacción con el plan de integración

Los cambios #1 a #15 del plan de integración se implementaron **sobre** estos patrones (errores del catálogo, respuestas tipadas, alcance por guard) y están todos hechos; #7 quedó absorbido por el paso 2. **#16** (`branches-summary`) se aplazó (decisión 18).

---

## 6. Archivos nuevos o modificados

- **Nuevos, comunes:** `src/common/errors/{error-codes,business.exception}.ts`, `src/common/http/{api-result,error-response.dto,pagination-query.dto}.ts`, `src/common/swagger/{api-ok-envelope.decorator,api-errors.decorator,setup-swagger}.ts`, `src/common/decorators/{trim,to-boolean}.decorator.ts`, `src/common/auth/{require-branch-id,branch-scope}.ts`, `src/common/validation/validation-exception.factory.ts`.
- **Nuevos, por módulo:** `src/<módulo>/entities/*.entity.ts` (entidades de respuesta) y los DTOs de consulta y edición de cada endpoint nuevo.
- **Nuevos, herramientas:** `scripts/api-snapshot/*`.
- **Modificados:** `http-exception.filter.ts` (ahora corto y sin formatos viejos), `main.ts`, `auth.guard.ts`, `roles.guard.ts`, `src/config/app.config.ts` (perfil `swagger`), `src/common/bootstrap/super-admin.ts`, `validation-messages.ts`, todos los services y controllers, y los DTOs con `@Transform`.
- **Docs:** `technical_guide.md` (§5.3, §5.4, endpoints, permisos), `README.md` (variables y tabla por entorno), `sincronizar-swagger-postman.md`, `seeders.md`.

---

## 7. Reglas vigentes de alcance y autorización

Consolidado de lo decidido y probado con la foto (la fuente de verdad es el código; el contrato por endpoint está en `technical_guide.md`).

| Recurso | SUPER_ADMIN | ADMIN | Otros roles |
|---|---|---|---|
| **Usuarios** | cualquier rol y sucursal; único que traslada personal | solo `CASHIER`, `DISPATCHER`, `COOK` **de su sucursal**; lo demás: 404; rol o sucursal no permitidos: 403 | no gestionan usuarios |
| **Sucursales** | todas | — | — |
| **Cajas e inventario** | `?branchId=` (o todas) y `branchId` en el alta; edita cualquier sucursal | su sucursal | `CASHIER` ve las cajas de la suya; `COOK` lee inventario y dashboard de la suya |
| **Pedidos** | todos | **solo los de su sucursal** (403 `ORDER_FROM_OTHER_BRANCH` / lista vacía) | `CASHIER` y `DISPATCHER`: los de su sucursal |
| **Clientes** (globales) | todo | lista, detalle, edición, toggle e historial **cross-sucursal** | `CASHIER`: lookup, alta, detalle y edición, **solo de clientes activos** |
| **Turnos** | — | períodos con `?includeInactive=true` | `CASHIER`: un turno abierto por cajera y una caja por cajera a la vez |

Reglas transversales: fuera de alcance responde **404** (no se revela que existe); asignar algo no permitido responde **403**; un cambio de rol, sucursal o estado aplica **al instante**.

---

## 8. Qué cambia para el front (checklist antes de tocarlo)

El front aún no se modificó. Esto es lo que tiene que adaptar. El detalle por endpoint está en `technical_guide.md` y en `swagger.json`.

**1. Manejo de errores**
- `error.details` es **siempre un array** `[{ field, message }]` (vacío si no hay campo). Antes era `{ fields: [...] }` o `{ name: "..." }`. Usar `field` para marcar el input.
- Decidir por `error.code`, no por el texto. La lista vigente es `src/common/errors/error-codes.ts`.

| Antes | Ahora |
|---|---|
| `POST /shifts/open`: `SHIFT_PERIOD_NOT_FOUND`, `CASH_REGISTER_NOT_FOUND` | `SHIFT_PERIOD_REFERENCE_NOT_FOUND`, `CASH_REGISTER_REFERENCE_NOT_FOUND`; nuevos `SHIFT_ALREADY_OPEN` y `CASH_REGISTER_IN_USE` (409) |
| `POST /orders`: `PRODUCT_NOT_FOUND`, `VARIANT_NOT_FOUND`, `CUSTOMER_NOT_FOUND` | `PRODUCT_REFERENCE_NOT_FOUND`, `VARIANT_REFERENCE_NOT_FOUND`, `CUSTOMER_REFERENCE_NOT_FOUND` |
| 401 `Unauthorized` | `INVALID_CREDENTIALS`, `TOKEN_REQUIRED`, `TOKEN_INVALID`, `USER_INACTIVE` |
| 404 sin código (`Not Found`) | `BRANCH_NOT_FOUND`, `USER_NOT_FOUND`, `ORDER_NOT_FOUND`, `SHIFT_NOT_FOUND` |
| `Bad Request` en duplicados | `USER_EMAIL_ALREADY_EXISTS`, `USER_CI_ALREADY_EXISTS`, `USER_PHONE_ALREADY_EXISTS`, `DUPLICATE_PRODUCT_NAME` |
| `Bad Request` / `Forbidden` genéricos | `BAD_REQUEST` (ids con formato inválido), `FORBIDDEN`, `ROLE_NOT_ALLOWED`, `BRANCH_OUT_OF_SCOPE` |

**2. Sesión**
- `401 USER_INACTIVE` (usuario desactivado) y `TOKEN_INVALID` (vencido) → volver al login.
- Los tokens duran 2 h en `development` y 8 h en `production`; no hay renovación todavía ([implementation_guide.md §10](implementation_guide.md#10-mejoras-del-backend-pendientes-y-decisiones-abiertas)).
- Para el header usar **`GET /auth/me`** (`{ id, firstName, lastName, email, role, branchId, branchName }`) en vez de decodificar el JWT y llamar a `GET /users/:id`.

**3. Restricciones que dejan de ser del cliente**
- El backend ya impone el alcance por rol y sucursal (§7). El front puede **ocultar** acciones como ayuda visual, pero ya no necesita filtrar usuarios por `branchId`, limitar roles ni esconder toggles para que sea correcto.
- SUPER_ADMIN: para cajas e inventario usa un selector de sucursal → `?branchId=` en las listas y `branchId` en el body al crear.

**4. Endpoints nuevos o ampliados que el front puede consumir**
- `GET /auth/me`; `GET /branches` con `cashRegistersCount` y `admin`; `GET /shifts/shift-periods?includeInactive=true`.
- Clientes: `GET /customers` (búsqueda, estado, fechas, paginación), `GET` y `PATCH /customers/:id` (`ci` y `nit` no se editan), `toggle-active` y `GET /customers/:id/orders`.
- Inventario: `PATCH /inventory/items/:id/toggle-active`, `POST /inventory/adjust` y `GET /inventory/dashboard`.
- Paginación común: `?page=&pageSize=` (máximo 100).

**5. Detalles de comportamiento a tener presentes**
- `POST /orders/:id/pay` y `/cancel` responden **201** (no 200).
- Los importes `Decimal` viajan como **string** (`"45"`).
- `?active=abc` y `?includeInactive=abc` dan 400 (antes se leían como `false`).
- Los mensajes de validación de reglas poco comunes pueden salir en inglés ([implementation_guide.md §10](implementation_guide.md#10-mejoras-del-backend-pendientes-y-decisiones-abiertas)).

**6. Documentación del front a actualizar** (no se tocó): `docs/frontend/plan-front-cruds-feature-test-cruds.md` todavía describe como pendientes el alcance de `/users` y la restricción de roles "del lado del cliente" (líneas 64 y 73), y el mapa de errores del paso 1 usa el formato anterior de `details`.
