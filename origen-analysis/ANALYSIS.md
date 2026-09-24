# Análisis del Origen — Wonder Chicken Prototype (Vite + React + Tailwind)

> Documento de referencia para la **recreación fiel** en `wonderchicken-front` (Next.js 16 + MUI v9 + Zustand + Zod).
> Generado el 24/09/2026 con capturas automatizadas vía `playwright-cli` sobre el origen corriendo en `localhost:3001`.

---

## 1. Stack y arquitectura del origen

| Capa | Tecnología | Notas |
|---|---|---|
| Bundler | Vite 6 | `--port=3000 --host=0.0.0.0` |
| UI | React 19 + TypeScript 5.8 | `react@^19.0.1` |
| Estilos | Tailwind CSS 4 + Material Symbols | utility-first + iconografía textual |
| Estado | Zustand 5 | tres stores: `auth`, `orders`, `shifts` |
| Validación | Zod 4 (declarado, poco usado) | — |
| Router | **NO usa** react-router | Switch declarativo por `useState<ScreenType>` en `App.tsx` |

> **Implicación para el destino:** el origen es una **SPA pura sin URLs reales**. El destino debe ganar routing real (Next.js App Router) **manteniendo** el contenido visual y la lógica de navegación por rol. NO se replica el routing declarativo.

---

## 2. Sistema de diseño (tokens críticos del origen)

Extraídos de `src/config/colors.ts` y `src/index.css`. Son **obligatorios** para que la app se vea igual.

### 2.1 Colores de marca

| Token | Valor | Uso |
|---|---|---|
| `primary` | `#d32f2f` | Rojo Wonder Chicken (header rojo, CTAs primarios) |
| `primaryDark` | `#af101a` | Hover/activo del primary |
| `secondary` | `#fbc02d` | Amarillo Wonder Chicken (badges, acentos) |
| `secondaryAccent` | `#fec330` | Hover del secondary |
| `darkSurface` | `#141b2b` | Navy slate (texto fuerte) |
| `darkSurfaceAlt` | `#293040` | Navy slate alternativo |
| `lightBg` | `#f9f9ff` | Background app |
| `lightCard` | `#ffffff` | Superficie de tarjetas |
| `lightBorder` | `#e1e8fd` | Bordes suaves |
| `textPrimary` | `#141b2b` | Texto fuerte |
| `textSecondary` | `#5b403d` | Texto secundario |
| `success` | `#15803d` | Verde (entregado/listo) |
| `warning` | `#b45309` | Ámbar |
| `error` | `#ba1a1a` | Rojo error |

### 2.2 Tipografía

- **Geist Sans** para UI base (`body { font-family: var(--font-geist-sans) }`)
- **JetBrains Mono** para códigos, montos, datos técnicos (clase `.font-mono`)
- **Material Symbols Outlined** para iconografía

### 2.3 Dark mode

El origen implementa dark mode **completo** con un sistema custom (no usa MUI Palette por la versión que tiene). El destino debe usar `theme.palette.mode = 'dark'` de MUI y mapear todos los tokens a la versión dark:

| Token | Light | Dark |
|---|---|---|
| `background.default` | `#f9f9ff` | `#0b0f19` |
| `background.paper` | `#ffffff` | `#131b2e` |
| `background.subtle` | `#f1f3ff` | `#1a233b` |
| `text.primary` | `#141b2b` | `#f8fafc` |
| `text.secondary` | `#64748b` | `#94a3b8` |
| `divider` | `#e1e8fd` | `#263554` |
| `action.hover` | `#f1f3ff` | `#243050` |

---

## 3. Catálogo de pantallas del origen

Capturas en `screenshots/` (16 PNGs). Cada sección describe lo visible, los elementos clave y la URL conceptual.

### 3.1 Login — `screenshots/07-login-origen.png`

```
URL: /login (sin auth)
Layout: SIN sidebar, SIN header → pantalla standalone centrada
```

