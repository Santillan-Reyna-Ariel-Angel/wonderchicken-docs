# Cuestionario Unificado para Mejorar el PDR (Fase 1)

Este documento organiza las preguntas de negocio en un formato de taller, con dos tipos de ítems:

- Preguntas con respuesta ya definida: se conserva la respuesta original sin cambios.
- Preguntas pendientes: incluyen opciones `a`, `b`, `c` y `otro` para facilitar decisión rápida.

---

## 1. Inventario y Productos

### 1.1 ¿Cómo se registran las entradas de pollo (procesado, reproceso, sobrante) en el sistema?
- S. actual: Las entrada son procesado.
- S. deseada: procesado

### 1.2 ¿Cada venta descuenta automáticamente las presas? ¿Cómo se reflejan los pares fijos (pecho-ala, pierna-entrepierna)?
- S. actual: El sistema actual no realiza el descuento de presas. Actualmente se usa un registro manual para realizar el seguimiento del inventario de presas al final de cada turno.
- S. deseada: De cada venta se deberia descontar automaticamente las presas. Por ejemplo una porcion media trae 2 presas (pecho-ala o pierna-entrepierna), el cliente escoje el par de presas en de su plato.

### 1.3 ¿Qué pasa con ventas custom (ej. dos pechos)? ¿Se permiten o se registran como excepción?
- S. actual: El sistema actual no permite una venta custom, la cajera realiza esta venta custom seleccioando un plato que encaje en precio. Pero las presas reales vendidas se descuentan del registro de "INVENTARIO DIARIO". 
- S. deseada: El nuevo sistema debe permitir una venta custom, (2 pechos, 2 alas, etc). El nuevo sistema debe permitir registrar la venta custom y descontar el inventario de presas correspondiente a lo que se vendio. Por ejemplo, si se vende 2 pechos, se debe descontar 2 pechos del inventario. Si se vende 1 ala y 1 pierna, se debe descontar esa misma cantidad del inventario. (crear endpoint especifico para custom)

### 1.4 ¿Cómo se controlan insumos como arroz, papas y bebidas? ¿Por unidad, por bolsa, por lote?
- S. actual: Se usa el registro manual "INVENTARIO DIARIO", en el cual se anota la cantidad de bolsas de papa usadas en cada turno. Las bebidas de descuentan por unidad. Tambien las despachadoras suelen anotar: envacez de arroz, bombillas, basos desachables de 500ml, etc. (Revisar INVENTARIO DIARIO para mas detalles)
- S. deseada: El sistema debe controllar el inventario. Debe descontar automaticamente las bebidas (por unidad y por cada venta). Debe permitir anotar al cantidad de bolsas de papa(y papa smile) usadas en cada turno y descontarlas del inventario.

### 1.5 Momento de descuento de inventario de presas
- S. deseada: El nuevo sistema al confirmar el pago (paid), para evitar problemas de inventario por pedidos pendientes.

---

## 2. Variantes y Sustituciones

### 2.1 ¿El precio cambia cuando se sustituye un acompañamiento (papa -> arroz -> Smiles)?
- S. actual: El precio base del plato no cambia.
- S. deseada: El nuevo sistemaa mantiene el precio base. Recordar que actualmente los platos se sirven con una porcion de mixto(arroz y papa). Solo se puede sustituir con: 1 porcion de arroz, 1 porcion de papa o 1 porcion de papa smiles.

### 2.2 ¿Se permite más de una sustitución por plato?
- S. actual: Solo se sustituye el acompañate del plato que es 1 porcion mixta.
- S. deseada: El nuevo sistema solo se permite 1 sustitucion. Solo se sustituye el acompañande (1 porcion de mixto)  por: 1 porcion de arroz, 1 porcion de papa o 1 porcion smiles.  

### 2.3 ¿Cómo se refleja la sustitución en el ticket y en el inventario?
- S. actual: El sistema actual no refleja la sustitución en el ticket. Del inventario no se descuentan porciones de mixtos, papa, arroz, smiles o platanos fritos.
- S. deseada: El nuevo sistema debe imprimir el detalle de sustitución en el ticket.

---

## 3. Pedidos y Estados

### 3.1 ¿Cuál es la máquina de estados definitiva de un pedido (ej. registrado -> preparando -> listo -> entregado -> cerrado)?
- S. actual: Se desconoce la maquina de estados o si es que existe alguna.
- S. El nuevo sistema debe tener una maquina de estados segun sea lo mas adecuado sin llegar a aser complejo.

