# Business Context — Wonder Chicken
**Sistema Informático de Ventas — Material de origen**

> **Qué es este documento:** la **evidencia cruda** del trabajo de titulación — citas textuales del documento oficial, menú 2026, inventario diario de ejemplo y tickets reales del sistema a reemplazar. Es el **material de origen** del que se deriva el [`pdr.md`](pdr.md).
>
> **No es normativo.** Acá vive el *insumo* (lo observado, lo entrevistado, lo medido); las **reglas definitivas** viven en el [`pdr.md`](pdr.md). Ante cualquier conflicto, **gana el PDR**.
>
> **Cadena:** `business_context.md` (origen) → [`pdr.md`](pdr.md) (reglas) → resto de la documentación. Mapa completo en [`indice_pdr.md`](indice_pdr.md).

---

## Índice

**Material de origen**
- [Citas textuales del documento](#citas-textuales-del-documento)
- [Wonder Chicken — Menú (2026)](#wonder-chicken---menú-2026)
- [Ejemplo de inventario diario](#ejemplo-de-inventario-diario)
- [Ejemplo de comandas/tickets (sistema actual)](#ejemplo-de-comadastickets-impresas-por-el-sistema-actual-a-remplar)


---

## CITAS TEXTUALES DEL DOCUMENTO:
**SITUACIÓN PROBLEMÁTICA:** Después de haber realizado un análisis de observación al flujo de trabajo del restaurante Wonder Chicken, examinar el funcionamiento de su sistema informático genérico y haber sostenido una entrevista con el dueño del restaurante, se identificaron los siguientes problemas:
- El sistema actual no se adecua a la forma de trabajo del restaurante, pues no admite el registro de nuevas variantes de los productos, por ejemplo: Una porción media consta de 2 presas de pollo + 1 porción de papa frita; pero también la porción de papa frita puede ser sustituida por 1 porción de arroz o 1 porción de Smiles McCain. Además, el sistema actual no permite diferenciar entre los pedidos para llevar y los de mesa. También dicho sistema no contempla el registro de vales de productos que opcionalmente un trabajador puede solicitar.
Estas limitaciones obligan a realizar anotaciones manuales en la comanda del pedido, lo que dificulta el trabajo y muchas veces genera confusiones.
- Actualmente, no existe un método rápido y sencillo para obtener la cantidad de pollo, es decir la cantidad de presas vendidas y las que permanecen en cocina. Para obtener esta información, el personal de cocina debe realizar un conteo manual de las presas restantes antes de cada cambio de turno.
- Interfaz sobrecargada que dificulta el trabajo de la cajera, actualmente el sistema muestra todas las opciones que posee; pero varias de estas opciones no son necesarias o no están disponibles debido a la falta de privilegios necesarios de la cajera. Esto genera dificultades en el aprendizaje del uso del sistema, ya sea para el personal actual o nuevo.
- Cuando el negocio está lleno y las despachadoras necesitan entregar un pedido, se ven obligadas a gritar el nombre del cliente o ir a buscarlo a su mesa. Esta situación resulta incómoda tanto para las despachadoras como para el cliente y además ralentiza el trabajo. Este escenario también ocurre debido a que algunos clientes eligen sentarse en mesas distantes.

**PROBLEMA CENTRAL:** El sistema de ventas en el restaurante "Wonder Chicken" no se adapta a las nuevas necesidades relacionadas con el flujo de atención al cliente, lo que ocasiona dificultades en la atención adecuada de los pedidos.

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
- Despresadores de pollo: Son las personas encargadas de despresar los pollos recién adquiridos y guardarlos en las neveras del restaurante.

**PROCESO DE VENTA:**
- Registrar pedido: Este proceso se realiza usando el sistema genérico y tiene como finalidad el registro de pedidos de un cliente ya sea de manera presencial o por llamada telefónica, registrando sus datos personales para la emisión de la factura, la emisión de la comanda y/o en envío por delivery del pedido.
- Generar factura y comanda del pedido: La cajera usa el sistema genérico para imprimir la factura del pedido y 2 comandas correspondientes. Posteriormente entrega al cliente la factura y una comanda, la otra restante la entrega a las despachadoras.
- Preparar el pedido: Las despachadoras reciben las comandas de los pedidos por parte de la cajera y estas deben preparar los platos.
- Despachar el pedido: Las despachadoras preparan los platos en base a la comanda que  les fue entregada por la cajera, una vez listo el plato llaman al cliente por su nombre o número de pedido para que pueda recogerlo previa presentación de su comanda.
En caso de pedidos a domicilio, el pedido se entrega a un servicio de delivery, el cual se encarga de entregarlo al cliente. Cabe mencionar que al ser un servicio de terceros, el precio del envío es previamente y netamente acordado entre el cliente y el delivery. Dicho precio no figura en la factura del cliente.
Al finalizar las entregas, las despachadoras guardan las comandas, ya que algunas veces la cajera necesita revisarlas cuando hay un problema al realizar las cuentas.

IMPORTANTE:
- Por cada turno de trabajo hay 1 cajera y 1-3 despachadoras. El dia de trabajo comprende 2 turnos.
- El personal de cajera y despachadora suelen rotar funciones en la semana. Es decir un personal puede ser(tener las funciones) cajera un dia y al otro ser despachadora.
- Cada cajera suele tener una clave unica para entrar al sistema (autenticaion)
- Algunas veces(cuando sobra pollo cocinado), se suele vender al personal plato(s) con descuento (por ejemplo un plato de 30bs a 23bs). CONTEMPLAR ESTA SITACION PARA ARQUEO, REPORTES, ETC

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

OBSERVACIÓN: Venta de presas surtidas (ventas custom — ver [`pdr.md` §2.10](pdr.md#210-ventas-custom-presas-surtidas)).

---

## EJEMPLO DE INVENTARIO DIARIO:

- WONDER CHICKEN - INVENTARIO DIARIO
- Dirección: Av. Las Américas Nº 317
- Elaborado por: Silvia
- Sucre, 15 de marzo de 2026

---                  | -      | ALA    | PECHO   | PIERNA  | ENTREPIERNA  | -
---------------------|--------|--------|---------|---------|--------------|--------
Reproceso crudo            | -      | 38     | 38      | 38      | 38           | -
Procesado crudo            | -      | 70    | 70     | 70     | 70          | -
Sobrante Procesado Crudo   | -      | 64     | 64      | 64      | 64           | -
Vendido Cocido   | -      | 44     | 44      | 44      | 44           | -
Sobrante cocido en expositor   | -      | 8     | 8      | 8      | 8           | -


Nota:
- El Reproceso crudo, Procesado crudo y Sobrante Procesado Crudo son anotados por el personal de cocina(los cocineros) en el inventario diario.
- Reproceso crudo: Es la cantidad de pollo sobrante del turno anterior (del dia(mañana) o del dia anterior(noche)).
- Procesado crudo: La cantidad de pollo fresco a marinar (turno actual)
- Sobrante Procesado Crudo: Cantidad de pollo que sobra al final de cada turno.

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
C1   | Bolsa Papa Congelada      | Bolsa    | -          | -       | -            | 10     | -
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

