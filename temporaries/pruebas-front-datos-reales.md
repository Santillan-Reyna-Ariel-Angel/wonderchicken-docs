# Pruebas desde el front con datos reales

> **Temporal.** Fecha: 2026-10-06. Contexto: cierre del Sprint 1 (integración del front con el API real). Se puede borrar cuando el front deje de tener pantallas con mocks.
> Verificado contra el código del front (rama `feature-test-cruds`) y el seed del backend. Todas las cuentas usan la contraseña `password123`.

## Pantallas que se pueden probar con datos reales

### Super Admin (`superadmin@gmail.com`)

- **Sucursales** (`/super-admin/branches`): listar, crear, editar y activar/desactivar.
- **Personal** (`/super-admin/users`): listar, crear (los 4 roles, incluido COOK), editar y activar/desactivar. Los campos turno, horas y último acceso son falsos.
- **Catálogo** (`/super-admin/products`): crear y editar productos y variantes, y activar/desactivar. Código SKU, imagen, reglas y badges son falsos.
- **Cajas** (`/super-admin/cash-registers`), **Períodos** (`/super-admin/shift-periods`), **Inventario** (`/super-admin/inventory`) y **Clientes** (`/super-admin/customers`): CRUD completo.
- **Inventario**: además alta con stock inicial, ajuste con motivo (`/adjust`) y edición de precio de venta en presas.
- **Clientes**: además ver el historial de pedidos del cliente.

### Admin de sucursal (`admin1@gmail.com`)

Las mismas pantallas bajo `/branch-admin/*`: Cajas, Períodos, Inventario, Clientes, Productos y Personal.

### Cajera (`cajera1@gmail.com`): flujo completo de venta

1. **Apertura de turno** (`/cashier/shift/open`): períodos y cajas reales. Si ya hay un turno abierto, lo recupera.
2. **POS** (`/cashier/pos`):
   - Menú real y pedido real (pagado o pendiente), con el total que devuelve el backend.
   - Cliente por búsqueda exacta de CI o NIT.
   - Sustituciones de papa, arroz o smiles.
3. **Pendientes** (`/cashier/pending`): cobrar y cancelar contra el API.
4. **Historial** (`/cashier/orders`): listado real y detalle.

### Despachadora (`despachadora1@gmail.com`)

Panel de comandas (`/dispatcher`): lee pedidos reales y se refresca cada 15 s.

## Qué NO probar (sigue con datos falsos o no hecho)

- **Cliente de la cajera** (`/cashier/customers`): mock local, porque el API no le deja listar clientes.
- **Dashboards:** KPIs inventados ("Bs. 2.450", "Bs. 4.820"). Los listados de sucursales sí vienen del API.
- **Cierre de turno** y **resumen de turno** (`/cashier/shift/summary`, `/branch-admin/reports`): cierre local, sin backend (Sprint 3).
- **Reportes del Super Admin:** solo dice "Disponible próximamente".
- **Despacho:** "Marcar Listo", "Entregar" y "Avisar" solo muestran "Disponible próximamente"; "Cancelar" avisa que solo la cajera puede.
- **Vista pública** (`/order/[token]`): mock.
- **POS:** "V. Custom" (venta custom), descuentos, efectivo recibido y cambio, y factura no se guardan.
- **Cocinero** (`cocinero1@gmail.com`): el backend le da acceso a inventario, pero el front no tiene pantalla para ese rol.

## Pruebas útiles a provocar a propósito

- **Errores de validación en español:** CI o NIT duplicado, caja duplicada, `salePrice` en un insumo.
- **Roles:** entrar a una ruta de otro rol y confirmar que el middleware redirige.

## Sin confirmar

- Cuánto de los listados de los dashboards viene del API (solo se vio que los KPIs son valores fijos).
