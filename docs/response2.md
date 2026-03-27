Excelente enfoque, Ariel. Mantener el stack tecnológico en el PDR como referencia general está bien, siempre que quede claro que es un **lineamiento de implementación** y no un detalle técnico exhaustivo. Lo importante es que el PDR siga siendo un documento de negocio, y que las reglas operativas estén bien definidas.  

Como tu objetivo es ir mejorando el PDR poco a poco mientras desarrollas la aplicación, aquí tienes una **lista de preguntas que deberías ir respondiendo en el tiempo**. Cada respuesta que vayas consolidando servirá para enriquecer y afinar el PDR:

---

### 📌 Preguntas para ir mejorando el PDR

#### 1. Inventario y productos
- ¿Cómo se registran las entradas de pollo (procesado, reproceso, sobrante) en el sistema?  
Respuesta: las entrada son procesados.
- ¿Cada venta descuenta automáticamente las presas? ¿Cómo se reflejan los pares fijos (pecho-ala, pierna-entrepierna)? 
Respuesta: De cada venta se deberia descontar las presas. Por ejemplo una porcion media trae 2 presas (pecho-ala o pierna-entrepierna), el cliente decide que par de presas seran. 
- ¿Qué pasa con ventas “custom” (ej. dos pechos)? ¿Se permiten o se registran como excepción?  
- ¿Cómo se controlan insumos como arroz, papas y bebidas? ¿Por unidad, por bolsa, por lote?
Respuesta: Ene l inventario solo se anota la cantidad de bolsas de papa usadas en cada turno.  Las bebidas deberian descontarse por unidad.

#### 2. Variantes y sustituciones
- ¿El precio cambia cuando se sustituye un acompañamiento (papa → arroz → Smiles)?  
- ¿Se permite más de una sustitución por plato?  
- ¿Cómo se refleja la sustitución en el ticket y en el inventario?  

#### 3. Vales y ventas internas
- ¿Cómo se registran los vales en el sistema (como venta con método “vale”, como gasto, como descuento)?  
- ¿Se aplican límites por trabajador (cantidad o monto)?  
- ¿Cómo se reflejan en reportes y arqueos?  

#### 4. Pedidos y estados
- ¿Cuál es la máquina de estados definitiva de un pedido (ej. registrado → preparando → listo → entregado → cerrado)?  
- ¿Qué pasa con pedidos delivery si el pago no llega? ¿Se cancelan automáticamente?
Respuesta: El delivery debe realizar el pago para que recien se regsitre la venta. 
- ¿Se permite registrar pedidos con pago pendiente?
Respuesta: El nuevo sistema debe contemplar esto, el actual no lo hace.

#### 5. Caja y arqueo
- ¿Qué información mínima debe tener un arqueo (apertura, cierre, ingresos, egresos, vales)?  
- ¿Cuál es el umbral de discrepancia aceptable entre caja y tickets?  
- ¿Qué proceso se sigue si hay diferencias?  

#### 6. Reportes
- ¿Qué reportes son obligatorios en el MVP (ventas por turno, inventario de presas, arqueo de caja, vales)?
Respuesta: Ventas por turno, inventario de presas, arqueo de caja.  
- ¿Se requiere reporte de productos más vendidos?
Respuesta: Es algo deseable pero no indispensable.  
- ¿Se necesita reporte de discrepancias automáticas?  

#### 7. Roles y permisos
- ¿Qué acciones son exclusivas del administrador (ej. anular venta, modificar inventario)?
Respuesta: por ahora solo seria modificar el inventario(con registro de quin lo hizo, timestamp y descripcion/motivo).  
- ¿Las cajeras pueden registrar vales o solo el administrador?
Respuesta: las cajeras si peuden registrar vales.  
- ¿Qué pasa si un trabajador rota de cajera a despachadora en la semana? ¿Usa la misma cuenta o distinta?
Respuesta: Actualmente, se presume que usa la misma cuenta, pues solo hay una caja que es atendida por 1 cajera durante 1 turno de manera  simultanea.
El nuevo sistema podria tener 1 o mas cajas, pero solo se debe permitir que una caja sea atentida por 1 cajera a la vez por tueno.    

#### 8. Tickets y notificaciones
- ¿Qué campos obligatorios debe tener el ticket térmico (cliente, fecha, productos, variantes, responsable)? 
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

- ¿Cómo se notifica al cliente que su pedido está listo (pantalla, sonido, número de ficha)?
Respueta: El nuevo sistema debe lisitar los pedidos listos (parecido a las pantallas de tickets de los bancos, es decir sera uan pantlla/interfaz publica dentro del negocio)    
- ¿Se guarda un historial digital de comandas para auditoría?
Respuesta: Si debe guardarse los datos para poder ser consultados/usados en un futuro.  

#### 9. Rendimiento y despliegue
- ¿Cuál es la meta de respuesta aceptable en LAN (200 ms, 300 ms)?  
- ¿Dónde se desplegará inicialmente el backend (Windows local, Linux, nube)?  
- ¿Se requiere instalador sencillo (ej. Docker Compose) para el restaurante?  

---

### 🎯 Cómo usar estas preguntas
- No necesitas responder todas de golpe.  
- A medida que avances en el desarrollo, cada respuesta que definas debe incorporarse al PDR como **regla de negocio**.  
- Cuando tengas claro el inventario y los pedidos, podrás diseñar la **base de datos** con seguridad, porque ya sabrás qué entidades y relaciones son imprescindibles.  

---

¿Quieres que te prepare un **checklist de entidades y relaciones de base de datos** derivado de estas preguntas? Eso te daría un mapa inicial para empezar a modelar la BD sin entrar aún en detalles técnicos de implementación.