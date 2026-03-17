### Product Requirements Document (PRD)  
**Sistema Informático de Ventas — Wonder Chicken**  
**Autor:** Senior Product Manager / Arquitecto de Sistemas  
**Fuente principal:** *Proyecto de grado: Sistema Informático de Ventas para el Restaurante "Wonder Chicken"*. 

---

## CITAS TEXTUALES DEL DOCUMENTO:
**SITUACIÓN PROBLEMÁTICA:** Después de haber realizado un análisis de observación al flujo de trabajo del restaurante Wonder Chicken, examinar el funcionamiento de su sistema informático genérico y haber sostenido una entrevista con el dueño del restaurante, se identificaron los siguientes problemas:
- El sistema actual no se adecua a la forma de trabajo del restaurante, pues no admite el registro de nuevas variantes de los productos, por ejemplo: Una porción media consta de 2 presas de pollo + 1 porción de papa frita; pero también la porción de papa frita puede ser sustituida por 1 porción de arroz o 1 porción de Smiles McCain. Además, el sistema actual no permite diferenciar entre los pedidos para llevar y los de mesa. También dicho sistema no contempla el registro de vales de productos que opcionalmente un trabajador puede solicitar. 
Estas limitaciones obligan a realizar anotaciones manuales en la comanda del pedido, lo que dificulta el trabajo y muchas veces genera confusiones.
- Actualmente, no existe un método rápido y sencillo para obtener la cantidad de pollo, es decir la cantidad de presas vendidas y las que permanecen en cocina. Para obtener esta información, el personal de cocina debe realizar un conteo manual de las presas restantes antes de cada cambio de turno.
- Interfaz sobrecargada que dificulta el trabajo de la cajera, actualmente el sistema muestra todas las opciones que posee; pero varias de estas opciones no son necesarias o no están disponibles debido a la falta de privilegios necesarios de la cajera. Esto genera dificultades en el aprendizaje del uso del sistema, ya sea para el personal actual o nuevo.
- Cuando el negocio está lleno y las despachadoras necesitan entregar un pedido, se ven obligadas a gritar el nombre del cliente o ir a buscarlo a su mesa. Esta situación resulta incómoda tanto para las despachadoras como para el cliente y además ralentiza el trabajo. Este escenario también ocurre debido a que algunos clientes eligen sentarse en mesas distantes.

**PROBLEMA CENTRAL:** El sistema de ventas en el restaurante “Wonder Chicken” no se adapta a las nuevas necesidades relacionadas con el flujo de atención al cliente, lo que ocasiona dificultades en la atención adecuada de los pedidos.

**OBJETIVO GENERAL:** Desarrollar un sistema informático de ventas para el restaurante Wonder Chicken para agilizar el proceso de venta y mejorar el flujo de atención al cliente.

**OBJETIVOS ESPECÍFICOS:**
- Analizar las funcionalidades del sistema actual para incorporar aquellas que sean de utilidad al nuevo desarrollo.
- Desarrollar un módulo de administración que permita la creación de nuevos productos y sus variantes para evitar las anotaciones manuales de las cajeras.
- Facilitar la información de las presas de pollo restantes en cocina como la cantidad vendida mediante una interfaz, para evitar la pérdida de tiempo que conlleva el conteo manual.
- Brindar interfaces limpias, de fácil uso y diferenciadas en base al tipo de usuario para mejorar su trabajo y el aprendizaje del sistema.
- Proporcionar un módulo para anunciar al cliente que su pedido está listo, con el fin de mejorar su experiencia y agilizar el trabajo de las despachadoras.

**DESCRIPCION ORGANIZACIONAL:**
- Administrador: Persona encargada de suministrar toda la materia prima, así como los recursos necesarios para que los trabajadores puedan realizar sus actividades. Esta persona inicia la apertura de caja con un monto determinado y también realiza el arqueo de cierre de caja de las ventas al final del turno con la cajera.
También es responsable de establecer la forma de despachar productos, es decir es quien define cómo se combinan y crean los platos para la venta.
- Cajera: Trabajador responsable de registrar las ventas de los pedidos de los clientes, informar a las despachadoras de los pedidos a preparar por medio de las comandas, como también es responsable de los ingresos económicos de las ventas de su turno y tiene la obligación de realizar un arqueo de cierre de caja con el administrador.
Esta persona está autorizada por el administrador de disponer el dinero de caja para las necesidades imprevistas que surgen durante el día de trabajo.
- Despachadoras: Se encargan de recibir las comandas de los pedidos, prepararlos y entregarlos a los clientes, ya sea llamándolos por su nombre o entregando el pedido a un servicio de delivery. Las despachadoras solicitarán a los cocineros los elementos necesarios para preparar los pedidos.
- Cocineros: Son el personal encargado de la preparación y freído de: presas de pollos, pipocas de pollo, papa normal, papa Smiles McCain(papas con forma de cara sonriente) y aros de cebolla. También realizan la elaboración de aderezos, limpieza de la cocina y de las bandejas del restaurante. Al final de turno este personal debe realizar el conteo manual de cada presa de pollo restante para su  posterior almacenamiento refrigerado.
Despresadores de pollo: Son las personas encargadas de despresar los pollos recién adquiridos y guardarlos en las neveras del restaurante.