- Card central con borde sutil y sombra `0 1px 8px rgba(0,0,0,0.04)`
- Logo circular `Wonder Chicken` arriba
- Título `Acceso al Sistema POS`
- Subtítulo `Sistema Integrado de Ventas, Despacho y Operaciones`
- 2 inputs: Correo Electrónico / Contraseña (CI) con iconos `alternate_email` y `badge`
- Botón toggle de visibilidad
- Link `¿Problemas de acceso?`
- Botón primario `Iniciar Sesión` (icono `login`)
- Card inferior: tabla de cuentas demo con 4 roles (Cajera, Despacho KDS, Administrador, Super Admin) — click → autocompleta credenciales
- Botón modo claro/oscuro flotante arriba a la derecha
- Footer: `Wonder Chicken POS & Cajas v2.4 • Sistema Conforme Normativa SIN Bolivia`

### 3.2 Apertura de turno — `screenshots/01-apertura-turno.png`

```
URL: /cashier/shift/open (CAJERA sin turno)
Layout: standalone full-bleed (como login)
```

- Header **ROJO** (`bg-red-600` / `#d32f2f`) — color único de marca, no es el tema
- Subtítulo: `Apertura Inicial de Caja & Turno Fiscal`
- Botón modo claro/oscuro dentro del header rojo
- 3 cards en pasos numerados (FR-004 / PDR §2.6):
  1. **Período de Turno**: 2 cards grandes seleccionables (Mañana / Noche) con iconos `wb_sunny`/`dark_mode` y rango horario
  2. **Caja Registradora**: 3 cards (Caja 01 LIBRE / Caja 02 LIBRE / Caja 03 EN USO)
  3. **Monto Inicial en Efectivo**: Input numérico con presets (`Bs. 100 / 150 (Frecuente) / 200 / +Bs. 20 / +Bs. 50`)
- Card lateral: "Resumen de Apertura" con datos del operador + alert `info` "Al confirmar la apertura, el sistema registrará el timestamp de inicio fiscal..."
- Botón grande `lock_open Abrir Turno y Entrar al POS`
- Footer igual al login

### 3.3 Resumen de Apertura (post-apertura) — `screenshots/02-resumen-apertura.png`

```
URL: /cashier/shift/summary
Layout: shell completo (header + sidebar)
```

- Sidebar muestra "Operaciones de Caja & POS" con:
  - **E** Resumen de Apertura (marcado activo, badge "Lectura")
  - **F** POS Ventas
  - **J** Historial de Pedidos
  - **P** Clientes (FR-019)
  - Pago Pendiente [FR-011] 3
- Header muestra Sucursal Central (Caja 01) en lugar de solo Sucursal Central
- Main: tarjeta con `lock_open`, código `SHF-XXXX-MAÑANA`, datos del operador, "Cerrar Turno y Volver al Login" y botones `print Reimprimir Comprobante` + `Ir a Terminal POS`

### 3.4 POS Ventas — `screenshots/03-pos-ventas.png`

```
URL: /cashier/pos
Layout: shell completo + grid catálogo izq + carrito der
```

- **Sidebar** como cajera (E/F/J/P/Pago pendiente)
- **Header** muestra Sucursal Central (Caja 01) — confirmado turno
- **Main izquierdo (catálogo)**:
  - Tabs de categorías: `Todos (12) / 🍗 Platos Principales / 🥤 Bebidas / 🍟 Extras & Guarniciones / tune Venta Custom`
  - Buscador con icono `search`
  - Grid de tarjetas de producto con imagen grande (16:10), badge de piezas (2 presas / 2 presas + Mixto / COMBO / SUPER), descripción y precio grande
- **Main derecho (carrito/resumen)**: el origen NO muestra panel lateral visible en la captura inicial — los items se agregan y aparecen

### 3.5 Clientes (cajera) — `screenshots/04-clientes.png`

```
URL: /cashier/customers
Layout: shell completo + tabla MUI DataGrid
```

- Header con título y acciones (`+ Nuevo Cliente`, `Volver a Ventas POS`)
- DataGrid con búsqueda global, paginación "Filas por página: 5/10/20", "1–9 de 9"
- Modal de cliente con campos: CI con departamento, NIT condicional, nombre, Razón Social, género, celular, correo, fecha nacimiento, nota SIN RND 102100000011

### 3.6 Historial de Pedidos — `screenshots/05-historial.png`

```
URL: /cashier/orders
Layout: shell completo + tabla
```

