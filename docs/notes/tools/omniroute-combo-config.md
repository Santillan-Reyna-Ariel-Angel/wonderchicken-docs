
---

### 🚀 Guía Maestra: Configuración y Optimización del Combo en OmniRoute

Para garantizar que tu **API Key de pago** de OpenRouter y el modelo **DeepSeek** funcionen con la máxima velocidad y calidad, sigue este desglose detallado de cada etapa.

#### Paso 1: Basics (Lo Fundamental)
*   **Nombre:** `combo-pay-free`.
*   **Plantilla:** **Ignora las plantillas rápidas**. Si aplicas una plantilla como "Free Stack", OmniRoute sobrescribirá tu lista manual con modelos gratuitos predefinidos, lo cual anularía tu objetivo de usar DeepSeek de pago como prioridad.

#### Paso 2: Steps (Jerarquía de Modelos)
En esta fase decides quién trabaja y en qué orden.
1.  **Modelo Principal:** Selecciona **DeepSeek V4 Flash 0731** (o la versión que prefieras) y asegúrate de elegir la **Cuenta** donde cargaste tus créditos.
2.  **Activar:** Haz clic en **"Add step"**. Esto mueve el modelo a la lista activa.
3.  **Respaldos (Fallbacks):** Añade modelos gratuitos (ej. de Kiro AI o OpenCode) debajo del de pago. OmniRoute solo los llamará si tu saldo se agota o si OpenRouter tiene una caída técnica, asegurando que **nunca dejes de programar**.

#### Paso 3: Strategy (Cerebro del Ruteo)
*   **Estrategia de Enrutamiento:** Selecciona **`priority` (Prioridad)**. A diferencia del modo "Aleatorio" o "Round-Robin", esta estrategia consume totalmente el primer modelo de la lista antes de intentar con el segundo. Es la configuración ideal cuando tienes un modelo claramente superior (de pago) y otros de emergencia (gratis).

#### Paso 4: Configuración Avanzada (Blindaje y Ahorro)
Aquí es donde optimizas el comportamiento técnico y el rendimiento económico:

*   **Reintentos máximos (Recomendado: 1 o 2):** Define cuántas veces OmniRoute intentará la petición con el modelo de pago si hay un error de red (como un timeout o un error 5xx del servidor) antes de saltar al modelo gratuito. Un valor de **1** es suficiente para absorber micro-caídas sin generar latencia excesiva.
*   **Response Validation (Forbidden substrings):** Al mantener cadenas como `"I cannot help"` o `"as an AI"`, OmniRoute detecta si el modelo de pago ha bloqueado una respuesta por filtros de seguridad. Si esto ocurre, la respuesta se descarta y el sistema **salta automáticamente al siguiente modelo** para intentar darte una solución útil.
*   **Proteger el caché de las mutaciones:** **Habilita esta opción**. Los proveedores modernos como OpenRouter ofrecen descuentos por **Prompt Caching**. Al habilitar esto, OmniRoute intenta mantener fijo el prefijo de tu conversación, permitiendo que el proveedor "recuerde" las instrucciones del sistema y el código previo, lo que puede reducir el costo de tokens de entrada hasta en un **90%** en sesiones largas.
*   **Longitud del Contexto (Escribir: 128000):** Debes ingresar este valor manualmente. Esto informa a VS Code la capacidad real del modelo DeepSeek. Si se deja vacío, el editor podría asumir un límite menor (como 4k o 32k), lo que causaría que el asistente "olvide" partes importantes de tu proyecto prematuramente.

#### Paso 5: Anular mensaje del sistema (Personalidad Senior)
Pega el siguiente prompt optimizado. Al ser un mensaje extenso y estructurado, forzará al modelo a razonar como un arquitecto y, gracias a la **Protección de Caché** configurada arriba, no pagarás por procesar este texto en cada mensaje después del primero:

> *"Eres un ingeniero senior con muchos años de experiencia, especializado en desarrollo backend y frontend con NestJS, Next.js (App Router) y React, además de contar con sólidos conocimientos de UI/UX. Responde siempre en español, de forma clara, directa y concisa, eliminando preámbulos innecesarios. Todo el código generado (variables, funciones, clases, interfaces, tipos y comentarios técnicos) debe estar estrictamente en inglés, excepto las cadenas de texto destinadas al usuario final. Prioriza siempre código moderno, limpio, correctamente tipado con TypeScript, mantenible y fácil de entender. Aplica los principios YAGNI y SOLID. Si una solución puede resolverse de forma sencilla, no la compliques innecesariamente. Cuando existan varias alternativas, prioriza la que ofrezca el mejor equilibrio entre simplicidad, mantenibilidad y buenas prácticas, explicando únicamente lo necesario. Si no conoces con certeza la sintaxis exacta, el comportamiento de una API o una implementación específica, consulta primero la documentación oficial mediante herramientas de búsqueda antes de responder."*

#### Paso 6: Activación Final
Una vez guardado el combo, asegúrate de que VS Code lo reconozca:
1.  **Vincular Terminal:** Ejecuta `omniroute connect localhost:20128` (Contraseña por defecto: `CHANGEME`).
2.  **Activar Combo:** Ejecuta `omniroute combo switch combo-pay-free`.
3.  **Reiniciar VS Code:** Usa la paleta de comandos (`Ctrl+Shift+P`) y selecciona **Developer: Reload Window**.

---

### Optimización de Ahorro de Tokens (RTK + Caveman)

Para que tus créditos de pago/gratuitos rindan hasta un **95% más**, debes configurar los motores de compresión en la pestaña Compression Settings **(Context > Settings)** del dashboard:

1.  **Pipeline Efectivo (Stacked):** Asegúrate de que esté activo el modo **"Stacked (rtk → caveman)"**.
    *   **RTK:** Filtra automáticamente el "ruido" de la terminal, logs de NestJS o errores de consola pesados.
    *   **Caveman:** Comprime el lenguaje natural eliminando palabras innecesarias sin perder el significado técnico.
2.  **Auto-Trigger Threshold:** Establécelo en **0**. Esto fuerza a OmniRoute a comprimir todos los mensajes desde el primer token.
3.  **Cache-aligned Live Zone:** **Habilítalo**. Esto mantiene estable el prefijo de tu conversación, permitiendo que OpenRouter use **Prompt Caching** y te cobre mucho menos por procesar el contexto repetido.
4.  **Output Styles (Estilos de salida):** Activa **"Terse prose"** (para respuestas sin saludos innecesarios) y **"Less code"** (para que solo te entregue el cambio exacto de código bajo principios YAGNI).

---

Con esta configuración, tu flujo de trabajo usará **DeepSeek de pago con compresión de tokens (ahorro de hasta 95%)**, respaldado por modelos gratuitos y guiado por instrucciones de nivel experto.