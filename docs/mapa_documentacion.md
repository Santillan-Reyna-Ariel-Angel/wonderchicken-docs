# Mapa de Documentación — Wonder Chicken

> Diagramas para **entender los documentos** del proyecto y **cómo se relacionan**.
> Pensado como puerta de entrada: leé esto primero, después saltá al documento que necesites.
>
> Documentos cubiertos:
> - [`indice_pdr.md`](indice_pdr.md) — índice navegable
> - [`pdr.md`](pdr.md) — reglas de negocio (la fuente de verdad)
> - [`requirements.md`](requirements.md) — requerimientos funcionales (FR) y no funcionales (NFR)
> - [`technical_guide.md`](technical_guide.md) — traducción técnica (modelo, API, payloads)
> - [`architecture_overview.md`](architecture_overview.md) — mapa visual del backend NestJS (módulos, lifecycle, endpoints reales)

---

## Índice

- [1. Los documentos y su rol](#1-los-documentos-y-su-rol)
- [2. La regla de oro: PRECEDENCIA](#2-la-regla-de-oro-precedencia)
- [3. Cómo "viaja" una decisión: del negocio al código](#3-cómo-viaja-una-decisión-del-negocio-al-código)
- [4. Ruta de lectura según tu rol](#4-ruta-de-lectura-según-tu-rol)
- [5. Mapa interno del PDR (la fuente de verdad)](#5-mapa-interno-del-pdr-la-fuente-de-verdad)
- [6. Modelo de datos (vista de relaciones)](#6-modelo-de-datos-vista-de-relaciones)
- [7. Máquina de estados de pedidos](#7-máquina-de-estados-de-pedidos)
- [8. Resumen de navegación](#8-resumen-de-navegación)

---

## 1. Los documentos y su rol

Cada archivo tiene **una responsabilidad** y **no se pisan** entre sí. El PDR define el QUÉ y el PORQUÉ del negocio; los otros lo aterrizan, hasta llegar al código.

```mermaid
flowchart TB
    subgraph entrada["🚪 Entrada"]
        IDX["📑 indice_pdr.md<br/><i>Índice navegable</i><br/>Mapa con anchors a cada sección"]
    end

    subgraph negocio["🧠 Negocio (el QUÉ y el PORQUÉ)"]
        PDR["📘 pdr.md<br/><i>Reglas de negocio definitivas</i><br/>§2 reglas · §4 estados · §13 alcance V1/V2"]
    end

    subgraph requis["✅ Requisitos (el QUÉ verificable)"]
        REQ["📗 requirements.md<br/><i>FR-001..FR-017 + NFR de negocio</i><br/>Cada FR con criterio de aceptación"]
    end

    subgraph tecnica["⚙️ Técnica (el CÓMO)"]
        TECH["📙 technical_guide.md<br/><i>Modelo de datos · API · payloads</i><br/>NFR técnicos · estados transaccionales · E2E"]
    end

    subgraph codigo["🏗️ Código (el DÓNDE en el repo)"]
        ARCH["📕 architecture_overview.md<br/><i>Mapa visual del backend NestJS</i><br/>Módulos · lifecycle de un request · endpoints reales"]
    end

    IDX -.navega a.-> PDR
    IDX -.navega a.-> REQ
    IDX -.navega a.-> TECH
    IDX -.navega a.-> ARCH

    PDR ==origina==> REQ
    PDR ==se traduce en==> TECH
    REQ -.se valida contra.-> TECH
    TECH ==se implementa en==> ARCH

    classDef idx fill:#e1f5fe,stroke:#0288d1,color:#01579b
    classDef pdr fill:#fff3e0,stroke:#f57c00,color:#e65100
    classDef req fill:#e8f5e9,stroke:#388e3c,color:#1b5e20
    classDef tech fill:#fce4ec,stroke:#c2185b,color:#880e4f
    classDef arch fill:#ede7f6,stroke:#5e35b1,color:#311b92
    class IDX idx
    class PDR pdr
    class REQ req
    class TECH tech
    class ARCH arch
```

| Documento | Responde a | Contiene | NO contiene |
| --- | --- | --- | --- |
| [`indice_pdr.md`](indice_pdr.md) | *"¿Dónde está X?"* | Anchors a cada sección de los otros 4 | Contenido propio |
| [`pdr.md`](pdr.md) | *"¿Por qué el negocio funciona así?"* | Reglas (§2), estados (§4), alcance V1/V2 (§13), UX (§7) | Modelo de datos, endpoints, FR detallados (los **trasladó**) |
| [`requirements.md`](requirements.md) | *"¿Qué debe hacer y cómo lo pruebo?"* | FR-001..FR-017 + criterios de aceptación, NFR de negocio | Reglas (referencia al PDR), detalle técnico |
| [`technical_guide.md`](technical_guide.md) | *"¿Cómo lo construyo?"* | Stack, modelo Prisma, endpoints, payloads, E2E, despliegue | Reglas de negocio (referencia al PDR) |
| [`architecture_overview.md`](architecture_overview.md) | *"¿Dónde vive esto en el repo?"* | Módulos NestJS, lifecycle de un request, endpoints reales, vista del Prisma | Reglas, FR, contrato detallado (referencia al PDR y a la guía técnica) |

---

## 2. La regla de oro: PRECEDENCIA

Esto es lo más importante de toda la arquitectura documental. **Si dos documentos se contradicen, gana el PDR.** Siempre. Sin excepciones.

```mermaid
flowchart LR
    PDR["📘 PDR<br/>(regla de negocio)"]
    REQ["📗 requirements.md<br/>(criterio FR)"]
    TECH["📙 technical_guide.md<br/>(decisión técnica)"]
    ARCH["📕 architecture_overview.md<br/>(diagrama del backend)"]
    CODE["🏗️ código real<br/>(prisma + NestJS)"]

    REQ -- "¿conflicto?<br/>gana 👑" --> PDR
    TECH -- "¿conflicto?<br/>gana 👑" --> PDR
    ARCH -- "¿conflicto de regla?<br/>gana 👑" --> PDR
    ARCH -- "¿conflicto de implementación?<br/>gana 🏗️" --> CODE

    note["👑 = el PDR es la fuente de verdad de NEGOCIO.<br/>🏗️ = para architecture-overview, ante la IMPLEMENTACIÓN gana el CÓDIGO.<br/>Los documentos se ACTUALIZAN para reflejar PDR/código, nunca al revés."]

    classDef pdr fill:#fff3e0,stroke:#f57c00,color:#e65100,stroke-width:3px
    classDef other fill:#f5f5f5,stroke:#999,color:#333
    classDef code fill:#ede7f6,stroke:#5e35b1,color:#311b92,stroke-width:3px
    classDef noteStyle fill:#fffde7,stroke:#fbc02d,color:#5d4037
    class PDR pdr
    class REQ,TECH,ARCH other
    class CODE code
    class note noteStyle
```

> Lo declaran los documentos explícitamente:
> [`indice_pdr.md` L6](indice_pdr.md#L6) · [`requirements.md` L11](requirements.md#L11) · [`technical_guide.md` L10](technical_guide.md#L10) · [`architecture_overview.md` L11](architecture_overview.md#L11)

> 📝 **Antes de la fuente de verdad está el backlog.** Las definiciones de negocio que **todavía no
> se decidieron** viven en [`pdr_questions_pending.txt`](pdr_questions_pending.txt) (preguntas
> `[SIN RESPUESTA]` / `[AMBIGUA]`). Ese archivo **no es normativo**: cuando el negocio responde, la
> decisión se **traslada al PDR** y recién ahí pasa a ser fuente de verdad. No implementes desde el backlog.

---

## 3. Cómo "viaja" una decisión: del negocio al código

Una misma idea (ej. *descuentos*) aparece en los tres documentos, pero **en distinto nivel de abstracción**. Entender este recorrido es la clave para no perderse.

```mermaid
flowchart TB
    A["🧠 PDR §2.11<br/><b>Regla de negocio</b><br/>'El admin crea descuentos de monto fijo;<br/>la cajera los aplica a la orden'"]
    B["✅ requirements.md FR-016 / FR-016b<br/><b>Requerimiento + criterio de aceptación</b><br/>'El total baja en ese monto; queda registrado<br/>precio original, monto y referencia'"]
    C["⚙️ technical guide §3 / §5<br/><b>Entidades + endpoints</b><br/>Discount · DiscountAuthorization ·<br/>POST /orders/{id}/discount"]
    D["⚙️ technical guide §6 / §8<br/><b>Payload + caso E2E</b><br/>OrderWithDiscountResponse ·<br/>Test 13 / 13b / 13c"]

    A ==origina==> B
    A ==se traduce==> C
    B -.se valida con.-> D
    C ==ejemplifica==> D

    classDef pdr fill:#fff3e0,stroke:#f57c00,color:#e65100
    classDef req fill:#e8f5e9,stroke:#388e3c,color:#1b5e20
    classDef tech fill:#fce4ec,stroke:#c2185b,color:#880e4f
    class A pdr
    class B req
    class C,D tech
```

**El mismo patrón aplica a cada feature.** Ejemplos de trazabilidad completa:

| Concepto | Regla (PDR) | Requerimiento | Técnica |
| --- | --- | --- | --- |
| Venta custom | [§2.10](pdr.md#L380) | [FR-002b](requirements.md#L26) | `POST /orders/custom`, `Order.isCustom`, `customPieces` |
| Inventario por presas | [§2.3](pdr.md#L310) | [FR-006](requirements.md#L42), [FR-017](requirements.md#L105) | `InventoryItem`, `ShiftChickenLog`, `InventoryTransaction` |
| Pago pendiente | [§2.5](pdr.md#L344) | [FR-011](requirements.md#L70) | `Order.status=pendingPayment`, sin auto-cancel |
| Descuentos | [§2.11](pdr.md#L401) | [FR-016/016b](requirements.md#L94) | `Discount`, `DiscountAuthorization` |
| Notificación listo | [§2.8](pdr.md#L368) | [FR-007](requirements.md#L49) | `Order.readyAt`, pantalla pública |
| Auth y roles | [§2.7](pdr.md#L357) | [FR-008](requirements.md#L53) / [FR-018](requirements.md#L112) | `AuthGuard` (JWT) + `RolesGuard` + `@Roles` ([tech §5.2](technical_guide.md#52-autenticación-y-autorización)) |

> La tabla completa de mapeo Negocio → Técnica está en [`technical_guide.md` §10](technical_guide.md#L627).

---

## 4. Ruta de lectura según tu rol

No los leas todos de corrido. **Empezá por donde tu trabajo lo necesita.**

```mermaid
flowchart TB
    START(["¿Qué venís a hacer?"])

    START --> PM["📊 Entender el negocio<br/>(PM / cliente / nuevo en el equipo)"]
    START --> BE["⚙️ Backend dev"]
    START --> FE["🎨 Frontend dev"]
    START --> QA["🧪 QA / Testing"]

    PM --> PM1["1· PDR §1 Resumen ejecutivo"]
    PM1 --> PM2["2· PDR §2 Reglas de negocio"]
    PM2 --> PM3["3· PDR §13 Alcance V1 vs V2"]

    BE --> BE1["1· PDR §2 Reglas (entender el porqué)"]
    BE1 --> BE2["2· tech §3 Modelo de datos"]
    BE2 --> BE3["3· tech §4 Estados transaccionales"]
    BE3 --> BE4["4· tech §5 Endpoints + §6 Payloads"]
    BE4 --> BE5["5· architecture-overview<br/>(dónde vive en el repo: módulos + lifecycle)"]

    FE --> FE1["1· PDR §7 UX / pantallas"]
    FE1 --> FE2["2· requirements FR (qué hace cada pantalla)"]
    FE2 --> FE3["3· tech §5.3 Contrato de respuesta"]

    QA --> QA1["1· requirements FR + criterios de aceptación"]
    QA1 --> QA2["2· tech §8 Casos E2E"]
    QA2 --> QA3["3· PDR §4 Máquina de estados"]

    classDef start fill:#ede7f6,stroke:#5e35b1,color:#311b92,stroke-width:2px
    classDef role fill:#e3f2fd,stroke:#1976d2,color:#0d47a1
    classDef step fill:#fafafa,stroke:#bdbdbd,color:#424242
    class START start
    class PM,BE,FE,QA role
    class PM1,PM2,PM3,BE1,BE2,BE3,BE4,BE5,FE1,FE2,FE3,QA1,QA2,QA3 step
```

---

## 5. Mapa interno del PDR (la fuente de verdad)

El PDR es el documento más grande. Esto es lo que vive adentro y qué **trasladó** a otros archivos (para no duplicar).

```mermaid
flowchart LR
    PDR["📘 pdr.md"]

    PDR --> S0["Material de origen<br/>menú, inventario diario, tickets reales"]
    PDR --> S1["§1 Resumen ejecutivo<br/>personas + flujos"]
    PDR --> S2["§2 Reglas de negocio ⭐<br/>2.1 precios · 2.3 inventario<br/>2.5 pago pendiente · 2.10 custom · 2.11 descuentos"]
    PDR --> S4["§4 Máquina de estados<br/>(nivel negocio)"]
    PDR --> S7["§7 UX / UI<br/>POS, despacho, pantalla pública"]
    PDR --> S13["§13 Alcance V1 vs V2 ⭐"]

    PDR -.trasladó a requirements.-> T1["§5 FR · §6 NFR"]
    PDR -.trasladó a technical guide.-> T2["§3 Modelo · §8 API · §9 Anexos"]

    classDef pdr fill:#fff3e0,stroke:#f57c00,color:#e65100,stroke-width:2px
    classDef sec fill:#fff8e1,stroke:#ffa000,color:#e65100
    classDef moved fill:#f5f5f5,stroke:#9e9e9e,color:#616161,stroke-dasharray: 4 4
    class PDR pdr
    class S0,S1,S2,S4,S7,S13 sec
    class T1,T2 moved
```

> ⭐ = secciones núcleo. Las cajas grises (`trasladó a...`) son secciones que el PDR vació a propósito y apuntan a otro documento — **no busques el detalle ahí, seguí el link.**

---

## 6. Modelo de datos (vista de relaciones)

Para devs: así se conectan las entidades clave de [`technical_guide.md` §3](technical_guide.md#L41). Es el corazón transaccional del sistema.

```mermaid
erDiagram
    Product ||--o{ Variant : tiene
    Order ||--o{ OrderItem : contiene
    OrderItem }o--o| Product : "referencia (null si custom)"
    OrderItem }o--o| Variant : "referencia (null si custom)"
    Shift ||--o{ Order : agrupa
    Shift ||--o{ Voucher : agrupa
    Shift ||--o{ Expense : agrupa
    Shift ||--o{ ShiftChickenLog : "ciclo crudo presas"
    Shift ||--o{ DailyManualConsumption : "consumos manuales"
    Shift ||--o{ DiscountAuthorization : "autoriza por turno"
    Discount ||--o{ Order : "aplicado (uno por orden)"
    Discount ||--o{ DiscountAuthorization : habilita
    InventoryItem ||--o{ InventoryTransaction : "movimientos"
    Order ||--o{ InventoryTransaction : "reason=sale"
    User ||--o{ Order : "createdBy"
    User ||--o{ Shift : "cashierId"

    Order {
        enum type "MESA|LLEVAR"
        bool isCustom "custom = marca, no tipo"
        enum status "created..closed|pendingPayment|cancelled"
        decimal originalAmount
        decimal discountAmount "snapshot fijo"
        decimal total "derivado"
    }
    Discount {
        decimal fixedAmount "monto fijo, no %"
        enum availability "always|endOfShift"
        bool requiresAuthorization
    }
    ShiftChickenLog {
        enum pieceType "pecho|ala|pierna|entrepierna"
        int reprocessRaw "autopoblado del turno previo"
        int processedRaw
        int rawLeftover "→ reprocessRaw del turno T+1"
        int cookedLeftover
    }
```

> **Dos sutilezas de negocio que el modelo refleja** (y que hay que entender, no solo copiar):
> - `Order.isCustom` es un **flag**, no un valor de `type`. Una venta custom sigue siendo `MESA` o `LLEVAR` ([§2.10](pdr.md#L380)).
> - `discountAmount` es un **snapshot** del monto fijo, NO una resta. El `total` es lo derivado ([§2.11](pdr.md#L401)).

---

## 7. Máquina de estados de pedidos

El flujo de vida de una orden. Negocio en [PDR §4](pdr.md#L444), efectos transaccionales en [technical guide §4](technical_guide.md#L163).

```mermaid
stateDiagram-v2
    [*] --> created: cajera registra

    created --> confirmed: pago inmediato 💰
    created --> pendingPayment: LLEVAR/delivery sin pago

    note right of confirmed
        Decremento ATÓMICO de inventario
        + contabiliza ingreso
    end note

    pendingPayment --> confirmed: paga 💰 (recién aquí descuenta inventario)
    pendingPayment --> cancelled: cancelación MANUAL (sin motivo, sin timeout)

    confirmed --> preparing: comanda en panel despacho
    pendingPayment --> preparing: se prepara de inmediato

    preparing --> ready: despachadora marca listo 🔔 (pantalla pública)
    ready --> delivered: cliente recoge / delivery retira
    delivered --> closed: cierre administrativo

    confirmed --> cancelled: anulación (motivo+detalle OBLIGATORIO, revierte inventario)

    cancelled --> [*]
    closed --> [*]
```

> **Reglas clave que el diagrama codifica:**
> - El inventario se descuenta **al confirmar el pago**, nunca antes ([§2.3](pdr.md#L324)).
> - `pendingPayment` se prepara **igual** que un pedido pagado, pero sin tocar inventario ni caja ([§2.5](pdr.md#L344)).
> - Cancelar pendiente: **manual, sin motivo**. Anular pagado: **motivo + detalle obligatorios** + revierte inventario ([FR-011b](requirements.md#L74)).

---

## 8. Resumen de navegación

```mermaid
flowchart LR
    Q1["Quiero entender<br/>POR QUÉ"] --> PDR["📘 PDR §2"]
    Q2["Quiero saber<br/>QUÉ debe hacer"] --> REQ["📗 requirements FR"]
    Q3["Quiero CONSTRUIR<br/>(modelo/API)"] --> TECH["📙 tech §3/§5"]
    Q4["Quiero PROBAR"] --> E2E["📙 tech §8"]
    Q5["No sé dónde<br/>está algo"] --> IDX["📑 indice_pdr"]
    Q6["¿Dónde vive<br/>en el repo?"] --> ARCH["📕 architecture-overview"]

    classDef q fill:#ede7f6,stroke:#5e35b1,color:#311b92
    classDef d fill:#e8eaf6,stroke:#3949ab,color:#1a237e
    class Q1,Q2,Q3,Q4,Q5,Q6 q
    class PDR,REQ,TECH,E2E,IDX,ARCH d
```

| Si buscás... | Andá a |
| --- | --- |
| El porqué de una regla | [`pdr.md` §2](pdr.md#L296) |
| Qué hace una feature + cómo se prueba | [`requirements.md` §1](requirements.md#L15) |
| Entidades y campos | [`technical_guide.md` §3](technical_guide.md#L41) |
| Endpoints y payloads | [`technical_guide.md` §5 / §6](technical_guide.md#L213) |
| Casos E2E | [`technical_guide.md` §8](technical_guide.md#L594) |
| Qué entra en V1 vs V2 | [`pdr.md` §13](pdr.md#L555) |
| Dónde vive algo en el repo (módulos, lifecycle) | [`architecture_overview.md`](architecture_overview.md) |
| Cualquier sección por anchor | [`indice_pdr.md`](indice_pdr.md) |

---

> **Recordá la regla de oro:** ante cualquier contradicción, **gana el PDR**. Los diagramas de arriba son un mapa, no la fuente de verdad.