**PROCESO DE VENTA:**
- Registrar pedido: Este proceso se realiza usando el sistema genérico y tiene como finalidad el registro de pedidos de un cliente ya sea de manera presencial o por llamada telefónica, registrando sus datos personales para la emisión de la factura, la emisión de la comanda y/o en envío por delivery del pedido.
- Generar factura y comanda del pedido: La cajera usa el sistema genérico para imprimir la factura del pedido y 2 comandas correspondientes. Posteriormente entrega al cliente la factura y una comanda, la otra restante la entrega a las despachadoras.
- Preparar el pedido: Las despachadoras reciben las comandas de los pedidos por parte de la cajera y estas deben preparar los platos.
- Despachar el pedido: Las despachadoras preparan los platos en base a la comanda que  les fue entregada por la cajera, una vez listo el plato llaman al cliente por su nombre o número de pedido para que pueda recogerlo previa presentación de su comanda.
En caso de pedidos a domicilio, el pedido se entrega a un servicio de delivery, el cual se encarga de entregarlo al cliente. Cabe mencionar que al ser un servicio de terceros, el precio del envío es previamente y netamente acordado entre el cliente y el delivery. Dicho precio no figura en la factura del cliente.
Al finalizar las entregas, las despachadoras guardan las comandas, ya que algunas veces la cajera necesita revisarlas cuando hay un problema al realizar las cuentas.

IMPORTANTE: Algunas veces(cuando sobra pollo cocinado), se suele vender al personal plato(s) con descuento (por ejemplo un plato de 30bs a 23bs). CONTEMPLAR ESTA SITACION PARA ARQUEO, REPORTES, ETC

**FUNCIOANLIDADES DEL SISTEMA ACTUAL (Es el sistema a remplzar):**

**Menú superior:**
- Catálogos generales: Se utiliza. El administrador accede a esta sección para visualizar el listado de productos y gestionar la adición, eliminación y edición de elementos, incluyendo nombre y precio.
- Línea de créditos: No se utiliza. Se aclara que no se trabaja al crédito, aunque permitiría asignar montos a cuentas.
- Manejo de caja: Se utiliza. El administrador emplea las funciones de apertura y cierre de caja y gestiona la inclusión o eliminación de cajeros.
- Opciones de productos: Se utiliza parcialmente. Esta sección sirve para registrar el ingreso de productos y su cantidad disponible para la venta. Normalmente el administrador suele revisar los almacenes con regularidad para poder abastecerse ya que está presente cada día  en el negocio.
- Reportes: Se asume que se utiliza. Se supone la existencia de reportes de ventas por cliente, por día y de productos más vendidos, aunque no se confirma su uso activo.
- Datos del sistema: No se utiliza. Se identifica que esta sección parecería referirse a información del sistema, pero carece de familiaridad.
- Salir: Se utiliza. Función estándar para cerrar la sesión en el sistema.
- Facturación en línea: Se utiliza. Herramienta para verificar la facturación y el libro de ventas.

**Menú lateral derecho:**
- Actualizar datos: Se utiliza para refrescar la pantalla; inicialmente se pensó que aplicaba cambios en el sistema, pero se aclaró su función de actualización de interfaz. Demostrando ser una opción con nombre confuso.
- Registro de ventas: Se utiliza. Administradores y cajeros tienen acceso al registro de ventas.
- Resumen de ventas: Se utiliza. Muestra ventas con hora, monto y cliente para administradores y cajeros.
- Apertura de caja: Se utiliza. Se realiza al inicio del turno de cada cajero.
- Cierre de caja: Se utiliza. Se realiza al finalizar el turno de cada cajero.
- Stock productos: No se utiliza. Una vez registrado el producto en el inventario este no puede ser modificado ni eliminado, por esta razón el administrador declara no usar dicha opción. Tampoco se confirma el acceso solo para consulta del stock. Como se mencionó el administrador se reabastece revisando el almacén o por estimación según su experiencia.
- Lista de precios: Se utiliza. Permite ver todos los productos y sus datos, con opción para modificar el stock. Esto representa una incoherencia pues la modificación del stock no debería darse desde esta opción.
- Registro de compras: No se utiliza. No se emplea debido a incoherencias entre la descripción y el uso real para el ingreso de productos.
- Resumen de compras: No se utiliza. Se asume que no se emplea por la falta de uso del registro de compras.
- Registro de gastos: Se utiliza. Registra compras realizadas con dinero de caja para insumos como arroz o guantes.
- Control de clientes: Se utiliza. Permite editar información de clientes registrados, como datos personales.

