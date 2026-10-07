# GUÍA COMPLETA

## Next.js + JavaScript/TypeScript + MUI + Zod + Zustand

## 0. Decisión de lenguaje: JavaScript primero, TypeScript donde protege el negocio

El proyecto utiliza un enfoque híbrido deliberado:

- **JavaScript/JSX (`.js`/`.jsx`)** para páginas, layouts visuales, componentes de presentación, modales, tablas, estilos y estado efímero de una pantalla.
- **TypeScript (`.ts`/`.tsx`)** para autenticación, autorización, contratos de API, schemas Zod, stores Zustand compartidos, tipos de dominio, pagos, pedidos, inventario y otras rutas críticas.

La extensión no define por sí sola la seguridad. Un archivo JavaScript no puede omitir la validación del backend ni recibir directamente datos externos sin validar. El objetivo es reducir la cantidad de tipado ceremonial en la UI sin quitar tipos en las fronteras donde un error puede afectar dinero, inventario, permisos o trazabilidad.

**Regla práctica:** si un módulo transforma datos del backend, coordina una mutación, persiste estado compartido o decide un permiso, se escribe en TypeScript. Si solamente compone una vista y emite eventos ya definidos, puede escribirse en JavaScript/JSX.

El repositorio actual está configurado con TypeScript estricto. Antes de migrar archivos existentes a JavaScript se debe ajustar la configuración y comprobar el impacto en ESLint y Next.js; no se hará una conversión masiva solo por cambiar extensiones.

## 0.1 Reglas transversales de experiencia y presentación

### Idioma de la interfaz

Todo texto visible de la aplicación debe estar en **español**, sin importar el rol autenticado. Esto incluye títulos, botones, etiquetas, ayudas, validaciones, estados, mensajes vacíos, errores y notificaciones. Los valores técnicos del backend (`CASHIER`, `PENDING_PAYMENT`, `READY`, etc.) se conservan en código, pero la UI los presenta con textos en español como “Cajera”, “Pago pendiente” y “Listo”.

No se deben mezclar traducciones improvisadas dentro de cada componente. Los textos repetidos o asociados a estados deben centralizarse en configuraciones simples del feature correspondiente.

### Notificaciones con React-Toastify

El proyecto utilizará `react-toastify` para mostrar confirmaciones breves después de recibir la respuesta del backend.

- Los errores de API deben informarse mediante toast cuando la operación no pudo completarse, porque el usuario necesita saber que falló.
- Los toasts de éxito no son automáticos para todas las respuestas correctas. Se reservan para ventas, pagos, eliminaciones, cambios de estado u otras operaciones críticas que necesiten confirmación visual.
- Una respuesta correcta de una consulta rutinaria, una búsqueda, una carga de tabla o una actualización visual no necesita toast por defecto.
- No se utiliza toast para cada interacción visual, cambio de tab, apertura de modal o modificación local del carrito.
- Las operaciones críticas que modifican ventas, pagos, turnos, clientes, productos, variantes o estados de pedidos deben tener feedback visible. El feedback puede ser un toast de éxito cuando corresponda, estados de carga y actualización de la pantalla; cuando el error requiere corrección en un formulario, también debe mostrarse junto al campo correspondiente.
- `ToastContainer` se monta una sola vez en el proveedor global de la aplicación y respeta el tema activo.
- Los componentes de feature disparan notificaciones mediante una pequeña utilidad compartida; no se crea un sistema genérico de mensajes que oculte el flujo de la operación.

La notificación no reemplaza los estados `loading`, `error`, `empty` y `success` de la pantalla. El botón debe indicar que la operación está en curso y el toast debe aparecer solo cuando exista una respuesta. Regla general: **toast para errores relevantes y para éxitos críticos; no toast por rutina**.

### Iconos y tamaño de componentes MUI

- Se utilizarán preferentemente los iconos de `@mui/icons-material`. No se incorporarán bibliotecas adicionales de iconos si Material UI ofrece un icono adecuado.
- Los iconos deben conservar significado accesible mediante `aria-label`, `Tooltip` o texto visible cuando la acción no sea evidente.
- Cuando un `Tooltip` se utilice dentro de un `Dialog`, `Modal` o superficie con portal, debe renderizarse por encima del modal. Se debe configurar su portal o `PopperProps` y el `z-index` correspondiente al theme de MUI para evitar que quede oculto detrás del overlay o del contenido del modal.
- El tamaño predeterminado de los componentes MUI que acepten `size` será `small`, especialmente en formularios, campos, botones, selects, tablas y controles de operación.
- `small` no es una obligación rígida: en móvil, acciones táctiles, diálogos, lectura prolongada o necesidades de accesibilidad se podrá usar `medium` u otro tamaño si mejora la experiencia.
- Las decisiones de tamaño deben considerar escritorio y móvil; no se debe compactar tanto una interfaz que los controles sean difíciles de tocar o leer.

### Responsive desde el inicio

Todas las pantallas deben funcionar en monitor, laptop, tablet y teléfono. El diseño no se construye para una única resolución y luego se corrige con parches.

- Las vistas operativas de cajera y administrador priorizan monitores, pero deben conservar navegación y acciones utilizables en pantallas reducidas.
- Las vistas del cliente priorizan el uso móvil y deben evitar desplazamiento horizontal innecesario.
- Se deben utilizar breakpoints, `Grid`, `Stack`, `Container`, `Box` y las herramientas responsive de MUI.
- Las tablas densas deben tener una estrategia móvil explícita: columnas prioritarias, scroll horizontal controlado o transformación a filas/tarjetas cuando corresponda.
- Los botones, campos, diálogos, tarjetas y tablas deben conservar tamaños táctiles y no depender de texto que se desborde.
- No se deben fijar anchos rígidos que rompan el layout; usar `minWidth`, `maxWidth`, `flex`, `grid` y reglas responsive.

### Tema claro y tema oscuro

