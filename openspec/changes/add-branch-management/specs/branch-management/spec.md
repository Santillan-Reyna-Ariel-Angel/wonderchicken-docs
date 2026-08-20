## Purpose

Permitir al SUPER_ADMIN gestionar las sucursales del restaurante (crear, listar, editar y dar de baja), que son el alcance natural de las operaciones multi-sucursal del sistema.

## ADDED Requirements

### Requirement: Create Branch Endpoint
El sistema SHALL proporcionar un endpoint para que el SUPER_ADMIN cree una sucursal con nombre, dirección y estado activo por defecto.

#### Scenario: Successful branch creation by SUPER_ADMIN
- **WHEN** se envía una petición POST a /api/v1/branches con datos válidos (`name`, `address`) por un usuario autenticado con rol SUPER_ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 201
- **AND** la respuesta sigue el contrato estándar `{ isSuccess: true, message: <string>, data: { branch: <objeto sucursal> }, error: null }`
- **AND** la sucursal creada tiene el nombre y dirección proporcionados y `active: true` por defecto

#### Scenario: Branch creation without SUPER_ADMIN privileges
- **WHEN** se envía una petición POST a /api/v1/branches por un usuario autenticado con un rol distinto a SUPER_ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 403
- **AND** la respuesta sigue el contrato estándar de error

#### Scenario: Branch creation with missing required fields
- **WHEN** se envía una petición POST a /api/v1/branches sin `name` o `address`
- **THEN** el sistema devuelve un código de estado HTTP 400
- **AND** la respuesta sigue el contrato estándar de error de validación

### Requirement: List Branches Endpoint
El sistema SHALL proporcionar un endpoint para que el SUPER_ADMIN liste todas las sucursales.

#### Scenario: Successful branches list retrieval
- **WHEN** se envía una petición GET a /api/v1/branches por un usuario autenticado con rol SUPER_ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta sigue el contrato estándar `{ isSuccess: true, message: <string>, data: { branches: [<arreglo de sucursales>] }, error: null }`
- **AND** cada sucursal en la lista incluye `id`, `name`, `address` y `active`

#### Scenario: Branches list without SUPER_ADMIN privileges
- **WHEN** se envía una petición GET a /api/v1/branches por un usuario autenticado con un rol distinto a SUPER_ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 403
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: Update Branch Endpoint
El sistema SHALL proporcionar un endpoint para que el SUPER_ADMIN edite el nombre y/o dirección de una sucursal existente.

#### Scenario: Successful branch update by SUPER_ADMIN
- **WHEN** se envía una petición PATCH a /api/v1/branches/{id} con `name` y/o `address` válidos por un usuario autenticado con rol SUPER_ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta sigue el contrato estándar con la sucursal actualizada
- **AND** los datos pasados de las entidades locales (turnos, cajas, inventario) conservan su `branchId` sin alterarse

#### Scenario: Branch update of non-existent branch
- **WHEN** se envía una petición PATCH a /api/v1/branches/{id} con un `id` que no existe
- **THEN** el sistema devuelve un código de estado HTTP 404
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: Deactivate Branch Endpoint
El sistema SHALL proporcionar un endpoint para que el SUPER_ADMIN dé de baja una sucursal marcándola como inactiva, sin eliminar sus datos.

#### Scenario: Successful branch deactivation by SUPER_ADMIN
- **WHEN** se envía una petición PATCH a /api/v1/branches/{id}/deactivate por un usuario autenticado con rol SUPER_ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la sucursal queda con `active: false`
- **AND** los datos históricos de la sucursal (turnos, cajas, inventario, usuarios) se conservan

#### Scenario: Branch deactivation of non-existent branch
- **WHEN** se envía una petición PATCH a /api/v1/branches/{id}/deactivate con un `id` que no existe
- **THEN** el sistema devuelve un código de estado HTTP 404
- **AND** la respuesta sigue el contrato estándar de error