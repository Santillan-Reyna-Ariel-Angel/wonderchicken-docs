# Requerimientos — Wonder Chicken
**Sistema Informático de Ventas — Requerimientos Funcionales y No Funcionales**
**Complementa:** [docs/pdr.md](pdr.md) (reglas de negocio) y [docs/technical_guide.md](technical_guide.md) (traducción técnica)
**Material de origen:** [docs/business_context.md](business_context.md) (evidencia del trabajo de titulación que alimenta el PDR — citas, menú, inventario, tickets reales)
**Versión:** 1.0
**Fecha:** 2026-06-06

> Este documento concentra los **requerimientos funcionales (FR)** y **no funcionales (NFR de negocio)** del sistema, extraídos del PDR para facilitar su lectura, trazabilidad y uso como base de pruebas (E2E/automáticas).
>
> **Referencias cruzadas:** las menciones a `§2.x`, `§4`, `§13`, etc. apuntan a las secciones del [PDR](pdr.md) (reglas de negocio). Las menciones a la **guía técnica** apuntan a [docs/technical_guide.md](technical_guide.md) (modelo de datos, API, payloads).
>
> **Precedencia:** si un criterio de este documento entra en conflicto con una regla de negocio del PDR, **la regla del PDR gana**.

---

## Índice

### [1. Requerimientos funcionales (completos) y criterios de aceptación](#1-requerimientos-funcionales-completos-y-criterios-de-aceptación)