La aplicación debe permitir alternar entre tema claro y tema oscuro. Todos los componentes deben consumir valores del theme de MUI mediante `palette`, `spacing`, `typography`, `shape` y `breakpoints`.

- No usar fondos, textos, bordes o sombras de color hardcodeados cuando representen superficies del sistema.
- Preferir `background.default`, `background.paper`, `text.primary`, `text.secondary`, `divider` y colores semánticos (`primary`, `success`, `warning`, `error`, `info`).
- Los estados de pedidos no deben depender únicamente del color; deben incluir texto, icono o etiqueta accesible.
- Los estilos que necesiten una diferencia entre temas deben resolverse en la configuración del theme o mediante `theme.palette.mode`.
- La preferencia del usuario puede persistirse, pero el cambio de tema debe resolverse desde un provider común y no desde cada pantalla.

### Reutilización equilibrada y consistencia visual

La reutilización es una herramienta, no un objetivo aislado. Se crea un componente común cuando existe una estructura, comportamiento o regla visual repetida y estable. Si un componente solo se parece superficialmente a otro o necesita demasiadas props condicionales, permanece dentro del feature.

`commonComponents/` debe concentrar piezas de presentación reutilizables como botones con comportamiento uniforme, encabezados, estados vacíos, diálogos de confirmación, feedback de carga y una tabla común. No debe convertirse en un contenedor de componentes de negocio ni en una API genérica difícil de entender.

La consistencia debe provenir principalmente del theme y de componentes pequeños bien definidos, no de una abstracción gigante que intente resolver todos los casos.

### Agrupación de props y parámetros

Como regla preferente, las props y los parámetros de una función deben agruparse en un objeto cuando forman parte de un mismo contrato o es probable que crezcan juntos. Esto aplica especialmente a configuraciones de componentes, filtros, payloads de API, opciones de búsqueda y acciones de dominio. El consumidor puede desestructurar únicamente lo que necesita y el orden de las propiedades deja de ser significativo.

Esta regla no es absoluta. Se mantendrán parámetros simples cuando exista un único valor independiente y evidente, por ejemplo `formatCurrency(amount)` o `isAllowed(role)`. No se debe crear un objeto artificial para envolver un valor aislado, ni usar objetos genéricos como `options` o `data` que oculten el contrato. La decisión debe priorizar, en este orden, legibilidad, tipado, estabilidad del contrato y facilidad de prueba.

El agrupamiento tampoco debe servir para pasar props que el componente no utiliza. Si un objeto contiene demasiadas propiedades o cruza límites de dominio, conviene dividir el componente, definir un tipo específico o mantener una función más pequeña.

### Tabla común

El proyecto tendrá un componente de tabla reutilizable, por ejemplo `CommonTable`, dentro de `commonComponents/`. Su responsabilidad es presentar datos y configuraciones, no conocer reglas de ventas, clientes o productos.

La API de la tabla se organizará alrededor de un objeto de props tipado, pero `columns` será la fuente de verdad para las columnas visibles:

