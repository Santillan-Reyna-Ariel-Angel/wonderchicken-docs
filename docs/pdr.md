# Product Requirements Document (PRD)
**Sistema Informático de Ventas — Wonder Chicken**

**Rol del autor:** Senior Product Manager / Arquitecto de Sistemas (digitalización de servicios de comida rápida)

**Versión:** 2.0 (incorpora respuestas del cuestionario Fase 1)

**Fecha:** 2026-05-01

**Alcance:** Documento de negocio y requisitos funcionales / no funcionales para que un LLM genere backend y frontend coherentes con las reglas operativas del restaurante.

**Material de origen:** las citas textuales del documento oficial, el menú 2026, el inventario diario de ejemplo y los tickets reales del sistema actual de los que deriva este PDR viven en [`docs/business_context.md`](business_context.md).

---

## Índice

**Documento**
- [1. Resumen ejecutivo (versión para desarrollo LLM)](#1-resumen-ejecutivo-versión-para-desarrollo-llm)
- [2. Reglas de negocio (definitivas y no negociables)](#2-reglas-de-negocio-definitivas-y-no-negociables)
  - [2.1 Precios y sustituciones](#21-precios-y-sustituciones)
  - [2.2 Variantes y componentes](#22-variantes-y-componentes)
  - [2.3 Inventario por presas](#23-inventario-por-presas)
  - [2.4 Vales (ventas internas — descuento por nómina)](#24-vales-ventas-internas--descuento-por-nómina)
  - [2.5 Pedidos delivery y pago pendiente](#25-pedidos-delivery-y-pago-pendiente)
  - [2.6 Caja y arqueo](#26-caja-y-arqueo)
  - [2.7 Roles e interfaces](#27-roles-e-interfaces-v1-con-autenticación-jwt-y-control-de-permisos-por-rol-en-backend)
  - [2.8 Comandas, tickets, factura y notificaciones](#28-comandas-tickets-factura-y-notificaciones)
  - [2.9 Auditoría](#29-auditoría)
  - [2.10 Ventas custom (presas surtidas)](#210-ventas-custom-presas-surtidas)
  - [2.11 Descuentos sobre la orden (incluye descuento al personal)](#211-descuentos-sobre-la-orden-incluye-descuento-al-personal)
  - [2.12 Clientes y facturación nominada](#212-clientes-y-facturación-nominada)
- [3. Modelo de datos](#3-modelo-de-datos)
- [4. Máquina de estados de pedidos](#4-máquina-de-estados-de-pedidos)
- [5. Requerimientos funcionales (completos) y criterios de aceptación](#5-requerimientos-funcionales-completos-y-criterios-de-aceptación)
- [6. Requerimientos no funcionales](#6-requerimientos-no-funcionales)
- [7. UX / UI — requisitos y pantallas clave](#7-ux--ui--requisitos-y-pantallas-clave)
  - [7.1 POS (Cajera)](#71-pos-cajera)
  - [7.2 Panel Despacho](#72-panel-despacho)
  - [7.3 Pantalla pública (clientes en local)](#73-pantalla-pública-clientes-en-local)
  - [7.4 Vista del cliente (su comanda)](#74-vista-del-cliente-su-comanda)
  - [7.5 Administración](#75-administración)
  - [7.6 Cocinero (consumos manuales)](#76-cocinero-consumos-manuales)
  - [7.7 Factura (impresión / PDF)](#77-factura-impresión--pdf)
- [8. API y contratos](#8-api-y-contratos)
- [9. Anexos técnicos](#9-anexos-técnicos)
- [10. Prioridad de trabajo y roadmap de entregas (MVP en sprints)](#10-prioridad-de-trabajo-y-roadmap-de-entregas-mvp-en-sprints)
- [11. Despliegue](#11-despliegue)
- [12. Criterios de aceptación del MVP (resumen)](#12-criterios-de-aceptación-del-mvp-resumen)
- [13. Alcance V1 (MVP) vs V2 (Futuro)](#13-alcance-v1-mvp-vs-v2-futuro)
  - [13.1 Versión 1 (MVP) — Incluido](#131-versión-1-mvp--incluido)
  - [13.2 Versión 2 (Roadmap futuro) — Diferido explícitamente](#132-versión-2-roadmap-futuro--diferido-explícitamente)
  - [13.3 Decisiones residuales pendientes de cierre antes de V1](#133-decisiones-residuales-pendientes-de-cierre-antes-de-v1)
- [14. Riesgos y decisiones POSPONIBLES (residuales tras Fase 1)](#14-riesgos-y-decisiones-posponibles-residuales-tras-fase-1)
- [Observación final (para el LLM y el equipo)](#observación-final-para-el-llm-y-el-equipo)

---

# 1. Resumen ejecutivo (versión para desarrollo LLM)
**Contexto:** Wonder Chicken es un restaurante de servicio rápido con alta rotación de pedidos y necesidad de control por presas de pollo. El sistema actual es genérico y no cubre variantes de productos, control de presas, diferencia pedidos mesa/llevar, notificaciones eficientes ni manejo claro de vales.

**Propósito del PRD:** Proveer al LLM un conjunto completo y no ambiguo de reglas de negocio, modelos de datos, flujos y criterios de aceptación para generar backend y frontend que cumplan con las operaciones reales del restaurante.

**Alcance MVP:** Gestión de productos/variantes, POS (mesa/llevar), comandas digitales/impresa(opcional), ventas custom de presas surtidas, inventario por presas, control de caja por turno, vales, notificaciones de pedido listo en pantalla pública, interfaces diferenciadas por rol con enforcement de permisos por rol en backend (JWT), reportes básicos, historial de comandas, impresión térmica de factura (solo si el cliente la pide).

### Personas y casos de uso
- **Administrador**
  - **Objetivo:** Configurar productos y variantes; revisar inventario y reportes; gestionar usuarios y caja; ajustar inventario con motivo registrado.
  - **Frustraciones actuales:** Opciones confusas en el sistema genérico; imposibilidad de crear variantes; falta de control de presas.

- **Cajera**
  - **Objetivo:** Registrar ventas rápidas (mesa/llevar/custom), emitir factura (opcional) y comandas digitales(opcion a imprimir), registrar vales, gestionar apertura/cierre de caja. Puede utilizar dinero de caja para comprar cosas imprevistas (Registro de gastos).
  - **Frustraciones actuales:** Interfaz sobrecargada; anotaciones manuales en comandas; procesos lentos en horas pico.

- **Despachadora**
  - **Objetivo:** Recibir comandas digitales, preparar y entregar pedidos; notificar cliente cuando el pedido está listo (pantalla pública).
  - **Frustraciones actuales:** Deben gritar o buscar clientes; pérdida de tiempo y experiencia negativa para el cliente.

- **Cocineros**
  - **Objetivo:** Marinar presas crudas (procesado), cocinar presas y porciones (papa, pipocas, plátano, smile). Contar bolsas de papa usadas y presas restantes (sobrante procesado). Anotar cantidad de presas crudas marinadas (procesado crudo).
  - **Frustraciones actuales:** Conteo manual de pollo restante y bolsas de papa al cambio de turno.

### Principales flujos de usuario (resumidos)
- **Venta presencial (mesa):** Cajera registra pedido → confirma pago → comanda digital aparece en panel de despacho → despachadora prepara → cliente notificado en pantalla pública (solo número de pedido) → despachadora entrega el pedido.
- **Venta para llevar / delivery:** La cajera registra el pedido (puede quedar con pago pendiente si el delivery aún no paga) → la comanda digital aparece y SE PREPARA de inmediato → al confirmar el pago, se descuenta inventario y se contabiliza la venta → el cliente es notificado en la pantalla pública (solo número de pedido) → entrega al delivery o al cliente.
- **Venta custom (presas surtidas):** La cajera entra al flujo "Venta Custom" en el POS → el pedido queda marcado como custom y puede ser MESA o LLEVAR → la cajera arma uno o más ítems indicando las presas exactas (ej. 2 pechos, 1 ala + 1 pierna) y un precio que ella decide → confirma el pago → el inventario descuenta exactamente las presas vendidas.
- **Venta interna con descuento (sobrante de pollo cocido):** al fin del turno, si sobra pollo cocido, el personal compra platos con el "Descuento personal" aplicado **por plato** — mecánica, montos y ejemplo en §2.11.
- **Compensación al cliente (pollo defectuoso):** con autorización del admin para el turno, la cajera aplica el descuento "Compensación al cliente" a los platos afectados — detalle en §2.11.
- **Administración:** Crear/editar productos, variantes y usuarios; consultar conteo de presas; generar reportes de ventas y gastos; ajustar inventario con motivo.

---

# 2. Reglas de negocio (definitivas y no negociables)
> Estas reglas son la base del producto: rigen la operación del restaurante y deben respetarse al implementar. La traducción técnica de cada regla (entidades, campos, endpoints) vive en [`docs/technical_guide.md`](technical_guide.md).

## 2.1 Precios y sustituciones
- **Regla principal:** El precio del plato **NO cambia** cuando se sustituye su acompañamiento. Los platos vienen con 1 porción de mixto (papa + arroz) por defecto. El cliente puede sustituir esa porción mixta por 1 porción de arroz, 1 porción de papa o 1 porción de smiles, **manteniendo el precio base**.
- **Límite:** Por ítem se permite **1 sustitución máxima**, y solo aplica al acompañamiento. No se sustituyen presas, bebidas ni extras.
- **Registro:** Cada sustitución queda registrada en el pedido (qué se cambió y por qué se cambió). Como por regla del negocio la sustitución nunca afecta el precio, **no se registra ningún ajuste de precio**.
- **Visualización en ticket:** La sustitución debe imprimirse en el detalle del ítem (ej. "1 - PORCIÓN DE ARROZ").

## 2.2 Variantes y componentes
- Una **variante** es un plato compuesto por: componentes obligatorios (presas), componente por defecto (mixto) y opciones (bebida y extras).
- **Un pedido estándar admite N ítems:** uno o varios **platos** del menú (cualquiera, en la cantidad que el cliente pida) y, **de forma OPCIONAL**, **extras y/o bebidas sueltos en cualquier cantidad**. Extras y bebidas sueltas **no son obligatorios**: un pedido puede no llevar ninguno. Platos, extras y bebidas son todos `Product` del catálogo (distinguidos por `category`); cada uno entra como un ítem del pedido con su `quantity`.
- **Bebida incluida vs. bebida agregada:** algunos platos **traen bebida incluida** en su composición (ej. Wonder = 2 presas + mixto + bebida 500 ml; ya está en el precio y es parte de la **variante**, NO un ítem aparte). Los platos que **no** traen bebida (ej. Porción Media, 30 Bs) pueden igual **sumar una bebida suelta** como ítem adicional (ej. + bebida 2 L, 16 Bs → total 46 Bs). Idéntico criterio para los extras: se agregan solo si el cliente los pide.
- **Precio final del pedido** = **suma de TODOS los ítems**, cada uno por `precio del producto × cantidad` (platos + extras + bebidas que efectivamente se agregaron). Lo calcula el **backend** desde el catálogo (el front no manda precios — §5.0 técnica). Las sustituciones NO afectan el precio (§2.1).
- **Composición visible:** En el POS y en el ticket se debe mostrar la descomposición del ítem (ej. "2 - PECHO-ALA; 1 - COCA COLA 500 ml; 1 - PORCIÓN DE ARROZ").

## 2.3 Inventario por presas

El pollo vive en **dos planos distintos** que el sistema debe modelar por separado:

### Plano CRUDO (anotado por los cocineros — no transaccional)
- **Anotación por turno:** al cierre de cada turno, el cocinero registra por tipo de presa (pecho, ala, pierna, entrepierna):
  - **Reproceso crudo:** pollo crudo sobrante que viene del turno anterior (turno mañana lo recibe del turno noche del día anterior; turno noche lo recibe del turno mañana del mismo día).
  - **Procesado crudo:** pollo fresco marinado en este turno.
  - **Sobrante procesado crudo:** pollo crudo que queda sin cocinar al final del turno.
  - **Sobrante cocido en expositor:** pollo cocido que queda sin vender en el expositor al cierre del turno.
- **Regla de continuidad entre turnos:** el **Sobrante procesado crudo** del turno T pasa a ser el **Reproceso crudo** del turno T+1. El sistema debe **autopoblar** este valor al abrir el turno siguiente(pero el cocinero siguiente tiene opcion a editar/confirnar dicha cantidad, el calculo automatico es una ayuda); el cocinero puede ajustar si hubo merma o ingreso adicional, dejando el cambio registrado para auditoría.
- **Cantidad cocinada en el turno (derivada):** `Reproceso crudo + Procesado crudo − Sobrante procesado crudo`. Esta cantidad representa el pollo crudo que pasó al expositor (se cocinó) durante el turno.
- **Reporte de inventario diario:** consolida ambos turnos del día (referencia: tabla "INVENTARIO DIARIO" en [`business_context.md`](business_context.md#ejemplo-de-inventario-diario)).

### Plano COCIDO (inventario transaccional del expositor — lo que se vende)
- **Unidad:** presas cocidas por tipo: pecho, ala, pierna, entrepierna.
- **Descuento por venta:** el inventario cocido se descuenta por tipo **al confirmar el pago**, NO al pasar el pedido a preparación. Esto evita inconsistencias cuando un pedido con pago pendiente termina cancelado.
- **Regla de pares:** los platos de "2 presas" consumen exactamente 2 unidades del par seleccionado por el cliente (ej. pecho-ala descuenta 1 pecho cocido + 1 ala cocida; pierna-entrepierna descuenta 1 pierna cocida + 1 entrepierna cocida).
- **Bebidas:** se descuentan por unidad automáticamente al confirmar el pago.
- **Sobrante cocido en expositor:** se anota al cierre de turno (plano crudo) y habilita la venta interna con descuento al personal (§2.11).
- **Reconciliación al cierre:** el sistema compara el `Sobrante cocido en expositor` contra `(cantidad cocinada en el turno − vendido cocido por el sistema)` y reporta discrepancias para auditoría.

Nota técnica importante: en la implementación técnica el consumo operativo de piezas y bebidas se registra en filas normalizadas de `OrderItemComponent` vinculadas a cada `OrderItem`. Además, cada `OrderItem` persiste un `snapshot` JSON con la información que debe imprimirse y auditarse (nombre, precio confirmado, descuentos aplicados, composición). El decremento de stock cocido se ejecuta al confirmar el pago y usa las filas `OrderItemComponent` como fuente de verdad para crear `InventoryTransaction`.

### Acompañamientos e insumos
- **Acompañamientos NO se descuentan a nivel granular:** porciones de mixto, arroz, papa, smiles, plátano NO se llevan en inventario en V1.
- **Conteo manual residual:** en cada turno, el personal anota cantidad de bolsas de papa, bolsas de smile, envases de arroz, vasos, bombillas, etc. (referencia: tabla "INVENTARIO DIARIO" en [`business_context.md`](business_context.md#ejemplo-de-inventario-diario)). El sistema debe ofrecer una pantalla simple para registrar estos consumos por turno.

## 2.4 Vales (ventas internas — descuento por nómina)
- **Naturaleza:** un vale registra que un trabajador consumió un plato; el monto se descuenta de su nómina al cierre del mes. NO es un retiro de caja inmediato ni un ingreso de venta.
- **Datos obligatorios del vale:** trabajador, plato, fecha, monto y quién lo emitió.
- **Monto derivado del producto:** el monto del vale **es el precio del producto** — el sistema lo toma de `productId`, no se digita a mano.
- **Descuento al personal sobre el vale:** un vale puede llevar aplicado el **"Descuento personal"** (mecánica y snapshot en §2.11): un plato de 30 Bs se registra como vale de **23 Bs** (precio original, descuento y monto final quedan guardados). El vale con descuento respeta la misma ventana `solo a fin de turno` del descuento.
- **Efecto en inventario:** el vale **SÍ descuenta** las presas y bebidas correspondientes.
- **Efecto en caja:** el vale **NO suma** al ingreso de caja del turno; aparece en el arqueo como línea separada con su monto.
- **Autorización:** cualquier cajera puede emitir vales. **No hay umbral de aprobación** ni límite por trabajador (decisión del administrador).
- **Visibilidad:** existe una interfaz que lista todos los vales otorgados con filtros por trabajador y fecha, consultable por cajera(los que emitio) y administrador(todos los registros, incluye nombre de la cajera que emitio) en cualquier momento.

## 2.5 Pedidos delivery y pago pendiente
- **Estado:** se permite registrar un pedido con pago pendiente para LLEVAR / delivery cuando la cajera lo registra pero el pago aún no llegó (el delivery paga al retirar).
- **Preparación:** los pedidos con pago pendiente **se preparan de inmediato** (no esperan al pago) para evitar retrasos. La comanda digital aparece en el panel de despachadoras como cualquier otro pedido.
- **Inventario e ingresos:** mientras el pedido tenga pago pendiente, **NO se descuenta inventario y NO se contabiliza el ingreso**. Ambos se actualizan al confirmar el pago.
- **Cancelación (siempre manual):** **NO existe timeout automático**. Como el pedido entra a cocina de inmediato, dejar que el sistema lo cancele solo generaría pollo cocinado sin trazabilidad. La cajera es la única que decide cuándo cancelar un pedido con pago pendiente; puede hacerlo en cualquier momento, sin requerir motivo (no se contabilizó nada).
- **Confirmación de pago:** al recibirse el pago, el pedido se marca como pagado → se descuenta inventario → se contabiliza el ingreso → se imprime/genera factura si el cliente la pide.

## 2.6 Caja y arqueo
- **Turno:** cada turno tiene un monto de apertura y un monto de cierre.
- **Arqueo (campos mínimos):** apertura, cierre, ventas totales, ventas por método (efectivo, tarjeta, vale), gastos, vales emitidos (monto), anulaciones (cantidad y monto), diferencia entre esperado y contado.
- **Anulaciones:** al anular un pedido ya pagado, se requiere **motivo y detalle**. Aparecen en el arqueo con su monto y motivo para cuadrar los ingresos del turno.
- **Discrepancias:** se registran para auditoría. El umbral de tolerancia y la política de cierre con discrepancia son **POSPONIBLE** (definir con administrador antes de Sprint 3 — ver §13.3).

## 2.7 Roles e interfaces (V1 con autenticación JWT y control de permisos por rol en backend)
- **Roles funcionales:** `SUPER_ADMIN`, `ADMINISTRADOR`, `CAJERA`, `DESPACHADORA`, `COCINERO`.
- **Estructura Multi-sucursal:** La sucursal (`branch`) es el alcance natural de los reportes y operaciones.
  - `SUPER_ADMIN`: Acceso global a todas las sucursales y reportes consolidados.
  - Otros roles: Acceso restringido exclusivamente a su sucursal (`branchId`).
- **Decisión V1:** **el control de permisos SÍ se aplica en backend** en V1, vía autenticación JWT + un guard que valida el rol en cada endpoint. La UI además oculta las pantallas no relevantes a cada rol, pero **la UI no es la frontera de seguridad: el backend valida el rol y la sucursal en cada petición** (devuelve 401 sin token válido, 403 si el rol o acceso a sucursal no corresponde).
- **Matriz de autorización por rol:**
  - **SUPER_ADMIN:** Gestión de sucursales, reportes consolidados globales, configuración global.
  - **ADMINISTRADOR:** Registrar productos, registrar platos / variantes, crear usuarios (en su sucursal), modificar inventario (con motivo), ver reportes de su sucursal, crear descuentos y autorizar descuentos por turno.
  - **CAJERA:** Registrar ventas (mesa / llevar / custom), emitir vales, abrir / cerrar caja, registrar gastos, anular pedidos, aplicar descuentos, gestionar clientes (registrar / buscar por CI o NIT para factura nominada).
  - **DESPACHADORA:** Ver la cola de comandas, marcar pedidos como "listo" y "entregado".
  - **COCINERO:** Registrar ingreso de presas procesadas, anotar consumos manuales por turno (bolsas de papa, smile, etc.).
- **Sesiones por turno:** un mismo trabajador puede trabajar como cajera un día y como despachadora otro. Pero **dentro del mismo turno**, un usuario solo puede tener **1 sesión activa con 1 rol**. No puede estar simultáneamente activo como cajera y despachadora en el mismo turno.
- **Cajas por turno:** el sistema permite 1 o más cajas, pero **cada caja es atendida por 1 sola cajera por turno**.

## 2.8 Comandas, tickets, factura y notificaciones
- **Comanda interna (despachadora):** **digital por default**, listada en una interfaz dedicada para despachadoras. Aparece automáticamente al confirmar el pedido (incluso si está con pago pendiente). NO se imprime en térmica salvo decisión explícita.
- **Comanda del cliente (dos capas):** **(1) por pedido** — el cliente accede a una interfaz dedicada de **su pedido** mediante una URL/QR con un **token no adivinable** (no por `id`). Funciona para **todos**, incluso la venta anónima "S/N". **(2) por cliente / pedidos del día** — si la venta está vinculada a un cliente registrado (`customerId`), desde ese mismo acceso ve además **sus otros pedidos del día**, agrupados por cliente. La identidad (`customerId`) **agrupa**; el **token da el acceso** (ver §2.12 y §7.4). La venta anónima sin identidad solo ve su pedido único.
- **Factura (fiscal, para el cliente):** solo se emite si el cliente la solicita. En ese caso, se imprime en la impresora térmica local. Si la impresora falla, el sistema permite descargar la factura en PDF y delegar la impresión al navegador o lector de PDF del usuario.
- **Tipos de comanda / ticket:** solo dos tipos — **MESA** y **LLEVAR** (CUSTOM no es un tipo: es una marca sobre el pedido — regla y porqué en §2.10).
- **Campos obligatorios en comanda / ticket:** ID del pedido, tipo (MESA / LLEVAR), nombre del cliente, fecha y hora, lista de ítems con su descomposición (presas seleccionadas, bebidas, extras, sustituciones), total y responsable (cajera).
- **Notificación de pedido listo:** al marcarse como listo, el pedido aparece en una **pantalla pública** estilo "tickets de banco" dentro del local mostrando **únicamente el número de pedido**. Aplica tanto a pedidos **MESA como LLEVAR**. No se muestra nombre del cliente, ni ningún otro dato — solo el número de pedido. Suena una alerta breve. En MESA y LLEVAR, el cliente recoge el pedido de las despachadoras (IMPORTANTE ES UN RESTAURANTE DE AUTO SERVICIO). La despachadora marca el pedido como entregado desde su panel y este desaparece de la pantalla. El momento de "entregado" queda registrado.

## 2.9 Auditoría
- **Nivel V1:** solo se auditan **acciones críticas**: registro de venta, anulación de venta, ajuste de inventario, emisión de vale, apertura / cierre de caja, generación de reporte.
- **Registro:** cada acción auditada deja constancia de quién, cuándo, qué entidad afectó y qué cambió.
> La traducción técnica (entidad `AuditLog`, patrón de implementación y atomicidad) vive en [`docs/technical_guide.md` §4.3](technical_guide.md#43-auditoría--implementación-v1).

## 2.10 Ventas custom (presas surtidas)
- **Caso de uso:** a veces los clientes piden combinaciones que no encajan con los platos del menú (ej. "vendéme 2 pechos sueltos", "1 ala + 1 pierna + arroz"). Hoy la cajera fuerza la venta seleccionando un plato de precio similar y descuenta inventario manualmente. El nuevo sistema debe soportar esto de forma nativa.
- **CUSTOM no es un tipo de pedido:** una venta custom puede ser **MESA o LLEVAR** indistintamente. El tipo del pedido sigue describiendo el destino (MESA o LLEVAR); el carácter custom es una **marca** sobre el pedido, no un valor de tipo.
- **Flujo dedicado en el POS:** la cajera elige explícitamente el flujo "Venta Custom" (botón dedicado, ver §7.1). El sistema reserva un camino separado para este flujo, con sus propias validaciones, sin necesidad de inferir nada desde el contenido del pedido.
- **Estructura del ítem custom:** la cajera arma cada ítem indicando explícitamente:
  - cantidad y tipo de cada presa (ej. 2 pechos, 1 ala, 1 pierna),
  - acompañamientos opcionales (papa / arroz / mixto / smiles / plátano) — sin afectar el inventario granular,
  - bebidas opcionales (descuentan por unidad),
  - **precio unitario:** el sistema muestra un **precio sugerido** (suma del precio de venta de cada presa seleccionada + extras + bebidas); la cajera puede **aceptarlo o pisarlo** — el precio final lo confirma ella según política del negocio (ver "Precio sugerido en venta custom" abajo).
- **Inventario:** descuenta **exactamente** lo que la cajera indicó en las presas, al confirmar el pago.

En la implementación técnica estas presas vendidas en una venta custom quedan reflejadas como `OrderItemComponent` (una fila por componente de presa/bebida con referencia a `InventoryItem` cuando aplica) y el `OrderItem` guarda un `snapshot` JSON que se imprime en el ticket y se usa para auditoría.
- **Comanda y reportes:** la comanda se lista igual que cualquier otra, mostrando la composición real del ítem (ej. "2 - PECHO; 1 - ALA; 1 - PIERNA") y cabecera MESA o LLEVAR; los reportes filtran por la marca custom.

### Precio sugerido en venta custom (V1)
Cada tipo de presa cocida (pecho, ala, pierna, entrepierna) lleva un **precio de venta unitario** que configura el administrador. En la venta custom, como la cajera puede seleccionar **X presas y/o productos**, el sistema calcula un **precio sugerido** = suma de las presas seleccionadas (a su precio de venta) + extras + bebidas, y se lo muestra. Reglas:
- Es una **sugerencia, no una imposición**: la cajera puede pisar el precio (regla del §2.10 — ella decide). El sistema persiste el precio **confirmado**, nunca la sugerencia.
- Es solo **precio de VENTA**. El sistema **no registra el costo del pollo** ni calcula margen (fuera de alcance — descartado de V2).

### Visión V2 (no MVP) — auto-servicio
- Si el sistema se abre al público en modalidad **auto-servicio**, el cliente arma su propio pedido custom y el total se **calcula automáticamente** a partir del precio de venta por presa (ya definido en V1), sin intervención de la cajera.

## 2.11 Descuentos sobre la orden (incluye descuento al personal)

### Feature de descuentos (V1)
- **El administrador crea descuentos** desde su panel. Cada descuento tiene: **nombre**, **monto fijo por plato** (en Bs), **disponibilidad** (`siempre` / `solo a fin de turno`) y **requiere autorización** (`sí` / `no`). En V1 los descuentos son de **monto fijo** (no porcentaje) y se aplican **por plato** (a nivel ítem del pedido).
- **La cajera aplica el descuento por plato al registrar la venta** desde el POS (botón/selector dedicado): elige uno de los descuentos creados por el admin que esté disponible en ese momento y **marca qué platos de la orden lo llevan** (uno, varios o todos) — todo dentro del mismo registro del pedido, en una sola operación. Ejemplo: 3 platos de 30 Bs con descuento de 7 Bs c/u → 21 Bs de descuento, total 69 Bs. Se permite **un solo descuento por plato** (sin apilamiento); en una misma orden pueden convivir platos con y sin descuento.
- **Descuentos que requieren autorización:** si el descuento tiene `requiere autorización = sí`, la cajera **no puede aplicarlo libremente**: necesita que el administrador le otorgue una **autorización para el turno** (ver "Autorización de descuentos por turno" abajo). Mientras la sesión de cajera no esté autorizada para ese descuento, el POS no lo ofrece.
- **Registro sobre la venta:** en **cada plato con descuento** quedan guardados el **monto descontado por plato** (snapshot del monto fijo aplicado, ej. 7 Bs) y la **referencia al descuento aplicado**. A nivel orden quedan el **precio original** (suma de ítems antes de descuento) y el **total cobrado** (`precio_original − suma de descuentos de los platos`, lo que entra a caja). Aparece en arqueo y reportes para trazabilidad, y queda en auditoría.
- **Inventario intacto:** el descuento es **puramente monetario**. El inventario siempre descuenta el producto **real** vendido, nunca el equivalente al precio descontado.

### Descuento al personal (sobrante de pollo cocido) — instancia principal
- **Contexto (el porqué):** al final de cada turno (16:00 o 23:00), si sobra **pollo cocido en el expositor** (§2.3, plano cocido), el dueño permite vender una **Porción Media** al personal por **23 Bs** (en vez de 30). Hoy se registra incorrectamente como "Cuarto de Pollo (2 presas) - 23 Bs" para que el inventario cuadre — el nuevo sistema registra el **producto real** entregado, sin trucos.
- **Config:** "Descuento personal", monto fijo **7 Bs por plato**, disponibilidad `solo a fin de turno`, `requiere autorización = no` (cualquier cajera lo aplica cuando está disponible — no confundir con la compensación al cliente, que sí requiere autorización).
- **Marcado parcial:** si el sobrante solo alcanza para algunos platos, la cajera marca solo esos (mecánica por plato y ejemplo en el bloque Feature de arriba).

### Descuento de compensación al cliente (pollo defectuoso) — segunda instancia
- **Contexto (el porqué):** a veces el pollo cocido no sale bien (piernas quebradas, pechos partidos, alas mal cortadas). Para **compensar al cliente**, el dueño autoriza vender un plato de 30 Bs a **23 Bs**. Es un caso **distinto** del descuento al personal: beneficiario el **cliente** (no el personal), motivo un **defecto de calidad** (no el sobrante), disponible **todo el turno** (no solo al final).
- **Config:** "Compensación al cliente", monto fijo **7 Bs por plato afectado**, disponibilidad `siempre`, **`requiere autorización = sí`**: la cajera no puede aplicarlo por su cuenta — necesita la autorización por turno (subsección siguiente); autorizada, lo aplica a cuantos platos lo necesite hasta el cierre.

### Autorización de descuentos por turno
- **Qué es:** una habilitación que el administrador otorga **a la sesión de cajera de un turno** para aplicar un descuento marcado como `requiere autorización = sí`. Es el mecanismo que separa "el admin define el descuento" de "esta cajera, hoy, puede usarlo".
- **Alcance — por turno, no por orden:** la autorización se da **una sola vez por turno** y vale para **todo el turno**. NO se solicita ni se renueva por cada orden o pedido. Mientras dure el turno y la cajera esté autorizada, puede aplicar el descuento las veces que la operación lo requiera.
- **Atada a la cajera del turno:** la autorización se vincula a la **sesión de cajera** de ese turno. Como un usuario solo puede tener 1 sesión activa con 1 rol por turno (§2.7, FR-008b), la autorización vive y muere con esa sesión: **se extingue automáticamente al cerrar el turno** y no se hereda al turno siguiente.
- **Datos de la autorización:** descuento autorizado, sesión/cajera y turno beneficiados, administrador que la otorgó y fecha/hora.
- **Auditoría:** el **acto de autorizar** es una acción auditable por sí mismo (quién autorizó, a qué cajera, para qué descuento, cuándo), independientemente de cada aplicación posterior del descuento sobre una venta (que ya queda auditada como cualquier descuento).

### Nota de diseño — catálogo mínimo, NO motor de reglas
> Decisión de arquitectura para quien implemente. El requisito es **"el admin crea descuentos y la cajera los aplica por plato"** — esa configurabilidad ES la feature, así que se justifica un **catálogo mínimo** de descuentos (entidad `Discount`: nombre, monto fijo por plato, disponibilidad, activo). NO confundir con un motor de reglas:
- **Alcance acotado a propósito:** exactamente lo definido en el bloque Feature (monto fijo, nivel ítem, sin apilamiento, ventanas `siempre`/`fin de turno`) y nada más. Si en el futuro hace falta %, apilamiento o combinaciones de descuentos, se agrega **con un caso real**, no antes.
- **La autorización por turno es la única excepción de control, y entra con un caso real:** el descuento de compensación al cliente exige que el admin habilite a la cajera, así que el catálogo suma **un flag `requiereAutorizacion`** en el `Discount` y una **autorización por turno** (admin → sesión de cajera). Sigue sin ser un motor de reglas: es un **flag de habilitación a nivel turno** (autorizado sí/no), NO un contador de usos ni una cuota por pedido o por plato. Una vez autorizada, la cajera aplica el descuento sin límite de cantidad hasta el cierre del turno.
- **El monto se congela en la transacción (snapshot), NO se deriva de una resta:** al aplicar un descuento, **cada plato (ítem) marcado copia** el `discountAmount` del **monto fijo vigente** en el catálogo (ej. 7 Bs) y guarda la referencia al `Discount`. Ojo: con monto fijo el `discountAmount` **es el valor que fijó el admin**, no el resultado de una resta — al revés, los totales son los derivados (precio del ítem = `(unitPrice − discountAmount) × cantidad`; total de la orden = `precio_original − suma de descuentos de los platos`). Se congela en el ítem para que, si el admin edita el descuento después (de 7 a 10 Bs), las ventas viejas conserven los 7 Bs con que realmente se cobraron. Detalle de campos en [`docs/technical_guide.md` §3](technical_guide.md).
- **Los vales (§2.4) NO son descuentos:** no suman a caja y descuentan nómina — concepto aparte, no se mezclan en este feature.

---

## 2.12 Clientes y facturación nominada

- **Por qué existe un cliente como entidad:** el negocio **factura** (la mayoría de las ventas el cliente pide factura con sus datos, en Bolivia para su RC-IVA). Para eso la cajera debe poder **registrar** y **reutilizar** clientes. El cliente es una **entidad** (`Customer`), no un simple string en la orden.
- **Datos del cliente:** CI, NIT (opcional), nombres, apellidos, sexo (`HOMBRE` / `MUJER`), fecha de nacimiento (opcional), celular, correo. La cajera **busca un cliente ya registrado por CI o NIT**; el cliente, para su factura, puede **dictar su CI o su NIT**.
- **Registro OPCIONAL por venta (regla legal):** facturar es obligatorio, pero la **nominatividad solo aplica a ventas mayores a Bs 1.000** (SIN / RND 102100000011). El ticket típico está por debajo de ese umbral, así que se puede facturar **"S/N" (sin nombre, sin NIT)**. Por eso vincular un cliente a la orden (`Order.customerId`) es **opcional**: si no se identifica, la orden queda como "S/N". **No** se usa el NIT `99001` para "sin nombre" (es exclusivo de misiones diplomáticas).
- **Identidad ≠ acceso (regla de seguridad):** el `customerId` (o el NIT) sirve para **agrupar** los pedidos de un cliente (uso interno). El **acceso** a la vista pública del cliente va **siempre por un token no adivinable** (o, en V2, por login). El **NIT NO es una llave de acceso**: no es secreto, así que jamás se usa en la URL para listar pedidos — si no, cualquiera vería los pedidos ajenos probando números.
- **Vista de "pedidos del día":** solo para clientes **identificados**. Un cliente anónimo ("S/N") no tiene identidad para agrupar, así que solo puede ver el pedido individual de su token. (Ver §7.4 y FR-019.)
- **Fuera de alcance de V1:** la integración fiscal con el SFE del SIN (CUF, código de control, envío al SIN) es un módulo aparte; esta sección solo cubre la **entidad cliente** y su vínculo con la orden.

---

# 3. Modelo de datos
> **Trasladado a la guía técnica.** El detalle de entidades, campos y relaciones del esquema lógico de base de datos vive en [`docs/technical_guide.md` §3](technical_guide.md). Este PDR mantiene únicamente las reglas de negocio que esas entidades deben respetar.

---

# 4. Máquina de estados de pedidos
> Los efectos transaccionales detallados (campos, timestamps, reversiones de inventario) viven en [`docs/technical_guide.md` §4](technical_guide.md). Esta sección describe los estados y las reglas de negocio que rigen las transiciones.

**Estados:** registrado → confirmado → en preparación → listo → entregado → cerrado.
Estados adicionales: **pago pendiente**, **anulado**, **en espera**.

**Transiciones y reglas (a nivel negocio):**

- **Confirmación de pedido con pago inmediato.** La cajera registra y cobra: pasa a preparación, descuenta inventario, contabiliza el ingreso, genera la comanda digital y —si el cliente la pide— imprime la factura.
- **Registro con pago pendiente / confirmación de pago / cancelación del pendiente.** Rigen las reglas de §2.5 (se prepara de inmediato; inventario e ingreso recién al pagar; cancelación siempre manual, sin timeout ni motivo).
- **Marcado como listo.** El pedido se muestra en la pantalla pública (solo número de pedido, §2.8) y suena una alerta breve. Aplica a MESA y a LLEVAR por igual.
- **Entrega.** El cliente recoge / el delivery retira. La despachadora marca el pedido como entregado.
- **Cierre.** Acción administrativa, típicamente al cierre de turno.
- **Anulación de un pedido ya pagado.** Requiere **motivo y detalle obligatorios**. El sistema revierte el inventario y la anulación queda en el arqueo del turno con su monto. Queda auditado.

**Regla transaccional (negocio):** la confirmación de pago y el descuento de inventario deben ocurrir como una sola operación inseparable. Si no hay stock suficiente, el pedido permanece en su estado anterior y se avisa a la cajera qué falta.

---

# 5. Requerimientos funcionales (completos) y criterios de aceptación
> **Trasladado a un documento dedicado.** El detalle de los requerimientos funcionales (FR-001 a FR-017) con sus criterios de aceptación vive en [`docs/requirements.md` §1](requirements.md). Este PDR mantiene las reglas de negocio (§2) que esos FR deben respetar y el alcance V1/V2 (§13).

---

# 6. Requerimientos no funcionales
> **Trasladado a un documento dedicado.** Las calidades de uso de cara al negocio viven en [`docs/requirements.md` §2](requirements.md). El detalle de NFR técnicos (rendimiento, seguridad, escalabilidad, multiplataforma, impresión, despliegue, backups) vive en [`docs/technical_guide.md` §2](technical_guide.md).

---

# 7. UX / UI — requisitos y pantallas clave
> Diseñar pantallas con foco en velocidad y claridad para personal con tolerancia a errores.

## 7.1 POS (Cajera)
- **Objetivo:** Registrar venta en ≤3 pasos.
- **Elementos:** Categorías, búsqueda rápida, botones de producto, selección de variante, selector/radiobuttons de sustitución (1, sin alterar precio), selector/radiobuttons de presas (par fijo: pecho-ala / pierna-entrepierna), keypad numérico, total visible, botones: `Confirmar Pago`, `Guardar Pendiente (LLEVAR)`, `Vale`, `Venta Custom`, `Aplicar Descuento`.
- **Atajos:** (opcional) teclas para categorías, confirmar venta, abrir caja, aplicar vale.

## 7.2 Panel Despacho
- **Objetivo:** Cola clara de comandas digitales en preparación; marcar pedidos como "listo" y "entregado".
- **Elementos:** Lista ordenada por hora de emisión; filtros (en preparación, listo, entregado); detalle por pedido con composición; botón "Marcar entregado" con confirmación; indicador visual para pedidos con pago pendiente.

## 7.3 Pantalla pública (clientes en local)
- **Objetivo:** Mostrar los pedidos listos estilo "turnos de banco" para anunciar al cliente. Aplica a **MESA** y **LLEVAR** indistintamente.
- **Elementos:** **Únicamente el número de pedido**. Sin nombre, sin mesa, sin ningún otro dato. Sonido breve al aparecer.

## 7.4 Vista del cliente (su comanda)
- **Objetivo (capa base — por pedido):** el cliente accede a una **URL/QR única de su pedido** mediante un **token no adivinable** (`Order.publicToken`, no el `id` interno) y ve su comanda con composición y total. **No requiere login ni registro** — el token es la credencial (patrón "capability URL"). Intentar otro token o el `id` → no funciona. Funciona también para la venta anónima "S/N".
- **Objetivo (capa extra — pedidos del día):** si el pedido está vinculado a un cliente registrado (`customerId`), desde el mismo acceso se listan **todos sus pedidos del día**, agrupados por cliente. El agrupado usa `customerId`; el acceso lo habilita el token, **no el NIT** (ver §2.12).
- **Elementos:** Nombre (o "S/N"), mesa, items con descomposición, total, estado actual; y —si hay cliente— la lista de sus pedidos del día.
- **Alcance:** vista del día en **V1 vía token**; el login de cliente con cuenta propia (`GET /me/orders`) llega en **V2** con la venta abierta al público (§13).

## 7.5 Administración
- **Objetivo:** CRUD productos/variantes (incluye precio de venta por presa), inventario, usuarios, reportes, gestión de vales, gestión de descuentos.
- **Elementos:** Formularios producto, definición variantes, panel inventario por presas, registro consumos manuales, listado vales, reportes exportables.

## 7.6 Cocinero (consumos manuales)
- **Objetivo:** Al final de turno, registrar bolsas papa/smile usadas, etc.
- **Elementos:** Formulario simple por ítem de inventario manual.

## 7.7 Factura (impresión / PDF)
- **Formato:** Similar a los [ejemplos de ticket en `business_context.md`](business_context.md#ejemplo-de-comadastickets-impresas-por-el-sistema-actual-a-remplar); incluir sustituciones y responsable.
- **Fallback:** PDF descargable; el navegador maneja la elección de impresora. Revisar si los ticjets necesitar incluir QR para que el cliente ueda escanear y ver sus comandas del dia.

---

# 8. API y contratos
> **Trasladado a la guía técnica.** El catálogo de endpoints, la estructura de respuesta estándar (éxito/error), los códigos de error y las reglas de seguridad viven en [`docs/technical_guide.md` §5](technical_guide.md).

---

# 9. Anexos técnicos
> **Trasladado a la guía técnica.** Los JSON payloads de ejemplo, el OpenAPI skeleton y los 15 casos de prueba E2E priorizados viven en [`docs/technical_guide.md` §6 / §7 / §8](technical_guide.md).

---

# 10. Prioridad de trabajo y roadmap de entregas (MVP en sprints)
**Sprint 0 (planificación + datos):** Modelado de datos definitivo (orden custom, descuentos con flag `requiereAutorizacion`, autorización de descuento por turno, timestamps de listo/entregado), esquema y diagramas. Definir umbral de discrepancia de arqueo con el administrador.

**Sprint 1:** Productos y variantes + POS básico (MESA/LLEVAR, sustitución sin afectar precio, confirmación de pago, comanda digital).

**Sprint 2:** Inventario por presas (descuento al pagar, transacciones atómicas) + flujo dedicado de venta custom de presas surtidas + dashboard de stock + consumos manuales.

**Sprint 3:** Caja, turnos y arqueo (con anulaciones y vales) + reportes básicos + feature de descuentos (descuento al personal + compensación al cliente con autorización por turno).

**Sprint 4:** Notificaciones (pantalla pública) + factura térmica + vista pública del cliente + impresión PDF como fallback.

**Sprint 5:** Auditoría (acciones críticas) + sesión única por turno + pruebas E2E + optimizaciones + despliegue local.

---

# 11. Despliegue
> **Trasladado a la guía técnica.** El detalle de modo de operación, distribución, sincronización a nube y backups vive en [`docs/technical_guide.md` §9](technical_guide.md).
>
> Resumen para negocio: en **V1** el sistema corre localmente en el restaurante (sin nube). La **sincronización a la nube y los backups automáticos** son parte de la **V2** (ver §13).

---

# 12. Criterios de aceptación del MVP (resumen)
> **Trasladado.** Los criterios de aceptación **verificables** viven junto a cada FR en [`docs/requirements.md`](requirements.md) (FR-001…FR-019); el **alcance consolidado** ítem por ítem está en [§13.1](#131-versión-1-mvp--incluido). El MVP se acepta cuando todos los FR de prioridad Alta cumplen su criterio.

> **Stack tecnológico:** especificado en [`docs/technical_guide.md` §1](technical_guide.md).

---

# 13. Alcance V1 (MVP) vs V2 (Futuro)
> Esta sección consolida en una sola tabla qué funcionalidades entran en la **Versión 1 (MVP)** y cuáles se difieren explícitamente a la **Versión 2**. Sirve como referencia única para el LLM, el equipo de desarrollo y el cliente. Todo lo que no aparezca en V2 debe asumirse como V1.

## 13.1 Versión 1 (MVP) — Incluido

### Productos, variantes y POS
- Gestión completa (alta, edición, baja) de productos y variantes (FR-001).
- Composición visible en POS y ticket: presas, bebidas, extras, sustituciones (§2.2).
- Sustitución de acompañamiento **sin alterar el precio**; máximo 1 sustitución por ítem (§2.1, FR-001).
- POS estándar para pedidos **MESA** y **LLEVAR** (FR-002).
- **Flujo dedicado de venta custom** con precio sugerido que la cajera puede aceptar o pisar (§2.10, FR-002b), alimentado por el **precio de venta por tipo de presa** que configura el admin.
- **Feature de descuentos por plato** con sus dos instancias principales — descuento al personal y compensación al cliente — y la **autorización por turno** para los que la requieren (§2.11, FR-016 / FR-016b).

### Estados, pago y cancelación
- Máquina de estados completa (§4); pago pendiente según §2.5 (FR-011); anulación de pagados con motivo y detalle + reversión de inventario (FR-011b); pago + descuento de inventario como operación inseparable (§2.3, §4).

### Inventario
- **Plano cocido (transaccional)** con descuento al confirmar pago, y **plano crudo** anotado por turno con autopoblado del reproceso (§2.3, FR-006 / FR-017).
- Descuento automático de bebidas por unidad al pagar; consumos manuales por turno (FR-017); ajuste manual por admin con motivo; dashboard de stock cocido con delta del turno.

### Vales (descuento por nómina)
- Registro sin umbral ni límite, con listado filtrable; descuentan inventario y NO suman a caja (§2.4, FR-005).

### Caja y arqueo
- Apertura y cierre por turno (1 caja = 1 cajera, §2.7, FR-004); arqueo con el desglose de §2.6, exportable a CSV; registro de gastos desde caja (FR-009).

### Comandas, tickets, factura, vista pública
- **Comandas digitales** por default en el panel de despachadoras (§2.8, FR-003); historial con búsqueda (FR-012).
- **Vista pública del cliente** por token no adivinable, con "pedidos del día" para clientes registrados (§2.8/§7.4, FR-015 / FR-019).
- **Registro y búsqueda de clientes** para factura nominada; vínculo opcional a la orden — anónimo = "S/N" (§2.12, FR-019).
- **Factura solo a demanda**: térmica con fallback a PDF (§2.8, FR-014). Tipos de ticket: solo MESA y LLEVAR (§2.10).

### Notificaciones
- **Pantalla pública** "tickets de banco" con únicamente el número de pedido, MESA y LLEVAR por igual; momentos de listo/entrega persistidos (§2.8, FR-007).

### Usuarios, roles, sesiones
- Roles funcionales + **permisos por rol enforced en backend** vía JWT (§2.7, FR-008 / FR-018); **sesión única por turno** (FR-008b).

### Reportes (MVP)
- Ventas por turno/día, inventario de presas, arqueo con desglose — exportables a CSV (FR-010).

### Auditoría
- Registro de auditoría solo para **acciones críticas**: ventas, anulaciones, ajustes de inventario, emisión de vales, apertura/cierre de caja, generación de reportes (§2.9).

### Despliegue
- Aplicación web local (on-premise). Detalles técnicos en [`docs/technical_guide.md` §9](technical_guide.md).

---

## 13.2 Versión 2 (Roadmap futuro) — Diferido explícitamente

### Modalidad auto-servicio
- POS para cliente final: el cliente arma su propio pedido custom sin intervención de la cajera, con el total **calculado automáticamente** a partir del precio de venta por presa (definido en V1) (§2.10 visión v2).
- **Cuenta de cliente con auto-registro y login:** el cliente se registra y accede con su sesión a **sus pedidos del día/histórico** (`GET /me/orders`), seguro por autenticación — sin depender del token por pedido. Es la evolución natural de la vista del cliente de V1 (§7.4 / §2.12, FR-019).

### Reportes adicionales
- Reporte de **productos más vendidos** (deseable, no obligatorio MVP — FR-010).
- Reporte de **discrepancias automáticas** entre caja esperada y contada.

### Agenda semanal de personal (rostering)
- Asignación **persona → día → turno → rol**: qué días trabaja cada quien, en qué período (Mañana/Noche) y con qué rol. Caso real que la motiva: el personal rota (Valeria trabaja unos días de mañana y otros de noche, y no siempre con el mismo rol — §2.7). En V1 el período del turno se confirma en la apertura de caja (§13.3); la agenda automatiza esa preselección y habilita validaciones ("hoy no te toca") en V2.

### Backups y persistencia
- **Backup diario automático** de la base de datos.
- **Backup manual on-demand** para el administrador desde la UI.
- **Política contable formal de vales**: confirmar con contabilidad local cómo se reflejan en libros (§13.3 residual).

### Sincronización a nube
- Despliegue **híbrido local + nube** con sincronización diferencial.
- **Estrategia de resolución de conflictos**: priorizar cambios locales recientes y registrar conflictos para resolución manual.
- Operación offline tolerable.

### Distribución
- **Empaquetado estandarizado** para portabilidad cross-host y onboarding rápido (V1 lo deja opcional).

---

## 13.3 Decisiones residuales pendientes de cierre antes de V1
> Estos puntos quedaron sin resolver tras Fase 1 y deben cerrarse con el administrador **antes de Sprint 3** (caja/arqueo). Si no se resuelven, se aplica el default sugerido.

| Decisión | Opciones | Default sugerido si no se decide |
|----------|----------|----------------------------------|
| Umbral de discrepancia aceptable en arqueo (§2.6) | 0 Bs / 5 Bs / 10 Bs / otro | 5 Bs |
| Política ante discrepancia en cierre (§2.6) | Registrar y permitir / Registrar + alertar + permitir / Bloquear hasta validación admin | Registrar + alertar + permitir |
| Reporte de discrepancias automáticas | Entra en V1 / Difiere a V2 | Difiere a V2 |
| Política contable formal de vales | Cerrar con contabilidad ahora / Difiere a V2 | Difiere a V2 |
| Quién confirma el **período del turno** (Mañana/Noche) al abrir la caja | Se confirma en la pantalla de apertura (el admin la inicia/supervisa — ver descripción organizacional en business_context) / El admin lo fija por cajera / Agenda semanal (V2) | Se confirma en la pantalla de apertura, con preselección sugerida **editable** (misma filosofía que el autopoblado del reproceso crudo §2.3: el cálculo automático es una ayuda). NO es atributo fijo del usuario: el personal rota días, turnos y roles (§2.7 — caso real: Valeria trabaja unos días de mañana y otros de noche) |

> **Descartado — inferir el período por hora (reloj local o API externa de hora):** se evaluó y **NO** se adopta. Motivos: (1) el sistema es on-premise sin nube en V1 ([§11](#11-despliegue)) — depender de una API de internet para una operación tan básica como abrir caja deja al negocio sin poder vender si falla la conexión; (2) el problema de fondo no es "de dónde sale la hora" sino usar la hora para **decidir** un dato de negocio — ninguna hora exacta sabe que el dueño movió el horario de un turno o creó uno nuevo, eso solo lo sabe el catálogo de turnos. Si se quiere reducir el clic de la cajera, la **preselección sugerida** (fila de arriba) puede apoyarse en el reloj **local del dispositivo** sin red ni inferencia en el backend — sigue siendo la cajera quien confirma.

---

# 14. Riesgos y decisiones POSPONIBLES (residuales tras Fase 1)
> La mayoría de los POSPONIBLES de la versión 1.0 quedó resuelta en el cuestionario Fase 1: esas decisiones cerradas están **codificadas como reglas en §2** (no se re-listan acá). Las **residuales abiertas** viven en la tabla única de [§13.3](#133-decisiones-residuales-pendientes-de-cierre-antes-de-v1), con opciones y default sugerido.

---

## Observación final (para el LLM y el equipo)
Este PRD está centrado en las **reglas de negocio** y en la **consistencia transaccional** (ventas ↔ inventario ↔ arqueo). La implementación técnica (modelo de datos, API, payloads, despliegue) vive en [`docs/technical_guide.md`](technical_guide.md).

**Reglas críticas de negocio que NO se pueden alterar al implementar** (detalle y porqués en cada sección):
1. La sustitución de acompañamiento NO modifica el precio del plato (§2.1).
2. El inventario se descuenta al confirmar el pago, NO al pasar a preparación (§2.3).
3. Pago pendiente: se prepara de inmediato; cancelación siempre manual, sin timeout (§2.5).
4. Comandas digitales por default; solo la factura se imprime, y solo a demanda (§2.8).
5. Permisos por rol enforced en backend (JWT); la UI no es la frontera de seguridad (§2.7).
6. CUSTOM nunca es un tipo de pedido — es una marca; la venta custom es MESA o LLEVAR (§2.10).
7. Los descuentos se aplican **POR PLATO** con snapshot congelado en cada ítem, nunca por orden (§2.11).
8. La compensación al cliente **requiere autorización del admin**, con alcance **por turno** — no por orden ni por plato — y se extingue al cierre (§2.11).