| FR | Título | Prioridad |
| --- | --- | --- |
| [FR-000](#fr-000--gestión-de-sucursales-alta) | Gestión de sucursales | Alta |
| [FR-001](#fr-001--gestión-de-productos-y-variantes-alta) | Gestión de productos y variantes | Alta |
| [FR-002](#fr-002--registro-de-pedidos-pos-alta) | Registro de pedidos POS | Alta |
| [FR-002b](#fr-002b--venta-custom-de-presas-surtidas-alta) | Venta custom de presas surtidas | Alta |
| [FR-003](#fr-003--comanda-digital-y-factura-opcional-alta) | Comanda digital y factura opcional | Alta |
| [FR-004](#fr-004--control-de-caja-por-turno-alta) | Control de caja por turno | Alta |
| [FR-005](#fr-005--vales-de-trabajadores-media) | Vales de trabajadores | Media |
| [FR-006](#fr-006--inventario-por-presas-alta) | Inventario por presas | Alta |
| [FR-007](#fr-007--notificación-de-pedido-listo-alta) | Notificación de pedido listo | Alta |
| [FR-008](#fr-008--interfaces-diferenciadas-por-rol-alta) | Interfaces diferenciadas por rol | Alta |
| [FR-008b](#fr-008b--sesión-única-por-turno-alta) | Sesión única por turno | Alta |
| [FR-009](#fr-009--registro-de-gastos-media) | Registro de gastos | Media |
| [FR-010](#fr-010--reportes-alta) | Reportes | Alta |
| [FR-011](#fr-011--pedidos-con-pago-pendiente-alta) | Pedidos con pago pendiente | Alta |
| [FR-011b](#fr-011b--anulación-de-pedido-pagado-alta) | Anulación de pedido pagado | Alta |
| [FR-012](#fr-012--historial-de-comandas-media) | Historial de comandas | Media |
| [FR-013](#fr-013--ui-limpia-por-rol-alta) | UI limpia por rol | Alta |
| [FR-014](#fr-014--impresión-de-factura-y-descarga-pdf-media) | Impresión de factura y descarga PDF | Media |
| [FR-015](#fr-015--vista-pública-del-cliente-alta) | Vista pública del cliente | Alta |
| [FR-016](#fr-016--gestión-de-descuentos-y-aplicación-en-pos-media) | Gestión de descuentos y aplicación en POS | Media |
| [FR-016b](#fr-016b--autorización-de-descuentos-por-turno-media) | Autorización de descuentos por turno | Media |
| [FR-017](#fr-017--registro-de-consumos-manuales-y-ciclo-crudo-de-presas-por-turno-media) | Consumos manuales y ciclo crudo de presas por turno | Media |
| [FR-018](#fr-018--autenticación-jwt-y-autorización-por-rol-alta) | Autenticación JWT y autorización por rol | Alta |
| [FR-019](#fr-019--registro-y-búsqueda-de-clientes-alta) | Registro y búsqueda de clientes | Alta |

### [2. Requerimientos no funcionales](#2-requerimientos-no-funcionales)

### [Trazabilidad](#trazabilidad)

---

# 1. Requerimientos funcionales (completos) y criterios de aceptación
> Cada FR incluye criterio de aceptación mínimo, pensado para pruebas automáticas y E2E.

### FR-000 — Gestión de sucursales (Alta)
- **Funcionalidad:** El SUPER_ADMIN puede crear, editar y dar de baja sucursales. Cada sucursal tiene nombre, dirección y estado (activa/inactiva). Las operaciones de los usuarios (ventas, inventario, turnos) se restringen a su sucursal asignada, excepto SUPER_ADMIN que tiene acceso global.
- **Criterio de aceptación:** El SUPER_ADMIN crea una sucursal; los usuarios asignados a esa sucursal solo ven datos de su sucursal; el SUPER_ADMIN ve un resumen consolidado de todas las sucursales en el endpoint `/reports/branches-summary`.

### FR-001 — Gestión de productos y variantes (Alta)
- **Funcionalidad:** El administrador puede crear, editar y dar de baja productos; definir variantes con sus componentes obligatorios (presas) y por defecto (acompañamiento); fijar el precio base del plato. Las sustituciones permitidas no afectan el precio ([PDR §2.1](pdr.md#21-precios-y-sustituciones)).
- **Criterio de aceptación:** El administrador crea un producto y su variante; la variante queda disponible en el POS de inmediato; el POS muestra la descomposición de la variante y el precio calculado.

### FR-002 — Registro de pedidos POS (Alta)
- **Funcionalidad:** El POS ofrece el flujo rápido de venta **MESA**/**LLEVAR**: producto → variante → presas → (opcional) 1 sustitución → bebidas/extras → pago (o pago pendiente). Un pedido admite **N ítems** con extras y bebidas sueltos opcionales, y el **backend calcula el total** — composición y reglas de precio en [PDR §2.2](pdr.md#22-variantes-y-componentes). Las presas surtidas van por el flujo separado FR-002b.
- **Criterio de aceptación:** La cajera puede registrar un pedido en 3 pasos o menos; un pedido con varios platos + extras + bebidas en distintas cantidades arroja el **total correcto** = suma de (`precio × cantidad`) de cada ítem; al confirmar, la comanda aparece en el panel de despacho.

### FR-002b — Venta custom de presas surtidas (Alta)
- **Funcionalidad:** Flujo dedicado **"Venta Custom"** para combinaciones fuera del menú: la cajera arma las presas (+acompañamientos/bebidas opcionales), ve un **precio sugerido** que puede aceptar o pisar, y confirma el final. MESA o LLEVAR; CUSTOM es marca, no tipo — reglas y estructura del ítem en [PDR §2.10](pdr.md#210-ventas-custom-presas-surtidas).
- **Criterio de aceptación:** Registrar una venta custom LLEVAR de "2 pechos + 1 papa + 1 cocacola" muestra un precio sugerido (suma de los precios de venta configurados) que la cajera puede modificar; descuenta exactamente 2 pechos del inventario y 1 unidad de cocacola al confirmar el pago; persiste el precio **confirmado**, no la sugerencia. La comanda muestra "LLEVAR" en la cabecera y la composición real del ítem. Los reportes pueden filtrar ventas custom.

### FR-003 — Comanda digital y factura opcional (Alta)
- **Funcionalidad:** Al confirmar un pedido, el sistema genera la **comanda digital** y la publica en (a) el panel de despachadoras y (b) la vista pública del cliente, donde el cliente puede consultar su pedido. La **factura solo se emite si el cliente la pide**; cuando se pide, se imprime en la térmica o, si la impresora falla, se descarga en PDF.
- **Criterio de aceptación:** Al confirmar el pedido, la comanda aparece en el panel de despacho de inmediato. El botón de imprimir factura está disponible solo bajo demanda. Si la impresora térmica falla, el sistema descarga el PDF de la factura automáticamente.

### FR-004 — Control de caja por turno (Alta)
- **Funcionalidad:** La cajera abre y cierra su turno. Al abrir se indican el monto inicial, la caja y el **período del turno** (Mañana / Noche, de un catálogo ampliable): el período se **declara**, el sistema nunca lo infiere del reloj ([PDR §13.3](pdr.md#133-decisiones-residuales-pendientes-de-cierre-antes-de-v1)). El arqueo muestra el desglose por método de pago, vales, gastos y anulaciones. Solo 1 caja por cajera por turno.
- **Criterio de aceptación:** Al abrir el turno se crea un registro con el monto inicial y el período elegido (la pantalla lo trae preseleccionado, pero es editable y la elección es la que persiste); abrir sin período falla con error de validación; al cerrar, no se pueden registrar más ventas en esa caja; el arqueo se exporta a CSV con totales por método, vales, anulaciones y diferencia.

### FR-005 — Vales de trabajadores (Media)
- **Funcionalidad:** La cajera o el administrador registran un vale con nombre del trabajador, plato consumido, fecha y monto. El vale descuenta presas y bebidas del inventario, pero NO suma al ingreso de caja del turno.
- **Criterio de aceptación:** El vale aparece como línea separada en el arqueo; descuenta inventario; existe una interfaz que lista todos los vales con filtros por trabajador, fecha y monto.

### FR-006 — Inventario por presas (Alta)
- **Funcionalidad:** El sistema lleva los **dos planos** de inventario de pollo de [PDR §2.3](pdr.md#23-inventario-por-presas): **cocido** (transaccional, descuenta al confirmar pago, dashboard por tipo) y **crudo** (anotado por turno con la regla de continuidad T → T+1). Consumos manuales del turno → FR-017.
- **Criterio de aceptación:** Una venta pagada descuenta el stock cocido; un pedido pendiente de pago NO descuenta hasta confirmar; el dashboard muestra el stock cocido actual por tipo y el delta del turno; al abrir un nuevo turno, el reproceso crudo se autopobla con el sobrante crudo del turno anterior; la reconciliación diaria es posible (vendido cocido + sobrante cocido en expositor vs cocinado en turno).

Nota técnica: El consumo operativo se registra en `OrderItemComponent` (una fila por componente consumido: presa, bebida o extra cuando aplica) y cada `OrderItem` persiste un `snapshot` JSON con la información que debe imprimirse y auditarse (nombre, precio confirmado, descuentos aplicados, composición). El servicio de pago crea `InventoryTransaction` a partir de las `OrderItemComponent` en la misma transacción.

### FR-007 — Notificación de pedido listo (Alta)
- **Funcionalidad:** Una **pantalla pública** dentro del local muestra los pedidos listos, estilo "turnos de banco". Solo aparece **el número de pedido** (sin nombre, sin mesa). Aplica indistintamente a **MESA y LLEVAR**. Suena una alerta breve cuando aparece un pedido. Cuando la despachadora marca el pedido como entregado, este desaparece de la pantalla.
- **Criterio de aceptación:** Un pedido listo (MESA o LLEVAR) aparece en la pantalla pública con su número y suena la alerta; al marcarse como entregado, desaparece y queda registrado quién lo entregó y cuándo.

### FR-008 — Interfaces diferenciadas por rol (Alta)
- **Funcionalidad:** Cada rol ve solo las pantallas relevantes a su trabajo: POS para la cajera, panel de comandas para la despachadora, dashboard de inventario para el cocinero, admin completo para el administrador. **El control de permisos se aplica en dos capas:** la UI oculta lo no relevante y **el backend valida el rol en cada endpoint vía JWT**, devolviendo 403 si el rol no corresponde ([PDR §2.7](pdr.md#27-roles-e-interfaces-v1-con-autenticación-jwt-y-control-de-permisos-por-rol-en-backend), [FR-018](#fr-018--autenticación-jwt-y-autorización-por-rol-alta)).
- **Criterio de aceptación:** Al ingresar como cajera, se muestran POS y caja; como despachadora, el panel de comandas; como administrador, todo. Un endpoint de admin invocado con token de cajera responde **403 Forbidden**; sin token responde **401 Unauthorized**.

### FR-008b — Sesión única por turno (Alta)
- **Funcionalidad:** Durante un mismo turno, un usuario solo puede estar activo con un rol. No puede estar simultáneamente como cajera y despachadora.
- **Criterio de aceptación:** Si un usuario ya tiene sesión activa en el turno actual, intentar iniciar sesión con otro rol falla con un mensaje claro.

### FR-009 — Registro de gastos (Media)
- **Funcionalidad:** La cajera registra gastos pagados con dinero de la caja (ej. compra de arroz, guantes, servilletas). El gasto queda asociado al turno.
- **Criterio de aceptación:** El gasto aparece en el arqueo y en los reportes.

### FR-010 — Reportes (Alta)
- **Funcionalidad MVP:** Reportes de (a) ventas por turno/día, (b) inventario de presas (vendidas y restantes por tipo), (c) arqueo de caja con anulaciones y vales. Exportables a CSV.
- **Deseable (no obligatorio MVP):** Reporte de productos más vendidos.
- **Criterio de aceptación:** Se puede generar un reporte por rango de fechas; la exportación a CSV es correcta.

### FR-011 — Pedidos con pago pendiente (Alta)
- **Funcionalidad:** Pedidos LLEVAR/delivery con pago pendiente según las reglas de [PDR §2.5](pdr.md#25-pedidos-delivery-y-pago-pendiente): se preparan de inmediato, inventario e ingreso recién al confirmar pago, cancelación siempre manual sin timeout.
- **Criterio de aceptación:** Un pedido con pago pendiente aparece en el panel de despacho y se prepara; al confirmar el pago, descuenta inventario y suma al ingreso del turno; el sistema no auto-cancela por tiempo.

### FR-011b — Anulación de pedido pagado (Alta)
- **Funcionalidad:** La cajera o el administrador pueden anular un pedido ya pagado. Es obligatorio indicar **motivo y detalle**. El sistema revierte el inventario y registra la anulación con su monto en el arqueo del turno.
- **Criterio de aceptación:** Al anular un pedido pagado, motivo y detalle son obligatorios; el inventario se revierte; la anulación aparece en el arqueo bajo "anulaciones" con su monto y razón.

### FR-012 — Historial de comandas (Media)
- **Funcionalidad:** El sistema guarda las comandas digitales y los datos del pedido para auditoría y consulta posterior. Se pueden buscar por ID de pedido, fecha, responsable, mesa o cliente.
- **Criterio de aceptación:** Buscar y recuperar una comanda es rápido.

### FR-013 — UI limpia por rol (Alta)
- **Funcionalidad:** POS y paneles con vistas simplificadas por rol para reducir la carga cognitiva. Soporte de tema claro y oscuro.
- **Criterio de aceptación:** Las pruebas de usabilidad muestran reducción de errores; cada rol ve solo las opciones relevantes.

### FR-014 — Impresión de factura y descarga PDF (Media)
- **Funcionalidad:** La impresora térmica se usa solo para imprimir la factura cuando el cliente la pide. Si la impresora falla, el sistema descarga el PDF de la factura para que el cliente o la cajera lo impriman por otra vía.
- **Criterio de aceptación:** La impresión de factura funciona; si falla, el PDF se descarga automáticamente.

### FR-015 — Vista pública del cliente (Alta)
- **Funcionalidad:** Cada pedido tiene una interfaz dedicada donde el cliente ve SU comanda (no las de otros), accesible por una **URL o QR únicos** que llevan un **token no adivinable** (`Order.publicToken`, no el `id` interno). El token es la credencial (patrón "capability URL"): **no requiere login ni registro**. Funciona también para la venta anónima "S/N". Si el pedido está vinculado a un cliente registrado, ver además [FR-019](#fr-019--registro-y-búsqueda-de-clientes-alta) (pedidos del día).
- **Criterio de aceptación:** El cliente entra a la URL/QR de su pedido (con su token) y ve su comanda; probar un token aleatorio o el `id` interno → no funciona (no enumerable); el acceso no expone datos sensibles ni pedidos de otros.

### FR-016 — Gestión de descuentos y aplicación en POS (Media)
- **Funcionalidad:** El admin crea **descuentos** de monto fijo **por plato** (disponibilidad `siempre`/`fin de turno`, flag `requiere autorización`); la cajera **marca qué ítems de la orden los llevan** (uno por plato, sin apilamiento). Las dos instancias principales — **descuento al personal** (fin de turno, sin autorización) y **compensación al cliente** (todo el turno, requiere autorización) — con sus configs, contextos y el carácter puramente monetario, en [PDR §2.11](pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal).
- **Criterio de aceptación:** El admin crea un descuento de monto fijo por plato; la cajera lo aplica a 3 platos de 30 Bs **en el mismo registro de la venta (una sola operación, sin pasos adicionales)** y el total baja 21 Bs (7 × 3 → total 69); en cada ítem marcado queda registrado el monto descontado (snapshot) y la referencia al descuento; a nivel orden quedan el precio original y el total derivado; aparece en arqueo y reportes; el descuento `solo a fin de turno` no se ofrece fuera de esa ventana; el inventario descuenta lo correcto y la caja cuadra.

### FR-016b — Autorización de descuentos por turno (Media)
- **Funcionalidad:** Para descuentos con `requiere autorización = sí`, el admin otorga una **autorización por turno a la sesión de cajera** — alcance, extinción al cierre y auditabilidad del acto según [PDR §2.11](pdr.md#211-descuentos-sobre-la-orden-incluye-descuento-al-personal) (subsección "Autorización de descuentos por turno"). Sin autorización, el POS no ofrece el descuento.
- **Criterio de aceptación:** Sin autorización, la cajera no ve/no puede aplicar el descuento "Compensación al cliente"; tras autorizarla el admin, puede aplicarlo a uno o varios platos de uno o varios pedidos del turno; la autorización no se renueva por pedido ni por plato; al cerrar el turno la autorización deja de estar vigente y no pasa al turno siguiente; queda registrado quién autorizó, a qué cajera y cuándo.

### FR-017 — Registro de consumos manuales y ciclo crudo de presas por turno (Media)
- **Funcionalidad:** Al cierre del turno, el cocinero registra:
  - **Consumos manuales de insumos:** bolsas de papa, bolsas de smile, envases de arroz, vasos, bombillas, etc. (referencia: tabla "INVENTARIO DIARIO" en [`business_context.md`](business_context.md#ejemplo-de-inventario-diario)).
  - **Ciclo crudo de presas por tipo (pecho, ala, pierna, entrepierna):** reproceso crudo, procesado crudo, sobrante procesado crudo y sobrante cocido en expositor ([PDR §2.3](pdr.md)).
- Al abrir un turno, el sistema **autopobla** el reproceso crudo a partir del sobrante crudo del turno anterior; el cocinero puede ajustar antes de confirmar y el cambio queda registrado.
- **Criterio de aceptación:** El registro queda vinculado al turno y aparece en el reporte de inventario diario; el reproceso crudo del nuevo turno coincide por default con el sobrante crudo del turno anterior; el sistema reconcilia `(reproceso + procesado − sobrante crudo) − vendido cocido` contra el sobrante cocido en expositor anotado y reporta discrepancias.

### FR-018 — Autenticación JWT y autorización por rol (Alta)
- **Funcionalidad:** El usuario inicia sesión con usuario y contraseña y recibe un **JWT (Bearer token)**. Toda petición a endpoints protegidos exige el token en el header `Authorization: Bearer <token>`. El backend lo verifica (**autenticación / AuthN**) y luego valida el **rol** del usuario contra el rol requerido por el endpoint (**autorización / AuthZ**, vía guard tipo middleware). El login es el único endpoint público. La matriz rol → acción autorizada vive en [PDR §2.7](pdr.md#27-roles-e-interfaces-v1-con-autenticación-jwt-y-control-de-permisos-por-rol-en-backend).
- **Criterio de aceptación:**
  - Login con credenciales válidas → **200** + token JWT que incluye `userId`, `username` y `role`.
  - Petición sin token, o con token inválido / expirado → **401 Unauthorized**.
  - Petición con token válido pero rol **no autorizado** para ese endpoint → **403 Forbidden**.
  - Petición con token válido y rol **autorizado** → procede normalmente.

### FR-019 — Registro y búsqueda de clientes (Alta)
- **Funcionalidad:** Entidad **`Customer`** para **facturación nominada** y la vista de **"pedidos del día"**: la cajera registra clientes y los busca por **CI o NIT**; el vínculo a la orden es **opcional** (anónimo = "S/N"). Datos del cliente, regla legal de nominatividad y la regla de seguridad **identidad ≠ acceso** (el token habilita, el NIT jamás es llave) en [PDR §2.12](pdr.md#212-clientes-y-facturación-nominada).
- **Criterio de aceptación:**
  - La cajera registra un cliente nuevo y luego lo encuentra buscando por **CI** o por **NIT**.
  - Una orden se crea vinculada a un `customerId`; otra se crea sin cliente y queda como "S/N".
  - Desde el token de un pedido de un cliente identificado se ven **todos sus pedidos del día** (mismo cliente, misma fecha); una venta "S/N" solo muestra su pedido único.
  - Intentar listar pedidos tipeando un NIT/CI en la URL (sin token) **no funciona**.
  - Editar los datos de un cliente no altera el `customerName` ya guardado como snapshot en pedidos pasados.
- **Fuera de alcance (V1):** integración fiscal con el SFE del SIN (CUF, código de control, envío). V2: auto-registro de cliente + login (`GET /me/orders`).

---

# 2. Requerimientos no funcionales
> El detalle de NFR técnicos (rendimiento, seguridad, escalabilidad, multiplataforma, impresión, despliegue, backups) vive en [`docs/technical_guide.md` §2](technical_guide.md). Esta sección enumera únicamente las calidades de uso de cara al negocio:

- **Velocidad de uso:** El POS debe permitir registrar una venta en 3 pasos como máximo. Las pantallas deben ser limpias y responder al instante en hora pico.
- **Idioma y moneda:** Español por defecto; montos en bolivianos (Bs).
- **Accesibilidad:** Contraste y tamaño de fuente adecuados para uso en ambientes con iluminación variable.
- **Tema:** Soporte para tema claro y oscuro.
- **Modo de operación:** Aplicación web local on-premise. La sincronización a la nube y los backups automáticos son parte de la **V2** (ver [PDR §13](pdr.md#13-alcance-v1-mvp-vs-v2-futuro)).

---

## Trazabilidad

- **Reglas de negocio que originan cada FR/NFR:** [docs/pdr.md §2](pdr.md#2-reglas-de-negocio-definitivas-y-no-negociables) (reglas definitivas) y [§13](pdr.md#13-alcance-v1-mvp-vs-v2-futuro) (alcance V1 vs V2).
- **Traducción técnica (modelo de datos, endpoints, payloads, casos E2E):** [docs/technical_guide.md](technical_guide.md).
- **Máquina de estados de pedidos:** [PDR §4](pdr.md#4-máquina-de-estados-de-pedidos) (negocio) y [technical guide §4](technical_guide.md#4-reglas-transaccionales-y-auditoría-v1) (transaccional).