---

## WONDER CHICKEN - MENÚ (2026):
Platos pricipales:
1. Cuarto de Pollo (2 presas) - 23 Bs.
2. Porción Media (2 presas + porción mixto de papa y arroz) - 30 Bs.
3. Wonder (2 presas + porción mixto + mocochinchi o gaseosa de 500 ml) - 36 Bs.
4. Medio Pollo (4 presas) - 46 Bs.
5. Porción Completa (4 presas + porción mixto) - 54 Bs.
6. Super Wonder (4 presas + porción mixto + mocochinchi o gaseosa de 500 ml) - 58 Bs.
7. Wonder Pop (300 g de trozos de filete de pechuga + porción de papa o arroz o mixto) - 33 Bs.

Bebidas:
- Mocochinchi 500 ml - 6 Bs.
- Bebidas 500 ml - 8 Bs.
- Bebidas 2 litros - 16 Bs.

Extras:
- Porción de Arroz - 8 Bs.
- Smiles McCain - 12 Bs.
- Porción de Plátano - 8 Bs.
- Porción de Papas - 12 Bs.
- Mixto (papa y arroz) - 10 Bs.

NOTA: Combos mixtos por escasez de papa.

OBSERVACIÓN: Venta de presas surtidas.

---

## EJEMPLO DE INVENTARIO DIARIO:

- WONDER CHICKEN - INVENTARIO DIARIO
- Dirección: Av. Las Américas Nº 317
- Elaborado por: Silvia
- Sucre, 15 de marzo de 2026

---                  | -      | ALA    | PECHO   | PIERNA  | ENTREPIERNA  | -       
---------------------|--------|--------|---------|---------|--------------|--------
Reproceso            | -      | 30     | 30      | 30      | 30           | -       
Procesado            | -      | 150    | 150     | 150     | 150          | -
Sobrante Procesado   | -      | 10     | 10      | 10      | 10           | -

Nota: 
- Reproceso: Es la cantidad de pollo sobrante del dia anteior(congelado) que se vuelve a marinar.
- Procesado: La cantidad de pollo fresco a marinar (dia actual)
- Sobrante Procesado: Cantidad de pollo que sobra al final del dia(despues de los 2 turnos).

TABLA DE INVENTARIO