- `rows`: datos a renderizar.
- `columns`: arreglo de definiciones de columnas. Cada columna declara al menos su identificador, encabezado y campo; cuando el valor necesita una presentación especial, puede recibir una función `render` que devuelve contenido o un componente React.
- La columna de acciones es opcional: si la pantalla pasa `actions`, la tabla agrega la columna; si no, no agrega ninguna. `actions` es una función que recibe la fila y devuelve los elementos React que el feature quiera (ver [Acciones de fila](#acciones-de-fila)). La tabla solo aporta el contenedor (alineación y separación).
- `loading`, `emptyMessage` y `error` cuando la pantalla lo necesite.
- `showSearch` y, si está habilitado, un callback o valor controlado de búsqueda.
- Configuración responsive mínima, como columnas prioritarias o contenido alternativo para móvil.

La tabla no debe hacer llamadas HTTP, manejar stores ni decidir permisos. Cada feature prepara las filas, las columnas y el renderizado de la columna de acciones; `CommonTable` solo renderiza. Si una tabla necesita agrupación, edición compleja o una interacción específica de negocio, se crea un componente de tabla dentro del feature y se reutilizan las piezas visuales comunes sin forzar el caso dentro de `CommonTable`.

#### Acciones de fila

Cada tabla **compone** las acciones que necesita; no existe un arreglo de acciones que lo defina todo. La tabla no decide qué acciones hay: una puede tener solo editar, otra editar y borrar, y otra solo un switch. Las piezas comunes aportan el aspecto y el color:

- **`RowActionButton`** (`commonComponents/RowActionButton.tsx`): icono con tooltip y `aria-label`. Su `kind` define icono, texto y color del theme; sin `kind`, recibe `icon` y `label` y es neutro.

  | `kind` | Icono | Color |
  | ------ | ----- | ----- |
  | `edit` | lápiz | `info` (el mismo azul que el modal de edición) |
  | `delete` | papelera | `error` |
  | `view` | ojo (o el `icon` que se pase, por ejemplo un historial) | neutro |
  | `print` | impresora | neutro |

- **`RowActionSwitch`** (`commonComponents/RowActionSwitch.tsx`): el switch de activar/desactivar, en `success`, con tooltip y `aria-label`.

```tsx
// Solo editar
actions={(c) => <RowActionButton kind="edit" label="Editar cliente" onClick={() => edit(c)} />}

// Editar + borrar
actions={(p) => (
  <>
    <RowActionButton kind="edit" label={`Editar ${p.name}`} onClick={() => edit(p)} />
    <RowActionButton kind="delete" label={`Eliminar ${p.name}`} onClick={() => remove(p)} />
  </>
)}

// Solo un switch
actions={(u) => <RowActionSwitch name={u.name} checked={u.active} onChange={() => toggle(u)} />}
```

Una acción solo para algunas filas se resuelve con JSX normal (`{row.canDelete && <RowActionButton … />}`) y una deshabilitada, con su prop `disabled`. El ancho de la columna se ajusta por pantalla con `actionsColumnWidth` (con un icono basta ~100 px, y con tres acciones ~180 px; el encabezado "Acciones" debe verse completo). Los colores nunca se pasan con `sx`: salen de `kind` y del theme.

### Indicadores de carga y feedback de operación

Toda operación que pueda tardar debe ofrecer feedback de procesamiento. Se utilizarán los componentes de MUI adecuados para el contexto:

- `CircularProgress` para acciones puntuales, botones que esperan una mutación y bloques pequeños.
- `Skeleton` para tablas, listas, tarjetas o paneles que todavía están cargando una cantidad considerable de datos.
- Un estado de carga de pantalla o sección para consultas críticas como el contexto del POS, historial de pedidos o panel de despacho.

Durante una mutación se debe deshabilitar el control que la inició y, cuando ayude a la comprensión, mostrar su `CircularProgress`. Esto evita envíos duplicados sin bloquear controles independientes que sigan siendo seguros. El indicador de carga no reemplaza los estados `error`, `empty` y `success`.

`react-toastify` puede utilizarse para errores de API y para confirmaciones puntuales de operaciones críticas. Es un mecanismo de feedback, no un sustituto de los estados de carga, error o vacío. Para mantener el código limpio y mantenible, no se crearán toasts para cada interacción ni capas genéricas innecesarias: se montará un único `ToastContainer` global y se reutilizará una utilidad pequeña solo cuando evite duplicación real.

## 0. Sinfronteras rescatado: principios que se mantienen

El estilo anterior resolvía una aplicación operativa grande con una organización muy cercana al negocio. Esa experiencia sigue siendo valiosa, pero debe trasladarse a herramientas y límites más robustos.

### 0.1 Organización por feature y caso de uso

Next.js no obliga a usar una arquitectura concreta. Para este proyecto, `app/` contiene rutas y composición; `features/` contiene capacidades de negocio; `commonComponents/` contiene UI compartida.

```text
src/
│  ├─ layout.tsx
│  ├─ ClientProviders.tsx
│  ├─ (public)/
│  │  ├─ login/page.tsx
│  │  └─ order/[token]/page.tsx
│  └─ (protected)/
│     ├─ layout.tsx
│     ├─ super-admin/
│     ├─ branch-admin/
│     ├─ cashier/
│     └─ dispatcher/
├─ features/
│  ├─ sales/
│  │  ├─ api/
│  │  └─ stores/
│  ├─ orders/
│  ├─ cash-register/
│  ├─ expenses/
│  ├─ vouchers/
│  ├─ customers/
│  ├─ reports/
│  └─ users/
└─ commonComponents/
```

Los nombres entre paréntesis son **route groups**: organizan layouts y permisos sin agregarse a la URL. Por ejemplo, `app/(public)/login/page.tsx` expone `/login`, mientras que `app/(protected)/cashier/pos/page.tsx` expone `/cashier/pos`. Los segmentos dinámicos, como `order/[token]`, se reservan para la vista pública de una comanda.

No se crea una ruta operativa para `cook` en V1. El rol cocinero permanece reservado hasta que se definan sus casos de uso; no debe aparecer en la navegación ni en la matriz de pantallas mientras no tenga una funcionalidad aprobada.

La cajera es un rol, no un feature. Sus pantallas componen varias capacidades:

```text
app/(protected)/cashier/
├─ page.tsx
├─ pos/page.tsx
├─ orders/page.tsx
├─ cash-register/page.tsx
├─ expenses/page.tsx
├─ vouchers/page.tsx
├─ customers/page.tsx
└─ reports/page.tsx
```

La cajera es un rol, no un feature. Sus rutas componen capacidades de negocio. El administrador de sucursal y el superadministrador también usan rutas por rol porque sus navegaciones, alcance de sucursal y permisos son diferentes. Los features no deben duplicarse por rol: `sales`, `orders`, `customers` y `cash-register` contienen la lógica compartida, mientras cada rol compone la vista que necesita.

### Rutas y autorización

El App Router es recomendable para este proyecto por cuatro motivos:

1. Permite layouts persistentes para sesión, sucursal y navegación.
2. Permite separar páginas públicas, autenticadas y vistas por rol con route groups.
3. Permite cargar componentes y datos cerca de la ruta que los necesita.
4. Hace visible la estructura de navegación en el sistema de archivos.

La alternativa de una única página que cambia todo con `if (role)` tendría menos carpetas al principio, pero produciría una pantalla monolítica, mezclando navegación y permisos. No se recomienda.

El layout o middleware puede redirigir por experiencia de usuario, pero el backend sigue siendo la frontera de seguridad. Cada endpoint debe validar JWT, rol y sucursal. Ocultar un enlace no autoriza una operación.

### POS de cajera y experiencia del cliente

No se recomienda reutilizar la misma pantalla completa para la cajera y el cliente. Comparten datos, contratos y componentes de dominio, pero tienen objetivos distintos:

- **Cajera:** velocidad, teclado, búsqueda inmediata, alta densidad de información, cantidades y confirmaciones rápidas.
- **Cliente:** descubrimiento del menú, imágenes, explicación de variantes, accesibilidad, carrito y seguimiento de su pedido.

La reutilización correcta ocurre en capas. `features/sales` puede compartir tipos, schemas, lectura del catálogo, reglas de presentación de una variante y componentes pequeños como `ProductImage`, `Price`, `VariantSummary` o `OrderItemRow`. Cada experiencia debe tener su propio contenedor y flujo: `cashier-pos` para la operación interna y `customer-menu`/`customer-order` para el canal público. De esta forma se evita duplicar lógica sin obligar a dos usuarios con necesidades opuestas a utilizar la misma interfaz.

La vista pública de una comanda no requiere login: se accede mediante el `publicToken` de la orden. Un futuro portal autenticado del cliente es una capacidad distinta y no debe mezclarse con las rutas operativas por rol.

Reglas:

- Un componente exclusivo de un feature vive dentro de ese feature.
- `commonComponents/` queda reservado para UI reutilizable.
- Los stores Zustand contienen datos compartidos de API y acciones del dominio.
- `useState` contiene únicamente estado visual local y temporal.
- Las rutas de `app/` componen pantallas, pero no implementan reglas de negocio.

#### Estructura interna de un feature

```text
features/sales/
├─ api/
│  ├─ get-pos-context.ts
│  ├─ create-order.ts
│  ├─ create-custom-order.ts
│  └─ confirm-payment.ts
├─ stores/
│  └─ sales.store.ts
├─ components/
│  ├─ sales-pos.tsx
│  └─ custom-sale-form.tsx
├─ schemas/
└─ types.ts
```

El flujo base es:

```text
API -> Zustand Store -> UI
```

La UI no llama directamente a `fetch`. El store invoca `api/`, conserva los datos compartidos y expone selectores y acciones. Los hooks personalizados no forman parte de la arquitectura base.

- **`api/`**: realiza una llamada HTTP por endpoint. No renderiza ni decide reglas de negocio.
- **`stores/`**: mantiene `data`, `isLoading`, `error` y acciones compartidas mediante Zustand. Puede exponer datos para que la UI calcule subtotales y un total preliminar de presentación, pero no decide precios válidos, stock, descuentos aplicables ni permisos.
- **`components/`**: recibe datos del store, renderiza controles y emite eventos.
- **`schemas/`**: valida la forma de requests y responses; no reemplaza la validación del backend.
- **`types.ts`**: define tipos compartidos de los contratos críticos sin esconder reglas de negocio. No se crea un archivo de tipos para cada componente visual trivial.

El flujo completo es:

```text
UI -> Zustand Store -> API -> Backend
UI <- Zustand Store <- API response <- Backend
```

`useState` se reserva para modales, tabs, búsquedas, selección visual y formularios temporales. El backend sigue siendo la única autoridad para precio confirmado, stock, descuentos, permisos, disponibilidad, totales y transiciones.

#### Alineación con el contrato actual del backend

La estructura del frontend debe seguir los endpoints reales documentados en Swagger y en la guía técnica:

| Feature         | API principal                                                                                                                                          | Uso de la UI                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `auth`          | `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`                                                                                                  | Iniciar y cerrar sesión; almacenar el estado de autenticación.        |
| `sales`         | `GET /api/v1/pos/context`, `POST /api/v1/orders`, `POST /api/v1/orders/custom`                                                                         | Cargar el contexto del POS y enviar la intención de venta.            |
| `orders`        | `GET /api/v1/orders`, `GET /api/v1/orders/{id}`, `POST /api/v1/orders/{id}/pay`, `POST /api/v1/orders/{id}/cancel`, `PATCH /api/v1/orders/{id}/status` | Listar, consultar, pagar, cancelar y mostrar el estado de pedidos.    |
| `cash-register` | `GET /api/v1/shifts/active`, `POST /api/v1/shifts/open`, `POST /api/v1/shifts/close`                                                                   | Mostrar el turno y enviar apertura/cierre de caja.                    |
| `customers`     | `GET /api/v1/customers`, `POST /api/v1/customers`, `PATCH /api/v1/customers/{id}`                                                                      | Buscar, registrar y editar clientes para facturación.                 |
| `reports`       | `GET /api/v1/reports/sales`, `/inventory-presas`, `/cash-audit`                                                                                        | Solicitar y renderizar reportes; el backend genera los totales y CSV. |

El POS debe cargar su contexto con una llamada a `GET /api/v1/pos/context`. El backend ya devuelve productos, variantes, descuentos aplicables, precios por presa, períodos y turno activo. La UI utiliza esos datos para mostrar precios unitarios, subtotales y un total preliminar del carrito; también puede calcular el **precio sugerido** de una venta custom con `piecePrices`. El backend valida y persiste los valores confirmados.

La respuesta de cada API debe conservar el contrato estándar del backend (`isSuccess`, `message`, `data`, `error`). Los stores exponen esos datos a la UI sin mover reglas transaccionales al navegador.

### 0.2 Composición antes que componentes monolíticos

El patrón anterior de modales configurables, tablas reutilizables y callbacks es correcto. En la versión nueva se expresa con props tipadas y composición, evitando que un componente conozca Firebase, las rutas o toda la lógica del negocio.

### Modales: un solo `AppModal`

Todos los modales de la aplicación comparten la misma estructura de tres zonas: **header** (icono, título y subtítulo opcional), **body** (un mensaje o un componente) y **footer** (cancelar y confirmar). La implementación vive en `src/commonComponents/AppModal.tsx`; `ConfirmDialog` y `ActionModal` son envoltorios delgados sobre él. No se crean modales con `Dialog` de MUI directamente.

| Zona | Prop | Regla |
| ---- | ---- | ----- |
| Control | `open`, `onClose` | `onClose` lo disparan la X, el click afuera, Esc y el botón Cancelar |
| Header | `icon`, `title`, `subtitle` | `title` obligatorio; el resto opcional |
| Body | `message`, `children` | `message` es texto simple; `children` es un componente. Se renderizan solo si existen, sin espacios vacíos |
| Footer | `cancelLabel`, `cancelIcon` | El botón solo existe si se envía el texto |
| Footer | `confirmLabel`, `confirmIcon`, `onConfirm` | El botón solo existe si se envía el texto. El icono es opcional; el texto, no |
| Footer | `confirmLoading`, `confirmDisabled` | `confirmLoading` muestra "Procesando…" y bloquea ambos botones; `confirmDisabled` bloquea por regla de negocio |
| Footer | `destructive` | El botón de confirmar usa `error` en vez de `success` |
| Header y footer | `editing` | El modal edita datos existentes: el header y el botón de confirmar usan `info` (azul) en vez del rojo de marca y `success` |
| Layout | `paperSx` | Escape hatch de estilos; en general solo para el ancho |

Reglas:

- **Sin etiquetas, sin footer.** Un modal de solo lectura no pasa `cancelLabel` ni `confirmLabel`. No existen `hideFooter` ni `hideCancel`: la presencia del texto decide si el botón se renderiza.
- **El footer solo lleva cancelar y confirmar.** Los totales y las acciones propias de un feature (Limpiar, Imprimir, Volver, "Precio final") van **dentro del body**, en el componente que los necesita. No hay prop `footer`.
- **Tamaño.** El modal se adapta al contenido y nunca supera el 80% del ancho ni del alto de la pantalla; solo el body hace scroll. Como el ancho sale del contenido, el modal declara su ancho natural con `paperSx={{ width: 560 }}` (se achica solo en pantallas chicas). No se usan `maxWidth` ni `fullWidth`.
- **Padding.** `AppModal` aplica el padding del body. Si el contenido necesita ocupar todo el ancho (por ejemplo, una barra de pasos o un resumen pegado al borde), compensa con `mx: -MODAL_BODY_PADDING_X` y `my: -MODAL_BODY_PADDING_Y`, constantes exportadas por `AppModal`. No se desactiva el padding con una prop.
- **Elementos fijos dentro del body.** Para que una barra quede pegada arriba o abajo al hacer scroll se usa `position: 'sticky'` con `top`/`bottom: (theme) => theme.spacing(-MODAL_BODY_PADDING_Y)` (el sticky respeta el padding del contenedor) y un **fondo opaco**: `action.hover` es translúcido y deja ver el contenido por debajo.
- **Colores.** Confirmar es `success`, editar es `info` (prop `editing`: cambia el header y el botón), destructivo es `error` y cancelar es `error` en contorno. Crear y editar se distinguen de un vistazo: header rojo de marca con botón verde al crear; header y botón azules al editar. Los botones del footer no llevan `sx` de color: los toman del theme.
- **Idioma.** Todo texto visible va en español, y el mensaje describe la consecuencia ("La sucursal quedará fuera de la red de catálogos compartidos").

Ejemplo de formulario:

```tsx
<AppModal
  open={open}
  onClose={onClose}
  icon={<StorefrontRoundedIcon />}
  title="Nueva sucursal"
  paperSx={{ width: 560 }}
  cancelLabel="Cancelar"
  confirmLabel="Crear sucursal"
  onConfirm={handleSave}
  confirmLoading={isSaving}
>
  <BranchForm />
</AppModal>
```

Ejemplo de confirmación destructiva, con `ConfirmDialog`:

```tsx
<ConfirmDialog
  open={Boolean(confirmToggle)}
  title={`Desactivar ${confirmToggle?.name}`}
  message="La sucursal quedará fuera de la red de catálogos compartidos."
  isDestructive
  destructiveLabel="Desactivar"
  onClose={() => setConfirmToggle(null)}
  onConfirm={handleToggle}
  confirmLoading={isToggling}
/>
```

`ConfirmDialog` fija el icono de advertencia (o de pregunta con `isQuestion`), el color de `destructive` y el texto "Cancelar" por defecto. La lógica de desactivar o eliminar se implementa en el feature y se entrega como `onConfirm`; el modal solo presenta y coordina la interacción.

### Modal con contenido React inyectable (referencia)

Un patrón útil cuando se necesita un modal que pueda abrirse desde un botón o icono y renderizar contenido React arbitrario. El componente gestiona su propio estado de apertura/cierre y expone callbacks para que el feature decida qué hacer al confirmar o cancelar.

```jsx
import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

function ActionModal({
  triggerLabel = 'Abrir',
  dialogTitle = 'Confirmar',
  children,
  onConfirm,
  onCancel,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  triggerColor = 'primary',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleConfirm = () => {
    onConfirm?.();
    setOpen(false);
  };

  const handleCancel = () => {
    onCancel?.();
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="contained"
        color={triggerColor}
        disabled={disabled}
        onClick={handleOpen}
      >
        {triggerLabel}
      </Button>
      <Dialog open={open} onClose={handleCancel}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>{children}</DialogContent>
        <DialogActions>
          <Button variant="contained" color="error" onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button variant="contained" color="success" onClick={handleConfirm} autoFocus>
            {confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export { ActionModal };
```

**Qué rescatar del patrón:**
- El modal es autónomo: maneja su propio `open`/`close` y se activa desde un botón o icono.
- `children` permite inyectar cualquier contenido React (formularios, detalles, tablas, confirmaciones).
- `onConfirm` y `onCancel` son callbacks opcionales que el feature define; el modal solo los invoca y se cierra.

**Qué adaptar al proyecto:**
- En TypeScript, tipar las props con `ReactNode` para `children` y tipos explícitos para callbacks.
- No incluir navegación, `redirectPage` ni múltiples funciones opcionales dentro del modal; cada feature compone su propia lógica.
- Si el modal necesita estado de carga, agregar `isLoading` y deshabilitar los botones mientras la operación está en curso, igual que en `ConfirmDialog`.
- El `triggerLabel` puede ser un icono en lugar de texto; el botón puede reemplazarse por un `IconButton` si la acción lo requiere.

### 0.3 Separación entre UI, estado y datos

El estilo anterior mezclaba a veces consulta, transformación, formulario y render en un mismo componente. La evolución recomendada conserva la división por módulo y agrega límites claros:

- **Componentes:** renderizan y emiten eventos.
- **Stores Zustand:** coordinan datos de API, estado compartido y acciones.
- **API:** encapsula llamadas HTTP y contratos de request/response.
- **Schemas:** validan entradas y respuestas externas.
- **`useState`:** contiene únicamente estado visual local y temporal.

No se debe llamar a la API directamente desde una tabla o un formulario. Tampoco se debe poner en Zustand el estado efímero de un input, un diálogo o una consulta que solo necesita una pantalla.

### 0.4 Zustand como fuente global de datos

Los datos de API que deben ser compartidos viven en un store Zustand por dominio. Así todos los componentes consumen la misma fuente de verdad y una actualización se refleja en toda la aplicación. No se crean hooks personalizados para duplicar `data`, `isLoading` y `error`.

```tsx
import { create } from 'zustand';
import { getPosContext } from '../api/get-pos-context';
import type { PosContext } from '../types';

type SalesState = {
  posContext: PosContext | null;
  isLoading: boolean;
  error: string | null;
  loadPosContext: () => Promise<void>;
};

export const useSalesStore = create<SalesState>((set) => ({
  posContext: null,
  isLoading: false,
  error: null,

  loadPosContext: async () => {
    set({ isLoading: true, error: null });

    try {
      const posContext = await getPosContext();
      set({ posContext, isLoading: false });
    } catch {
      set({
        isLoading: false,
        error: 'No se pudo cargar el contexto del POS',
      });
    }
  },
}));
```

La UI selecciona únicamente lo que necesita del store:

```tsx
const posContext = useSalesStore((state) => state.posContext);
const isLoading = useSalesStore((state) => state.isLoading);
const loadPosContext = useSalesStore((state) => state.loadPosContext);
```

La pantalla debe contemplar siempre los estados `loading`, `error`, `empty` y `success`. Zustand mantiene esos estados porque forman parte del resultado compartido de la consulta; `useState` queda reservado para detalles visuales locales.

### 0.5 Formularios controlados, ahora con esquema único

Se mantiene la idea anterior de controlar los formularios y validar antes de persistir, pero la validación debe vivir en un schema reutilizable. El mismo schema puede validar un formulario y los datos recibidos de una API.

```tsx
const createUserSchema = z.object({
  username: z.string().trim().min(3, 'Mínimo 3 caracteres'),
  role: z.enum(['ADMIN', 'CASHIER', 'DISPATCHER', 'COOK']),
});

type CreateUserInput = z.infer<typeof createUserSchema>;
```

La confirmación mediante modal sigue siendo útil para operaciones destructivas o sensibles. Para acciones simples, el formulario debe usar `onSubmit` y mostrar el resultado sin exigir un diálogo innecesario.

### 0.6 Qué no se traslada

No se trasladan el acceso directo a Firebase desde componentes, los contextos globales para cualquier dato, las funciones auxiliares sin tipos, las llamadas `fetch` dispersas ni los componentes gigantes. El objetivo es conservar la cercanía al negocio y la reutilización, reduciendo el acoplamiento y haciendo explícitos los contratos.

## PARTE 1 — INSTALACIÓN

> **Next.js ya instalado – App Router**

**Objetivo:** instalar solo lo necesario, sin sobrecargar el proyecto.

---

## 1. Material UI (base)

```bash
pnpm add @mui/material @mui/icons-material
pnpm add @emotion/react @emotion/styled
```

Incluye:

- Componentes MUI
- Sistema de estilos
- `styled`
- `sx`

> No es necesario instalar Roboto si usas fuentes de Next.js (`next/font`).

---

## 2. Zod (validación de datos)

```bash
pnpm add zod
```

### Opcional — muy recomendado para formularios

```bash
pnpm add react-hook-form @hookform/resolvers
```

---

## 3. Zustand (estado global)

```bash
pnpm add zustand
```

No requiere providers ni configuración extra.

---

## 4. React-Toastify (notificaciones)

```bash
pnpm add react-toastify
```

`ToastContainer` debe montarse una sola vez dentro de `ClientProviders`. Las pantallas y stores lo utilizan para informar el resultado de operaciones críticas después de recibir la respuesta del backend. No se muestran notificaciones para cada cambio visual o interacción local.

---

## 5. Estructura recomendada

```text
src/
├─ app/
│  ├─ layout.tsx
│  ├─ ClientProviders.tsx
│  ├─ (public)/
│  │  ├─ login/page.tsx
│  │  └─ order/[token]/page.tsx
│  └─ (protected)/
│     ├─ super-admin/
│     ├─ branch-admin/
│     ├─ cashier/
│     └─ dispatcher/
├─ features/
│  ├─ sales/
│  ├─ orders/
│  ├─ cash-register/
│  ├─ expenses/
│  ├─ vouchers/
│  ├─ customers/
│  ├─ reports/
│  └─ users/
├─ config/
│  ├─ api.ts               # Prefijo de la API (variable de entorno)
│  └─ colors.ts            # Colores de la marca (único punto de verdad)
├─ commonComponents/
│  ├─ CommonTable.tsx
│  ├─ EmptyState.tsx
│  └─ ConfirmDialog.tsx
└─ styles/
  └─ globals.css
```

`CommonTable` debe mantenerse como una pieza de presentación simple y configurable. Recibe columnas, filas y opciones como búsqueda, acciones, carga, estado vacío y comportamiento responsive; no conoce endpoints ni reglas de negocio. Una tabla con edición compleja o una interacción específica permanece dentro del feature correspondiente.

### Configuración de la API

El prefijo de la API no debe quedar escrito dentro de las llamadas API. Si la versión cambia de `/api/v1` a `/api/v2`, solo se actualiza la variable de entorno.

### `.env.local`

```env
NEXT_PUBLIC_API_PREFIX=/api/v1
```

### `src/config/api.ts`

```ts
export const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? '/api/v1';
```

Las variables con prefijo `NEXT_PUBLIC_` pueden ser leídas por código que se ejecuta en el navegador. No deben contener secretos, tokens privados ni credenciales.

### API por feature

Las funciones que antes vivían junto a cada módulo siguen siendo una buena idea. La diferencia es que ahora viven en `api/`, reciben y devuelven tipos explícitos, y no dependen de componentes React.

### `src/features/users/api/users.ts`

```ts
import { z } from 'zod';
import { API_PREFIX } from '@/config/api';

const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  active: z.boolean(),
});

export type User = z.infer<typeof userSchema>;

export async function getUsers(): Promise<User[]> {
  const response = await fetch(`${API_PREFIX}/users`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('No se pudieron cargar los usuarios');
  }

  const payload: unknown = await response.json();
  return z.array(userSchema).parse(payload);
}
```

La función API es el único lugar que conoce la URL y el formato externo. El store consume `User[]`, no una respuesta HTTP sin validar; el componente solo consume el estado y las acciones que el store expone.

---

## 5. Theme mínimo de MUI

### Paleta de colores de la marca

La paleta de la marca vive en `src/config/colors.ts`, que importa el theme de MUI. Los colores se cambian desde un solo lugar y cualquier componente puede importar las constantes sin depender del theme.

```ts
// src/config/colors.ts — Único punto de verdad para los colores de la marca
export const BRAND_COLORS = {
  red: '#e31017',
  yellow: '#e8fc21',
  white: '#ffffff',
  black: '#000000',
} as const;
```

### Roles de color: identidad vs. acción

El rojo de la marca se parece demasiado al rojo de error de MUI. Si ambos se usaran en botones, "Crear sucursal" y "Eliminar" se verían iguales y el usuario no distinguiría una acción segura de una destructiva. Por eso cada color tiene un rol fijo:

| Rol | Color | Se usa en |
| --- | ----- | --------- |
| `primary` | Rojo de marca (`darken(BRAND_COLORS.red, 0.20)`) | **Identidad:** header de los modales, app bar, navegación activa, foco y etiquetas. No es un color de acción |
| `secondary` | Amarillo de marca | Detalles, badges y resaltados |
| `success` | Verde (`green` de MUI) | Acciones de **confirmar, crear, guardar y activar**; el estado "activo" de un switch |
| `info` | Azul (`lightBlue` de MUI) | **Modales de edición** (header y botón de confirmar) y todo lo "informativo": toasts, alertas, badges de estado. Se cambia solo en el theme |
| `error` | Rojo (`red` de MUI) | Acciones **destructivas** (eliminar, desactivar, cancelar un pedido) y el botón Cancelar en contorno |

Regla práctica: si un botón hace algo, su color sale de `success` o `error`; el rojo de marca no se usa para botones de acción.

### Colores semánticos controlados desde el theme

`success`, `error` e `info` se declaran **de forma explícita en el theme**, con los tokens de la paleta de MUI (`green`, `red`) y una variante por modo. Así se ajustan en un solo lugar sin tener que tocar los componentes, y siguen el cambio entre tema claro y oscuro (en oscuro se usan tonos más claros para mantener el contraste sobre `#121212`).

```tsx
// src/theme/theme.ts (extracto)
import { green, red } from '@mui/material/colors';
import { BRAND_COLORS } from '@/config/colors';

export function buildTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary: { main: darken(BRAND_COLORS.red, 0.2), contrastText: BRAND_COLORS.white },
      success: {
        main: mode === 'dark' ? green[400] : green[800],
        dark: mode === 'dark' ? green[700] : green[900],
        contrastText: mode === 'dark' ? BRAND_COLORS.black : BRAND_COLORS.white,
      },
      error: {
        main: mode === 'dark' ? red[500] : red[700],
        dark: mode === 'dark' ? red[700] : red[900],
        contrastText: BRAND_COLORS.white,
      },
    },
  });
}
```

**Reglas:**

- No hardcodear tonos de rojo, verde, amarillo, blanco o negro fuera del theme o de `colors.ts`.
- Los componentes usan `color="success"` / `color="error"` (o `theme.palette.*`); nunca un hexadecimal ni un `sx` de color en botones de acción.
- Cualquier variación cromática (hover, active, disabled) se genera desde el theme (`darken`, `lighten`, `alpha`), no se define como constante aparte.
- Un fondo que debe tapar el contenido (barra pegada con `position: 'sticky'`) no puede usar un color translúcido como `action.hover`; se usa `background.paper` y, si hace falta el tono, un `backgroundImage` con `linear-gradient`.
- **Acentos puntuales de dominio** (por ejemplo el azul de las bebidas en el POS o el estado de la cocina) no usan `info`: cada componente define su propio color (`const ACCENT_BLUE = …` con tokens `lightBlue`). Así, cambiar `info` en el theme solo afecta a los modales de edición y a lo informativo, no a esos acentos.
- Los estados no dependen solo del color: llevan texto o icono.

---

## 6. Conectar MUI en `layout.tsx` (CORRECTO)

### ¿Para qué sirve `<CssBaseline />`?

`<CssBaseline />` es el reset de CSS oficial de MUI.

Hace automáticamente:

- `box-sizing: border-box`
- Elimina márgenes por defecto
- Normaliza estilos entre navegadores
- Aplica la fuente definida en el theme
- Prepara el soporte para light / dark mode

> No reemplaza `globals.css`.
>
> No choca con Next.js.
>
> Es muy recomendado si usas MUI.

### Layout final recomendado

El proveedor de MUI debe ser un Client Component independiente. Así el layout puede conservar `metadata` y el render del documento HTML en el servidor.

### `src/app/ClientProviders.tsx`

```tsx
'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { theme } from '@/theme/theme';

type ProvidersProps = {
  children: ReactNode;
};

export function ClientProviders({ children }: ProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
```

### `src/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { ClientProviders } from './ClientProviders';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Wonder Chicken',
  description: 'Sistema operativo de Wonder Chicken',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
```

### Resultado

- ✔ Se mantienen las fuentes de Next.js
- ✔ MUI se limita al proveedor cliente
- ✔ `CssBaseline` aplica el reset visual
- ✔ `globals.css` sigue siendo mínimo
- ✔ `metadata` permanece en un layout de servidor

El mismo `ClientProviders` debe concentrar el theme activo, el control para alternar entre modo claro y oscuro y el `ToastContainer` de React-Toastify. Las pantallas no deben crear proveedores paralelos ni resolver el tema de forma aislada.

---

# PARTE 2 — GUÍA DE USO

> Ejemplos simples y claros.

---

## 🔹 Next.js con JSX y TSX — Uso recomendado

### Componente visual en JSX

```jsx
export default function Card({ title }) {
  return <h2>{title}</h2>;
}
```

La UI puede escribirse en JSX cuando recibe datos ya validados y solo compone la vista. No se debe usar JSX como excusa para omitir validación de respuestas, permisos o payloads.

### Frontera crítica en TypeScript

```ts
import { z } from 'zod';

const orderResponseSchema = z.object({
  id: z.string(),
  status: z.enum(['created', 'confirmed', 'preparing', 'ready', 'delivered', 'closed', 'pendingPayment', 'cancelled']),
});

export function parseOrderResponse(payload: unknown) {
  return orderResponseSchema.parse(payload);
}
```

### Recomendaciones

- Empieza simple.
- Usa JSX para presentación y estado visual local.
- Usa TypeScript para contratos, API, stores, autenticación, permisos y mutaciones de negocio.
- Usa Zod para validar datos externos incluso si el componente consumidor está escrito en JSX.

### Ventajas

- Menos bugs
- Mejor autocompletado
- Código mantenible
- Compatible con `app/` y Server Components

### Regla práctica

> Usa `.jsx` para la UI no crítica y `.ts`/`.tsx` para las fronteras críticas del sistema.

---

# 🔹 MUI `styled` — Uso práctico

## ¿Qué es `styled`?

Permite crear componentes reutilizables usando el theme de MUI:

- Colores
- Spacing
- Breakpoints
- Otros valores definidos en el theme

### Ejemplo básico — sin tipado

```tsx
import { styled } from '@mui/material/styles';

const Card = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  background: theme.palette.background.paper,
}));
```

✔ Sin tipos explícitos
✔ Usa el theme
✔ Código limpio

### Usarlo en un componente

```tsx
export default function Page() {
  return <Card>Contenido</Card>;
}
```

---

## Estilizar un componente de MUI

```tsx
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';

const MyButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));
```

---

## ¿Cuándo NO usar tipado?

No tipar cuando:

- El componente no recibe props.
- El estilo es fijo.
- No hay lógica visual.

> Este es el caso más común.

### Tipar solo cuando es necesario

```tsx
type Props = {
  active?: boolean;
};

const Card = styled('div')<Props>(({ active, theme }) => ({
  padding: theme.spacing(2),
  border: active ? '2px solid green' : '1px solid gray',
}));
```

✔ Tipos mínimos
✔ Solo donde aporta valor

### Regla rápida: `sx` vs `styled`

| Herramienta | Uso                         |
| ----------- | --------------------------- |
| `sx`        | Estilos rápidos y puntuales |
| `styled`    | Componentes reutilizables   |

---

# 🔹 Validación con Zod

## ¿Para qué sirve?

- Validar formularios
- Validar datos de API
- Validación segura y clara

### Ejemplo

```tsx
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  age: z.number().min(18),
});

const result = userSchema.safeParse({
  name: '',
  email: 'x@',
  age: 15,
});

console.log(result.success); // false
```

> Ideal para `app/api`, Server Actions y formularios.

---

# 🔹 Estado global con Zustand

Zustand es la fuente global para datos de API y estado compartido. Cada dominio debe tener su propio store: `auth.store.ts`, `sales.store.ts`, `orders.store.ts` o `cash-register.store.ts`.

```tsx
import { create } from 'zustand';
import { getPosContext } from '@/features/sales/api/get-pos-context';
import type { PosContext } from '@/features/sales/types';

