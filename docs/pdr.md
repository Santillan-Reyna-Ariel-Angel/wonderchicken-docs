# Product Requirements Document (PRD)
**Sistema Informático de Ventas — Wonder Chicken**
**Rol del autor:** Senior Product Manager / Arquitecto de Sistemas (digitalización de servicios de comida rápida)
**Versión:** 2.0 (incorpora respuestas del cuestionario Fase 1)
**Fecha:** 2026-05-01
**Alcance:** Documento de negocio y requisitos funcionales / no funcionales para que un LLM genere backend y frontend coherentes con las reglas operativas del restaurante.

---

## Índice

**Material de origen**
- [Citas textuales del documento](#citas-textuales-del-documento)
- [Wonder Chicken — Menú (2026)](#wonder-chicken---menú-2026)
- [Ejemplo de inventario diario](#ejemplo-de-inventario-diario)
- [Ejemplo de comandas/tickets (sistema actual)](#ejemplo-de-comadastickets-impresas-por-el-sistema-actual-a-remplar)

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
- [15. Siguientes entregables que puedo generar (elige uno)](#15-siguientes-entregables-que-puedo-generar-elige-uno)
- [Observación final (para el LLM y el equipo)](#observación-final-para-el-llm-y-el-equipo)

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
Despresadores de pollo: Son las personas encargadas de despresar los pollos recién adquiridos y guardarlos en las neveras del restaurante.

**PROCESO DE VENTA:**
- Registrar pedido: Este proceso se realiza usando el sistema genérico y tiene como finalidad el registro de pedidos de un cliente ya sea de manera presencial o por llamada telefónica, registrando sus datos personales para la emisión de la factura, la emisión de la comanda y/o en envío por delivery del pedido.
- Generar factura y comanda del pedido: La cajera usa el sistema genérico para imprimir la factura del pedido y 2 comandas correspondientes. Posteriormente entrega al cliente la factura y una comanda, la otra restante la entrega a las despachadoras.
- Preparar el pedido: Las despachadoras reciben las comandas de los pedidos por parte de la cajera y estas deben preparar los platos.
- Despachar el pedido: Las despachadoras preparan los platos en base a la comanda que  les fue entregada por la cajera, una vez listo el plato llaman al cliente por su nombre o número de pedido para que pueda recogerlo previa presentación de su comanda.
En caso de pedidos a domicilio, el pedido se entrega a un servicio de delivery, el cual se encarga de entregarlo al cliente. Cabe mencionar que al ser un servicio de terceros, el precio del envío es previamente y netamente acordado entre el cliente y el delivery. Dicho precio no figura en la factura del cliente.
Al finalizar las entregas, las despachadoras guardan las comandas, ya que algunas veces la cajera necesita revisarlas cuando hay un problema al realizar las cuentas.

IMPORTANTE:
- Por cada turno de trabajo hay 1 cajera y 2-3 despachadoras. El dia de trabajo comprende 2 turnos.
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

OBSERVACIÓN: Venta de presas surtidas (ventas custom — ver §2.10).

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
  - **Objetivo:** Marinar presas crudas (procesado), cocinar presas y porciones (papa, pipocas, plátano, smile). Contar bolsas de papa usadas y presas restantes (sobrante procesado).
  - **Frustraciones actuales:** Conteo manual de pollo restante y bolsas de papa al cambio de turno.

### Principales flujos de usuario (resumidos)
- **Venta presencial (mesa):** Cajera registra pedido → confirma pago → comanda digital aparece en panel de despacho → despachadora prepara → cliente notificado en pantalla pública (solo número de pedido) → despachadora entrega el pedido.
- **Venta para llevar / delivery:** La cajera registra el pedido (puede quedar con pago pendiente si el delivery aún no paga) → la comanda digital aparece y SE PREPARA de inmediato → al confirmar el pago, se descuenta inventario y se contabiliza la venta → el cliente es notificado en la pantalla pública (solo número de pedido) → entrega al delivery o al cliente.
- **Venta custom (presas surtidas):** La cajera entra al flujo "Venta Custom" en el POS → el pedido queda marcado como custom y puede ser MESA o LLEVAR → la cajera arma uno o más ítems indicando las presas exactas (ej. 2 pechos, 1 ala + 1 pierna) y un precio que ella decide → confirma el pago → el inventario descuenta exactamente las presas vendidas.
- **Venta interna con descuento (sobrante de pollo cocido):** Al final del turno, si hay sobrante de pollo cocido, se permite vender una Porción Media a 23 Bs (precio de Cuarto de Pollo) al personal. La venta queda marcada como descuento interno para que el arqueo y el inventario cuadren correctamente.
- **Compensación al cliente (pollo defectuoso):** cuando el pollo cocido no sale bien (presas quebradas/partidas/mal cortadas), el administrador autoriza una vez por turno a la cajera para aplicar el descuento "Compensación al cliente" (7 Bs, disponible todo el turno). Autorizada, la cajera puede aplicarlo a los pedidos afectados durante el turno; cada aplicación queda registrada como descuento para que arqueo e inventario cuadren (§2.11).
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
- **Precio final del pedido** = precio base del plato + valor de los extras. Las sustituciones NO afectan el precio (§2.1).
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
- **Reporte de inventario diario:** consolida ambos turnos del día (referencia: tabla "INVENTARIO DIARIO" más arriba).

### Plano COCIDO (inventario transaccional del expositor — lo que se vende)
- **Unidad:** presas cocidas por tipo: pecho, ala, pierna, entrepierna.
- **Descuento por venta:** el inventario cocido se descuenta por tipo **al confirmar el pago**, NO al pasar el pedido a preparación. Esto evita inconsistencias cuando un pedido con pago pendiente termina cancelado.
- **Regla de pares:** los platos de "2 presas" consumen exactamente 2 unidades del par seleccionado por el cliente (ej. pecho-ala descuenta 1 pecho cocido + 1 ala cocida; pierna-entrepierna descuenta 1 pierna cocida + 1 entrepierna cocida).
- **Bebidas:** se descuentan por unidad automáticamente al confirmar el pago.
- **Sobrante cocido en expositor:** se anota al cierre de turno (plano crudo) y habilita la venta interna con descuento al personal (§2.11).
- **Reconciliación al cierre:** el sistema compara el `Sobrante cocido en expositor` contra `(cantidad cocinada en el turno − vendido cocido por el sistema)` y reporta discrepancias para auditoría.

### Acompañamientos e insumos
- **Acompañamientos NO se descuentan a nivel granular:** porciones de mixto, arroz, papa, smiles, plátano NO se llevan en inventario en V1.
- **Conteo manual residual:** en cada turno, el personal anota cantidad de bolsas de papa, bolsas de smile, envases de arroz, vasos, bombillas, etc. (referencia: tabla "INVENTARIO DIARIO" más arriba). El sistema debe ofrecer una pantalla simple para registrar estos consumos por turno.

## 2.4 Vales (ventas internas — descuento por nómina)
- **Naturaleza:** un vale registra que un trabajador consumió un plato; el monto se descuenta de su nómina al cierre del mes. NO es un retiro de caja inmediato ni un ingreso de venta.
- **Datos obligatorios del vale:** trabajador, plato, fecha, monto y quién lo emitió.
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
- **Roles funcionales:** administrador, cajera, despachadora, cocinero.
- **Decisión V1:** **el control de permisos SÍ se aplica en backend** en V1, vía autenticación JWT + un guard que valida el rol en cada endpoint. La UI además oculta las pantallas no relevantes a cada rol, pero **la UI no es la frontera de seguridad: el backend valida el rol en cada petición** (devuelve 401 sin token válido, 403 si el rol no corresponde).
- **Matriz de autorización por rol** (la UI la usa para mostrar pantallas; el backend la usa para autorizar endpoints vía guard — es la spec que el guard implementa):
  - **Administrador:** registrar productos, registrar platos / variantes, crear usuarios, modificar inventario (con motivo), ver reportes globales, crear descuentos y autorizar descuentos por turno.
  - **Cajera:** registrar ventas (mesa / llevar / custom), emitir vales, abrir / cerrar caja, registrar gastos, anular pedidos, aplicar descuentos.
  - **Despachadora:** ver la cola de comandas, marcar pedidos como "listo" y "entregado".
  - **Cocinero:** registrar ingreso de presas procesadas, anotar consumos manuales por turno (bolsas de papa, smile, etc.).
- **Sesiones por turno:** un mismo trabajador puede trabajar como cajera un día y como despachadora otro. Pero **dentro del mismo turno**, un usuario solo puede tener **1 sesión activa con 1 rol**. No puede estar simultáneamente activo como cajera y despachadora en el mismo turno.
- **Cajas por turno:** el sistema permite 1 o más cajas, pero **cada caja es atendida por 1 sola cajera por turno**.

## 2.8 Comandas, tickets, factura y notificaciones
- **Comanda interna (despachadora):** **digital por default**, listada en una interfaz dedicada para despachadoras. Aparece automáticamente al confirmar el pedido (incluso si está con pago pendiente). NO se imprime en térmica salvo decisión explícita.
- **Comanda del cliente:** el cliente accede a una interfaz dedicada (única por cliente) donde ve **solo su comanda(s)** (sus pedidos del dia).
- **Factura (fiscal, para el cliente):** solo se emite si el cliente la solicita. En ese caso, se imprime en la impresora térmica local. Si la impresora falla, el sistema permite descargar la factura en PDF y delegar la impresión al navegador o lector de PDF del usuario.
- **Tipos de comanda / ticket:** solo dos tipos — **MESA** y **LLEVAR**. Una venta custom (presas surtidas — §2.10) **no es un tipo aparte**: puede ser MESA o LLEVAR según dónde consume el cliente. CUSTOM es una marca que se aplica al pedido, no un tipo de pedido.
- **Campos obligatorios en comanda / ticket:** ID del pedido, tipo (MESA / LLEVAR), nombre del cliente, fecha y hora, lista de ítems con su descomposición (presas seleccionadas, bebidas, extras, sustituciones), total y responsable (cajera).
- **Notificación de pedido listo:** al marcarse como listo, el pedido aparece en una **pantalla pública** estilo "tickets de banco" dentro del local mostrando **únicamente el número de pedido**. Aplica tanto a pedidos **MESA como LLEVAR**. No se muestra nombre del cliente, ni ningún otro dato — solo el número de pedido. Suena una alerta breve. En MESA y LLEVAR, el cliente recoge el pedido de las despachadoras (IMPORTANTE ES UN RESTAURANTE DE AUTO SERVICIO). La despachadora marca el pedido como entregado desde su panel y este desaparece de la pantalla. El momento de "entregado" queda registrado.

## 2.9 Auditoría
- **Nivel V1:** solo se auditan **acciones críticas**: registro de venta, anulación de venta, ajuste de inventario, emisión de vale, apertura / cierre de caja, generación de reporte.
- **Registro:** cada acción auditada deja constancia de quién, cuándo, qué entidad afectó y qué cambió.

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
- **Comanda:** se lista igual que cualquier otra, mostrando la composición real del ítem (ej. "2 - PECHO; 1 - ALA; 1 - PIERNA"). La cabecera del ticket dice MESA o LLEVAR según corresponda — no existe el tipo "CUSTOM" en la comanda.
- **Reportes:** las ventas custom se identifican como marca sobre el pedido, no como tipo MESA/LLEVAR.

### Precio sugerido en venta custom (V1)
Cada tipo de presa cocida (pecho, ala, pierna, entrepierna) lleva un **precio de venta unitario** que configura el administrador. En la venta custom, como la cajera puede seleccionar **X presas y/o productos**, el sistema calcula un **precio sugerido** = suma de las presas seleccionadas (a su precio de venta) + extras + bebidas, y se lo muestra. Reglas:
- Es una **sugerencia, no una imposición**: la cajera puede pisar el precio (regla del §2.10 — ella decide). El sistema persiste el precio **confirmado**, nunca la sugerencia.
- Es solo **precio de VENTA**. El sistema **no registra el costo del pollo** ni calcula margen (fuera de alcance — descartado de V2).

### Visión V2 (no MVP) — auto-servicio
- Si el sistema se abre al público en modalidad **auto-servicio**, el cliente arma su propio pedido custom y el total se **calcula automáticamente** a partir del precio de venta por presa (ya definido en V1), sin intervención de la cajera.

## 2.11 Descuentos sobre la orden (incluye descuento al personal)

### Feature de descuentos (V1)
- **El administrador crea descuentos** desde su panel. Cada descuento tiene: **nombre**, **monto fijo** (en Bs), **disponibilidad** (`siempre` / `solo a fin de turno`) y **requiere autorización** (`sí` / `no`). En V1 los descuentos son de **monto fijo** (no porcentaje) y se aplican **a toda la orden**.
- **La cajera aplica un descuento a la orden** desde el POS (botón/selector dedicado): elige uno de los descuentos creados por el admin que esté disponible en ese momento. Se permite **un solo descuento por orden** (sin apilamiento).
- **Descuentos que requieren autorización:** si el descuento tiene `requiere autorización = sí`, la cajera **no puede aplicarlo libremente**: necesita que el administrador le otorgue una **autorización para el turno** (ver "Autorización de descuentos por turno" abajo). Mientras la sesión de cajera no esté autorizada para ese descuento, el POS no lo ofrece.
- **Registro sobre la venta:** quedan guardados el **precio original** (antes del descuento), el **monto descontado** (snapshot del monto fijo aplicado, ej. 7 Bs), el **total cobrado** (`precio_original − monto descontado`, lo que entra a caja) y la **referencia al descuento aplicado**. Aparece en arqueo y reportes para trazabilidad, y queda en auditoría.
- **Inventario intacto:** el descuento es **puramente monetario**. El inventario siempre descuenta el producto **real** vendido, nunca el equivalente al precio descontado.

### Descuento al personal (sobrante de pollo cocido) — instancia principal
- **Contexto:** al final de cada turno (16:00 o 23:00), si sobra **pollo cocido en el expositor** (ver §2.3, plano cocido), el dueño permite vender una **Porción Media** al personal por **23 Bs** (en vez de 30 Bs). Hoy se registra incorrectamente como "Cuarto de Pollo (2 presas) - 23 Bs" para que el inventario cuadre.
- **En el nuevo sistema** es simplemente un descuento creado por el admin: **"Descuento personal", monto fijo 7 Bs, disponibilidad `solo a fin de turno`**. Al aplicarlo a una Porción Media (30 Bs), el precio final es **23 Bs** y queda registrado el descuento de **7 Bs**.
- **Producto real:** la venta se registra con la **Porción Media** real entregada (no el truco del Cuarto de Pollo). El inventario descuenta lo correcto (2 presas), sin trucos.
- **Disponibilidad y auditoría:** este descuento solo se habilita al final del turno (es su config de disponibilidad) y queda registrado en auditoría.
- **Sin autorización especial:** cualquier cajera puede aplicarlo cuando está disponible (`requiere autorización = no`). No confundir con el descuento de compensación al cliente, que sí la requiere (abajo).

### Descuento de compensación al cliente (pollo defectuoso) — segunda instancia
- **Contexto:** a veces el pollo cocido no sale bien (piernas quebradas, pechos partidos, alas mal cortadas, etc.). Para **compensar al cliente**, el dueño autoriza vender un plato de 30 Bs a **23 Bs**. Es un caso **distinto** del descuento al personal: el beneficiario es el **cliente**, no el personal; el motivo es un **defecto de calidad**, no el sobrante; y está disponible **durante todo el turno**, no solo al final.
- **En el nuevo sistema** es un descuento creado por el admin: **"Compensación al cliente", monto fijo 7 Bs, disponibilidad `siempre`, requiere autorización `sí`**. Al aplicarlo a un plato de 30 Bs, el precio final es **23 Bs** y queda registrado el descuento de **7 Bs**.
- **Requiere autorización del admin (clave):** la cajera **no** puede aplicar este descuento por su cuenta. El administrador le otorga una **autorización para el turno** (ver abajo). Una vez autorizada, la cajera puede aplicarlo **cuantas veces lo necesite hasta el fin del turno** (no se limita a un único pedido).
- **Producto real e inventario:** como cualquier descuento, es puramente monetario. La venta registra el **plato real entregado** y el inventario descuenta las presas reales, sin trucos.

### Autorización de descuentos por turno
- **Qué es:** una habilitación que el administrador otorga **a la sesión de cajera de un turno** para aplicar un descuento marcado como `requiere autorización = sí`. Es el mecanismo que separa "el admin define el descuento" de "esta cajera, hoy, puede usarlo".
- **Alcance — por turno, no por orden:** la autorización se da **una sola vez por turno** y vale para **todo el turno**. NO se solicita ni se renueva por cada orden o pedido. Mientras dure el turno y la cajera esté autorizada, puede aplicar el descuento las veces que la operación lo requiera.
- **Atada a la cajera del turno:** la autorización se vincula a la **sesión de cajera** de ese turno. Como un usuario solo puede tener 1 sesión activa con 1 rol por turno (§2.7, FR-008b), la autorización vive y muere con esa sesión: **se extingue automáticamente al cerrar el turno** y no se hereda al turno siguiente.
- **Datos de la autorización:** descuento autorizado, sesión/cajera y turno beneficiados, administrador que la otorgó y fecha/hora.
- **Auditoría:** el **acto de autorizar** es una acción auditable por sí mismo (quién autorizó, a qué cajera, para qué descuento, cuándo), independientemente de cada aplicación posterior del descuento sobre una venta (que ya queda auditada como cualquier descuento).

### Nota de diseño — catálogo mínimo, NO motor de reglas
> Decisión de arquitectura para quien implemente. El requisito es **"el admin crea descuentos y la cajera los aplica"** — esa configurabilidad ES la feature, así que se justifica un **catálogo mínimo** de descuentos (entidad `Discount`: nombre, monto fijo, disponibilidad, activo). NO confundir con un motor de reglas:
- **Alcance acotado a propósito:** **monto fijo** (sin porcentaje), **a nivel orden** (sin nivel ítem), **un descuento por orden** (sin apilamiento), sin ventanas de validez más allá de `siempre` / `fin de turno`. Si en el futuro hace falta %, apilamiento o targeting por ítem, se agrega **con un caso real**, no antes.
- **La autorización por turno es la única excepción de control, y entra con un caso real:** el descuento de compensación al cliente exige que el admin habilite a la cajera, así que el catálogo suma **un flag `requiereAutorizacion`** en el `Discount` y una **autorización por turno** (admin → sesión de cajera). Sigue sin ser un motor de reglas: es un **flag de habilitación a nivel turno** (autorizado sí/no), NO un contador de usos ni una cuota por pedido. Una vez autorizada, la cajera aplica el descuento sin límite de cantidad hasta el cierre del turno.
- **El monto se congela en la transacción (snapshot), NO se deriva de una resta:** al aplicar un descuento, la orden **copia** el `discountAmount` del **monto fijo vigente** en el catálogo (ej. 7 Bs) y guarda también la referencia al `Discount` y el `total` cobrado. Ojo: con monto fijo el `discountAmount` **es el valor que fijó el admin**, no el resultado de `precio_original − precio_final` — al revés, el `total` es el que se deriva (`precio_original − discountAmount`). Se congela en la orden para que, si el admin edita el descuento después (de 7 a 10 Bs), las ventas viejas conserven los 7 Bs con que realmente se cobraron. Detalle de campos en [`docs/technical_guide.md` §3](technical_guide.md).
- **Los vales (§2.4) NO son descuentos:** no suman a caja y descuentan nómina — concepto aparte, no se mezclan en este feature.

---

# 3. Modelo de datos
> **Trasladado a la guía técnica.** El detalle de entidades, campos y relaciones del esquema lógico de base de datos vive en [`docs/technical_guide.md` §3](technical_guide.md). Este PDR mantiene únicamente las reglas de negocio que esas entidades deben respetar.

---

# 4. Máquina de estados de pedidos
> Los efectos transaccionales detallados (campos, timestamps, reversiones de inventario) viven en [`docs/technical_guide.md` §4](technical_guide.md). Esta sección describe los estados y las reglas de negocio que rigen las transiciones.

**Estados:** registrado → confirmado → en preparación → listo → entregado → cerrado.
Estados adicionales: **pago pendiente**, **anulado**, **en espera**.

**Transiciones y reglas (a nivel negocio):**

- **Confirmación de pedido con pago inmediato.** La cajera registra y cobra. El pedido pasa a preparación, se descuenta inventario, se contabiliza el ingreso, se genera la comanda digital y, si el cliente lo pide, se imprime la factura.
- **Registro de pedido con pago pendiente (LLEVAR / delivery).** El pedido entra a preparación de inmediato. Mientras esté pendiente de pago, NO se descuenta inventario y NO se contabiliza ingreso. La cancelación, si ocurre, es siempre manual y la decide la cajera (§2.5).
- **Confirmación de pago de un pedido pendiente.** Al recibirse el pago: se descuenta inventario, se contabiliza el ingreso y se imprime/genera la factura si el cliente lo solicita.
- **Cancelación de un pedido pendiente de pago.** Solo la cajera puede hacerlo, en cualquier momento, sin requerir motivo (no se contabilizó nada). **No hay auto-cancelación por tiempo.**
- **Marcado como listo.** Cuando la despachadora termina el pedido, este se muestra en la pantalla pública (solo número de pedido) y suena una alerta breve. Aplica a MESA y a LLEVAR por igual.
- **Entrega.** El cliente recoge / el delivery retira / la despachadora lleva el pedido a la mesa. La despachadora marca el pedido como entregado.
- **Cierre.** Acción administrativa, típicamente al cierre de turno.
- **Anulación de un pedido ya pagado.** Requiere **motivo y detalle obligatorios**. El sistema revierte el inventario y la anulación queda registrada en el arqueo del turno con su monto. Queda auditado.

**Regla transaccional (negocio):** la confirmación de pago y el descuento de inventario deben ocurrir como una sola operación inseparable. Si no hay stock suficiente, el pedido permanece en su estado anterior y se avisa a la cajera qué falta.

---

# 5. Requerimientos funcionales (completos) y criterios de aceptación
> **Trasladado a un documento dedicado.** El detalle de los requerimientos funcionales (FR-001 a FR-017) con sus criterios de aceptación vive en [`docs/requirements.md` §1](requirements.md). Este PDR mantiene las reglas de negocio (§2) que esos FR deben respetar y el alcance V1/V2 (§13).

---

# 6. Requerimientos no funcionales
> **Trasladado a un documento dedicado.** Las calidades de uso de cara al negocio viven en [`docs/requirements.md` §2](requirements.md). El detalle de NFR técnicos (rendimiento, seguridad, escalabilidad, multiplataforma, impresión, despliegue, backups) vive en [`docs/technical_guide.md` §2](technical_guide.md).

---

# 7. UX / UI — requisitos y pantallas clave
> Diseñar pantallas con foco en velocidad y claridad para personal con baja tolerancia a errores.

## 7.1 POS (Cajera)
- **Objetivo:** Registrar venta en ≤3 pasos.
- **Elementos:** Categorías, búsqueda rápida, botones de producto, selección de variante, selector de sustitución (1, sin alterar precio), selector de presas (par fijo: pecho-ala / pierna-entrepierna), keypad numérico, total visible, botones: `Confirmar Pago`, `Guardar Pendiente (LLEVAR)`, `Vale`, `Venta Custom`, `Aplicar Descuento`.
- **Atajos:** (opcional) teclas para categorías, confirmar venta, abrir caja, aplicar vale.

## 7.2 Panel Despacho
- **Objetivo:** Cola clara de comandas digitales en preparación; marcar pedidos como "listo" y "entregado".
- **Elementos:** Lista ordenada por hora de emisión; filtros (en preparación, listo); detalle por pedido con composición; botón "Marcar listo" con confirmación; indicador visual para pedidos con pago pendiente.

## 7.3 Pantalla pública (clientes en local)
- **Objetivo:** Mostrar los pedidos listos estilo "turnos de banco" para anunciar al cliente. Aplica a **MESA** y **LLEVAR** indistintamente.
- **Elementos:** **Únicamente el número de pedido**. Sin nombre, sin mesa, sin ningún otro dato. Sonido breve al aparecer.

## 7.4 Vista del cliente (su comanda)
- **Objetivo:** Cliente accede a una URL única de su pedido y ve su comanda con composición y total.
- **Elementos:** Nombre, mesa, items con descomposición, total, estado actual.

## 7.5 Administración
- **Objetivo:** CRUD productos/variantes (incluye precio de venta por presa), inventario, usuarios, reportes, gestión de vales, gestión de descuentos.
- **Elementos:** Formularios producto, definición variantes, panel inventario por presas, registro consumos manuales, listado vales, reportes exportables.

## 7.6 Cocinero (consumos manuales)
- **Objetivo:** Al final de turno, registrar bolsas papa/smile usadas, vasos, bombillas, etc.
- **Elementos:** Formulario simple por ítem de inventario manual.

## 7.7 Factura (impresión / PDF)
- **Formato:** Similar a ejemplos del PDR; incluir sustituciones y responsable.
- **Fallback:** PDF descargable; el navegador maneja la elección de impresora.

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
- POS funcional para registrar ventas estándar MESA/LLEVAR y ventas custom de presas surtidas (MESA/LLEVAR), con variantes y 1 sustitución de acompañamiento sin alterar el precio.
- Los pedidos con pago pendiente se preparan de inmediato, descuentan inventario solo al confirmar el pago, y se cancelan únicamente de forma manual por la cajera (sin timeout automático).
- Inventario por presas descontado automáticamente al confirmar pago, con dashboard visible.
- Apertura y cierre de caja con arqueo exportable que incluya ventas por método, vales, anulaciones, gastos y diferencia.
- Notificación de pedidos listos en una pantalla pública estilo "turnos de banco".
- Vales registrados con su detalle: descuentan inventario, no suman al ingreso, son listables.
- Comandas digitales en el panel de despacho + vista pública del cliente.
- Factura impresa en térmica solo a demanda; descarga PDF como fallback.
- Política de descuento al personal (Porción Media a 23 Bs) registrada con su marca de descuento interno.
- Descuento de compensación al cliente por pollo defectuoso (7 Bs, todo el turno) aplicable solo si el admin autorizó a la cajera en ese turno; la autorización es por turno (no por orden) y se extingue al cierre.
- Registro de consumos manuales por turno (bolsas, vasos, bombillas, etc.).
- UI diferenciada por rol + autenticación JWT y control de permisos por rol enforced en backend.
- Auditoría de acciones críticas (ventas, arqueos, vales, anulaciones, ajustes de inventario).

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
- **Flujo dedicado de venta custom** de presas surtidas: la cajera define cantidades de presas; el sistema muestra un **precio sugerido** (precio de venta por presa + extras + bebidas) que ella puede aceptar o pisar (§2.10, FR-002b).
- **Precio de venta por tipo de presa** configurado por el admin, usado para el precio sugerido en venta custom (§2.10).
- **Feature de descuentos:** el admin crea descuentos de **monto fijo** (con disponibilidad `siempre` / `fin de turno` y flag `requiere autorización`); la cajera aplica uno por orden. Instancias principales: **descuento al personal** (Porción Media a 23 Bs, fin de turno, sin autorización) y **compensación al cliente por pollo defectuoso** (7 Bs, todo el turno, requiere autorización) (§2.11, FR-016).
- **Autorización de descuentos por turno:** el admin habilita a la sesión de cajera para aplicar un descuento que requiere autorización; vale para todo el turno (no por orden), se extingue al cerrar el turno y queda auditada (§2.11, FR-016b).

### Estados, pago y cancelación
- Máquina de estados completa para los pedidos (§4).
- Los pedidos con pago pendiente se preparan **de inmediato**; la cancelación es **siempre manual** por la cajera, **sin timeout automático** (§2.5, FR-011).
- Anulación de pedidos pagados con motivo y detalle obligatorios; el inventario se revierte (FR-011b).
- El pago y el descuento de inventario ocurren como una sola operación inseparable (§2.3, §4).

### Inventario
- **Plano cocido (transaccional):** stock por tipo de presa (pecho, ala, pierna, entrepierna) con descuento **al confirmar pago** (§2.3, FR-006).
- **Plano crudo (anotado por turno):** registro del ciclo crudo de presas por turno por el cocinero — reproceso crudo, procesado crudo, sobrante procesado crudo, sobrante cocido en expositor — con autopoblado del reproceso entre turnos (§2.3, FR-017).
- Descuento automático de bebidas por unidad al pagar.
- Registro de consumos manuales por turno: bolsas de papa, bolsas de smile, envases de arroz, vasos, bombillas, etc. (FR-017).
- Ajuste manual de inventario por administrador con motivo registrado.
- Dashboard de stock cocido por tipo de presa con delta del turno.

### Vales (descuento por nómina)
- Registro de vales sin umbral ni límite por trabajador (§2.4, FR-005).
- Los vales **descuentan inventario** pero **NO suman al ingreso de caja**.
- Listado consultable con filtros por trabajador, fecha y monto.

### Caja y arqueo
- Apertura y cierre por turno; 1 caja = 1 cajera por turno (§2.7, FR-004).
- Arqueo con desglose: apertura, cierre, ventas totales, ventas por método (efectivo/tarjeta/vale), gastos, vales emitidos, anulaciones (cantidad + monto + motivo), diferencia entre esperado y contado.
- Registro de gastos pagados desde caja (FR-009).
- Exportable a CSV.

### Comandas, tickets, factura, vista pública
- **Comandas digitales** por default en el panel de despachadoras (§2.8, FR-003).
- **Vista pública del cliente** por URL única por pedido (FR-015).
- **Factura solo a demanda** del cliente: impresora térmica con fallback automático a descarga PDF (FR-014).
- Tipos de ticket: solo **MESA** y **LLEVAR** (CUSTOM nunca es un tipo) (§2.8, §2.10).
- Historial digital de comandas con búsqueda (FR-012).

### Notificaciones
- **Pantalla pública** estilo "tickets de banco" mostrando **únicamente el número de pedido** (FR-007).
- Aplica indistintamente a MESA y LLEVAR.
- Se persisten los momentos de listo y de entrega para auditoría.

### Usuarios, roles, sesiones
- Roles funcionales: administrador, cajera, despachadora, cocinero (§2.7).
- **UI diferenciada por rol** + **control de permisos por rol enforced en el backend** en V1 (FR-008).
- **Sesión única por turno**: un usuario no puede estar simultáneamente activo como cajera y despachadora en el mismo turno (FR-008b).
- Autenticación con usuario y contraseña vía **JWT (Bearer token)**; cada endpoint valida el rol del usuario (FR-018).

### Reportes (MVP)
- Ventas por turno / por día (FR-010).
- Inventario de presas (vendidas y restantes por tipo) (FR-010).
- Arqueo de caja con desglose por método, vales, anulaciones, gastos, diferencia (FR-010).
- Exportable a CSV.

### Auditoría
- Registro de auditoría solo para **acciones críticas**: ventas, anulaciones, ajustes de inventario, emisión de vales, apertura/cierre de caja, generación de reportes (§2.9).

### Despliegue
- Aplicación web local (on-premise). Detalles técnicos en [`docs/technical_guide.md` §9](technical_guide.md).

---

## 13.2 Versión 2 (Roadmap futuro) — Diferido explícitamente

### Modalidad auto-servicio
- POS para cliente final: el cliente arma su propio pedido custom sin intervención de la cajera, con el total **calculado automáticamente** a partir del precio de venta por presa (definido en V1) (§2.10 visión v2).

### Reportes adicionales
- Reporte de **productos más vendidos** (deseable, no obligatorio MVP — FR-010).
- Reporte de **discrepancias automáticas** entre caja esperada y contada.

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

---

# 14. Riesgos y decisiones POSPONIBLES (residuales tras Fase 1)
La mayoría de POSPONIBLES de la versión 1.0 quedaron resueltos en el cuestionario Fase 1. Los residuales son:

- **Umbral de discrepancia aceptable en arqueo** (§2.6): definir con administrador antes de Sprint 3 (opciones: 0 Bs sin tolerancia / 5 Bs / 10 Bs).
- **Política exacta ante discrepancia en cierre** (§2.6): registrar y permitir / alertar y permitir / bloquear hasta validación del administrador.
- **Reporte de discrepancias automáticas**: si entra al MVP o se difiere a fase posterior.
- **Política contable formal de vales**: confirmar con contabilidad local cómo se reflejan en libros.

**Decisiones ya cerradas tras Fase 1** (ver detalle en §2):
- La sustitución no altera el precio.
- El inventario se descuenta al confirmar el pago.
- Vales sin umbral ni límite.
- Los pedidos con pago pendiente se preparan de inmediato; la cancelación es siempre manual por la cajera (sin timeout automático).
- Comandas digitales por default; impresión solo para la factura, a demanda.
- Con control de permisos por rol en backend (JWT) en V1; sesión única por turno.
- Política de descuento al personal documentada (Porción Media a 23 Bs).
- Reportes MVP: ventas por turno, inventario de presas, arqueo de caja.
- Auditoría MVP: solo acciones críticas.
- Backups automáticos: parte de V2.

---

# 15. Siguientes entregables que puedo generar (elige uno)
- **A.** Modelo de datos y migraciones listas para implementar.
- **B.** Documentación de la API (OpenAPI) con paths, schemas y ejemplos.
- **C.** Anexo A: payloads ampliados con todos los flujos (custom, descuento personal, anulación, vale, etc.).
- **D.** Anexo B: 15 casos de prueba E2E con datos concretos y pasos.

> El detalle técnico ya existente vive en [`docs/technical_guide.md`](technical_guide.md).

---

## Observación final (para el LLM y el equipo)
Este PRD está centrado en las **reglas de negocio** y en la **consistencia transaccional** (ventas ↔ inventario ↔ arqueo). La implementación técnica (modelo de datos, API, payloads, despliegue) vive en [`docs/technical_guide.md`](technical_guide.md).

**Reglas críticas de negocio que NO se pueden alterar al implementar:**
1. La sustitución de acompañamiento NO modifica el precio del plato (§2.1).
2. El inventario se descuenta al confirmar el pago, NO al pasar el pedido a preparación (§2.3).
3. Los pedidos con pago pendiente se preparan de inmediato; la cancelación es siempre manual por la cajera, **sin timeout automático** (§2.5).
4. Las comandas son digitales por default; solo la factura se imprime y solo a demanda del cliente (§2.8).
5. En V1 hay autenticación JWT y control de permisos por rol enforced en el backend; la UI diferenciada es complementaria, no la frontera de seguridad (§2.7).
6. Las ventas custom (presas surtidas) pueden ser MESA o LLEVAR. CUSTOM nunca es un tipo de pedido — es una marca que se aplica al pedido (§2.10).
7. La política de descuento al personal (Porción Media a 23 Bs) se registra como descuento interno para que arqueo e inventario cuadren con trazabilidad (§2.11).
8. El descuento de compensación al cliente por pollo defectuoso (7 Bs, disponible todo el turno) **requiere autorización del admin a la cajera**. La autorización es **por turno, no por orden**: una vez otorgada, la cajera lo aplica las veces que necesite hasta el cierre del turno, momento en que la autorización se extingue (§2.11).
