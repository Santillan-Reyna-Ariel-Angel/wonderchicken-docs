# Prompt — Integración Backend ↔ Frontend (análisis y plan)

> Prompt para iniciar la integración del frontend con el backend. Solo análisis y plan: no modifica código ni documentación. Parte del plan vigente [plan-integracion-front-datos-reales.md](plan-integracion-front-datos-reales.md) y del contrato [technical_guide.md](technical_guide.md).

---

Necesito integrar dos proyectos que ya existen: un backend NestJS y un frontend Next.js. **En esta etapa solo quiero análisis y un plan: no modifiques código ni documentación.**

## Rutas

- **Backend:** `D:\SISTEMAS\wonderchicken-back` (NestJS 11, Prisma 7, pnpm; rama `feature_sprint1_integrate_front`).
- **Frontend:** `D:\SISTEMAS\wonderchicken-front` (Next.js, React, MUI, Zustand, Zod; rama `feature_sprint1_prototype_ui`; hoy funciona 100 % con mocks).
- `docs/` es un subtree compartido: la copia del frontend es la misma que la del backend.

## Objetivo

Que las interfaces actuales del frontend trabajen con **datos reales** del backend. Flujo esperado:

`Backend → API → servicio del frontend (api/) → Zustand o hook personalizado → componentes → UI`

El backend es la **fuente de verdad** (lógica de negocio, validaciones y contratos). El frontend solo consume, guarda en el estado y renderiza, con validaciones básicas de interacción. No calcula precios ni totales, no filtra por seguridad y no inventa reglas.

## Documentos a leer (rutas reales)

Punto de partida, **en este orden**:

1. `docs/backend/plan-integracion-front-datos-reales.md` — el plan de integración vigente (estado, contrato que debe respetar el front, pasos 1 a 4, pantallas, verificación, decisiones).
2. `docs/backend/technical_guide.md` — contrato del API: §5.1 endpoints, §5.2 auth y roles, §5.3 a §5.5 sobre de respuesta y errores, §5.6 alcance por rol y sucursal, §6 request/response por módulo.
3. `docs/business/pdr.md` y `docs/business/requirements.md` — reglas de negocio y requerimientos.
4. `docs/backend/implementation_guide.md` — qué está hecho, qué falta por sprint y la deuda técnica (§10).
5. `docs/frontend/frontend_code_style.md` y `docs/frontend/frontend_interfaces_sprint1.md` — convenciones y estructura del frontend.
6. Apoyo: `docs/swagger-postman/swagger.json` y la colección de Postman (versionados; pueden diferir del código).

Estos documentos se actualizaron y contrastaron con el código el 2026-10-05, pero **siguen siendo secundarios**: si algo contradice al código, gana el código y hay que reportarlo.

## Prioridad de fuentes (si hay conflicto)

1. Código real del backend (controllers, DTOs, services, `prisma/schema.prisma`, `src/common/errors/error-codes.ts`).
2. Código real del frontend.
3. `pdr.md` y `requirements.md` (negocio).
4. `technical_guide.md` e `implementation_guide.md` (técnico backend).
5. `frontend_code_style.md` y `frontend_interfaces_sprint1.md` (frontend).
6. Swagger / Postman (apoyo).

## Qué hacer

**A. Backend (por endpoint).** Para cada endpoint **implementado** (hay 50; la lista está en `technical_guide §5.1`), verificar leyendo el código: roles, parámetros de ruta y query, body, cuáles son obligatorios u opcionales, validaciones del DTO, forma exacta de `data`, códigos de error propios y el alcance por rol y sucursal. Contrastarlo con `technical_guide §6` y reportar solo las diferencias. Los endpoints futuros (Sprints 2 a 5) **no** se analizan: solo se listan.

**B. Frontend.** Inventariar por feature (`src/features/*`), rutas (`src/app/**`), `src/lib/domain/types.ts`, `src/lib/mocks`, stores, `*.api.ts`, `middleware.ts` y componentes: qué datos consume cada pantalla, de qué mock sale cada dato, y qué se puede mantener tal cual.

**C. Contraste.** Por cada pantalla: qué endpoint la alimenta, qué campos del tipo de dominio **sí** vienen del API, cuáles no (`MOCK-ONLY`) y qué ajuste mínimo hace falta. Verificar también que el estado real del front coincide con lo que afirma `plan-integracion-front-datos-reales.md §1 y §4`.

