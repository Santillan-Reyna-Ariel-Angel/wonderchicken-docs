# Sincronizar Swagger con Postman

Cuando cambia la API (un DTO, un controller, un ejemplo), Postman se actualiza solo con la colección nueva, **con los scripts incluidos**. Esto es lo que hay que hacer.

## 1. Configuración (una sola vez)

1. **Instalar dependencias:** `pnpm install`.
2. **Crear una API key** en Postman: *Account settings → API keys → Generate API Key*.
3. **Tener una colección en Postman** que el script pueda reemplazar (puede estar vacía) y obtener su **uid**, con el formato `<userId>-<collectionId>`. Para listarlas:
   ```bash
   curl -H "x-api-key: TU_API_KEY" https://api.getpostman.com/collections
   ```
   Copiar el campo `uid` de la colección elegida.
4. **Agregar al `.env`** (está ignorado por git):
   ```env
   POSTMAN_API_KEY=PMAK-xxxxxxxx
   POSTMAN_COLLECTION_UID=12345678-aaaa-bbbb-cccc-1234567890ab
   ```
   Opcionales: `POSTMAN_BASE_URL` (default `http://localhost:4000`) y `POSTMAN_API_URL` (cuentas de la UE: `https://api.eu.postman.com`).

## 2. Uso diario

**`pnpm start:dev`** levanta la API **y** un vigilante de `swagger.json` (los logs del vigilante salen con el prefijo `[postman]`).

```
Cambiás un DTO/controller → Nest reinicia → reescribe swagger.json
  → el vigilante convierte el Swagger a colección, le agrega los scripts
  → reemplaza la colección en Postman
```

- Solo sube cuando `swagger.json` **cambió de verdad**. Si reiniciás el servidor sin cambios en la API, no toca Postman (así no se pierden tus variables).
- Si falla la subida (sin red, key inválida), **solo se muestra el error**: la API sigue corriendo.

### Comandos manuales

| Comando | Qué hace |
|---|---|
| `pnpm postman:sync` | Genera y sube la colección una vez |
| `pnpm postman:sync --no-push` | Solo genera `postman/wonder-chicken.postman_collection.json` (se puede importar a mano en Postman) |
| `pnpm postman:watch` | Vigilante solo, sin levantar la API (útil con `pnpm dev`) |

Sin `POSTMAN_API_KEY` / `POSTMAN_COLLECTION_UID` no se sube nada: solo se genera el archivo.

## 3. Qué trae la colección

- **Carpeta `00 · Login por rol`:** un login por rol del seed (`superadmin@`, `admin1@`, `cajera1@`, `despachadora1@`, `cocinero1@gmail.com`), contraseña `password123`. Requiere haber corrido `pnpm seed`.
- **Token automático:** al correr cualquier login, el token queda guardado en `bearerToken` (el que usan todos los requests) y en la variable de su rol (`adminToken`, `cashierToken`…).
- **Ejemplos con datos del seed:** los `:id` y los bodies ya traen ids que existen en la base sembrada.

## 4. Cosas a tener en cuenta

- **La subida reemplaza la colección entera.** No edites la colección a mano: se pierde en la próxima sincronización. Los scripts viven en `scripts/postman-sync.ts`.
- **Después de cada sincronización las variables se reinician:** hay que volver a correr un login.
- **`pnpm start:dev` ejecuta `sync-docs`** (un `git subtree pull` de `docs/`), que suele fallar si hay cambios sin commitear en `docs/`. Si pasa, usá `pnpm dev` y, en otra terminal, `pnpm postman:watch`.
- **La subida real a Postman todavía no se probó con una cuenta real.** Si falla, el error de Postman se imprime en la consola.
- Detalle técnico y motivos (por qué un `swagger.json` no puede llevar scripts de Postman): [plan-integracion-front-datos-reales.md](plan-integracion-front-datos-reales.md), sección 3.
