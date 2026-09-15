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
- La columna de acciones es opcional. Si el arreglo `columns` incluye una definición marcada como acciones, `CommonTable` la renderiza; si no existe, no agrega ninguna columna adicional. Su `render` recibe la fila y devuelve uno o varios elementos React —por ejemplo, botones para editar, eliminar, ver o seleccionar— definidos por el feature.
- `loading`, `emptyMessage` y `error` cuando la pantalla lo necesite.
- `showSearch` y, si está habilitado, un callback o valor controlado de búsqueda.
- Configuración responsive mínima, como columnas prioritarias o contenido alternativo para móvil.

La tabla no debe hacer llamadas HTTP, manejar stores ni decidir permisos. Cada feature prepara las filas, las columnas y el renderizado de la columna de acciones; `CommonTable` solo renderiza. Si una tabla necesita agrupación, edición compleja o una interacción específica de negocio, se crea un componente de tabla dentro del feature y se reutilizan las piezas visuales comunes sin forzar el caso dentro de `CommonTable`.

### Indicadores de carga y feedback de operación

Toda operación que pueda tardar debe ofrecer feedback de procesamiento. Se utilizarán los componentes de MUI adecuados para el contexto:

- `CircularProgress` para acciones puntuales, botones que esperan una mutación y bloques pequeños.
- `Skeleton` para tablas, listas, tarjetas o paneles que todavía están cargando una cantidad considerable de datos.
- Un estado de carga de pantalla o sección para consultas críticas como el contexto del POS, historial de pedidos o panel de despacho.

Durante una mutación se debe deshabilitar el control que la inició y, cuando ayude a la comprensión, mostrar su `CircularProgress`. Esto evita envíos duplicados sin bloquear controles independientes que sigan siendo seguros. El indicador de carga no reemplaza los estados `error`, `empty` y `success`.

`react-toastify` puede utilizarse para errores de API y para confirmaciones puntuales de operaciones críticas. Es un mecanismo de feedback, no un sustituto de los estados de carga, error o vacío. Para mantener el código limpio y mantenible, no se crearán toasts para cada interacción ni capas genéricas innecesarias: se montará un único `ToastContainer` global y se reutilizará una utilidad pequeña solo cuando evite duplicación real.

## 0. Sinfronteras rescatado: principios que se mantienen

El estilo anterior resolvía una aplicación operativa grande con una organización muy cercana al negocio. Esa experiencia sigue siendo valiosa, pero debe trasladarse a herramientas y límites más robustos.

<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
### 0.1 Organización por feature y caso de uso

Next.js no obliga a usar una arquitectura concreta. Para este proyecto, `app/` contiene rutas y composición; `features/` contiene capacidades de negocio; `commonComponents/` contiene UI compartida.

```text
src/
│  ├─ layout.tsx
<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
│  ├─ providers.tsx
│  └─ (authenticated)/
│     ├─ cashier/
│     ├─ dispatcher/
│     ├─ cook/
│     └─ admin/
=======
│  ├─ ClientProviders.tsx
│  ├─ (public)/
│  │  ├─ login/page.jsx
│  │  └─ order/[token]/page.jsx
│  └─ (protected)/
│     ├─ layout.tsx
│     ├─ super-admin/
│     ├─ branch-admin/
│     ├─ cashier/
│     └─ dispatcher/
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md
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

<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
La cajera es un rol, no un feature. Sus pantallas componen varias capacidades:

```text
app/(authenticated)/cashier/
├─ page.tsx
├─ sales/page.tsx
├─ orders/page.tsx
├─ cash-register/page.tsx
├─ expenses/page.tsx
├─ vouchers/page.tsx
├─ customers/page.tsx
└─ reports/page.tsx
```

=======
Los nombres entre paréntesis son **route groups**: organizan layouts y permisos sin agregarse a la URL. Por ejemplo, `app/(public)/login/page.jsx` expone `/login`, mientras que `app/(protected)/cashier/pos/page.jsx` expone `/cashier/pos`. Los segmentos dinámicos, como `order/[token]`, se reservan para la vista pública de una comanda.

No se crea una ruta operativa para `cook` en V1. El rol cocinero permanece reservado hasta que se definan sus casos de uso; no debe aparecer en la navegación ni en la matriz de pantallas mientras no tenga una funcionalidad aprobada.

La cajera es un rol, no un feature. Sus pantallas componen varias capacidades:

```text
app/(protected)/cashier/
├─ page.jsx
├─ pos/page.jsx
├─ orders/page.jsx
├─ cash-register/page.jsx
├─ expenses/page.jsx
├─ vouchers/page.jsx
├─ customers/page.jsx
└─ reports/page.jsx
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

