## Purpose

Permitir al administrador gestionar el catálogo de productos y variantes del menú (crear y listar) que consume el POS, manteniendo los productos como entidades globales compartidas entre sucursales.

## ADDED Requirements

### Requirement: Create Product Endpoint
El sistema SHALL proporcionar un endpoint que permita al administrador crear un producto del catálogo.

#### Scenario: Successful product creation by ADMIN
- **WHEN** se envía una petición POST a /api/v1/products con datos válidos (`name`, `basePrice`, `category`, opcionalmente `description`, `isSellable`, `isInventoryItem`) por un usuario autenticado con rol ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 201
- **AND** la respuesta sigue el contrato estándar `{ isSuccess: true, message: <string>, data: { product: <objeto producto> }, error: null }`
- **AND** el producto queda persistido con `active: true` por defecto
- **AND** el producto es visible de inmediato en el POS para cajeras autenticadas

#### Scenario: Product creation with duplicate name
- **WHEN** se envía una petición POST a /api/v1/products con un `name` que ya existe en el catálogo
- **THEN** el sistema devuelve un código de estado HTTP 400
- **AND** la respuesta sigue el contrato estándar de error con código estable `DUPLICATE_PRODUCT_NAME`

#### Scenario: Product creation with invalid basePrice
- **WHEN** se envía una petición POST a /api/v1/products con `basePrice` menor o igual a 0 o con más de 2 decimales
- **THEN** el sistema devuelve un código de estado HTTP 400
- **AND** la respuesta sigue el contrato estándar de error de validación

#### Scenario: Product creation without ADMIN privileges
- **WHEN** se envía una petición POST a /api/v1/products por un usuario autenticado con rol distinto a ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 403
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: List Active Products Endpoint
El sistema SHALL exponer un listado de productos activos con sus variantes activas, consumido por el POS y el panel de administración.

#### Scenario: Successful products list retrieval by ADMIN
- **WHEN** se envía una petición GET a /api/v1/products por un usuario autenticado con rol ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la respuesta sigue el contrato estándar `{ isSuccess: true, message: <string>, data: { products: [<arreglo con id, name, basePrice, category, description, active, isSellable, isInventoryItem, variants: [<arreglo de variantes activas>]>] }, error: null }`

#### Scenario: Successful products list retrieval by CASHIER
- **WHEN** se envía una petición GET a /api/v1/products por un usuario autenticado con rol CASHIER
- **THEN** el sistema devuelve un código de estado HTTP 200
- **AND** la lista incluye solo productos con `active: true` e `isSellable: true`
- **AND** cada producto incluye solo sus variantes con `active: true`

#### Scenario: Products list without authentication
- **WHEN** se envía una petición GET a /api/v1/products sin token válido
- **THEN** el sistema devuelve un código de estado HTTP 401
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: Create Variant Endpoint
El sistema SHALL permitir al administrador crear una variante asociada a un producto existente, declarando sus componentes como estructura JSON.

#### Scenario: Successful variant creation by ADMIN
- **WHEN** se envía una petición POST a /api/v1/variants con datos válidos (`productId`, `name`, `components` como arreglo con al menos un elemento, opcionalmente `isDefault`) por un usuario autenticado con rol ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 201
- **AND** la respuesta sigue el contrato estándar con la variante creada
- **AND** la variante queda persistida con `active: true` por defecto
- **AND** la variante queda visible de inmediato en el POS al listar el producto padre

#### Scenario: Variant creation with non-existent product
- **WHEN** se envía una petición POST a /api/v1/variants con un `productId` que no existe
- **THEN** el sistema devuelve un código de estado HTTP 400
- **AND** la respuesta sigue el contrato estándar de error con código estable `PRODUCT_NOT_FOUND`

#### Scenario: Variant creation without ADMIN privileges
- **WHEN** se envía una petición POST a /api/v1/variants por un usuario autenticado con rol distinto a ADMIN
- **THEN** el sistema devuelve un código de estado HTTP 403
- **AND** la respuesta sigue el contrato estándar de error

### Requirement: Product Catalog Is Global
El sistema SHALL tratar los productos y variantes como entidades globales compartidas por todas las sucursales (sin `branchId` propio); la asignación por sucursal se materializa en Sprint 2 al crear `InventoryItem`.

#### Scenario: Product created by ADMIN of any branch
- **WHEN** un ADMIN de cualquier sucursal crea un producto vía POST /api/v1/products
- **THEN** el producto queda disponible para cajeras de TODAS las sucursales
- **AND** el POS de cualquier sucursal autenticada lo incluye en `GET /pos/context`

### Requirement: Substitution Has No Price Effect
El sistema SHALL validar que las sustituciones definidas en variantes y/o ítems de pedido nunca alteran el precio del plato (regla [PDR §2.1](../../../../../docs/business/pdr.md#21-precios-y-sustituciones)).

#### Scenario: Variant with substitution component
- **WHEN** se crea una variante con un componente de tipo `acompanamiento` cuyo `name` es `mixto` y se incluye en el POS
- **THEN** la cajera puede sustituirlo por `arroz`, `papa` o `smiles` desde el POS
- **AND** el precio del plato se mantiene igual independientemente de la sustitución elegida

### Requirement: Contract Response for Product and Variant
El sistema SHALL devolver todos los payloads de productos y variantes respetando el contrato estándar definido en [tech guide §5.3](../../../../../docs/backend/technical_guide.md#53-estructura-de-respuesta-estándar) y los ejemplos de los contratos §6.1 y §6.2.

#### Scenario: Product response shape
- **WHEN** el sistema responde a POST /api/v1/products o GET /api/v1/products
- **THEN** cada `product` en `data` expone `id`, `name`, `basePrice`, `category`, `description`, `active`, `isSellable`, `isInventoryItem`
- **AND** los montos se serializan con 2 decimales en formato numérico (no string)

#### Scenario: Variant response shape
- **WHEN** el sistema responde a POST /api/v1/variants
- **THEN** la `variant` en `data` expone `id`, `productId`, `name`, `components`, `isDefault`, `active`
- **AND** `components` se devuelve como el mismo arreglo JSON recibido en el DTO