- Botón de vuelta al POS
- Tabla con columnas: Ticket / Tipo / Cliente / Ítems / Total / Pago / Cajero / Acciones
- Modal de reimpresión con layout de ticket 80mm

### 3.7 Pago Pendiente — `screenshots/06-pago-pendiente.png` + `06b-user-menu.png`

```
URL: /cashier/orders (con tab pendiente)
Layout: shell completo + grid de cards
```

- Header: `Bandeja de Pedidos con Pago Pendiente (FR-011)`
- Subtítulo: "Despachados a fritura/cocina anticipada • Pendientes de liquidación fiscal"
- Botones: `tv Pantalla Turnos (Fichas)` / `point_of_sale Volver a POS`
- Grid de cards con: `#ticket / tipo / cliente / tiempo / items / Cobrar Pedido / Cancelar`

### 3.8 Dashboard Branch Admin — `screenshots/08-dashboard-branch-admin.png`

```
URL: /branch-admin
Layout: shell completo
```

**Sidebar ADMINISTRADOR** (diferente al de cajera):
- Sección "Administración de Sede":
  - **D** Dashboard Sucursal
  - **N1** Catálogo y Variantes
  - **N2** Personal de Sucursal
  - **O** Reportes Operativos
  - **Q** Clientes (Admin FR-019)
- Sección "Supervisión Operativa":
  - **F** Terminal POS
  - **J** Historial de Pedidos
  - Pago Pendiente [FR-011] 3

**Main Dashboard**:
- Header: `Panel de Administración de Sucursal`
- 3 botones de acción rápida (Catálogo & Variantes / Control de Turnos / Gestionar Personal)
- 4 KPI cards en grid: Ventas Turno Actual / Comandas en Cocina (KDS) / Pago Pendiente [FR-011] / Estado de Turno
- Tabla MUI X DataGrid: "Arqueo y Estado de Cajas en Sucursal" con columnas Terminal / Cajera Asignada / Período / Hora Apertura / Fondo Inicial / Ventas Registradas / Estado

### 3.9 Catálogo — `screenshots/09-catalogo.png`

```
URL: /branch-admin/products
Layout: shell completo + tabla
```

- Tabla de productos con: checkbox, código, producto (imagen), categoría, precio base, variantes, reglas (modal), control de presas, POS activo (toggle), acciones (editar)
- Modal "Reglas de Armado" con 3 tabs: Presas obligatorias / Acompañamiento y sustituciones / Bebida y extras
- Modal "Registrar Nuevo Producto"

### 3.10 Personal — `screenshots/10-personal.png`

```
URL: /branch-admin/users
Layout: shell completo + tabla
```

- Tabla con filtros por rol, switch activo/inactivo
- Modal alta de operador

### 3.11 Reportes Operativos — `screenshots/11-reportes.png`

```
URL: /branch-admin/reports
Layout: shell completo + pantallas de arqueo + acta Z
```

- Tabla de cajas activas con totales
- Conteo físico de efectivo con denominaciones (200/100/50/20/10 + monedas)
- Cuadre operativo (fondo + ventas - gastos - vales = teórico)
- Modal "Acta Z" con datos fiscales para impresión

### 3.12 Clientes Admin — `screenshots/12-clientes-admin.png`

```
URL: /branch-admin/customers
Layout: shell completo + DataGrid
```

- Header: `Directorio de Clientes`
- Badge: `Módulo FR-019 • Gestión de Clientes y Cumplimiento Normativo de Facturación (SIN BOLIVIA)`
- Filtros: CI / NIT / Nombre / Fecha registro / Estado
- DataGrid con 9 clientes
- Botón `+ Nuevo Cliente`

### 3.13 KDS — `screenshots/13-kds.png`

```
URL: /dispatcher (DESPACHADORA)
Layout: shell completo + grid de tarjetas
```

**Sidebar DESPACHADORA**:
- **K** Comandas KDS (con badge `2`)
- Monitor Turnos PDR

