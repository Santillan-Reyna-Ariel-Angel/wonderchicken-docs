## Purpose

Permitir a la cajera abrir el turno de caja declarando el período (Mañana/Noche), consultar el catálogo de períodos disponibles y conocer el turno activo de la sesión. El arqueo completo y el cierre administrativo de órdenes llegan en Sprint 3.

## ADDED Requirements

### Requirement: Open Shift Endpoint
El sistema SHALL proporcionar un endpoint para que la cajera abra un turno de caja declarando explícitamente el período del catálogo (sin inferencia del reloj, [PDR §13.3](../../../../../docs/business/pdr.md#133-decisiones-residuales-pendientes-de-cierre-antes-de-v1)).

#### Scenario: Successful shift open by CASHIER
- **WHEN** se envía una petición POST a /api/v1/shifts/open con `{ openingAmount, cashRegisterId, periodId }` válidos por un usuario autenticado con rol CASHIER
- **THEN** el sistema devuelve un código de estado HTTP 201
- **AND** la respuesta sigue el contrato estándar `{ isSuccess: true, message: <string>, data: { shift: <objeto turno con cashier, cashRegister, period, openingAmount, startAt, status: "OPEN"> }, error: null }`
- **AND** el turno queda persistido con `status: OPEN`, `lastOrderNumber: 0`, `branchId` igual al del cajera
- **AND** el `ShiftPeriod.periodId` solicitado queda registrado como atributo del turno (no se calcula desde la hora actual)

#### Scenario: Shift open with non-existent period
- **WHEN** se envía una petición POST a /api/v1/shifts/open con un `periodId` que no existe o está inactivo
- **THEN** el sistema devuelve un código de estado HTTP 400
- **AND** la respuesta sigue el contrato estándar de error con código estable `SHIFT_PERIOD_NOT_FOUND` o `SHIFT_PERIOD_INACTIVE`

#### Scenario: Shift open with non-existent cash register
- **WHEN** se envía una petición POST a /api/v1/shifts/open con un `cashRegisterId` que no existe en la sucursal del cajera
- **THEN** el sistema devuelve un código de estado HTTP 400
- **AND** la respuesta sigue el contrato estándar de error con código estable `CASH_REGISTER_NOT_FOUND`

#### Scenario: Shift open with negative opening amount
- **WHEN** se envía una petición POST a /api/v1/shifts/open con `openingAmount` negativo o cero
- **THEN** el sistema devuelve un código de estado HTTP 400
- **AND** la respuesta sigue el contrato estándar de error de validación

#### Scenario: Shift open without CASHIER privileges
- **WHEN** se envía una petición POST a /api/v1/shifts/open por un usuario autenticado con rol distinto a CASHIER
- **THEN** el sistema devuelve un código de estado HTTP 403
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: List Shift Periods Endpoint
El sistema SHALL exponer el catálogo de períodos disponibles para que la pantalla de apertura de turno muestre las opciones (incluye Mañana/Noche sembrados).

#### Scenario: Successful shift periods list retrieval
- **WHEN** se envía una petición GET a /api/v1/shift-periods por un usuario autenticado con rol CASHIER o ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta sigue el contrato estándar `{ isSuccess: true, message: <string>, data: { periods: [<arreglo con id, name, displayOrder, referenceStart, referenceEnd, active>] }, error: null }`
- **AND** la lista incluye solo períodos con `active: true`, ordenados por `displayOrder` ascendente

#### Scenario: Shift periods list without authentication
- **WHEN** se envía una petición GET a /api/v1/shift-periods sin token válido
- **THEN** el sistema devuelve un código de estado HTTP 401
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: Get Active Shift Endpoint
El sistema SHALL proporcionar un endpoint para que la cajera autenticada consulte su turno actualmente abierto.

#### Scenario: Active shift exists
- **WHEN** la cajera autenticada envía una petición GET a /api/v1/shifts/active y tiene un turno abierto en su sucursal
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta sigue el contrato estándar con el turno activo (incluye `lastOrderNumber` y datos del cajera/caja/período)

#### Scenario: No active shift
- **WHEN** la cajera autenticada envía una petición GET a /api/v1/shifts/active y no tiene un turno abierto
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta sigue el contrato estándar con `data: { shift: null }` (no es un error, es ausencia de turno)
- **AND** el POS puede renderizar la pantalla de apertura sin tratar la ausencia como fallo

### Requirement: Shift Period Declared Not Inferred
El sistema SHALL aceptar el `periodId` enviado por el cliente sin sobrescribirlo ni inferirlo a partir de la hora actual del servidor ([PDR §13.3](../../../../../docs/business/pdr.md#133-decisiones-residuales-pendientes-de-cierre-antes-de-v1)).

#### Scenario: Client-provided period accepted
- **WHEN** el cliente envía un `periodId` válido en POST /api/v1/shifts/open
- **THEN** el turno se persiste con exactamente ese `periodId`
- **AND** el servidor NO sustituye el `periodId` por uno derivado de la hora local

### Requirement: Audit Log on Shift Open
El sistema SHALL registrar una entrada inmutable de auditoría por cada apertura de turno, dentro de la misma transacción que crea el turno ([tech guide §4.3](../../../../../docs/backend/technical_guide.md#43-auditoría--implementación-v1)).

#### Scenario: Audit log created on shift open
- **WHEN** se completa con éxito POST /api/v1/shifts/open
- **THEN** el sistema persiste un `AuditLog` con `entity: "Shift"`, `entityId: <id del turno creado>`, `action: "OPEN_SHIFT"`, `userId: <id del cajera desde JWT>, `shiftId: <id del turno creado>` y `details` con `{ openingAmount, cashRegisterId, periodId }`
- **AND** la inserción del AuditLog ocurre dentro de la misma `prisma.$transaction` que la creación del Shift

### Requirement: Error Code No Active Shift
El sistema SHALL devolver un código de error estable cuando cualquier endpoint dependiente de un turno activo se invoque sin que la cajera tenga uno abierto.

#### Scenario: Order creation without active shift
- **WHEN** la cajera autenticada intenta crear una orden vía POST /api/v1/orders sin tener un turno abierto
- **THEN** el sistema devuelve un código de estado HTTP 409 (o 400 según contrato)
- **AND** la respuesta sigue el contrato estándar de error con código estable `NO_ACTIVE_SHIFT`
- **AND** el mensaje en español explica que debe abrir caja primero