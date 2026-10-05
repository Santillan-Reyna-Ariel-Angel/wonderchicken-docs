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
| `pnpm postman:sync --no-push` | Solo genera `docs/swagger-postman/wonder-chicken.postman_collection.json` (se puede importar a mano en Postman) |
| `pnpm postman:watch` | Vigilante solo, sin levantar la API (útil con `pnpm dev`) |

Sin `POSTMAN_API_KEY` / `POSTMAN_COLLECTION_UID` no se sube nada: solo se genera el archivo.

## 3. Qué trae la colección

- **Carpeta `00 · Login por rol`:** un login por rol del seed (`superadmin@`, `admin1@`, `cajera1@`, `despachadora1@`, `cocinero1@gmail.com`), contraseña `password123`. Requiere haber corrido `pnpm seed`.
- **Token automático:** al correr cualquier login, el token queda guardado en `bearerToken` (el que usan todos los requests) y en la variable de su rol (`adminToken`, `cashierToken`…).
- **Ejemplos con datos del seed:** los `:id` y los bodies ya traen ids que existen en la base sembrada.

## 4. Cosas a tener en cuenta

- **La subida reemplaza la colección entera.** No edites la colección a mano: se pierde en la próxima sincronización. Los scripts viven en `scripts/postman-sync.ts`.
- **Después de cada sincronización las variables se reinician:** hay que volver a correr un login.
- **Dónde viven los archivos:** en `docs/swagger-postman/`: `swagger.json` (lo escribe la API en cada arranque) y `wonder-chicken.postman_collection.json` (lo genera el script a partir de él). Ambos están **versionados** y se comparten con el front por el subtree de `docs/`. La colección se escribe **sin ids y con valores fijos** para que sea estable: en git solo cambian cuando cambia la API, y en ese caso hay que commitearlos (y subir el subtree). El estado local de la última subida a Postman vive en `node_modules/.cache/` (no se versiona).
- **Ejemplos fijos:** si agregás un parámetro con `enum` o un campo de fecha, dale un `example` (y `format: 'date'` si es solo fecha). Sin eso el conversor de Postman elige un valor al azar en cada generación y el archivo versionado cambia sin que cambie la API.
- **`pnpm start:dev` ya no sincroniza `docs/`**: solo **avisa** si hay novedades (ver la sección 5).
- **`pnpm seed` tiene una guarda:** se niega a correr con `NODE_ENV=production` o si `DATABASE_URL` no apunta a `localhost`, porque **borra** la base. `pnpm seed -- --force` la omite.
- **La subida real a Postman todavía no se probó con una cuenta real.** Si falla, el error de Postman se imprime en la consola.
- Detalle técnico y motivos (por qué un `swagger.json` no puede llevar scripts de Postman): [plan-integracion-front-datos-reales.md](plan-integracion-front-datos-reales.md), sección 3.

## 5. Documentación compartida (`docs/`): aviso al arrancar

`docs/` es un subtree del repo `wonderchicken-docs`, compartido con el front. `pnpm start:dev` **no lo sincroniza** (frenaba el arranque y llenaba el historial de merges): en su lugar **avisa** si el repo de docs tiene cambios que todavía no están en tu `docs/`.

| Comando | Qué hace |
|---|---|
| `pnpm docs:check` | Solo lectura. Corre solo en cada `start:dev`. Muestra un recuadro amarillo con los archivos y commits nuevos |
| `pnpm docs:pull` | Trae los cambios (`git subtree pull --squash`). Se niega, con un mensaje claro, si hay archivos sin commitear: git exige **todo** el árbol limpio (no solo `docs/`) |
| `pnpm docs:push` | Sube tus commits de `docs/`. Se niega si hay cambios sin commitear en `docs/` (solo se sube lo commiteado) |

Todos los scripts de docs llevan el prefijo `docs:`.

- **Cómo detecta las novedades:** consulta el remoto (1–2 s) y compara **contenido**, no ids de commit, así que tus propios `docs:push` no aparecen como novedades. No toca tu árbol de trabajo.
- **¿Bloquea el arranque?** Por defecto **no** (`warn`). Se cambia con la constante `DEFAULT_CHECK_MODE` al inicio de `scripts/docs-subtree.js` (`'warn'` | `'block'`) o, por ejecución y sin tocar código: `DOCS_CHECK_MODE=block pnpm start:dev`. En `block`, el arranque se detiene hasta que traigas los docs.
- **Sin red o sin acceso al repo:** nunca bloquea, en ningún modo; solo lo informa en gris.
- **A futuro:** un modo `ask` (preguntar si se quiere sincronizar) se agregaría en la función `check` del mismo script.
- **Mismo archivo en el front:** `scripts/docs-subtree.js` es **idéntico** en los dos repos y no tiene dependencias (el front declara `"type": "module"` en su `package.json` para que el `.js` sea ESM sin advertencias de Node). Si se cambia uno, hay que copiarlo al otro.
- **Verificado:** el aviso contra el repo real (al día en el back; atrasado en el front), con novedades simuladas en un repo de prueba (`warn` sale con 0, `block` con 1), sin red en modo `block` (no bloquea) y las negativas de `pull`/`push` con cambios sin commitear. **No probado:** el camino exitoso de `docs:pull` y `docs:push` (requieren árbol limpio / publican de verdad).