**Main KDS**:
- Header: `Despacho de Cocina — KDS (Kitchen Display System)`
- Subtítulo
- Botones `tv Pantalla Turnos PDR` / `Volver a POS`
- Filtros: Todos (4) / En Preparación / Listo para Entrega / MESA / LLEVAR
- Buscador
- Grid de tarjetas de comanda con header coloreado según estado:
  - VERDE: Listo/Anunciado
  - ROJO: En Preparación/Nuevo
  - ÁMBAR: Pago Pendiente
- Cada tarjeta: número, tipo, badge pago pendiente, cliente, hora, items con detalles
- Botones contextuales según estado

### 3.14 Pantalla Turnos PDR (público) — `screenshots/14-pantalla-turnos.png`

```
URL: /order/[token]
Layout: STANDALONE — sin sidebar ni header de app
```

- Header minimal con logo + "Volver al Sistema"
- Input grande: `Ingrese número de ticket (ej. 105, 103, 102)...` con auto-actualización
- 2 columnas: `LISTOS PARA RECOGER (verde)` / `EN PREPARACIÓN (ámbar)`
- Cards grandes de tickets con número y nombre del cliente
- Footer: `Wonder Chicken Fast-Casual System • Consulta Pública de Turno`

---

## 4. Header y Sidebar — anatomía detallada

### 4.1 Header — `Header.tsx`

```css
position: fixed top-0 left-0 right-0 z-50
height: 64px
bg: rgba(255,255,255,0.95) + backdrop-blur-md
shadow: 0 1px 8px rgba(0,0,0,0.04)
border-bottom: 1px solid #e1e8fd
```

**Estructura interna (de izq a der):**

1. **Botón hamburguesa** (mobile only) — `md:hidden`, abre drawer lateral
2. **Botón colapsar sidebar** (desktop only) — toggle expand/collapse
3. **Branding** — Logo circular (40×40 desktop / 44×44 mobile) + nombre de sucursal (bold 14-16px) + línea secundaria mono 10px con `WONDER CHICKEN • Online` (rojo + verde)
4. **Botón tema** — chip con icono (oscuro: `dark_mode` / claro: `light_mode`) + texto "Claro/Oscuro"
5. **Account Popover** — Avatar circular rojo (`bg-[#af101a]`) con inicial + nombre + rol + chevron expand_more/expand_less
   - Al expandir: card de 288-320px con datos del usuario + Sucursal Activa + botón `logout Cerrar Sesión`

### 4.2 Sidebar — `Sidebar.tsx`

```css
position: fixed top-16 bottom-0 z-40
width: 256px (expanded) / 72px (collapsed) en desktop
bg: white
border-right: 1px solid #e1e8fd
shadow: 0 1px 8px rgba(0,0,0,0.04)
padding: 8-12px
```

**Estructura:**

1. Header mobile con "MENÚ DE NAVEGACIÓN" + botón cerrar
2. **Secciones** (cada una con título mono 10px uppercase tracking-wider + items)
3. Cada item: 
   - **Avatar/icono de nodo** (cuadrado 36×36 con bg-color)
   - **Icono Material Symbols** (24px)
   - **Label** (texto principal 14px)
   - **Sublabel** (path URL mono 10px gris)
   - **Badge** opcional (círculo rojo con número o chip de texto)

**Estructura por rol** (debe respetarse):

#### CAJERA (5 items)
- E Resumen de Apertura (Lectura) / Apertura de Turno (Requerido)
- F POS Ventas
- J Historial de Pedidos
- P Clientes (FR-019)
- Pago Pendiente [FR-011]

#### DESPACHADORA (2 items)
- K Comandas KDS (badge con active count)
- Monitor Turnos PDR

#### ADMIN (8 items en 2 secciones)
**Administración de Sede:**
- D Dashboard Sucursal
- N1 Catálogo y Variantes
- N2 Personal de Sucursal
- O Reportes Operativos
- Q Clientes (Admin FR-019)

**Supervisión Operativa:**
- F Terminal POS
- J Historial de Pedidos
- Pago Pendiente [FR-011]

#### SUPER_ADMIN (6 items en 1 sección)
**Superadministración:**
- C Dashboard Global
- M Gestión Sucursales (badge "3 Sedes")
- Q Clientes Cross-Sucursal
- N1 Catálogo Global
- O Reportes & Auditoría
- N2 Usuarios y Roles

