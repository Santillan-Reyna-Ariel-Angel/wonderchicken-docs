# Cuestionario Unificado para Mejorar el PDR (Fase 1)

Este documento organiza las preguntas de negocio en un formato de taller, con dos tipos de ítems:

- Preguntas con respuesta ya definida: se conserva la respuesta original sin cambios.
- Preguntas pendientes: incluyen opciones `a`, `b`, `c` y `otro` para facilitar decisión rápida.

---

## 1. Inventario y Productos

### 1.1 ¿Cómo se registran las entradas de pollo (procesado, reproceso, sobrante) en el sistema?
Respuesta: las entrada son procesados.

### 1.2 ¿Cada venta descuenta automáticamente las presas? ¿Cómo se reflejan los pares fijos (pecho-ala, pierna-entrepierna)?
Respuesta: De cada venta se deberia descontar las presas. Por ejemplo una porcion media trae 2 presas (pecho-ala o pierna-entrepierna), el cliente decide que par de presas seran.

### 1.3 ¿Qué pasa con ventas custom (ej. dos pechos)? ¿Se permiten o se registran como excepción?
- a) Se permiten libremente y descuentan inventario según selección real.
- b) Se permiten solo con autorización de administrador.
- c) No se permiten en el MVP; solo combinaciones predefinidas.
- otro) ________

### 1.4 ¿Cómo se controlan insumos como arroz, papas y bebidas? ¿Por unidad, por bolsa, por lote?
Respuesta: Ene l inventario solo se anota la cantidad de bolsas de papa usadas en cada turno.  Las bebidas deberian descontarse por unidad.

### 1.5 Momento de descuento de inventario de presas
- a) Al confirmar pedido (confirmed).
- b) Al iniciar preparación (preparing).
- c) Al confirmar pago (paid).
- otro) ________

---

## 2. Variantes y Sustituciones

### 2.1 ¿El precio cambia cuando se sustituye un acompañamiento (papa -> arroz -> Smiles)?
- a) Sí, siempre se recalcula con el precio del nuevo acompañamiento.
- b) No, se mantiene el precio base del producto.
- c) Depende del producto/variante configurada por administrador.
- otro) ________

### 2.2 ¿Se permite más de una sustitución por plato?
- a) Solo 1 sustitución por ítem.
- b) Hasta 2 sustituciones por ítem.
- c) Sin límite, mientras se registre el ajuste de precio.
- otro) ________

### 2.3 ¿Cómo se refleja la sustitución en el ticket y en el inventario?
- a) Se imprime el detalle de sustitución y descuenta inventario por componente final.
- b) Solo se refleja en ticket, sin impacto de inventario diferenciado.
- c) Solo se refleja en inventario, sin detalle explícito en ticket.
- otro) ________

---

## 3. Pedidos y Estados

### 3.1 ¿Cuál es la máquina de estados definitiva de un pedido (ej. registrado -> preparando -> listo -> entregado -> cerrado)?
- a) `created -> confirmed -> preparing -> ready -> delivered -> closed`.
- b) `created -> preparing -> ready -> delivered -> closed`.
- c) `created -> pendingPayment -> confirmed -> preparing -> ready -> delivered -> closed`.
- otro) ________

### 3.2 ¿Qué pasa con pedidos delivery si el pago no llega? ¿Se cancelan automáticamente?
Respuesta: El delivery debe realizar el pago para que recien se regsitre la venta.

### 3.3 ¿Se permite registrar pedidos con pago pendiente?
Respuesta: El nuevo sistema debe contemplar esto, el actual no lo hace.

### 3.4 Preparación de pedidos en estado pendiente de pago
- a) Se prepara inmediatamente aunque esté pendiente.
- b) No se prepara hasta confirmar pago.
- c) Se prepara solo para clientes frecuentes autorizados.
- otro) ________

### 3.5 Tiempo máximo para mantener un pedido pendiente de pago
- a) 15 minutos.
- b) 30 minutos.
- c) 60 minutos.
- otro) ________

