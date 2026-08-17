## Purpose

Proveer guards de autenticación y autorización que protejan los endpoints según los requisitos de seguridad del negocio.

## ADDED Requirements

### Requirement: JWT Authentication Guard
El sistema SHALL validar la presencia y validez de tokens JWT en las peticiones entrantes.

#### Scenario: Valid token allows access
- **WHEN** una petición incluye un header Authorization con un token JWT válido
- **THEN** el AuthGuard permite que la petición continúe hacia el endpoint
- **AND** el usuario autenticado está disponible en el contexto de la petición

#### Scenario: Missing token results in 401
- **WHEN** una petición no incluye el header Authorization
- **THEN** el AuthGuard lanza una UnauthorizedException
- **AND** la respuesta tiene código de estado HTTP 401

#### Scenario: Invalid token results in 401
- **WHEN** una petición incluye un header Authorization con un token JWT inválido o expirado
- **THEN** el AuthGuard lanza una UnauthorizedException
- **AND** la respuesta tiene código de estado HTTP 401

### Requirement: Role-Based Authorization Guard
El sistema SHALL verificar que el usuario autenticado tenga los roles requeridos para acceder a un endpoint.

#### Scenario: Correct role allows access
- **WHEN** un endpoint requiere rol 'ADMIN' mediante @Roles(['ADMIN'])
- **AND** el usuario autenticado tiene rol ADMIN
- **THEN** el RolesGuard permite que la petición continúe hacia el endpoint

#### Scenario: Incorrect role results in 403
- **WHEN** un endpoint requiere rol 'ADMIN' mediante @Roles(['ADMIN'])
- **AND** el usuario autenticado tiene rol 'CAJERA'
- **THEN** el RolesGuard lanza una ForbiddenException
- **AND** la respuesta tiene código de estado HTTP 403

#### Scenario: No roles decorator requires authentication only
- **WHEN** un endpoint no tiene decorador @Roles() pero sí requiere autenticación
- **AND** el usuario está autenticado con cualquier rol válido
- **THEN** el RolesGuard permite que la petición continúe (solo verifica autenticación)