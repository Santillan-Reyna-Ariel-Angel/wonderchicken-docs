## Purpose

Proveer un servicio Prisma global configurado con el driver adapter pg para conexión a PostgreSQL, siguiendo el patrón establecido en seeders/prisma.ts.

## ADDED Requirements

### Requirement: Prisma Service Connection
El sistema SHALL proporcionar un servicio Prisma que maneje la conexión a PostgreSQL usando el driver adapter pg.

#### Scenario: Successful database connection
- **WHEN** la aplicación se inicia y el PrismaService es inyectado
- **THEN** el servicio establece una conexión a la base de datos PostgreSQL usando el driver adapter pg
- **AND** el servicio expone métodos $connect y $disconnect para manejo explícito de conexiones

#### Scenario: Connection error handling
- **WHEN** ocurre un error al conectar a la base de datos
- **THEN** el servicio lanza una excepción que puede ser capturada por los filtros de excepción globales
- **AND** el error incluye información suficiente para diagnóstico

### Requirement: Global Prisma Service Availability
El sistema SHALL hacer disponible el servicio Prisma de forma global a través de inyección de dependencias.

#### Scenario: Service injection in modules
- **WHEN** cualquier módulo necesita acceder a operaciones de base de datos
- **THEN** puede inyectar PrismaService mediante constructor privado y readonly
- **AND** el servicio está disponible sin necesidad de importaciones adicionales en cada módulo

#### Scenario: Service lifecycle integration
- **WHEN** el módulo Prisma se inicializa
- **THEN** registra el PrismaService como proveedor global
- **AND** el servicio está disponible para todos los módulos que lo importen directa o indirectamente