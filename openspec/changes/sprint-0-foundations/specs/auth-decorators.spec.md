## Purpose

Proveer decoradores de referencia para controlar el acceso a endpoints: @Public() para acceso sin autenticación y @Roles() para restricción por roles específicos.

## ADDED Requirements

### Requirement: Public Access Decorator
El sistema SHALL proporcionar un decorador @Public() que marque endpoints como accesibles sin autenticación.

#### Scenario: Public endpoint access
- **WHEN** un endpoint está decorado con @Public()
- **THEN** puede ser accedido sin proporcionar un token JWT válido
- **AND** el AuthGuard permite la petición continuar hacia el endpoint

#### Scenario: Protected endpoint without decorator
- **WHEN** un endpoint no tiene @Public() ni @Roles()
- **THEN** requiere autenticación válida por defecto
- **AND** el AuthGuard rechaza peticiones sin token JWT

### Requirement: Role-Based Access Decorator
El sistema SHALL proporcionar un decorador @Roles() que restrinja el acceso a endpoints basado en roles de usuario.

#### Scenario: Role-based access granted
- **WHEN** un endpoint está decorado con @Roles(['ADMIN'])
- **AND** el usuario autenticado tiene rol ADMIN
- **THEN** el RolesGuard permite la petición continuar hacia el endpoint

#### Scenario: Role-based access denied
- **WHEN** un endpoint está decorado con @Roles(['ADMIN'])
- **AND** el usuario autenticado tiene rol CAJERA
- **THEN** el RolesGuard rechaza la petición con código 403 Forbidden
- **AND** la respuesta sigue el contrato estándar de error

#### Scenario: Multiple roles allowed
- **WHEN** un endpoint está decorado con @Roles(['ADMIN', 'GERENTE'])
- **AND** el usuario autenticado tiene cualquiera de esos roles
- **THEN** el RolesGuard permite la petición continuar