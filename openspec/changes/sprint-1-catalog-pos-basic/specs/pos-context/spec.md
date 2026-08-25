## Purpose

Proveer un endpoint único y liviano que cargue el contexto necesario para el POS de la cajera (catálogo de productos/variantes, períodos de turno y turno activo), cumpliendo el principio de "una llamada" para reducir latencia y llamadas en hora pico. Crece en sprints posteriores con descuentos (Sprint 3) y piece prices custom (Sprint 2).

## ADDED Requirements

### Requirement: Get Pos Context Endpoint
El sistema SHALL exponer un endpoint que devuelva en una sola llamada los datos necesarios para inicializar la pantalla del POS de la cajera autenticada.

#### Scenario: Successful pos context retrieval
- **WHEN** un usuario autenticado con rol CASHIER envía GET a /api/v1/pos/context
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta sigue el contrato estándar `{ isSuccess: true, message: <string>, data: { products, shiftPeriods, shift }, error: null }`

#### Scenario: Pos context product shape
- **WHEN** el sistema arma la sección `products` del contexto
- **THEN** incluye solo productos con `active: true` e `isSellable: true`
- **AND** cada producto expone `id`, `name`, `basePrice`, `category`, `description?` y un arreglo `variants` solo con las variantes activas
- **AND** cada variante expone `id`, `name`, `components`, `isDefault`

#### Scenario: Pos context shiftPeriods shape
- **WHEN** el sistema arma la sección `shiftPeriods`
- **THEN** expone el catálogo completo de períodos activos ordenados por `displayOrder` ascendente

#### Scenario: Pos context shift shape
- **WHEN** el sistema arma la sección `shift`
- **THEN** expone el turno activo del cajera autenticado en su sucursal (objeto con `id`, `lastOrderNumber`, `startAt`, `cashier` resumido, `cashRegister` resumido, `period` resumido) o `null` si no hay turno abierto
- **AND** no es un error carecer de turno activo; el front puede mostrar la pantalla de apertura

#### Scenario: Pos context without CASHIER privileges
- **WHEN** un usuario sin rol CASHIER intenta acceder al contexto POS
- **THEN** el sistema devuelve un código de estado HTTP 403
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: Pos Context Excludes Historical Data
El sistema SHALL incluir solo datos activos y vigentes en el contexto POS, omitiendo históricos (órdenes pasadas, turnos cerrados, etc.).

#### Scenario: Only active products and variants
- **WHEN** el sistema arma el contexto
- **THEN** la respuesta es liviana (no incluye órdenes históricas, ni descuentos inactivos, ni períodos inactivos)
- **AND** el tamaño del payload se mantiene en pocos KB incluso con catálogos grandes (≤ 50 productos y variantes)

### Requirement: Pos Context Is Single Source
El sistema SHALL diseñar el endpoint `GET /api/v1/pos/context` como la única fuente para inicializar el POS en V1; el front NO debe combinar otros endpoints para armar la pantalla inicial.

#### Scenario: Single call suffices
- **WHEN** el POS arranca (login o refresh)
- **THEN** una única llamada a `GET /api/v1/pos/context` provee `products`, `shiftPeriods` y `shift`
- **AND** no se requieren llamadas adicionales a `/products`, `/shift-periods` ni `/shifts/active` para pintar la pantalla inicial