type SalesState = {
  posContext: PosContext | null;
  isLoading: boolean;
  error: string | null;
  loadPosContext: () => Promise<void>;
};

export const useSalesStore = create<SalesState>((set) => ({
  posContext: null,
  isLoading: false,
  error: null,

  loadPosContext: async () => {
    set({ isLoading: true, error: null });

    try {
      const posContext = await getPosContext();
      set({ posContext, isLoading: false });
    } catch {
      set({
        isLoading: false,
        error: 'No se pudo cargar el contexto del POS',
      });
    }
  },
}));
```

### Consumo desde la UI

Seleccioná únicamente las partes que el componente necesita:

```tsx
const products = useSalesStore(
  (state) => state.posContext?.products ?? [],
);
const isLoading = useSalesStore((state) => state.isLoading);
const loadPosContext = useSalesStore((state) => state.loadPosContext);
```

Después de una mutación, la acción del store debe actualizar el estado afectado o volver a cargarlo para que todas las pantallas reciban la información actualizada.

### Qué no guardar en Zustand

No guardes en Zustand modales, tabs, texto de búsqueda, inputs temporales ni estados visuales de una sola pantalla. Usá `useState` o React Hook Form para esos casos.

### Regla de hooks personalizados

No se crean hooks personalizados de dominio inicialmente. El hook generado por Zustand, como `useSalesStore`, sí se utiliza para seleccionar estado y ejecutar acciones. Solo se agregan hooks propios si aparece una necesidad real de coordinar varios stores o efectos de React, sin convertirse en una segunda fuente de datos.

> **API para comunicación, Zustand para estado global, `useState` para estado visual y UI para renderizar.**

---

# 🧠 CONCLUSIÓN FINAL

Este stack está pensado para:

- Proyectos reales
- Código limpio
- Mantenimiento sencillo
- Escalar sin dolor

## Regla general del proyecto

> **No tipar por obligación.**
>
> **Tipar solo cuando aporte claridad y seguridad.**
