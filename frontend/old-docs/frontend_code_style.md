# GUÍA COMPLETA

## Next.js + TypeScript (TSX) + MUI + Zod + Zustand

## 0. Sinfronteras rescatado: principios que se mantienen

El estilo anterior resolvía una aplicación operativa grande con una organización muy cercana al negocio. Esa experiencia sigue siendo valiosa, pero debe trasladarse a herramientas y límites más robustos.

### 0.1 Organización por feature y caso de uso

Next.js no obliga a usar una arquitectura concreta: permite organizar el código por ruta o por feature. Para este proyecto conviene mantener `app/` como capa de rutas y composición, y colocar los dominios funcionales en `features/` fuera de `app/`.

`features/` sí es una estructura estándar y válida, pero no debe organizarse por rol. Un rol describe quién puede usar una capacidad; un feature describe qué puede hacer el sistema. Por ejemplo, `cashier` es un rol, mientras que `sales`, `orders` y `cash-register` son capacidades reutilizables.

```text
src/
├─ app/
│  ├─ layout.tsx
│  ├─ providers.tsx
│  └─ (authenticated)/
│     ├─ cashier/
│     ├─ dispatcher/
│     ├─ cook/
│     └─ admin/
├─ features/
│  ├─ sales/
│  ├─ orders/
│  ├─ cash-register/
│  ├─ expenses/
│  ├─ vouchers/
│  ├─ customers/
│  ├─ reports/
│  └─ users/
└─ commonComponents/
```

Reglas:

- Si un componente solo sirve para un feature, vive dentro de ese feature.
- `commonComponents/` queda reservado para piezas visuales verdaderamente reutilizables, como `ConfirmDialog`, `PageState` o `FormField`.
- `config/` contiene configuración transversal como `API_PREFIX`; no contiene lógica de negocio.
- Las rutas de `app/` componen pantallas según el rol, pero no implementan reglas de negocio.

#### Cómo se divide la interfaz de la cajera

La cajera no necesita una carpeta `features/cashier` que contenga todo. Su layout o página compone capacidades independientes:

```text
app/(authenticated)/cashier/
├─ page.tsx                 # resumen o inicio de cajera
├─ sales/page.tsx           # POS: venta estándar y venta custom
├─ orders/page.tsx          # pedidos y pagos pendientes
├─ cash-register/page.tsx   # apertura, cierre y arqueo
├─ expenses/page.tsx        # gastos de caja
├─ vouchers/page.tsx        # vales de trabajadores
├─ customers/page.tsx       # búsqueda y registro para facturación
└─ reports/page.tsx         # reportes permitidos para su rol
```

Cada pantalla consume uno o más features. Por ejemplo, `sales/page.tsx` usa `features/sales`; `cash-register/page.tsx` usa `features/cash-register` y `features/reports` para mostrar el arqueo. La navegación filtra las opciones visibles según el rol, pero el backend sigue siendo la única frontera de autorización.

La regla práctica es: organizar por capacidad de negocio, componer por rol y enrutar por pantalla.

#### Estructura interna de un feature

```text
features/sales/
├─ api/
│  ├─ get-pos-context.ts
│  ├─ create-order.ts
│  ├─ create-custom-order.ts
│  └─ confirm-payment.ts
├─ components/
│  ├─ sales-pos.tsx
│  └─ custom-sale-form.tsx
├─ hooks/
├─ schemas/
└─ types.ts
```

Este proyecto usa un flujo directo y deliberadamente simple:

```text
API -> Hook -> UI
```

La UI no llama directamente a `fetch`. El hook invoca las funciones de `api/`, guarda la respuesta y los estados de pantalla, y expone datos y acciones al componente visual.

Cada carpeta tiene una responsabilidad concreta:

- **`api/` — llamadas al backend:** contiene funciones pequeñas que ejecutan una llamada HTTP por endpoint. Cada archivo conoce el método HTTP, la ruta, los parámetros, el token y los contratos de request/response. No renderiza componentes ni decide reglas del negocio.
  - `get-pos-context.ts`: llama a `GET /api/v1/pos/context` y obtiene productos, variantes, descuentos autorizados, precios por presa, períodos y turno activo.
  - `create-order.ts`: llama a `POST /api/v1/orders` para crear una orden estándar. Envía referencias e intención de la cajera; no envía precios ni totales.
  - `create-custom-order.ts`: llama a `POST /api/v1/orders/custom` con la composición custom y el precio confirmado por la cajera.
  - `confirm-payment.ts`: llama a `POST /api/v1/orders/{id}/pay` para confirmar el pago de un pedido pendiente.