### 3.2 ¿Qué pasa con pedidos delivery si el pago no llega? ¿Se cancelan automáticamente?
- S.ctual: Actualmente solo se registra una venta cuando esta es pagada, asi que el delivery debe realizar el pago. Mientras tanto no se registra nada en el sistema.
- S. deseada: El nuevo sistema debe permitir registrar el pedido aunque el pago no llegue, pero debe marcarlo como pendiente de pago. Tambien el sistema debe permitir borrar un pedido en pendiente de pago.


### 3.3 ¿Se permite registrar pedidos con pago pendiente?
- S. actual: No se permite registrar pedidos con pago pendiente, solo se registra una venta cuando esta es pagada.
- S. deseada: El nuevo sistema debe registrar un pedido con pago pendiente, pero el inventario y los ingresos solo deben actualizar cuando un pedido es pagado.

### 3.4 Preparación de pedidos en estado pendiente de pago
- a) Se prepara inmediatamente aunque esté pendiente.
- b) No se prepara hasta confirmar pago.
- c) Se prepara solo para clientes frecuentes autorizados.
- otro) ________
- S. actual: Actualmente si se preparan los pedidos y se tienen lsitos para recoger cuando el cleintttte o delivery paga el pedido.
- S. deseada: Debe funcionar igua, es decir, se prepara inmediatamente aunque esté pendiente. Esto para evitar retrasos en la preparación.

### 3.5 Tiempo máximo para mantener un pedido pendiente de pago
- Respuesta: 25 min. El pollo se cocina entre 18-20 min. 


### 3.6 Cancelación de pedido ya confirmado
- S. actual: Actualmente un pedido confirmado es uno ya pagado. Si es que se quiere cancelar implca la devolucion del dinero, en ese caso la cajera lo realiza pero al final de cada turno la cajera informa de esta situacion al administrador y se procede con la anulacion de la factura. De la anulacion de la factura solo se sabe que se encesita el numero de factura, pero se desconoce mas detalles del proceso.
- S. deseada: El nuevo sistema debe permitir cancelar un pedido pagado, pero esde bebe requerir una razon y detalles del pedido para registrarse. En el arqueo de caja debe haber un apartado que indique las anulaciones realizadass y la cantidad monetaria, para cuadrar los ingresos de cada turno. 
---

## 4. Vales y Ventas Internas

### 4.1 ¿Cómo se registran los vales en el sistema (como venta con método vale, como gasto, como descuento)?
- S. actual: Actualmente no se registran en el sistema.
- S. deseada: El nuevo sistema debe permitir registrar vales. Para el vale se debe registrar el nombre del trabajador, el nomber del plato, la fecha y el monto. El sistema debe descontar las presas, del inventario pero no debe registrar como dinero entrante. Para esto se puede añadir al flujo de venta una opcion de pago como vale o simplemente tener una interfaz dedicada(elegir la opcion que sea mas simple y efectiva).

### 4.2 Naturaleza del vale de empleado
- Respuesta: Actualmente no se registran en el sistema, pero se manejan como un descuento por nomina, es decir, el trabajador recibe su vale y al final de cada mes se le descuenta el monto total de los vales que uso en ese mes.

### 4.3 ¿Se aplican límites por trabajador (cantidad o monto)?
- Respuesta: No, no existen limites.

### 4.4 Umbral para aprobación obligatoria de vales
- respuesta: No existe un umbral.

### 4.5 ¿Cómo se reflejan en reportes y arqueos?
- S. actual: Actualmente no se registran en el sistema, pero se anota el vale del trabajador el dia que lo solicito en el reporte diario de venta(arqueo de caja).
- S. deseada: El nuevo sistema debe reflejar lso vales otrorgados en el dia, esto para los reportes (reporte diario o arqueo de caja). Tambien deberia haber una interfaz que lsite los vales otrorgados a los trabajadores con su detalle (nombre del trabajador, plato, fecha y monto), esto para poder ser consultado en cualquier momento. 

### 4.6 Política de descuento interno al personal
- S. actual: No existe una politica formal, pero al finalizar el turno si existe pollo cocido sobrante. Se ofrece al trabajador una Porción Media por el precio de 23bs. Lo que pasa es que en el sistema sea anota una venta de Cuarto de Pollo (2 presas) - 23 Bs. Pero al trabajador se le entrega Porción Media (2 presas + porción mixto de papa y arroz) - 30 Bs. Todo esto para que cuadre en el inventario la catidad de presas. Casi siempre este es el trato "descuento" que se le da al trabajador. Peros olo cuando hay pollo cocido sobrante al final de truno (16hrs o 23hrs). 