### 3.6 Cancelación de pedido ya confirmado
- a) Permitida con reverso automático de inventario y movimientos de caja.
- b) Permitida solo con aprobación de administrador y reverso controlado.
- c) No permitida después de pasar a preparing.
- otro) ________

---

## 4. Vales y Ventas Internas

### 4.1 ¿Cómo se registran los vales en el sistema (como venta con método vale, como gasto, como descuento)?
- a) Como venta con método de pago `vale`.
- b) Como egreso/gasto de caja.
- c) Como descuento interno vinculado al trabajador.
- otro) ________

### 4.2 Naturaleza del vale de empleado
- a) Solo descuento por nómina (sin cobro en caja).
- b) Solo canje inmediato (impacta caja al momento).
- c) Ambos, con tipos separados de vale.
- otro) ________

### 4.3 ¿Se aplican límites por trabajador (cantidad o monto)?
- a) Límite por monto mensual.
- b) Límite por cantidad de vales por mes.
- c) Sin límite fijo, solo aprobación administrativa.
- otro) ________

### 4.4 Umbral para aprobación obligatoria de vales
- a) Desde 30 Bs.
- b) Desde 50 Bs.
- c) Desde 100 Bs.
- otro) ________

### 4.5 ¿Cómo se reflejan en reportes y arqueos?
- a) Se muestran en arqueo y reporte de vales por trabajador.
- b) Solo en reporte mensual de nómina.
- c) Solo en reporte contable interno.
- otro) ________

### 4.6 Política de descuento interno al personal
- a) Porcentaje fijo por producto.
- b) Precio fijo especial por producto.
- c) Descuento variable con aprobación caso a caso.
- otro) ________

---

## 5. Caja y Arqueo

### 5.1 ¿Qué información mínima debe tener un arqueo (apertura, cierre, ingresos, egresos, vales)?
- a) Apertura, cierre, ventas totales y diferencia final.
- b) Apertura, cierre, ventas por método, gastos, vales, diferencia.
- c) Todo lo anterior + detalle por transacción.
- otro) ________

### 5.2 ¿Cuál es el umbral de discrepancia aceptable entre caja y tickets?
- a) 0 Bs (sin tolerancia).
- b) 5 Bs.
- c) 10 Bs.
- otro) ________

### 5.3 ¿Qué proceso se sigue si hay diferencias?
- a) Registrar observación y permitir cierre.
- b) Registrar, alertar y solicitar validación de administrador.
- c) Bloquear cierre hasta conciliación completa.
- otro) ________

### 5.4 Cierre de caja con discrepancia entre esperado y contado
- a) Se registra diferencia y se permite cerrar sin bloqueo.
- b) Se registra diferencia, se genera alerta y se permite cerrar.
- c) Se bloquea cierre si supera umbral y requiere validación admin.
- otro) ________

---

## 6. Reportes

### 6.1 ¿Qué reportes son obligatorios en el MVP (ventas por turno, inventario de presas, arqueo de caja, vales)?
Respuesta: Ventas por turno, inventario de presas, arqueo de caja.

### 6.2 ¿Se requiere reporte de productos más vendidos?
Respuesta: Es algo deseable pero no indispensable.

### 6.3 ¿Se necesita reporte de discrepancias automáticas?
- a) Sí, obligatorio desde MVP.
- b) Sí, pero para una fase posterior.
- c) No, solo revisión manual.
- otro) ________

---

## 7. Roles, Usuarios y Turnos

### 7.1 ¿Qué acciones son exclusivas del administrador (ej. anular venta, modificar inventario)?
Respuesta: por ahora solo seria modificar el inventario(con registro de quin lo hizo, timestamp y descripcion/motivo).

### 7.2 ¿Las cajeras pueden registrar vales o solo el administrador?
Respuesta: las cajeras si peuden registrar vales.

### 7.3 ¿Qué pasa si un trabajador rota de cajera a despachadora en la semana? ¿Usa la misma cuenta o distinta?
Respuesta: Actualmente, se presume que usa la misma cuenta, pues solo hay una caja que es atendida por 1 cajera durante 1 turno de manera  simultanea.
El nuevo sistema podria tener 1 o mas cajas, pero solo se debe permitir que una caja sea atentida por 1 cajera a la vez por tueno.