- **`components/` — interfaz visual:** contiene componentes React específicos del feature. Reciben datos por props, renderizan controles y emiten eventos mediante callbacks.
  - `sales-pos.tsx`: muestra el POS, las categorías, los productos seleccionados y las acciones disponibles.
  - `custom-sale-form.tsx`: muestra el formulario de una venta custom y comunica la selección realizada por la cajera.

- **`hooks/` — estado y acciones de pantalla:** contiene hooks que invocan las funciones de `api/`, almacenan `data`, `isLoading`, `error` y otros estados temporales, y ofrecen funciones como `loadPosContext`, `createOrder` o `confirmPayment` para que la UI no conozca HTTP. No contienen reglas definitivas del negocio.

- **`schemas/` — contratos de transporte:** contiene schemas Zod para verificar que las respuestas recibidas y los datos enviados tengan la forma esperada. Esta validación protege al frontend de respuestas malformadas y mejora los mensajes de formulario, pero no reemplaza la validación del backend ni constituye una frontera de seguridad.

- **`types.ts` — tipos TypeScript:** contiene tipos compartidos por los componentes, hooks, API y schemas del feature, como `CreateOrderInput`, `ConfirmPaymentResponse` o `SalesProduct`. Los tipos describen la forma de los datos; no deben esconder reglas de negocio en el frontend.

El flujo esperado es:

```text
UI -> Hook -> API -> Backend
UI <- Hook <- API response <- Backend
```

El frontend puede controlar selección de productos, estado visual, apertura de modales, navegación, estados de carga y presentación de errores. También puede calcular el **precio sugerido** de la venta custom cuando el backend entrega `piecePrices` en `GET /api/v1/pos/context`; ese valor es solo una ayuda visual. El backend sigue siendo la única autoridad para el precio confirmado, stock, descuentos, permisos, disponibilidad, totales y transiciones de pedidos.

#### Regla de dependencias

Las rutas de `app/` pueden usar features, `commonComponents` y configuración. Un feature puede usar otros módulos técnicos compartidos, pero no debe importar componentes internos de otro feature. Si dos features necesitan coordinarse, la composición ocurre en la página de `app/`.

#### Alineación con el contrato actual del backend

La estructura del frontend debe seguir los endpoints reales documentados en Swagger y en la guía técnica, no inventar una capa de negocio paralela en React:

| Feature         | API principal                                                                                                                                          | Uso de la UI                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `auth`          | `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`                                                                                                  | Iniciar y cerrar sesión; almacenar el estado de autenticación.        |
| `sales`         | `GET /api/v1/pos/context`, `POST /api/v1/orders`, `POST /api/v1/orders/custom`                                                                         | Cargar el contexto del POS y enviar la intención de venta.            |
| `orders`        | `GET /api/v1/orders`, `GET /api/v1/orders/{id}`, `POST /api/v1/orders/{id}/pay`, `POST /api/v1/orders/{id}/cancel`, `PATCH /api/v1/orders/{id}/status` | Listar, consultar, pagar, cancelar y mostrar el estado de pedidos.    |
| `cash-register` | `GET /api/v1/shifts/active`, `POST /api/v1/shifts/open`, `POST /api/v1/shifts/close`                                                                   | Mostrar el turno y enviar apertura/cierre de caja.                    |
| `customers`     | `GET /api/v1/customers`, `POST /api/v1/customers`, `PATCH /api/v1/customers/{id}`                                                                      | Buscar, registrar y editar clientes para facturación.                 |
| `reports`       | `GET /api/v1/reports/sales`, `/inventory-presas`, `/cash-audit`                                                                                        | Solicitar y renderizar reportes; el backend genera los totales y CSV. |

El POS debe cargar su contexto con una llamada a `GET /api/v1/pos/context`. El backend ya devuelve productos, variantes, descuentos aplicables, precios por presa, períodos y turno activo. La UI pinta esos datos y solo puede calcular el **precio sugerido** de una venta custom con `piecePrices`; el backend valida y persiste el precio confirmado.

La respuesta de cada API debe conservar el contrato estándar del backend (`isSuccess`, `message`, `data`, `error`). Los hooks exponen esos datos a la UI sin mover reglas transaccionales al navegador.

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