---

## 5. Caja y Arqueo

### 5.1 ¿Qué información mínima debe tener un arqueo (apertura, cierre, ingresos, egresos, vales)?
- a) Apertura, cierre, ventas totales y diferencia final.
- b) Apertura, cierre, ventas por método, gastos, vales, diferencia.
- c) Todo lo anterior + detalle por transacción.
- otro) ________
- S. actual: continuar...

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
- S deseada: registrar productos (presas), registar platos, crear usuarios, modificar el inventario(con registro de quien lo hizo, timestamp y descripcion/motivo).

### 7.2 ¿Las cajeras pueden registrar vales o solo el administrador?
Respuesta: las cajeras si pueden registrar vales.

### 7.3 ¿Qué pasa si un trabajador rota de cajera a despachadora en la semana? ¿Usa la misma cuenta o distinta?
- S. actual: Actualmente, se presume que usa la misma cuenta, pues solo hay una caja que es atendida por 1 cajera durante 1 turno de manera  simultanea. Las personas que trabajan como despachadora no se logean en el sistema ese da, solo se logean cuando es su turno como cajera.
- S. deseada: El nuevo sistema podria tener 1 o mas cajas, pero solo se debe permitir que una caja sea atentida por 1 cajera a la vez por turno.

### 7.4 Regla de turnos activos por usuario
- S. deseada: Un usuario puede estar activo 1 sola vez por turno. Ejemplo: un trabajador solo puede logearse como cajera o despachadora en 1 mismo turno. No puede logearse como cajera y despachadora en 1 mismo turno.

### 7.5 Matriz de permisos para MVP
- S. deseada: No se hara control de permisos.
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
- S. deseada: El nuevo sistema debe lisitar los pedidos listos (parecido a las pantallas de tickets de los bancos, es decir sera ana pantlla/interfaz publica dentro del negocio)

### 8.3 ¿Se guarda un historial digital de comandas para auditoría?
- S. deseada: Si debe guardarse los datos para poder ser consultados/usados en un futuro.

### 8.4 Documento emitido al confirmar venta
- S. actual: Factura(si lo desea el cliente) + 2 comandas del pedido(1 para el cliente y otro para la despachadora).
- S. deseada: Al confirmar la venta se debe imprimir una factura (solo si lo desea el cliente). El nuevo sistema debera listar las comandas generadas(pdf, html u otro formato) en una interfaz que podra ser accedida por las despachadoras. El cliente tendra otra interfaz para ver solo su comanda de su pedido realizado.

### 8.5 Arquitectura de impresión de comandas
- S. actual: Actualmente la comanda se imprime en una impresora termica.
- S. deseada: Se pretende que el nuevo sistema solo digitalice las comandas (html, pdf u otro formato) y las liste en una interfaz para que las despachadoras puedan consultarlas La impresora termica se usaria solo para imprimir la factura si es que el cliente lo desea.

### 8.6 Contingencia ante falla de impresora térmica
- S. deseada: En primera instancia, la factura podria poder descargarse. Al ser una aplicacion local web, deberia caer en el navegador(u otro lector de pdf) la responsabilidad de elegir la impresora a usar para la impresion.
---

## 9. Rendimiento y Despliegue

### 9.2 ¿Dónde se desplegará inicialmente el backend (Windows local, Linux, nube)?
- S. deseada: El nuevo sistema debe ser multiplaforma, pero principalmente se usara en una sistema windows 10.

### 9.3 ¿Se requiere instalador sencillo (ej. Docker Compose) para el restaurante?
- S. deseada: Es una aplicacion web. El cual se usara primeramente localmente. En la version 2 del sistema se pensara de colocarlo en la nube.

### 9.4 Política de respaldo de base de datos
- S. deseada: Esto es para la version 2 del sistema. El nuevo sistema debe realizar backup diario automático de la base de datos, esto para evitar perdida de datos en caso de algun error o falla del sistema. Tambien el adminsitrador debe tener la opcion de realizar backup manualmente en cualquier momento.
---

## 10. Auditoría

### 10.1 Nivel de auditoría para MVP
- a) Solo acciones críticas (ventas, anulaciones, ajustes, vales).
- b) Críticas + cambios de estado de pedido y caja.
- c) Auditoría integral de todas las acciones operativas.
- otro) ________
- S. deseada: continuara...
---

## Uso recomendado en taller

- Marcar una opción por pregunta pendiente.
- Si se marca `otro`, describir la regla exacta.
- Al finalizar, pasar decisiones al PDR como reglas cerradas del MVP.
