# Índice de Documentación — Wonder Chicken

> Punto de entrada a la documentación del proyecto.
> **Cada documento tiene ahora su propio índice interno** (sección `## Índice` al inicio):
> entrá al que necesites y navegá desde ahí.
>
> **Precedencia:** si un criterio de `requirements.md` o una decisión de `technical_guide.md`
> entra en conflicto con una regla de negocio del PDR, **gana la regla del PDR**.

---

## Índice

- [Documentos](#documentos)
- [Orden de lectura sugerido](#orden-de-lectura-sugerido)
- [Por dónde empezar](#por-dónde-empezar)
- [Documentos de trabajo (no normativos)](#documentos-de-trabajo-no-normativos)
- [Mapa de relaciones entre documentos](#mapa-de-relaciones-entre-documentos)
  - [1. Los documentos y su rol](#1-los-documentos-y-su-rol)
  - [2. La regla de oro: PRECEDENCIA](#2-la-regla-de-oro-precedencia)
  - [3. Cómo "viaja" una decisión: del negocio al código](#3-cómo-viaja-una-decisión-del-negocio-al-código)
  - [4. Ruta de lectura según tu rol](#4-ruta-de-lectura-según-tu-rol)
  - [5. Mapa interno del PDR (la fuente de verdad)](#5-mapa-interno-del-pdr-la-fuente-de-verdad)
  - [6. Resumen de navegación](#6-resumen-de-navegación)

---

## Documentos

| Documento | Propósito |
| --------- | --------- |
| [business_context.md](business_context.md) | **Material de origen.** Citas textuales del documento oficial de titulación, menú 2026, inventario diario de ejemplo y tickets reales del sistema actual. Evidencia cruda que **alimenta** al PDR. *No normativo.* |
| [pdr.md](pdr.md) | Reglas de negocio definitivas, modelo de datos, alcance V1/V2, UX/UI, roadmap. **Fuente de verdad.** |
| [requirements.md](requirements.md) | Requerimientos funcionales (FR-001…FR-018) y no funcionales (NFR de negocio) con criterios de aceptación. |
| [technical_guide.md](technical_guide.md) | Traducción técnica: modelo de datos, contrato de la API, payloads, NFR técnicos, casos E2E, despliegue. |
| [architecture_overview.md](architecture_overview.md) | Mapa visual del backend NestJS: módulos, lifecycle de un request, endpoints por dominio. |

---

## Orden de lectura sugerido

Si venís nuevo al proyecto y querés leer **todo de corrido**, seguí este orden. Va de lo
abstracto a lo concreto: cada documento **depende del anterior** (no entendés los FR sin las
reglas, ni los endpoints sin el modelo de datos, ni el código sin la guía técnica).

| # | Documento | Por qué va acá |
| - | --------- | -------------- |
| 1 | [Mapa de relaciones (abajo)](#mapa-de-relaciones-entre-documentos) | **Orientación primero.** Cómo se relacionan los documentos y la regla de precedencia. Te evita perderte. |
| 2 | [business_context.md](business_context.md) | **El origen (la EVIDENCIA).** Material de origen del trabajo de titulación: citas, menú, inventario, tickets reales. Alimenta al PDR. *No normativo.* |
| 3 | [pdr.md](pdr.md) | **El negocio (el QUÉ y el PORQUÉ).** Fuente de verdad: reglas, estados, alcance V1/V2. Todo lo demás se deriva de acá. |
| 4 | [requirements.md](requirements.md) | **El QUÉ verificable.** Los FR/NFR que nacen de las reglas del PDR, con criterios de aceptación. |
| 5 | [technical_guide.md](technical_guide.md) | **El CÓMO.** Traducción técnica: modelo de datos, API, payloads, E2E. Necesita el PDR y los FR ya entendidos. |
| 6 | [architecture_overview.md](architecture_overview.md) | **El código.** Mapa visual del backend NestJS: módulos, lifecycle de un request, endpoints reales. Aterriza la guía técnica en el repo. |

> ¿No tenés tiempo de leer todo? No leas de corrido: usá la **[Ruta de lectura según tu rol](#4-ruta-de-lectura-según-tu-rol)** del mapa (abajo) y empezá por donde tu trabajo lo necesita.

---

## Por dónde empezar

- **¿De dónde sale el negocio (evidencia, menú, tickets reales)?** → [business_context.md](business_context.md)
- **¿Qué hace el negocio y por qué?** → [pdr.md](pdr.md)
- **¿Qué tiene que cumplir el sistema (FR/NFR)?** → [requirements.md](requirements.md)
- **¿Cómo lo implemento (modelo, API, payloads)?** → [technical_guide.md](technical_guide.md)
- **¿Cómo está armado el backend?** → [architecture_overview.md](architecture_overview.md)
- **¿Cómo se relacionan estos documentos?** → [Mapa de relaciones entre documentos](#mapa-de-relaciones-entre-documentos)

---

## Documentos de trabajo (no normativos)

> ⚠️ Estos archivos **no son fuente de verdad** y **no entran en el orden de lectura** de arriba.
> Son insumos de trabajo que **alimentan** al PDR. No los uses para implementar — usalos para
> *cerrar definiciones* antes de que lleguen al PDR.

| Archivo | Qué es | Cómo usarlo |
| ------- | ------ | ----------- |
| [pdr_questions_pending.txt](pdr_questions_pending.txt) | **Backlog de preguntas abiertas del negocio**: decisiones aún `[SIN RESPUESTA]`, `[AMBIGUA]` o `[FALTANTE EN DOC]`, priorizadas (críticas / importantes / a verificar). | A medida que el negocio responde, **trasladá la decisión al [pdr.md](pdr.md)** (la fuente de verdad) y remové/marcá la pregunta acá. El PDR manda; este archivo solo lista lo que falta definir. |

> **Críticas hoy** (bloquean modelo de datos): máquina de estados del pedido (3.1), estructura
> del arqueo (5.1), umbral y proceso ante discrepancias (5.2–5.4), modelo de registro de vales (4.1).

---

## Mapa de relaciones entre documentos

> Diagramas para **entender los documentos** del proyecto y **cómo se relacionan**.
> Las vistas técnicas (modelo de datos ER y máquina de estados transaccional) viven en
> [`technical_guide.md` §3.3](technical_guide.md#33-diagrama-de-relaciones-er) y
> [`technical_guide.md` §4](technical_guide.md#4-máquina-de-estados-de-pedidos-transaccional).

### 1. Los documentos y su rol

Cada archivo tiene **una responsabilidad** y **no se pisan** entre sí. El PDR define el QUÉ y el PORQUÉ del negocio; los otros lo aterrizan, hasta llegar al código.

```mermaid
flowchart TB
    subgraph entrada["🚪 Entrada"]
        IDX["📑 indice_pdr.md<br/><i>Índice navegable</i><br/>Mapa con anchors a cada sección"]
    end

    subgraph origen["📄 Origen (la EVIDENCIA)"]
        BC["📄 business_context.md<br/><i>Material de origen</i><br/>Citas oficiales · menú · inventario · tickets reales"]
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

    IDX -.navega a.-> BC
    IDX -.navega a.-> PDR
    IDX -.navega a.-> REQ
    IDX -.navega a.-> TECH
    IDX -.navega a.-> ARCH

    BC ==alimenta==> PDR
    PDR ==origina==> REQ
    PDR ==se traduce en==> TECH
    REQ -.se valida contra.-> TECH
    TECH ==se implementa en==> ARCH

    classDef idx fill:#e1f5fe,stroke:#0288d1,color:#01579b
    classDef bc fill:#f5f5f5,stroke:#9e9e9e,color:#424242
    classDef pdr fill:#fff3e0,stroke:#f57c00,color:#e65100
    classDef req fill:#e8f5e9,stroke:#388e3c,color:#1b5e20
    classDef tech fill:#fce4ec,stroke:#c2185b,color:#880e4f
    classDef arch fill:#ede7f6,stroke:#5e35b1,color:#311b92
    class IDX idx
    class BC bc
    class PDR pdr
    class REQ req
    class TECH tech
    class ARCH arch
```

| Documento | Responde a | Contiene | NO contiene |
| --- | --- | --- | --- |
| [`indice_pdr.md`](indice_pdr.md) | *"¿Dónde está X?"* | Anchors a cada sección de los otros 4 | Contenido propio |
| [`business_context.md`](business_context.md) | *"¿De dónde sacamos esto?"* | Citas del documento oficial, menú, inventario diario, tickets reales | Reglas normativas (las deriva el PDR) |
| [`pdr.md`](pdr.md) | *"¿Por qué el negocio funciona así?"* | Reglas (§2), estados (§4), alcance V1/V2 (§13), UX (§7) | Modelo de datos, endpoints, FR detallados (los **trasladó**) |
| [`requirements.md`](requirements.md) | *"¿Qué debe hacer y cómo lo pruebo?"* | FR-001..FR-017 + criterios de aceptación, NFR de negocio | Reglas (referencia al PDR), detalle técnico |
| [`technical_guide.md`](technical_guide.md) | *"¿Cómo lo construyo?"* | Stack, modelo Prisma, endpoints, payloads, E2E, despliegue | Reglas de negocio (referencia al PDR) |
| [`architecture_overview.md`](architecture_overview.md) | *"¿Dónde vive esto en el repo?"* | Módulos NestJS, lifecycle de un request, endpoints reales, vista del Prisma | Reglas, FR, contrato detallado (referencia al PDR y a la guía técnica) |

### 2. La regla de oro: PRECEDENCIA

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
> [`requirements.md` L11](requirements.md#L11) · [`technical_guide.md` L10](technical_guide.md#L10) · [`architecture_overview.md` L12](architecture_overview.md#L12)

### 3. Cómo "viaja" una decisión: del negocio al código

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
| Clientes y vista del cliente | [§2.12](pdr.md#212-clientes-y-facturación-nominada) | [FR-015](requirements.md#fr-015--vista-pública-del-cliente-alta) / [FR-019](requirements.md#fr-019--registro-y-búsqueda-de-clientes-alta) | `Customer`, `Order.customerId`, `Order.publicToken`, `GET /public/orders/{token}`, `GET/POST /customers` |
| Notificación listo | [§2.8](pdr.md#L368) | [FR-007](requirements.md#L49) | `Order.readyAt`, pantalla pública |
| Auth y roles | [§2.7](pdr.md#L357) | [FR-008](requirements.md#L53) / [FR-018](requirements.md#L112) | `AuthGuard` (JWT) + `RolesGuard` + `@Roles` ([tech §5.2](technical_guide.md#52-autenticación-y-autorización)) |
| Auditoría | [§2.9](pdr.md#29-auditoría) | — | `AuditLog`, audit explícito en la transacción ([tech §4.3](technical_guide.md#43-auditoría--implementación-v1)) |

> La tabla completa de mapeo Negocio → Técnica está en [`technical_guide.md` §10](technical_guide.md#10-mapeo-negocio--técnica).

### 4. Ruta de lectura según tu rol

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

### 5. Mapa interno del PDR (la fuente de verdad)

El PDR es el documento más grande. Esto es lo que vive adentro y qué **trasladó** a otros archivos (para no duplicar).

```mermaid
flowchart LR
    BC["📄 business_context.md<br/>Material de origen<br/>menú, inventario diario, tickets reales"]
    PDR["📘 pdr.md"]

    BC ==alimenta==> PDR
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
    classDef bc fill:#eeeeee,stroke:#9e9e9e,color:#424242,stroke-width:2px
    class PDR pdr
    class S1,S2,S4,S7,S13 sec
    class T1,T2 moved
    class BC bc
```

> ⭐ = secciones núcleo. Las cajas grises (`trasladó a...`) son secciones que el PDR vació a propósito y apuntan a otro documento — **no busques el detalle ahí, seguí el link.**

### 6. Resumen de navegación

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
| Entidades y campos | [`technical_guide.md` §3](technical_guide.md#3-modelo-de-datos-esquema-lógico-para-la-bd) |
| Endpoints y payloads | [`technical_guide.md` §5 / §6](technical_guide.md#5-contratos-de-la-api) |
| Casos E2E | [`technical_guide.md` §8](technical_guide.md#8-test-cases-e2e-casos-prioritarios) |
| Qué entra en V1 vs V2 | [`pdr.md` §13](pdr.md#L555) |
| Dónde vive algo en el repo (módulos, lifecycle) | [`architecture_overview.md`](architecture_overview.md) |

---

> **Recordá la regla de oro:** ante cualquier contradicción, **gana el PDR**. Los diagramas de arriba son un mapa, no la fuente de verdad.
