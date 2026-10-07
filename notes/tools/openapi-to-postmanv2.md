# openapi-to-postmanv2

| Herramienta | Descripción |
| --- | --- |
| **openapi-to-postmanv2** | Convierte especificaciones OpenAPI/Swagger (`.json` o `.yaml`) en colecciones de Postman (`.postman_collection.json`). Permite generar y actualizar automáticamente colecciones de Postman a partir de la documentación de una API. |

## Qué es

Paquete npm de Postman Labs que transforma una especificación **OpenAPI 3.0, 3.1 o Swagger 2.0** en una colección de Postman. Sirve como módulo de Node y como CLI.

Limitación que importa acá: **no genera los scripts de eventos** de la colección (pre-request y tests). El proyecto los agrega después, en `scripts/postman-sync.ts`.

## Instalación

```bash
npm install openapi-to-postmanv2        # como módulo de Node
npm i -g openapi-to-postmanv2           # CLI global
```

En este proyecto ya es dependencia (`^6.3.3`, ver `package.json`); se instala con `pnpm install`.

## Uso por CLI

```bash
openapi2postmanv2 -s spec.yaml -o collection.json -p -O folderStrategy=Tags
```

| Flag | Qué hace |
| --- | --- |
| `-s, --spec` | Archivo OpenAPI de entrada |
| `-o, --output` | Archivo de la colección de salida |
| `-p, --pretty` | JSON con formato legible |
| `-O, --options` | Opciones del conversor (`clave=valor`) |
| `-c, --options-config` | Opciones desde un archivo de configuración |
| `--sync <colección>` | Actualiza una colección existente con los cambios de la spec |

## Uso desde Node

```javascript
const Converter = require('openapi-to-postmanv2');

Converter.convert(
  { type: 'string', data: openapiData }, // type: 'file' | 'string' | 'json'
  {},                                    // opciones
  (err, result) => {
    console.log(result.output[0].data);  // la colección
  },
);
```

Resultado: `{ result: true, output: [{ type: 'collection', data: {...} }] }`.

Opciones más usadas: `folderStrategy` (cómo se agrupan las carpetas), `requestParametersResolution` y `exampleParametersResolution` (de dónde salen los valores), `requestNameSource`.

Para actualizar una colección existente sin regenerarla: `Converter.syncCollection(data, options, existingCollection, syncOptions, callback)`.

## Cómo lo usa este proyecto

`scripts/postman-sync.ts` convierte `docs/swagger-postman/swagger.json` con estas opciones:

- `type: 'json'` (la spec ya está en memoria).
- `folderStrategy: 'Tags'`: una carpeta por `@ApiTags`.
- `requestParametersResolution: 'Example'` y `exampleParametersResolution: 'Example'`: usa los `example` de `@ApiProperty`.

Después le agrega los scripts y la autenticación `bearer`, y la sube a Postman. Comandos y configuración: `docs/backend/sincronizar-swagger-postman.md`.

```bash
pnpm postman:sync              # genera y sube
pnpm postman:sync --no-push    # solo genera docs/swagger-postman/wonder-chicken.postman_collection.json
pnpm postman:watch             # vigila swagger.json y sincroniza al cambiar
```

Fuentes: [github.com/postmanlabs/openapi-to-postman](https://github.com/postmanlabs/openapi-to-postman)