CÓD  | PRODUCTO                  | TIPO     | SALDO ANT. | INGRESO | TOTAL MESÓN  | GASTO  | SOBRANTE
-----|---------------------------|----------|------------|---------|--------------|--------|----------
B1   | Coca Cola                 | Unidad   | -          | 2       | 2            | 4      | -
B2   | Coca Cola Zero            | Unidad   | 2          | 2       | 4            | -      | -
B3   | Fanta Naranja             | Unidad   | 2          | 1       | 3            | 4      | 14
B4   | Fanta Guarana             | Unidad   | 2          | 2       | 4            | 2      | 20
B5   | Fanta Papaya              | Unidad   | 2          | 1       | 3            | 2      | -
B6   | Sprite                    | Unidad   | 2          | 8       | 10           | 3      | 7
B7   | Aquarius Pera             | Unidad   | 10         | -       | 10           | -      | 10
B8   | Aquarius Manzana          | Unidad   | 6          | -       | 6            | -      | 6
B9   | Aquarius Pomelo           | Unidad   | 6          | -       | 6            | -      | 6
B10  | Fanta Limón               | Unidad   | 2          | -       | 2            | -      | 2
B11  | Coca Cola 2 lt            | Unidad   | 6          | -       | 6            | -      | 6
B12  | Fanta Papaya 2 lt         | Unidad   | 2          | -       | 2            | -      | 2
B13  | Fanta Naranja 2 lt        | Unidad   | 2          | -       | 2            | 1      | 1
B14  | Fanta Guarana 2 lt        | Unidad   | 2          | -       | 2            | -      | 2
B15  | Fanta Naranja2 lt         | Unidad   | 2          | -       | 2            | -      | 2
B16  | Jugo de Manzana 2 lt      | Unidad   | 6          | -       | 6            | 1      | 5
B17  | Jugo de Durazno 2 lt      | Unidad   | 9          | -       | 9            | 1      | 8
B18  | Mocochinchi               | Vaso     | -          | -       | -            | -      | 50
B19  | Mocochinchi en remojo     | Unidad   | -          | -       | -            | -      | 50
---  | -                         | -        | -          | -       | -            | -      | - 
P1   | Sobre Despacho individual | Bolsa    | 110        | 100     | 210          | 125    | -
P2   | Sobre Papa                | Paquete  | 105        | -       | 105          | -      | 94
P3   | Láminas Bandejas          | Unidad   | -          | -       | -            | -      | -
P4   | Servilletas               | Unidad   | 500        | -       | 500          | 350    | -
P5   | Cuchillos                 | Unidad   | 3.1        | -       | 3.1          | 20     | -
P6   | Tenedores                 | Unidad   | 3.5        | -       | 3.5          | 25     | -
P7   | Cucharas                  | Unidad   | 4.8        | -       | 4.8          | 3      | 45
P8   | Bolsa Camiseta            | Unidad   | 50         | -       | 50           | -      | 40
P9   | Bolsa Blanca Mediana      | Unidad   | 186        | -       | 186          | -      | 165
P10  | Bolsa Blanca Pequeña      | Unidad   | 9          | 100     | 109          | -      | 50
P11  | Bolsa Basura Ploma        | Unidad   | -          | -       | -            | -      | -
P12  | Vaso 50 cc                | Unidad   | -          | -       | -            | -      | -
P13  | Tapa Vaso 50 cc           | Unidad   | -          | -       | -            | -      | -
P14  | Vaso Despachable 200 cc   | Unidad   | 87         | -       | 87           | 45     | -
P15  | Vaso Grande Ref. 500 cc   | Unidad   | 28         | -       | 28           | -      | 28
P16  | Vaso Jugo G. Ref. 500 cc  | Unidad   | 31         | -       | 31           | -      | 31
P17  | Bombillas                 | Unidad   | 46         | -       | 46           | -      | 121
P18  | Envases Arroz             | Unidad   | 50         | 100     | 150          | -      | 45
---  | -                         | -        | -          | -       | -            | -      | -
S1   | Mayonesa                  | Doypack  | -          | -       | -            | -      | -
S2   | Ketchup                   | Doypack  | -          | -       | -            | -      | -
S3   | Mortadela                 | Unidad   | -          | -       | -            | -      | -
C1   | Bolsa Papa Congelada      | Bolsa    | -          | -       | -            | -      | -
C4   | Harina                    | Bolsa    | -          | -       | -            | -      | -

---

## EJEMPLO DE COMADAS/TICKETS (Impresas por el sistema actual a remplar):

Los siguientes ejemplos están maquetados en formato monoespaciado para simular la impresión en ticket térmico:

```text
                  TICKET PARA MESA 67
                     WONDER CHICKEN
------------------------------------------------------
NOMBRE: LUIS IGLESIAS
FECHA: 04/05/2024      22:07
------------------------------------------------------
CANT. | DETALLE              | P. UNIT | TOTAL
------------------------------------------------------
  2   | WONDER               | 36.00   | 72.00
      | 2 - PECHO-ALA
      | 1 - COCA COLA SIN AZUCAR (500 ml)
      | 1 - AQUARIUS PERA (500 ml)
      | FRIAS
------------------------------------------------------
                  TOTAL BS.:             72.00
------------------------------------------------------
RESPONSABLE: ROXANA
```

```text
                  TICKET PARA MESA 51
                     WONDER CHICKEN
------------------------------------------------------
NOMBRE: FREDY AREVALO
FECHA: 04/05/2024      20:46
------------------------------------------------------
CANT. | DETALLE              | P. UNIT | TOTAL
------------------------------------------------------
  2   | WONDER               | 36.00   | 72.00
      | 2 - PECHO-ALA
      | 1 - PIERNA-ENTREPIERNA
      | 2 - COCA COLA (500 ml)
      | FRIAS
------------------------------------------------------
                  TOTAL BS.:             72.00
------------------------------------------------------
RESPONSABLE: ROXANA
```

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

```text
                  TICKET PARA LLEVAR 48
                     WONDER CHICKEN
------------------------------------------------------
NOMBRE: MARCO ORTEGA
FECHA: 04/05/2024      20:37
------------------------------------------------------
CANT. | DETALLE              | P. UNIT | TOTAL
------------------------------------------------------
  3   | PORCION MEDIA        | 30.00   | 90.00
      | 1 - PECHO-ALA
      | 2 - PIERNA-ENTREPIERNA
------------------------------------------------------
                  TOTAL BS.:             90.00
------------------------------------------------------
RESPONSABLE: ROXANA
```

