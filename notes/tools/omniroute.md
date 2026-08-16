# OmniRoute: Guía Completa de Uso y Documentación

Esta guía detalla el funcionamiento, instalación y configuración de **OmniRoute** para integrarlo con el chat de IA nativo de **Visual Studio Code**, permitiendo optimizar el uso de modelos gratuitos y de pago.

---

## 1. ¿Qué es OmniRoute y para qué sirve?

**OmniRoute** es una **pasarela de IA local, de código abierto y orientada a la privacidad** que actúa como un enrutador inteligente entre tus aplicaciones y más de **330 proveedores de modelos de lenguaje**.

Su propósito principal es servir como un **punto de control único** que centraliza la gestión de claves y optimiza el flujo de trabajo mediante las siguientes características:
*   **Enrutamiento Inteligente e "Inquebrantable":** Si un proveedor falla, agota su cuota o tiene una latencia alta, OmniRoute salta automáticamente al siguiente mejor modelo disponible de forma transparente.
*   **Compresión de Tokens:** Utiliza los motores **RTK y Caveman** para reducir el peso de tus mensajes entre un **15% y 95%**, extendiendo la duración de tus créditos gratuitos y acelerando las respuestas.
*   **Agregación de Tiers Gratuitos:** Consolida aproximadamente **1.51 mil millones de tokens gratuitos al mes** provenientes de múltiples proveedores.
*   **Privacidad Local:** Tus claves se cifran localmente con **AES-256-GCM** y no se envían a servidores externos.

---

## 2. Instalación en Windows

Para instalar OmniRoute en Windows, debes tener **Node.js** instalado (versión **22.22.2+ o 24.x**). Abre una terminal (PowerShell o CMD) y elige uno de estos métodos:

### Opción A: Instalación con pnpm (Recomendado)
```bash
pnpm add -g omniroute@latest --allow-build=better-sqlite3 --allow-build=@swc/core
```
Este comando instala OmniRoute globalmente y fuerza la construcción de los binarios nativos para un rendimiento óptimo.

### Opción B: Instalación con npm
```bash
npm install -g omniroute
```
Una vez instalado, inicia el motor ejecutando:
```bash
omniroute
```
El servidor se iniciará por defecto en `http://localhost:20128` y abrirá automáticamente el panel de control en tu navegador.

---

## 3. Generar la API Key de OmniRoute

Antes de ir a VS Code, necesitas crear una clave dentro de OmniRoute para que el editor pueda autenticarse con tu servidor local:

1.  Accede al dashboard en `http://localhost:20128` e inicia sesión (contraseña por defecto: `CHANGEME`).
2.  Dirígete a la sección **Dashboard › API Manager** (o API Keys).
3.  Haz clic en **Create API Key**.
4.  Asigna un nombre (ej. "VSCode-Chat") y selecciona los permisos necesarios.
5.  **Copia y guarda la clave generada** (formato `sk-xxxx...`), ya que no volverá a mostrarse.

---

## 4. Integración con VS Code Copilot Chat

Para usar OmniRoute con el chat integrado de VS Code, se utiliza la funcionalidad **Bring Your Own Key (BYOK)** y el proveedor de **Custom Endpoint**.

### Pasos en VS Code:
1.  Abre la **Paleta de Comandos** (`Ctrl+Shift+P`).
2.  Busca y selecciona **Chat: Manage Language Models**.
3.  Haz clic en **Add Models** y selecciona **Custom Endpoint**.
4.  Introduce el nombre de grupo "OmniRoute".
5.  Pega la **API Key de OmniRoute** que generaste en el dashboard de OmniRoute.
6.  Selecciona el tipo de API: **Chat Completions**.

---

## 5. Configuración de `chatLanguageModels.json`

Tras el asistente, VS Code abrirá el archivo `chatLanguageModels.json`. Configúralo de una de estas dos maneras para activar el **procesamiento automático**:

### Método 1: Configuración Estándar (Más Segura)
Utiliza el sistema de secretos nativo de VS Code.

```json
{
    "name": "OmniRoute AI",
    "vendor": "customendpoint",
    "apiKey": "${input:chat.lm.secret.XXXXXX}",
    "apiType": "chat-completions",
    "models": [
        {
            "id": "auto",
            "name": "OmniRoute Auto (Enrutamiento Inteligente)",
            "url": "http://localhost:20128/v1/chat/completions",
            "toolCalling": true,
            "vision": true,
            "maxInputTokens": 128000,
            "maxOutputTokens": 16000
        }
    ]
}
```
*   **Explicación:** Esta es la opción preferida porque la clave real se guarda cifrada en el llavero del sistema operativo y no queda expuesta en texto plano dentro del archivo. Al usar el **ID `"auto"`**, OmniRoute elige dinámicamente el mejor modelo entre tus proveedores conectados.

### Método 2: Ruta Tokenizada (Fallback de Compatibilidad)
Usa este método si el anterior te da errores de conexión (ej. `401 Unauthorized`).

```json
{
    "name": "OmniRoute Fallback",
    "vendor": "customendpoint",
    "apiType": "chat-completions",
    "models": [
        {
            "id": "auto",
            "name": "OmniRoute Directo",
            "url": "http://localhost:20128/api/v1/vscode/TU_API_KEY_AQUI/chat/completions",
            "modelsUrl": "http://localhost:20128/api/v1/vscode/TU_API_KEY_AQUI/models",
            "toolCalling": true,
            "vision": true,
            "maxInputTokens": 128000,
            "maxOutputTokens": 16000,
            "auth": { "type": "none" }
        }
    ]
}
```
*   **Explicación:** Este método incrusta la API key directamente en la URL de la ruta. Se configura con `"auth": {"type": "none"}` porque la identificación se realiza a través de la propia URL, lo que ayuda a saltar bloqueos de cabeceras HTTP que algunos entornos de red imponen.

---

## 6. Cómo agregar API Keys de proveedores en OmniRoute

Para centralizar tus créditos gratuitos (como los de Gemini, Mistral o NVIDIA), utiliza el **Asistente de incorporación de proveedores** en el dashboard:

1.  En el Dashboard, ve a la pestaña **Providers** y haz clic en **Add Provider**.
2.  Selecciona la opción **"Proveedor de claves API"**.
3.  Busca el servicio (ej. **"NVIDIA NIM"** o **"Groq"**) y selecciona su tarjeta.
4.  **Configura las Credenciales:**
    *   **Nombre de conexión:** Un alias para identificar la cuenta.
    *   **Clave API:** Pega la clave `sk-...` obtenida del sitio oficial del proveedor.
5.  Haz clic en **"Validar, guardar y probar"**.

**Resultado:** OmniRoute verificará la clave e incluirá sus modelos automáticamente en el enrutamiento inteligente cuando utilices el ID `"auto"` en VS Code.