# Plan: turnos para cada rol (cajera, despachadora, cocinero) y formulario de períodos de turno

> **Fecha:** 2026-10-06 · **Rama:** `feature-test-cruds` · **Fuentes:** [pdr.md](../business/pdr.md) §2.7, §13.3 · [requirements.md](../business/requirements.md) FR-008b, FR-017 · [technical_guide.md](../backend/technical_guide.md) §6.x · [implementation_guide.md](../backend/implementation_guide.md) §10 (decisión 24) · `swagger.json` · `prisma/schema.prisma` del backend.

## Índice

1. [Pregunta y respuesta corta](#1-pregunta-y-respuesta-corta)
2. [Qué dicen el PDR y el backend](#2-qué-dicen-el-pdr-y-el-backend)
3. [Estado de los endpoints por sprint](#3-estado-de-los-endpoints-por-sprint)
4. [Formulario de períodos de turno (admin): ya existe y calza](#4-formulario-de-períodos-de-turno-admin-ya-existe-y-calza)
5. [Qué se puede hacer ahora y qué espera al backend](#5-qué-se-puede-hacer-ahora-y-qué-espera-al-backend)
6. [Plan](#6-plan)
7. [Decisiones abiertas](#7-decisiones-abiertas)

## 1. Pregunta y respuesta corta

**¿La despachadora y el cocinero deberían elegir el turno al loguearse?**

**No, según el PDR y el backend.** El turno es una **sesión de caja que abre la cajera**; nadie más "elige turno" al entrar. Lo que cambia es la necesidad del **cocinero**: tiene que saber **a qué turno anota** sus registros. Eso **no es un selector al loguearse**, sino un campo dentro de sus formularios, y su contrato está **abierto** (decisión 24, Sprint 2). La despachadora no necesita turno.

**¿El admin puede crear turnos con sus horarios?** Sí, y **el formulario ya está construido y alineado** con el endpoint (ver §4).

## 2. Qué dicen el PDR y el backend

| Tema | Fuente | Qué dice |
| ---- | ------ | -------- |
| El turno es de caja | PDR §2.6; `Shift` en `schema.prisma` | `Shift` tiene `cashierId`, `cashRegisterId`, `openingAmount`, `startAt/endAt` y el `period`. Lo abre la cajera con `POST /shifts/open` |
| Quién confirma el período | PDR §13.3 | Se confirma **al abrir la caja**, con preselección sugerida **editable**. **No es atributo del usuario**: "el personal rota días, turnos y roles (caso real: Valeria trabaja unos días de mañana y otros de noche)" |
| No se infiere por hora | PDR §13.3 | **Descartado** decidir el período con el reloj: "eso solo lo sabe el catálogo de turnos" |
| Sesiones por turno | PDR §2.7, FR-008b | "Dentro del mismo turno, un usuario solo puede tener **1 sesión activa con 1 rol**." Es una **restricción**, no un selector. Entra en el **Sprint 5** |
| Despachadora | PDR §2.7 | "Ver la cola de comandas, marcar pedidos como listo y entregado." No menciona turno |
| Cocinero | PDR §2.3, §2.7, FR-017 | Anota **al cierre de su turno** consumos manuales y ciclo crudo, ligados al `Shift` (`DailyManualConsumption.shiftId`, `ShiftChickenLog.shiftId`) |
| Cómo sabe el cocinero el turno | `technical_guide` §6.9; `implementation_guide` decisión 24 | **Abierta, a cerrar antes del Sprint 2.** Propuesta: `shiftId` explícito en el body, "la cocina elige entre los turnos abiertos de su sucursal", validado contra su sucursal |
| Horarios de los turnos | `schema.prisma` `ShiftPeriod` | `referenceStart` / `referenceEnd` son un horario **de referencia informativo: "NO clasifica nada"** |

## 3. Estado de los endpoints por sprint

| Endpoint | Roles | Estado |
| -------- | ----- | ------ |
| `GET /shifts/shift-periods` | `CASHIER`, `ADMIN` (+ `SUPER_ADMIN`, que pasa todos los guards) | ✅ (admite `?includeInactive=true`) |
| `POST /shifts/shift-periods` | `ADMIN` (+ `SUPER_ADMIN`) | ✅ |
| `PATCH /shifts/shift-periods/:id` | `ADMIN` (+ `SUPER_ADMIN`) | ✅ |
| `POST /shifts/open`, `GET /shifts/active` | `CASHIER` | ✅ |
| `POST /shifts/close` | `CASHIER` | 🔲 Sprint 3 |
| `POST /inventory/manual-consumption` | `COOK` | 🔲 Sprint 2 |
| `GET/POST /inventory/shift-chicken-log`, `.../:shiftId/close` | `COOK` | 🔲 Sprint 2 |
| **Listar turnos abiertos de la sucursal** (lo que el cocinero necesitaría para elegir) | `COOK` | **No existe ni figura en el contrato.** `GET /shifts/active` es solo de la cajera |
| Sesión única por turno (FR-008b) | todos | 🔲 Sprint 5 |

Conclusión: ni el cocinero ni la despachadora pueden hoy consultar turnos (`GET /shifts/*` no admite `COOK` ni `DISPATCHER`). Habilitarles una elección de turno requiere **trabajo del backend primero**.

## 4. Formulario de períodos de turno (admin): ya existe y calza

Pantalla `ShiftPeriodsScreen` + `ShiftPeriodFormModal` (rutas `/super-admin/shift-periods` y `/branch-admin/shift-periods`). Comparado con `CreateShiftPeriodDto` / `UpdateShiftPeriodDto`:

| Campo del contrato | Obligatorio | En el formulario | Alineado |
| ------------------ | ----------- | ---------------- | -------- |
| `name` | sí (crear) | "Nombre \*" | ✅ |
| `displayOrder` | sí (crear) | "Orden \*" (entero ≥ 1, sugiere el siguiente) | ✅ |
| `referenceStart` | no | "Inicio (referencia)", campo de hora | ✅ |
| `referenceEnd` | no | "Fin (referencia)", campo de hora | ✅ |
| `active` (solo `PATCH`) | no | Switch de la tabla (con confirmación al desactivar) | ✅ |

- Al editar solo se envía lo que cambió y las horas vacías se mandan como `null` (el contrato lo permite).
- El listado usa `includeInactive=true`, así que el admin puede reactivar períodos.
- El catálogo es **global** (no por sucursal): el aviso de desactivar ya lo dice ("todas las sucursales").

**No hay que cambiar nada para cumplir lo pedido sobre el formulario.**

## 5. Qué se puede hacer ahora y qué espera al backend

| Necesidad | ¿Ahora? | Motivo |
| --------- | ------- | ------ |
| Admin crea/edita turnos con horarios | ✅ ya está | §4 |
| Cajera elige el período al abrir caja | ✅ ya está | `ShiftScreen` usa el catálogo y manda `periodId` |
| Despachadora elige turno | ❌ no corresponde | El PDR no lo pide y no hay endpoint |
| Cocinero elige a qué turno anota | ⏸️ espera | Decisión 24 abierta, y falta el endpoint de turnos abiertos |
| Formularios de cocina (consumos manuales y ciclo crudo) | ⏸️ espera | Los endpoints son Sprint 2 (🔲). Se pueden **diseñar** ya con el contrato previsto (§6) |

## 6. Plan

### Fase 0 — Ahora, sin código nuevo
1. Mantener la pantalla de períodos tal cual (ya alineada).
2. **Cerrar la decisión 24 con el equipo del backend**, porque condiciona al cocinero: ¿turno por `shiftId` en el body? ¿Qué endpoint lista los turnos abiertos de la sucursal y para qué roles?
3. Sugerir al backend: habilitar a `COOK` una lectura de los turnos abiertos de su sucursal (p. ej. `GET /shifts/open` o ampliar `GET /shifts/active`), porque sin eso el selector no puede existir.

### Fase 1 — Cuando el backend entregue el Sprint 2 (cocinero)
Pantalla **Cocina** para `COOK`, con el **selector de turno dentro del formulario** (no al loguearse):

- **Selector "Turno":** lista los turnos abiertos de su sucursal. Si hay uno solo, se preselecciona; si no hay ninguno, se muestra un aviso ("No hay un turno abierto").
- **Formulario de consumos manuales** → `POST /inventory/manual-consumption`: `shiftId` (obligatorio), `entries[]` (mínimo 1) con `inventoryItemId` (obligatorio) y `quantity` (entero ≥ 1, obligatorio). Los ítems son de la sucursal; un consumo que deje stock negativo se rechaza completo (mostrar el error del backend).
- **Formulario del ciclo crudo** → `GET`/`POST /inventory/shift-chicken-log`: una fila por cada una de las 4 presas (`PECHO`, `ALA`, `PIERNA`, `ENTREPIERNA`) con `reprocessRaw` (autopoblado desde el turno anterior, editable), `processedRaw`, `rawLeftover` y `cookedLeftover`, todos enteros ≥ 0. `cooked` se muestra calculado, no se envía.
- **Cierre del ciclo** → `POST .../:shiftId/close`: muestra `sold`, `expectedCookedLeftover` y `discrepancy`; una discrepancia **no bloquea** el cierre.
- Cada formulario usa `AppModal`, validación con Zod que replica el DTO, y la lógica en un store por feature (guía §0.3). Ruta y menú nuevos para el rol `COOK` (hoy `src/app/(protected)` no tiene `cook`).

### Fase 2 — Cuando exista la sesión única por turno (Sprint 5)
Mostrar el error claro de FR-008b al intentar iniciar sesión con otro rol en el mismo turno. Es un mensaje de login, **no un selector**.

## 7. Decisiones abiertas

1. **Decisión 24 (backend):** cómo sabe el cocinero el turno y qué endpoint le lista los turnos abiertos.
2. **Turnos por sucursal (decisión del usuario, 2026-10-06):** cada sucursal debe tener **sus propios turnos**, creados por **su administrador**. Hoy el backend no lo soporta: `ShiftPeriod` **no tiene `branchId`**, el `name` es único **globalmente** y el catálogo es global (`GET /shifts/shift-periods` devuelve el mismo para todas). Para cumplirlo el backend debe: agregar `branchId` a `ShiftPeriod`, hacer el nombre único **por sucursal**, acotar el listado y las altas/ediciones a la sucursal del `ADMIN` (como ya hace con las cajas registradoras y los usuarios), y dejar al `SUPER_ADMIN` indicar la sucursal. **Efecto en el front cuando eso exista:** el formulario no cambia de campos para el `ADMIN` (usa su sucursal); el `SUPER_ADMIN` necesitaría un selector de sucursal, igual que en Cajas y Personal; y el aviso de desactivar deja de decir "todas las sucursales". Hasta entonces, el front queda como está (alineado con el contrato actual).
3. **¿La despachadora necesita ver el turno** (por ejemplo para filtrar la cola por turno)? El PDR no lo pide; si el negocio lo quisiera, habría que agregarlo al contrato.