---

## 1. Resumen ejecutivo
**Problema:** El sistema genérico actual no soporta variantes de productos, no diferencia pedidos mesa/llevar, obliga a anotaciones manuales en comandas, exige conteos manuales de presas de pollo y carece de un mecanismo eficiente para notificar a clientes cuando su pedido está listo. 

**Objetivo del producto:** Desarrollar una aplicación web interna que **agilice el proceso de venta** y **mejore el flujo de atención al cliente**, eliminando anotaciones manuales, automatizando el control de inventario por presas y proporcionando notificaciones de pedidos listos. 

**Alcance inicial:** Módulos de **Administración**, **Ventas**, **Notificación**, **Inventario**, autenticación y reportes básicos. Implementación iterativa siguiendo **Proceso Unificado Ágil (AUP)**. 

---

## 2. Personas y casos de uso clave

### Personas
- **Administrador**  
  - **Objetivo:** Configurar productos y variantes; revisar inventario y reportes; gestionar usuarios y caja.  
  - **Frustraciones actuales:** Opciones confusas en el sistema genérico; imposibilidad de crear variantes; falta de control de presas. 

- **Cajera**  
  - **Objetivo:** Registrar ventas rápidas (mesa/llevar), emitir facturas/comandas, registrar vales, gestionar apertura/cierre de caja. Puede utilizar dinero de caja para comprar cosa imprevistas(Registro de gastos)
  - **Frustraciones actuales:** Interfaz sobrecargada; anotaciones manuales en comandas; procesos lentos en horas pico. 

- **Despachadora**  
  - **Objetivo:** Recibir comandas, preparar y entregar pedidos; notificar clientes cuando el pedido está listo.  
  - **Frustraciones actuales:** Deben gritar o buscar clientes; pérdida de tiempo y experiencia negativa para el cliente. 

- **Cocineros**  
  - **Objetivo:** Contar y marinar presas de pollo crudo entrantes(procesado), cocinar presas de pollo para entregar despachadora, cocinar porciones de: papafrita, pipocas de pollo, platano frito, papa sonrisa(smile). Contar cantidad de bolsas de papa frita usadas. Contar cantidad de presas de pollo restante en cocina (Sobreante procesado) 
  - **Frustraciones actuales:** Contar de manera manual el pollo restante en cocina (Sobrante procesado) y las bolsas de papa usadas para anotarlo en inventario (cada cambio te turno).

### Importante:
- Por cada turno de trabajo hay 1 cajera y 2-3 despachadoras. El dia de trabajo comprende 2 turnos.
- El personal de cajera y despachadora suelen rotar funciones en la semana. Es decir un personal puede ser(tener las funciones) cajera un dia y al otro ser despachadora.
- Cada cajera suele tener una clave unica para entrar al sistema (autenticaion)
- Algunas veces(cuando sobra pollo cocinado), se suele vender al personal plato(s) con descuento (por ejemplo un plato de 30bs a 23bs). CONTEMPLAR ESTA SITACION PARA ARQUEO, REPORTES, ETC

### Principales flujos de usuario (resumidos)
- **Venta presencial (mesa):** Cajera registra pedido → sistema imprime comanda mesa → despachadora prepara → notificación al cliente → entrega.  
- **Venta para llevar / delivery:** Cajera registra pedido (el delivery paga a nombre del cliente) → sistema imprime comanda llevar → despachadora prepara → entrega a servicio de delivery.  
- **Administración:** Crear/editar productos y variantes; consultar conteo de presas; generar reportes de ventas y gastos. Crear usuarios (cajera, despachadora, cocinero)

---

## 3. Módulos funcionales y requerimientos