### 7.4 Regla de turnos activos por usuario
- a) Máximo 1 turno abierto por usuario en todo momento.
- b) 1 turno abierto por caja, aunque el usuario rote.
- c) Múltiples turnos por usuario con restricciones y auditoría.
- otro) ________

### 7.5 Matriz de permisos para MVP
- a) Estricta por rol, sin excepciones.
- b) Por rol con excepciones temporales autorizadas.
- c) Flexible por usuario según necesidad operativa.
- otro) ________

---

## 8. Tickets, Notificaciones e Impresión

### 8.1 ¿Qué campos obligatorios debe tener el ticket térmico (cliente, fecha, productos, variantes, responsable)?
Respuesta: este es un ejemplo de ticket:

```text
                  TICKET PARA MESA 70
                     WONDER CHICKEN
------------------------------------------------------
NOMBRE: GOMEZ
FECHA: 04/05/2024      22:10
------------------------------------------------------
CANT. | DETALLE              | P. UNIT | TOTAL
------------------------------------------------------
  2   | WONDER               | 36.00   | 72.00
      | 2 - PECHO-ALA
      | 1 - FANTA PAPAYA (500 ml)
      | 1 - MOCOCHINCHI (500 ml)
      | FRIAS
------------------------------------------------------
                  TOTAL BS.:             72.00
------------------------------------------------------
RESPONSABLE: ROXANA
```

### 8.2 ¿Cómo se notifica al cliente que su pedido está listo (pantalla, sonido, número de ficha)?
Respueta: El nuevo sistema debe lisitar los pedidos listos (parecido a las pantallas de tickets de los bancos, es decir sera uan pantlla/interfaz publica dentro del negocio)

### 8.3 ¿Se guarda un historial digital de comandas para auditoría?
Respuesta: Si debe guardarse los datos para poder ser consultados/usados en un futuro.

### 8.4 Documento emitido al confirmar venta
- a) Factura fiscal + comanda de cocina.
- b) Solo comanda (sin factura en ese flujo).
- c) Ticket comercial + factura solo cuando corresponda.
- otro) ________

### 8.5 Arquitectura de impresión de comandas
- a) Impresión local desde el frontend (caja).
- b) Impresión centralizada desde backend/servidor.
- c) Modo híbrido con fallback automático a PDF.
- otro) ________

### 8.6 Contingencia ante falla de impresora térmica
- a) Reintentar 3 veces y luego generar PDF.
- b) Generar PDF inmediatamente.
- c) Redirigir a impresora secundaria y dejar trazabilidad.
- otro) ________

---

## 9. Rendimiento y Despliegue

### 9.1 ¿Cuál es la meta de respuesta aceptable en LAN (200 ms, 300 ms)?
- a) <= 200 ms para operaciones críticas.
- b) <= 300 ms para operaciones críticas.
- c) <= 500 ms para operaciones críticas.
- otro) ________

### 9.2 ¿Dónde se desplegará inicialmente el backend (Windows local, Linux, nube)?
- a) Windows local en el restaurante.
- b) Linux local (servidor on-premise).
- c) Nube (con acceso remoto).
- otro) ________

### 9.3 ¿Se requiere instalador sencillo (ej. Docker Compose) para el restaurante?
- a) Sí, obligatorio para MVP.
- b) Sí, pero en fase posterior.
- c) No, instalación manual por equipo técnico.
- otro) ________

### 9.4 Política de respaldo de base de datos
- a) Backup diario automático.
- b) Backup por turno.
- c) Backup diario + semanal completo de seguridad.
- otro) ________

---

## 10. Auditoría

### 10.1 Nivel de auditoría para MVP
- a) Solo acciones críticas (ventas, anulaciones, ajustes, vales).
- b) Críticas + cambios de estado de pedido y caja.
- c) Auditoría integral de todas las acciones operativas.
- otro) ________

---

## Uso recomendado en taller

- Marcar una opción por pregunta pendiente.
- Si se marca `otro`, describir la regla exacta.
- Al finalizar, pasar decisiones al PDR como reglas cerradas del MVP.
