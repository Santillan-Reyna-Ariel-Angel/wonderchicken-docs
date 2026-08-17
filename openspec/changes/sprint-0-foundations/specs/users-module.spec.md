## Purpose

Proveer un módulo completo de gestión de usuarios que permita a los administradores crear, leer, actualizar y listar usuarios en el sistema, incluyendo control de roles y estado activo/inactivo.

## ADDED Requirements

### Requirement: Create User Endpoint
El sistema SHALL proporcionar un endpoint para crear nuevos usuarios con asignación de rol y estado inicial.

#### Scenario: Successful user creation by admin
- **WHEN** se envía una petición POST a /api/v1/users con datos válidos (email, password, role) por un usuario autenticado con rol ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 201
- **AND** la respuesta sigue el contrato estándar { isSuccess: true, message: <string>, data: { user: <objeto usuario> }, error: null }
- **AND** el usuario creado tiene el email proporcionado, el rol asignado y está activo por defecto
- **AND** la contraseña se almacena hasheada usando bcryptjs

#### Scenario: User creation with duplicate email
- **WHEN** se envía una petición POST a /api/v1/users con un email que ya existe en el sistema
- **THEN** el sistema devuelve un código de estado HTTP 400
- **AND** la respuesta sigue el contrato estándar de error indicando que el email ya está registrado

#### Scenario: User creation without admin privileges
- **WHEN** se envía una petición POST a /api/v1/users por un usuario sin rol ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 403
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: Get Users List Endpoint
El sistema SHALL proporcionar un endpoint para listar usuarios con filtros opcionales.

#### Scenario: Successful users list retrieval
- **WHEN** se envía una petición GET a /api/v1/users por un usuario autenticado con rol ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta sigue el contrato estándar { isSuccess: true, message: <string>, data: { users: [<arreglo de usuarios>], total: <number> }, error: null }
- **AND** cada usuario en la lista incluye id, email, role y estado activo/inactivo (pero nunca la contraseña)

#### Scenario: Users list with role filter
- **WHEN** se envía una petición GET a /api/v1/users?role=ADMIN por un usuario autenticado con rol ADMIN
- **THEN** el sistema devuelve solo los usuarios con rol ADMIN
- **AND** la respuesta incluye el conteo correcto de usuarios filtrados

#### Scenario: Users list without admin privileges
- **WHEN** se envía una petición GET a /api/v1/users por un usuario sin rol ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 403
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: Get Single User Endpoint
El sistema SHALL proporcionar un endpoint para obtener los detalles de un usuario específico.

#### Scenario: Successful single user retrieval
- **WHEN** se envía una petición GET a /api/v1/users/{id} por un usuario autenticado con rol ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta sigue el contrato estándar { isSuccess: true, message: <string>, data: { user: <objeto usuario> }, error: null }
- **AND** el usuario devuelto incluye id, email, role y estado activo/inactivo (pero nunca la contraseña)

#### Scenario: Single user retrieval not found
- **WHEN** se envía una petición GET a /api/v1/users/{id} con un id que no existe
- **THEN** el sistema devuelve un código de estado HTTP 404
- **AND** la respuesta sigue el contrato estándar de error

#### Scenario: Single user retrieval without admin privileges
- **WHEN** se envía una petición GET a /api/v1/users/{id} por un usuario sin rol ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 403
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: Update User Endpoint
El sistema SHALL proporcionar un endpoint para actualizar los datos de un usuario existente (rol, estado activo/inactivo).

#### Scenario: Successful user role update
- **WHEN** se envía una petición PATCH a /api/v1/users/{id} con cambios de rol por un usuario autenticado con rol ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta sigue el contrato estándar { isSuccess: true, message: <string>, data: { user: <objeto usuario actualizado> }, error: null }
- **AND** el usuario actualizado tiene el nuevo rol pero mantiene su id y email

#### Scenario: Successful user activation/deactivation
- **WHEN** se envía una petición PATCH a /api/v1/users/{id} para cambiar el estado activo/inactivo por un usuario autenticado con rol ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta sigue el contrato estándar de éxito
- **AND** el usuario actualizado refleja el nuevo estado activo/inactivo

#### Scenario: Update user without admin privileges
- **WHEN** se envía una petición PATCH a /api/v1/users/{id} por un usuario sin rol ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 403
- **AND** la respuesta sigue el contrato estándar de error

#### Scenario: Update non-existent user
- **WHEN** se envía una petición PATCH a /api/v1/users/{id} con un id que no existe
- **THEN** el sistema devuelve un código de estado HTTP 404
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: Password Security
El sistema SHALL asegurar que las contraseñas nunca se expongan en respuestas o logs.

#### Scenario: Password never returned in responses
- **WHEN** se consulta cualquier endpoint de usuarios (lista, individual, creación, actualización)
- **THEN** la respuesta nunca incluye el campo de contraseña ni su hash
- **AND** el campo de contraseña solo se usa internamente para autenticación

#### Scenario: Password hashing storage
- **WHEN** se crea o actualiza una contraseña de usuario
- **THEN** se almacena únicamente el hash generado por bcryptjs
- **AND** nunca se almacena la contraseña en texto plano