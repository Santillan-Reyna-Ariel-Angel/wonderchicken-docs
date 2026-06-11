# Índice de Documentación — Wonder Chicken

> Punto de entrada a la documentación del proyecto.
> **Cada documento tiene ahora su propio índice interno** (sección `## Índice` al inicio):
> entrá al que necesites y navegá desde ahí.
>
> **Precedencia:** si un criterio de `requirements.md` o una decisión de `technical_guide.md`
> entra en conflicto con una regla de negocio del PDR, **gana la regla del PDR**.

---

## Documentos

| Documento | Propósito |
| --------- | --------- |
| [pdr.md](pdr.md) | Reglas de negocio definitivas, modelo de datos, alcance V1/V2, UX/UI, roadmap. **Fuente de verdad.** |
| [requirements.md](requirements.md) | Requerimientos funcionales (FR-001…FR-018) y no funcionales (NFR de negocio) con criterios de aceptación. |
| [technical_guide.md](technical_guide.md) | Traducción técnica: modelo de datos, contrato de la API, payloads, NFR técnicos, casos E2E, despliegue. |
| [architecture_overview.md](architecture_overview.md) | Mapa visual del backend NestJS: módulos, lifecycle de un request, endpoints por dominio. |
| [mapa_documentacion.md](mapa_documentacion.md) | Cómo se relacionan los documentos entre sí y ruta de lectura según tu rol. |

---

## Orden de lectura sugerido

Si venís nuevo al proyecto y querés leer **todo de corrido**, seguí este orden. Va de lo
abstracto a lo concreto: cada documento **depende del anterior** (no entendés los FR sin las
reglas, ni los endpoints sin el modelo de datos, ni el código sin la guía técnica).

| # | Documento | Por qué va acá |
| - | --------- | -------------- |
| 1 | [mapa_documentacion.md](mapa_documentacion.md) | **Orientación primero.** Cómo se relacionan los documentos y la regla de precedencia. Te evita perderte. |
| 2 | [pdr.md](pdr.md) | **El negocio (el QUÉ y el PORQUÉ).** Fuente de verdad: reglas, estados, alcance V1/V2. Todo lo demás se deriva de acá. |
| 3 | [requirements.md](requirements.md) | **El QUÉ verificable.** Los FR/NFR que nacen de las reglas del PDR, con criterios de aceptación. |
| 4 | [technical_guide.md](technical_guide.md) | **El CÓMO.** Traducción técnica: modelo de datos, API, payloads, E2E. Necesita el PDR y los FR ya entendidos. |
| 5 | [architecture_overview.md](architecture_overview.md) | **El código.** Mapa visual del backend NestJS: módulos, lifecycle de un request, endpoints reales. Aterriza la guía técnica en el repo. |

> ¿No tenés tiempo de leer todo? No leas de corrido: usá la **[Ruta de lectura según tu rol](mapa_documentacion.md#4-ruta-de-lectura-según-tu-rol)** del mapa y empezá por donde tu trabajo lo necesita.

---

## Por dónde empezar

- **¿Qué hace el negocio y por qué?** → [pdr.md](pdr.md)
- **¿Qué tiene que cumplir el sistema (FR/NFR)?** → [requirements.md](requirements.md)
- **¿Cómo lo implemento (modelo, API, payloads)?** → [technical_guide.md](technical_guide.md)
- **¿Cómo está armado el backend?** → [architecture_overview.md](architecture_overview.md)
- **¿Cómo se relacionan estos documentos?** → [mapa_documentacion.md](mapa_documentacion.md)

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