### 3.1 Tabla: Requerimientos funcionales (ID, Descripción, Prioridad)
| **ID** | **Descripción** | **Prioridad** |
|---|---:|:---:|
| FR-001 | **Gestión de productos y variantes**: Crear productos, definir variantes y sustituciones (ej. porción media = 2 presas + papa/ mixto(arroz y papa)/ arroz/ Smiles). | **Alta** |
| FR-002 | **Registro de pedidos**: Crear pedidos para *mesa* o *llevar*; seleccionar variantes; registrar vales(venta un trabajado); calcular total. | **Alta** |
| FR-003 | **Emisión de comprobantes**: Generar factura y 2 comandas (cliente + despachadora); datos para UI/imprimir/exportar PDF. | **Alta** |
| FR-004 | **Control de caja**: Apertura/cierre de caja por turno; registrar ingresos y egresos; arqueo. | **Alta** |
| FR-005 | **Vales de productos**: Registrar vales de empleados o promociones. Basicamente un vale es registrar una venta a nombre de un trabajador, cuyo precio del pedido se descontara del salario del mes encurso.  | **Media** |
| FR-006 | **Inventario por presas**: Registrar entrada de presas; decrementar automáticamente por venta; mostrar cantidad vendida y restantes por tipo (pecho, ala, pierna, entrepierna). | **Alta** |
| FR-007 | **Notificación de pedido listo**: Sistema para anunciar pedidos listos (visual + sonoro + pantalla de clientes) y marcar pedido como entregado. | **Alta** |
| FR-008 | **Roles y permisos**: Usuarios: Administrador, Cajera, Despachadora, Cocinero(probablemente para registrar entradas de presas pollo crudo); vistas y acciones restringidas por rol. | **Alta** |
| FR-009 | **Registro de gastos**: Registrar gastos pagados desde caja; asociar a turno. | **Media** |
| FR-010 | **Resumen y reportes**: Ventas por día/turno/producto; productos más vendidos; discrepancias caja vs tickets. | **Alta** |
| FR-011 | **Pedidos con pago pendiente**: Permitir registrar pedidos a domicilio con estado de pago pendiente y opción de confirmar/anular. Cuando el delivery paga por el producto recien se registrara como un venta exitosa/valida como tal. | **Alta** |
| FR-012 | **Historial de comandas**: Guardar comandas del día para auditoría y conciliación. | **Media** |
| FR-013 | **Interfaz limpia por rol**: Mostrar solo funcionalidades necesarias según rol para reducir carga cognitiva. | **Alta** |
| FR-014 | **Integración con impresoras de comandas**: Soporte para impresoras térmicas locales. | **Media** |
| FR-015 | **API pública interna**: Endpoints REST para integraciones futuras (delivery, marketing). | **Media** |
---

### 3.2 Requerimientos no funcionales (lista)
- **Usabilidad:** Interfaces limpias y reactivas, botones grandes, flujo de venta en 3 pasos máximo para cajera. Soporte para tema claro y oscuro (para esto tratar de usar fondos, colres y papper de MUI. Evitar usar fondos solidos o no reactivos)  
- **Rendimiento:** Respuesta <200 ms en operaciones de venta en LAN local; tolerancia a picos en fines de semana.  
- **Disponibilidad:** Modo local (on-premise) con opción de sincronización a nube; objetivo 99.5% uptime durante horario operativo.  
- **Seguridad:** Autenticación con JWT; contraseñas hasheadas con **bcryptjs**; roles y control de acceso por endpoint (puede usarse un midlware).  
- **Escalabilidad:** Backend modular (NestJS) y ORM PRISMA para permitir cambio de BD sin reescritura. Frontend modular (se usara Nextjs, zustand, etc) 
- **Mantenibilidad:** Código en TypeScript; Reutilizable-Modular (atravez de funciones, compoentes, estados globales, hooks, etc); Facil de entender y mantener en el tiempo.  
- **Localización:** Soporte para español; formatos de fecha y moneda locales.  
- **Impresión y exportación:** Generación de PDF para facturas/comandas mediante `react-to-print` u otro paquete facil de usar que ofrezcan buenos resultados personalizados.  
- **Accesibilidad:** Contraste y tamaño de fuente adecuados para uso en ambientes con iluminación variable.

---

## 4. Arquitectura técnica y stack

### 4.1 Stack obligatorio (especificado)
- **Backend:** **NestJS**, **TypeScript**, **ORM** (por ejemplo TypeORM o Prisma).  
- **Frontend:** **Next.js**, **React**, **Zustand** para estado global.  
- **Autenticación:** JWT + bcryptjs para hashing.  
- **Impresión/PDF:** `react-to-print` u otro paquete facil de usar que ofrezcan buenos resultados personalizados.  
- **UI components:** MUI (Material UI); iconografía con MUI Icons.  
- **Codigo multiplataforma:** El codigo del proyecto debera funcionar bien en Windows como linux (contemplar esto para uso de paths/rutas y tratamiento de fechas, etc). 

