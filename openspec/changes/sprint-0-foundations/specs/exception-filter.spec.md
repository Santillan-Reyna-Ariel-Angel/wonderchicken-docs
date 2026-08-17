## Purpose

Proveer un filtro global de excepciones que asegure que todas las respuestas de error cumplan con el contrato estándar de respuesta { isSuccess, message, data, error } con códigos de error estables.

## ADDED Requirements

### Requirement: Global Exception Handling
El sistema SHALL interceptar todas las excepciones no capturadas y transformarlas en respuestas que cumplan el contrato estándar.

#### Scenario: Error response format
- **WHEN** ocurre una excepción no capturada en cualquier endpoint
- **THEN** el HttpExceptionFilter la captura y transforma la respuesta
- **AND** la respuesta sigue el formato { isSuccess: false, message: <string>, data: null, error: <objeto> }
- **AND** el código de estado HTTP corresponde al tipo de excepción (ej. 400 para BadRequestException)

#### Scenario: Known exception types
- **WHEN** se lanza una NotFoundException
- **THEN** la respuesta tiene isSuccess: false, message con descripción del error, data: null, error con detalles
- **AND** el código de estado HTTP es 404

#### Scenario: Validation exceptions
- **WHEN** ocurre una ValidationException por DTO inválido
- **THEN** la respuesta incluye detalles de los campos que fallaron validación
- **AND** el código de estado HTTP es 400 (Bad Request)

### Requirement: Stable Error Codes
El sistema SHALL usar códigos de error estables y predecibles para facilitar el manejo de errores en el frontend.

#### Scenario: Error code consistency
- **WHEN** se producen errores del mismo tipo en diferentes momentos
- **THEN** los códigos de error HTTP son consistentes
- **AND** el frontend puede confiar en estos códigos para mostrar mensajes apropiados

#### Scenario: Error categorization
- **WHEN** es un error de cliente (4xx)
- **THEN** el mensaje es seguro para mostrar al usuario final
- **AND** cuando es un error de servidor (5xx)
- **THEN** el mensaje es genérico para no exponer detalles internos