>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md
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
<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
│  ├─ sales-pos.tsx
│  └─ custom-sale-form.tsx
=======
│  ├─ sales-pos.jsx
│  └─ custom-sale-form.jsx
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md
├─ schemas/
└─ types.ts
```

El flujo base es:

```text
API -> Zustand Store -> UI
```

La UI no llama directamente a `fetch`. El store invoca `api/`, conserva los datos compartidos y expone selectores y acciones. Los hooks personalizados no forman parte de la arquitectura base.

- **`api/`**: realiza una llamada HTTP por endpoint. No renderiza ni decide reglas de negocio.
<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
- **`stores/`**: mantiene `data`, `isLoading`, `error` y acciones compartidas mediante Zustand. No calcula precios, stock, descuentos ni permisos.
- **`components/`**: recibe datos del store, renderiza controles y emite eventos.
- **`schemas/`**: valida la forma de requests y responses; no reemplaza la validación del backend.
- **`types.ts`**: define tipos compartidos sin esconder reglas de negocio.
=======
- **`stores/`**: mantiene `data`, `isLoading`, `error` y acciones compartidas mediante Zustand. Puede exponer datos para que la UI calcule subtotales y un total preliminar de presentación, pero no decide precios válidos, stock, descuentos aplicables ni permisos.
- **`components/`**: recibe datos del store, renderiza controles y emite eventos.
- **`schemas/`**: valida la forma de requests y responses; no reemplaza la validación del backend.
- **`types.ts`**: define tipos compartidos de los contratos críticos sin esconder reglas de negocio. No se crea un archivo de tipos para cada componente visual trivial.
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md

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

<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
El POS debe cargar su contexto con una llamada a `GET /api/v1/pos/context`. El backend ya devuelve productos, variantes, descuentos aplicables, precios por presa, períodos y turno activo. La UI pinta esos datos y solo puede calcular el **precio sugerido** de una venta custom con `piecePrices`; el backend valida y persiste el precio confirmado.
=======
El POS debe cargar su contexto con una llamada a `GET /api/v1/pos/context`. El backend ya devuelve productos, variantes, descuentos aplicables, precios por presa, períodos y turno activo. La UI utiliza esos datos para mostrar precios unitarios, subtotales y un total preliminar del carrito; también puede calcular el **precio sugerido** de una venta custom con `piecePrices`. El backend valida y persiste los valores confirmados.
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md

La respuesta de cada API debe conservar el contrato estándar del backend (`isSuccess`, `message`, `data`, `error`). Los stores exponen esos datos a la UI sin mover reglas transaccionales al navegador.

### 0.2 Composición antes que componentes monolíticos

El patrón anterior de modales configurables, tablas reutilizables y callbacks es correcto. En la versión nueva se expresa con props tipadas y composición, evitando que un componente conozca Firebase, las rutas o toda la lógica del negocio.

```tsx
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  isLoading = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{description}</DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} color="error" disabled={isLoading}>
          {isLoading ? 'Procesando...' : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

La lógica de eliminar un usuario se implementa en el feature y se entrega como `onConfirm`; el diálogo solo presenta y coordina la interacción.

<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
=======
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

>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md
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

<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
## 4. Estructura recomendada
=======
## 4. React-Toastify (notificaciones)

```bash
pnpm add react-toastify
```

`ToastContainer` debe montarse una sola vez dentro de `ClientProviders`. Las pantallas y stores lo utilizan para informar el resultado de operaciones críticas después de recibir la respuesta del backend. No se muestran notificaciones para cada cambio visual o interacción local.

---

## 5. Estructura recomendada
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md

```text
src/
├─ app/
│  ├─ layout.tsx
<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
│  ├─ providers.tsx
│  └─ (authenticated)/
│     ├─ cashier/
│     ├─ dispatcher/
│     ├─ cook/
│     └─ admin/
=======
│  ├─ ClientProviders.tsx
│  ├─ (public)/
│  │  ├─ login/page.jsx
│  │  └─ order/[token]/page.jsx
│  └─ (protected)/
│     ├─ super-admin/
│     ├─ branch-admin/
│     ├─ cashier/
│     └─ dispatcher/
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md
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
<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
│  └─ api.ts
├─ commonComponents/
=======
│  ├─ api.ts               # Prefijo de la API (variable de entorno)
│  └─ colors.ts            # Colores de la marca (único punto de verdad)
├─ commonComponents/
│  ├─ CommonTable.jsx
│  ├─ EmptyState.jsx
│  └─ ConfirmDialog.jsx
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md
└─ styles/
  └─ globals.css
```

<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
=======
`CommonTable` debe mantenerse como una pieza de presentación simple y configurable. Recibe columnas, filas y opciones como búsqueda, acciones, carga, estado vacío y comportamiento responsive; no conoce endpoints ni reglas de negocio. Una tabla con edición compleja o una interacción específica permanece dentro del feature correspondiente.

>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md
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

<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
### `src/theme/theme.ts`

```tsx
import { createTheme } from '@mui/material/styles';
=======
### Paleta de colores de la marca

La paleta cromática del proyecto se define en un archivo de configuración centralizado (`src/config/colors.ts`) que el theme de MUI importa. De esta forma, los colores de la marca se cambian desde un solo lugar y cualquier componente que los necesite puede importar las constantes directamente.

**Colores de Wonder Chicken:**

| Rol en MUI | Color       | Hex       | Uso principal                            |
|------------|-------------|-----------|------------------------------------------|
| `primary`  | Rojo        | `#d32f2f` | Botones principales, encabezados, acentos |
| `secondary`| Amarillo    | `#fbc02d` | Detalles, badges, highlights, ofertas     |
| —          | Blanco      | `#ffffff` | Fondos, superficies claras                |
| —          | Negro       | `#000000` | Textos, contrastes fuertes                |

**Armonía con los colores semánticos de MUI:**

Los colores de la marca NO deben reasignar ni confundirse con los colores semánticos que MUI usa para estados del sistema. MUI reserva:

- `error` → rojo de advertencia/error (distinto al rojo de marca)
- `warning` → naranja/ámbar
- `info` → azul
- `success` → verde

El rojo de Wonder Chicken (`primary`) es un rojo intenso corporativo (#d32f2f), NO el rojo semántico de error. El amarillo (`secondary`) es un amarillo mostaza cálido (#fbc02d), NO el amarillo de advertencia. Esto permite que los botones de acción principales usen el rojo de marca sin que el usuario los interprete como "error" o "peligro".

**Psicología del color aplicada:**

- **Rojo corporativo:** Transmite energía, calidez, apetito (ideal para un restaurante de pollo). Al usarlo como `primary` y no como `error`, se asocia a acción positiva, no a peligro.
- **Amarillo mostaza:** Transmite optimismo, calidez, familiaridad. Al ser un amarillo apagado (mostaza) y no brillante, no cansa la vista ni compite con el rojo.
- **Blanco y negro:** Proporcionan el contraste necesario para la legibilidad y la jerarquía visual sin agregar ruido cromático.

### Archivo de configuración centralizado

Los valores de los colores deben vivir en `src/config/colors.ts`. El theme de MUI los importa y cualquier componente que necesite un color específico también puede importarlos sin depender del theme.

```ts
// src/config/colors.ts — Único punto de verdad para los colores de la marca

export const BRAND_COLORS = {
  primary: '#d32f2f',   // Rojo Wonder Chicken
  secondary: '#fbc02d', // Amarillo Wonder Chicken
  white: '#ffffff',
  black: '#000000',
} as const;
```

El theme importa estas constantes:

```tsx
// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';
import { BRAND_COLORS } from '@/config/colors';
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md

export const theme = createTheme({
  palette: {
    mode: 'light',
<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
=======
    primary: {
      main: BRAND_COLORS.primary,
    },
    secondary: {
      main: BRAND_COLORS.secondary,
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), sans-serif',
  },
});
```

Si en el futuro el restaurante cambia su identidad visual, solo se actualiza `src/config/colors.ts` y el cambio se propaga a todo el theme y a cualquier componente que importe las constantes directamente.

**Reglas:**

- No hardcodear tonos de rojo, amarillo, blanco o negro fuera del theme o de `colors.ts`.
- Cualquier variación cromática (hover, active, disabled) debe generarse desde el theme de MUI (`darken`, `lighten`, `alpha`), no definirse como constantes separadas.
- Los colores semánticos de MUI (`error`, `warning`, `info`, `success`) se dejan con sus valores por defecto. No se deben reasignar con colores de la marca para no confundir estados del sistema con la identidad visual.

### `src/theme/theme.ts`

```tsx
import { createTheme } from '@mui/material/styles';
import { BRAND_COLORS } from '@/config/colors';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: BRAND_COLORS.primary,
    },
    secondary: {
      main: BRAND_COLORS.secondary,
    },
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), sans-serif',
  },
});
```

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

<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
### `src/app/providers.tsx`
=======
### `src/app/ClientProviders.tsx`
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md

```tsx
'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { theme } from '@/theme/theme';

type ProvidersProps = {
  children: ReactNode;
};

<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
export function Providers({ children }: ProvidersProps) {
=======
export function ClientProviders({ children }: ProvidersProps) {
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md
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
<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
import { Providers } from './providers';
=======
import { ClientProviders } from './ClientProviders';
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md
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
<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
        <Providers>{children}</Providers>
=======
        <ClientProviders>{children}</ClientProviders>
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md
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

<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
=======
El mismo `ClientProviders` debe concentrar el theme activo, el control para alternar entre modo claro y oscuro y el `ToastContainer` de React-Toastify. Las pantallas no deben crear proveedores paralelos ni resolver el tema de forma aislada.

>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md
---

# PARTE 2 — GUÍA DE USO

> Ejemplos simples y claros.

---

<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
## 🔹 Next.js con TSX — Uso recomendado

### Ejemplo de componente

```tsx
type Props = {
  title: string;
};

export default function Card({ title }: Props) {
=======
## 🔹 Next.js con JSX y TSX — Uso recomendado

### Componente visual en JSX

```jsx
export default function Card({ title }) {
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md
  return <h2>{title}</h2>;
}
```

<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
### Recomendaciones

- Empieza simple.
- Agrega tipos solo en:
  - Props
  - Respuestas de API
  - Funciones importantes
=======
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
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md

### Ventajas

- Menos bugs
- Mejor autocompletado
- Código mantenible
- Compatible con `app/` y Server Components

### Regla práctica

<<<<<<< HEAD:docs/frontend/old-docs/frontend_code_style.md
> Usa `.tsx` como base y tipa solo donde aporta valor.
=======
> Usa `.jsx` para la UI no crítica y `.ts`/`.tsx` para las fronteras críticas del sistema.
>>>>>>> df636109084d3ea42b6bc2da7d006be0ba84e188:docs/frontend/frontend_code_style.md

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