### 4.2 Arquitectura lógica (resumen)
- **API Layer (NestJS):** Controladores por módulo (products, orders, inventory, users, reports, notifications).  
- **Service Layer:** Lógica de negocio, transacciones atómicas para ventas e inventario.  
- **Data Layer (ORM):** Entidades: Product, Variant, InventoryItem (presa type), Order, OrderItem, User, Shift, CashRegister, Voucher, Expense, NotificationLog.  
- **Frontend (Next.js):** Páginas por rol; componentes reutilizables; Zustand store para estado de venta en curso y notificaciones.  
- **Realtime / Messaging:** Evaluar la complegidad en codigo para usar realtime o no. Se puede usar WebSocket (NestJS Gateway) - Server-Sent Events o simplemente realizar fetch desde frontend para notificaciones de pedido listo y actualización de inventario.  
- **Integración impresoras:** Servicio local que envía comandos a impresora térmica.

---

## 5. Diseño de datos y eventos (esenciales)

### 5.1 Entidades clave (resumen)
- **Product**: id, name, basePrice, category, active, variants[]  
- **Variant**: id, productId, name, components[] (e.g., 2 presas + papa)  
- **InventoryItem**: id, type (pecho/ala/pierna/entrepierna), totalReceived, totalSold, currentStock  
- **Order**: id, type (mesa/llevar), tableNumber?, customerName?, status (pending, preparing, ready, delivered, cancelled), total, paymentStatus  
- **OrderItem**: id, orderId, productId, variantId, quantity, notes, price  
- **Voucher**: id, code, amount, issuedBy, redeemedBy, status  
- **Shift / CashRegister**: id, userId, startAt, endAt, openingAmount, closingAmount, transactions[]  
- **NotificationLog**: id, orderId, channel, deliveredAt, acknowledgedBy

### 5.2 Eventos y contratos (examples)
- **OrderCreated** → payload: orderId, items, type, createdBy. Triggers: print comanda, notify kitchen.  
- **InventoryAdjusted** → payload: itemId, delta, reason. Triggers: update dashboard.  
- **OrderReady** → payload: orderId, estimatedPickup. Triggers: notify client display, sound, mobile push (if available).  
- **OrderDelivered** → payload: orderId, deliveredBy. Triggers: close order, update inventory reconciliation.

---

## 6. UX / UI requirements (high level)
- **Cajera screen (sales):** Full-screen POS layout; product categories; quick-add variants; numeric keypad; visible total; large "Registrar Venta" button; quick access to vales and payment methods.  
- **Despachadora screen (kitchen):** Queue of orders with status badges; ability to mark items as ready; filter by time/priority; audible alert when new order arrives.  
- **Cliente display / Notifier:** Simple screen showing order numbers and statuses; optional buzzer and visual highlight for ready orders.  
- **Administrador dashboard:** Product/variant editor; inventory by presa type; sales reports; user management; reconciliation tools.

---

## 7. APIs y integration surface (examples)
- **POST /api/orders** — Create order (body: order payload).  
- **GET /api/orders?status=preparing** — List orders by status.  
- **POST /api/orders/:id/ready** — Mark order ready; emits OrderReady event.  
- **POST /api/products** — Create product with variants.  
- **GET /api/inventory/presas** — Get counts per presa type.  
- **POST /api/inventory/adjust** — Manual adjustment (reception, spoilage).  
- **POST /api/vouchers/redeem** — Redeem voucher.  
- **WebSocket or fetch channel:** `orders` — real-time or fetch events for order lifecycle.

---

## 8. Acceptance criteria & test strategy
### 8.1 Acceptance criteria (per module)
- **FR-001 (Productos/variantes):** Admin can create a product with at least one variant and define allowed substitutions; created variant appears in POS within 5s.  
- **FR-002 (Registro de pedidos):** Cajera puede registrar una venta completa (selección de variantes, aplicar vale, seleccionar mesa/llevar) y generar factura + 2 comandas imprimibles.  
- **FR-006 (Inventario presas):** Venta de una porción que consume presas decrementa automáticamente `InventoryItem.currentStock` y el dashboard muestra `currentStock` actualizado.  
- **FR-007 (Notificación):** Cuando despachadora marca pedido como listo, el cliente display y la pantalla de cajera reciben la notificación en <2s y suena alerta configurable.

### 8.2 Test plan(OPTIONAL)
- **Unit tests:** Services, inventory adjustments, voucher logic.  
- **Integration tests:** Order creation → inventory decrement → print job enqueued.  
- **E2E tests:** Simulate full shift: open cash, register multiple orders, close cash, reconcile.  
- **Usability tests:** 3–5 sessions con cajeras y despachadoras en entorno real.  
- **Acceptance tests:** Black-box tests y pruebas de aceptación con el dueño del restaurante como previsto en el proyecto. 

---

