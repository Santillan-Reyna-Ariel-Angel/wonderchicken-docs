## Purpose

Proveer un servicio transversal de auditoría con un único método `log` invocable desde los services de acciones críticas, garantizando atomicidad con la operación principal y semántica append-only sobre la tabla `AuditLog`.

## ADDED Requirements

### Requirement: Audit Service Log Method
El sistema SHALL exponer un `AuditService` con un método `log(tx, { entity, entityId, action, userId, shiftId?, details? })` que persiste una entrada en `AuditLog` dentro de la transacción Prisma proporcionada.

#### Scenario: Successful audit log creation
- **WHEN** un service invoca `auditService.log(tx, ...)` con una transacción Prisma activa y datos válidos
- **THEN** el sistema persiste un nuevo `AuditLog` con `entity`, `entityId`, `action`, `userId`, `shiftId` (opcional), `details` (opcional) y `timestamp` del servidor
- **AND** la inserción usa la misma `tx` Prisma (atomicidad con la operación principal)
- **AND** el `entityId` es un UUID cuando la entidad es persistida (Order, Voucher, InventoryItem, Shift, DiscountAuthorization); para entidades lógicas como Report se usa una clave legible (en Sprint 1 este caso no aplica)

#### Scenario: Audit log persists action verbs from defined set
- **WHEN** se invoca `auditService.log` con `action`
- **THEN** la `action` pertenece al conjunto cerrado definido en [tech guide §4.3](../../../../../docs/backend/technical_guide.md#43-auditoría--implementación-v1) (`CREATE_SALE`, `CANCEL_SALE`, `ADJUST_INVENTORY`, `CREATE_VOUCHER`, `OPEN_SHIFT`, `CLOSE_SHIFT`, `GENERATE_REPORT`, `AUTHORIZE_DISCOUNT`)
- **AND** cualquier otra cadena produce un error controlado en el service que invoca (no se audita con verbos no documentados)

### Requirement: Audit Log Is Append Only
El sistema SHALL tratar la tabla `AuditLog` como append-only: solo permite `INSERT` y `SELECT`; nunca `UPDATE` ni `DELETE`.

#### Scenario: No update path exposed
- **WHEN** cualquier código del backend intenta actualizar o borrar un `AuditLog` existente
- **THEN** no existe endpoint, service method ni helper público que lo permita
- **AND** la inmutabilidad del registro de auditoría queda preservada como valor de prueba

### Requirement: Audit Log Fields Auto Filled
El sistema SHALL completar automáticamente los campos `userId` (del JWT) y `timestamp` (del servidor) en cada `AuditLog`, sin requerir que el invocador los pase.

#### Scenario: User and timestamp auto captured
- **WHEN** se invoca `auditService.log(tx, { entity, entityId, action, details })` sin pasar `userId` ni `timestamp`
- **THEN** el sistema obtiene `userId` del request/contexto autenticado
- **AND** asigna `timestamp` con `@default(now())` de Prisma
- **AND** la entrada persistida tiene ambos campos completos

### Requirement: ShiftId Set From Active Shift
El sistema SHALL asignar el `shiftId` del `AuditLog` desde el turno activo de la sesión cuando la acción crítica ocurre dentro de una sesión de caja; en `OPEN_SHIFT`/`CLOSE_SHIFT` el `shiftId` es el propio turno afectado.

#### Scenario: Audit log during open shift uses its own shiftId
- **WHEN** se ejecuta `OPEN_SHIFT` con éxito
- **THEN** el `AuditLog` correspondiente tiene `shiftId = <id del Shift recién creado>`

#### Scenario: Audit log without active shift
- **WHEN** se ejecuta una acción crítica fuera de un turno abierto (ej. `ADJUST_INVENTORY` en Sprint 2)
- **THEN** el `AuditLog` queda con `shiftId: null`
- **AND** esto permite filtrar acciones administrativas de las de caja sin ventanas horarias

### Requirement: Audit Within Same Transaction
El sistema SHALL ejecutar la inserción del `AuditLog` dentro de la misma `prisma.$transaction` que la operación crítica auditada, garantizando atomicidad.

#### Scenario: Atomic audit and operation
- **WHEN** un service de acción crítica ejecuta su lógica y llama a `auditService.log(tx, ...)` con la `tx` activa
- **THEN** si la transacción completa hace commit, tanto la operación como el audit quedan persistidos
- **AND** si la transacción hace rollback, ninguna de las dos queda persistida
- **AND** no existe flujo donde la acción se grabe pero el audit no (o viceversa)