**D. Plan de integración.** Confirmar o corregir el plan existente, sin rehacerlo. Debe cubrir: base de API (cliente HTTP, proxy en `next.config.ts`, mapa `error.code → español`), login real con `GET /auth/me`, middleware con JWT, patrón por feature (tipos → schema Zod → `api` → store → pantalla), orden de conversión de pantallas (el de las **fases** de arriba) y verificación manual por fase. Si el análisis muestra que el orden de las fases debe cambiar por una dependencia real, proponerlo y justificarlo.

## Estrategia: fases en orden lógico (primero los maestros, después lo que cruza datos)

La integración se implementa **por fases**, y cada fase deja el front funcionando antes de empezar la siguiente. **Primero** se crean las interfaces de CRUD de las **tablas maestras** (no dependen de otras pantallas y producen los datos que el resto necesita); **después** las interfaces que **cruzan datos** (usan varios maestros a la vez y generan datos operativos). El orden dentro de cada fase sigue las dependencias reales del modelo: nada se construye antes de lo que referencia.

**Fase 0 — Base de API** (sin pantallas nuevas): cliente HTTP, proxy en `next.config.ts`, mapa `error.code → español`, login real, `GET /auth/me` y middleware con JWT. Es prerrequisito de todo lo demás.

**Fase 1 — CRUD de tablas maestras** (el administrador configura el negocio, en orden de dependencia):

1. Sucursales (`/super-admin/branches`) — raíz de todo lo que es local por sucursal.
2. Usuarios y roles (`PersonnelScreen`) — dependen de la sucursal.
3. Períodos de turno — catálogo global, lo necesita la apertura de turno.
4. Cajas registradoras — dependen de la sucursal.
5. Productos y variantes (`CatalogScreen`) — globales; los necesita el POS.
6. Inventario: ítems, ajuste de stock y dashboard — local por sucursal.
7. Clientes, administración (`ClientsScreen`) — globales; el POS los consulta.

**Fase 2 — Interfaces que cruzan datos** (operación diaria, usan los maestros de la Fase 1), solo con lo que el backend ya implementa:

1. Apertura de turno (cajera): cruza caja + período + usuario.
2. POS: cruza productos, variantes, cliente, turno y crea el pedido (pagado o pendiente).
3. Pedidos pendientes, historial y detalle de pedido: pagar y cancelar pendientes.
4. Panel de despacho: lectura de `GET /orders`; los estados `READY`/`DELIVERED` dependen del Sprint 4.

**Fase 3 — Lo que depende de sprints pendientes del backend** (se planifica, no se implementa ahora): cierre de turno, gastos, vales, descuentos, reportes (Sprint 3); vistas públicas, impresión y despacho completo (Sprint 4); auditoría (Sprint 5); dashboard con KPIs (al final). Cada una se conecta cuando el backend entregue su sprint, según `plan-integracion-front-datos-reales.md §3`.

Para cada fase, el plan debe indicar: pantallas, endpoints, archivos a crear o modificar, qué queda `MOCK-ONLY`, criterio de "listo" y qué verificar a mano antes de pasar a la siguiente.

## Restricciones

- **Cambios mínimos en el frontend:** no tocar apariencia, estilos, colores, estructura visual ni la arquitectura. No eliminar componentes, columnas, campos, botones ni modales. Si el backend no tiene un dato, se completa con un mapper y un complemento local marcado `// MOCK-ONLY`.
- No cambiar el backend para acomodar al frontend. Si hace falta un cambio de backend, **proponerlo aparte** como discrepancia.
- Respetar las decisiones vigentes (`plan-integracion §5`): alcance por sucursal, usuarios por rol, dashboard de KPIs y token de renovación aplazados.
- Reglas del proyecto: sin tests ni `*.spec.ts` hasta cerrar V1; **no ejecutar build**; código y comentarios técnicos en inglés, textos de UI en español; responder en español.
- No hacer commits ni push.

## Entregables

1. **Tabla de discrepancias** con columnas: *Área · Qué dice la fuente A · Qué hace el código · Gravedad (bloquea / ajuste / cosmético) · Propuesta · Quién cambia (front, back o doc)*. Ordenada por gravedad.
2. **Matriz pantalla → endpoint:** ruta del front, componente, endpoints que consume, campos reales vs `MOCK-ONLY`, ajuste mínimo, y si depende de un Sprint pendiente del backend.
3. **Plan de integración por fases** (Fase 0 a Fase 3, primero maestros y luego pantallas que cruzan datos), con archivos a crear o modificar, orden y criterio de "listo" de cada fase.
4. **Lista de preguntas abiertas** que necesiten decisión mía antes de implementar (haz las preguntas de una en una).