## 9. Roadmap y entregables (AUP-aligned iterations)
**Inception (1–2 semanas)**  
- Requisitos detallados, prototipos de alta fidelidad (Figma), definición de arquitectura y plan de despliegue.

**Elaboration (2–4 semanas)**  
- Implementación de modelos de datos, API básica, autenticación, y prototipo funcional de POS y administración.  
- Validación con stakeholders (dueño, cajera, despachadora, cocineros).

**Construction (6–8 semanas, iterativo)**  
- Iteraciones de 2 semanas entregando: ventas básicas, impresión de comandas, inventario por presas, notificaciones, reportes básicos.  
- Integración impresora y pruebas en sitio.

**Transition (2 semanas)**  
- Pruebas de aceptación en producción local, capacitación de personal, ajustes finales y despliegue.

**Mínimo Producto Viable (MVP) — objetivo:** FR-001, FR-002, FR-003, FR-006, FR-007, FR-008, FR-010 en producción local. 

---

## 10. Operación, despliegue y mantenimiento
- **Despliegue inicial:** Servidor local (windows) con Docker Compose (opcional); base de datos PostgreSQL.  
- **Backups:** Copias diarias automáticas de la BD; exportación manual antes de cada cambio de versión.  
- **Monitoreo:** Logs de aplicación, alertas de errores críticos, métricas de uso.  
- **Soporte:** Plan de soporte 30 días post-despliegue para ajustes operativos y correcciones críticas.

---

## 11. Riesgos, mitigaciones y KPIs
### Riesgos y mitigaciones
- **Resistencia al cambio del personal** → Mitigación: UI simple, capacitación en sitio, periodo paralelo con sistema antiguo.   
- **Desincronización inventario por ventas manuales** → Mitigación: controles de auditoría, ajustes manuales con registro y reconciliación diaria.  
- **Fallas impresora térmica** → Mitigación: fallback a PDF/comanda en pantalla y opción de imprimir desde otra estación.

### KPIs (medibles)
- **Tiempo promedio por venta** (objetivo: reducir 30% respecto a proceso actual).  
- **Errores en pedidos entregados** (objetivo: <1% de pedidos mal entregados).  
- **Tiempo de notificación pedido listo** (objetivo: <2s desde marcado listo).  
- **Reducción de anotaciones manuales** (objetivo: 95% de comandas sin anotaciones en papel).  
- **Precisión inventario presas** (objetivo: conciliación diaria con desviación <2%).

---

## 12. Requerimientos operativos y legales
- **Facturación:** Integración con facturación computarizada local según normativa vigente (IMPUETOS - SUCRE BOLIVIA).   
- **Protección de datos:** Manejo de datos personales mínimos para facturación; almacenamiento seguro y cumplimiento de prácticas locales.

---

## 13. Entregables de documentación
- **Especificación de API (OpenAPI).**  
- **Modelos de datos (ERD).**  
- **Guía de despliegue (Docker opcional).**  
- **Manual de usuario por rol (Admin, Cajera, Despachadora).**  
- **Plan de pruebas y checklist de aceptación.**

---

## 14. Recomendaciones técnicas y decisiones abiertas
- **ORM recomendado:** *Prisma* para productividad y migraciones o *TypeORM* si se prefiere integración clásica con NestJS.  
- **Realtime:** WebSocket Gateway en NestJS para notificaciones internas; considerar Redis Pub/Sub si se escala a múltiples instancias. O Simplemente realizar un fetch
- **Persistencia local vs nube:** Implementar modo local por defecto con opción de sincronización a nube para backups y reportes remotos. 

---

## 15. Anexos rápidos
- **Métricas de volumen estimadas:** ~200 presas por tipo por día (800 presas/día total) según registro actual; esto justifica la automatización del conteo.   
- **Herramientas de diseño y gestión:** Figma, StarUML, GanttProject, Visual Studio Code, GitHub. 

---

### Conclusión
Este PRD traduce la problemática operacional descrita en el proyecto de grado en requerimientos técnicos y funcionales accionables. El enfoque prioriza la **velocidad de venta**, la **precisión del inventario por presas**, y la **experiencia del cliente** mediante notificaciones en tiempo real y una interfaz por rol simplificada. La propuesta técnica (NestJS + TypeScript + ORM; Next.js + React + Zustand) y la metodología AUP permiten entregas iterativas y validación temprana con el dueño del restaurante. 

---

**Siguientes pasos recomendados (inmediatos):**  
- Validar y priorizar la lista FR con el dueño y 2 cajeras en una sesión de 1 hora.  
- Aprobar el alcance del MVP y reservar 2 semanas para Inception (prototipos y arquitectura).