### 0.3 Separación entre UI, estado y datos

El estilo anterior mezclaba a veces consulta, transformación, formulario y render en un mismo componente. La evolución recomendada conserva la división por módulo y agrega límites claros:

- **Componentes:** renderizan y emiten eventos.
- **Hooks:** coordinan estado de pantalla y efectos.
- **API:** encapsula llamadas HTTP y contratos de request/response.
- **Schemas:** validan entradas y respuestas externas.
- **Stores:** contienen únicamente estado global que realmente se comparte.

No se debe llamar a la API directamente desde una tabla o un formulario. Tampoco se debe poner en Zustand el estado efímero de un input, un diálogo o una consulta usada por una sola pantalla.

### 0.4 Hooks de dominio y estados explícitos

Los hooks personalizados del estilo anterior eran una buena forma de reutilizar suscripciones y transformaciones. En Next.js deben representar casos de uso, con estados explícitos de carga, éxito y error.

```tsx
import { useEffect, useState } from 'react';
import { getUsers, type User } from '../api/users';

type UsersState = {
  data: User[];
  isLoading: boolean;
  error: string | null;
};

export function useUsers(): UsersState {
  const [state, setState] = useState<UsersState>({
    data: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    getUsers()
      .then((data) => setState({ data, isLoading: false, error: null }))
      .catch(() =>
        setState({
          data: [],
          isLoading: false,
          error: 'No se pudieron cargar los usuarios',
        }),
      );
  }, []);

  return state;
}
```

La pantalla debe contemplar siempre los estados `loading`, `error`, `empty` y `success`. Esto mejora la experiencia operativa y evita que la interfaz dependa de `undefined` o de logs en consola.

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

## 4. Estructura recomendada

```text
src/
├─ app/
│  ├─ layout.tsx
│  ├─ providers.tsx
│  └─ (authenticated)/
│     ├─ cashier/
│     ├─ dispatcher/
│     ├─ cook/
│     └─ admin/
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
│  └─ api.ts
├─ commonComponents/
└─ styles/
  └─ globals.css
```

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

La función API es el único lugar que conoce la URL y el formato externo. El hook consume `User[]`, no una respuesta HTTP sin validar; el componente solo consume el estado y las acciones que el hook expone.

---

## 5. Theme mínimo de MUI

### `src/theme/theme.ts`

```tsx
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
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

### `src/app/providers.tsx`

```tsx
'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { theme } from '@/theme/theme';

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
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
import { Providers } from './providers';
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
        <Providers>{children}</Providers>
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

---

# PARTE 2 — GUÍA DE USO

> Ejemplos simples y claros.

---

## 🔹 Next.js con TSX — Uso recomendado

### Ejemplo de componente

```tsx
type Props = {
  title: string;
};

export default function Card({ title }: Props) {
  return <h2>{title}</h2>;
}
```

### Recomendaciones

- Empieza simple.
- Agrega tipos solo en:
  - Props
  - Respuestas de API
  - Funciones importantes

### Ventajas

- Menos bugs
- Mejor autocompletado
- Código mantenible
- Compatible con `app/` y Server Components

### Regla práctica

> Usa `.tsx` como base y tipa solo donde aporta valor.

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

## Ejemplo simple — sin tipos

```tsx
import { create } from 'zustand';

const useBear = create((set) => ({
  bears: 0,

  increasePopulation: () =>
    set((state) => ({
      bears: state.bears + 1,
    })),

  removeAllBears: () =>
    set({
      bears: 0,
    }),
}));
```

✔ Rápido
✔ Poco código
✔ Ideal para UI state

---

## Ejemplo recomendado — con tipos

```tsx
import { create } from 'zustand';

type BearState = {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
};

const useBear = create<BearState>((set) => ({
  bears: 0,

  increasePopulation: () =>
    set((state) => ({
      bears: state.bears + 1,
    })),

  removeAllBears: () =>
    set({
      bears: 0,
    }),
}));
```

---

## ¿Cuándo tipar Zustand?

| Caso           | Tipar |
| -------------- | ----- |
| UI simple      | ❌ No |
| Auth           | ✅ Sí |
| Carrito        | ✅ Sí |
| Config global  | ✅ Sí |
| Flags visuales | ❌ No |

> **Estados globales importantes = tipar**

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
