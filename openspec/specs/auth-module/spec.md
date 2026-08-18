## Purpose

Proveer un módulo completo de autenticación que permita a los usuarios iniciar sesión y cerrar sesión, gestionando tokens JWT y sesiones de turno según los requisitos de negocio.

## Requirements

### Requirement: User Login Endpoint
El sistema SHALL proporcionar un endpoint para autenticar usuarios y devolver un token JWT válido.

#### Scenario: Successful login with correct credentials
- **WHEN** se envía una petición POST a /api/v1/auth/login con username y contraseña válidos de un usuario activo
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta sigue el contrato estándar { isSuccess: true, message: <string>, data: { accessToken: <string> }, error: null }
- **AND** el accessToken es un JWT válido que contiene la información del usuario (sub: id, username, role)

#### Scenario: Failed login with incorrect password
- **WHEN** se envía una petición POST a /api/v1/auth/login con username válido pero contraseña incorrecta
- **THEN** el sistema devuelve un código de estado HTTP 401
- **AND** la respuesta sigue el contrato estándar de error con mensaje indicando credenciales inválidas

#### Scenario: Failed login with non-existent user
- **WHEN** se envía una petición POST a /api/v1/auth/login con username que no existe en el sistema
- **THEN** el sistema devuelve un código de estado HTTP 401
- **AND** la respuesta sigue el contrato estándar de error con mensaje indicando credenciales inválidas

#### Scenario: Login with inactive user
- **WHEN** se envía una petición POST a /api/v1/auth/login con username y contraseña válidos pero usuario inactivo
- **THEN** el sistema devuelve un código de estado HTTP 401
- **AND** la respuesta sigue el contrato estándar de error indicando que la cuenta está inactiva

### Requirement: User Logout Endpoint
El sistema SHALL proporcionar un endpoint para cerrar sesión que invalide la sesión actual del usuario.

#### Scenario: Successful logout
- **WHEN** se envía una petición POST a /api/v1/auth/logout con un token JWT válido en el header Authorization
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta sigue el contrato estándar { isSuccess: true, message: <string>, data: null, error: null }
- **AND** la sesión asociada al token se marca como inválida (para implementación futura de sesión única por turno)

#### Scenario: Logout without token
- **WHEN** se envía una petición POST a /api/v1/auth/logout sin token JWT válido
- **THEN** el sistema devuelve un código de estado HTTP 401
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: Password Validation with Bcrypt
El sistema SHALL utilizar bcryptjs para comparar contraseñas hasheadas durante el proceso de autenticación.

#### Scenario: Password comparison using bcrypt
- **WHEN** se intenta autenticar un usuario
- **THEN** el sistema compara la contraseña proporcionada con el hash almacenado usando bcrypt.compare()
- **AND** solo si la comparación es exitosa se procede a generar el token JWT