---

## 5. Diferencias críticas vs. implementación actual del destino

| Elemento | Origen | Destino actual | Acción |
|---|---|---|---|
| Header fondo | blanco 95% + blur | gris básico | **arreglar**: blanco + blur |
| Sidebar width | 256/72px, sombra sutil | 260px (similar) | **ajustar a 256/72** |
| Sidebar position | `fixed top-16 bottom-0` | usa AppBar sticky | **arreglar**: fixed |
| Login layout | sin sidebar, centrado | igual | OK |
| Apertura de turno | header ROJO + 3 pasos | muy básico | **rediseñar completo** |
| POS catálogo | grid tarjetas con imagen grande | grid básico | **mejorar visual** |
| KDS tarjetas | header coloreado por estado | similar | **mejorar** |
| Pantalla turnos | standalone + input | standalone | OK |
| Iconos | Material Symbols Outlined | MUI Icons | OK (diferente pero equivalente) |
| Dark mode | completo + tokens | implementado | OK |
| Branch admin sidebar | 2 secciones, 8 items | 4 secciones básico | **re-armar sidebar** |
| User popover header | expandible con datos | no existe | **agregar** |

---

## 6. Plan de recreación fiel (orden de implementación)

### Fase 1 — Foundations (refactor)
1. `config/colors.ts` — completar con tokens faltantes
2. `theme/theme.ts` — extender components overrides para Header (transparent), Sidebar (border-right, fixed), Tabla (DataGrid theme), Card (border + shadow)
3. `commonComponents/AppHeader.tsx` — reescribir con layout exacto del origen:
   - Logo circular clickeable
   - Sucursal + WONDER CHICKEN • Online mono
   - Theme toggle chip
   - User popover con avatar + nombre + rol + email + Sucursal + Cerrar Sesión
4. `commonComponents/AppSidebar.tsx` — reescribir:
   - Posición fixed top-16 bottom-0
   - Width 256/72
   - Items con avatar/icono + label + sublabel + badge
   - Por rol con 2 secciones en ADMIN
5. `app/(protected)/layout.tsx` — usar header + sidebar reales

### Fase 2 — Login + Apertura de turno (header rojo + 3 pasos)
1. Reescribir `LoginScreen` para coincidir visualmente
2. Reescribir `ShiftScreen` con header ROJO + 3 cards de pasos
3. Crear `ShiftSummaryScreen` (nueva pantalla post-apertura)

### Fase 3 — POS rediseñado
1. Refactor `POSScreen` con tarjetas grandes de catálogo
2. Panel derecho del carrito con items detallados
3. `ComboVariantModal` con presas interactivas
4. `PaymentModal` con tabs Efectivo/QR

### Fase 4 — KDS pulido
1. Tarjetas con header coloreado por estado
2. Acciones contextuales según estado

### Fase 5 — Pantalla Turnos pública
1. Input grande con auto-actualización
2. 2 columnas LISTOS/EN PREPARACIÓN

### Fase 6 — Dashboards
1. `BranchAdminDashboard` con KPI cards y tabla de cajas (DataGrid)
2. `SuperAdminDashboard` con KPI cards y tabla de sucursales

---

## 7. Componentes MUI a usar / crear

| Necesidad | Componente MUI |
|---|---|
| Tabla con sort/search/pagination | `@mui/x-data-grid` DataGrid (NO CommonTable custom) |
| Selector de fecha | `@mui/x-date-pickers` DatePicker + `dayjs` |
| Iconos | `@mui/icons-material` |
| Tablas densas con muchas columnas | DataGrid (no Table nativa) |
| KPIs con icono | `Card` + `Stack` + `Avatar` icon |
| Modal grande con header rojo | `Dialog` con `PaperProps.sx={{ borderTop: 4, borderColor: 'primary.main' }}` |
| AppShell | `AppBar` (header) + `Drawer variant="permanent"` (sidebar) — patrón estándar MUI DashboardLayout |

> **Decisión clave:** en lugar de mantener el `CommonTable<T>` custom que escribí, **usar `DataGrid`** para todas las tablas con sort/search/pagination que tengan >4 columnas. El origen usa MUI X DataGrid.
