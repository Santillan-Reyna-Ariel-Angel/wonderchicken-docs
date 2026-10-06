# Documentación de Sincronización de Documentación

## 🌳 Git Subtree

### ¿Qué es?

- Técnica de Git que permite **fusionar un repositorio externo dentro de otro** como carpeta.
- Los archivos se copian dentro del proyecto, pero se pueden sincronizar con comandos especiales.

### ¿Para qué sirve?

- Compartir documentación entre varios proyectos.
- Mantener un **repo central de documentación** y sincronizarlo con proyectos dependientes.

### Cómo se usa

```bash
# Agregar repo externo
git subtree add --prefix=docs https://github.com/Santillan-Reyna-Ariel-Angel/wonderchicken-docs main --squash

# Traer cambios
git subtree pull --prefix=docs https://github.com/Santillan-Reyna-Ariel-Angel/wonderchicken-docs main --squash

# Enviar cambios
git subtree push --prefix=docs https://github.com/Santillan-Reyna-Ariel-Angel/wonderchicken-docs main
```

### Ventajas

- Archivos **visibles directamente en GitHub** dentro de cada proyecto.
- Un solo repo central de documentación.
- Menos confusión que submódulos.

### Desventajas

- Commits de `docs` se mezclan parcialmente en el historial del proyecto principal.
- Sincronización manual (pull/push).
- Requiere disciplina.

---

## 📂 robocopy / rsync

### ¿Qué es?

- Herramientas de sincronización de archivos:
  - **robocopy** → Windows
  - **rsync** → Linux/Mac
- Copian físicamente los archivos de una carpeta a otra.

### ¿Para qué sirve?

- Mantener copias idénticas de `docs/` en dos proyectos distintos.
- Sincronizar cambios manualmente o mediante scripts.

### Cómo se usa

```powershell
# Backend → Frontend
robocopy ..\backend\docs ..\frontend\docs /MIR

# Frontend → Backend
robocopy ..\frontend\docs ..\backend\docs /MIR
```

```bash
# Linux/Mac
rsync -av ../backend/docs/ ../frontend/docs/
```

### Ventajas

- Archivos **visibles directamente en GitHub** en ambos proyectos.
- Cada proyecto tiene su propio historial.
- Fácil de usar.

### Desventajas

- Archivos **duplicados**.
- No hay sincronización automática (salvo que programes tareas).
- Riesgo alto de conflictos si se modifican en paralelo.

---

## 📦 Git Submodule

### ¿Qué es?

- Técnica de Git que permite **incluir un repositorio dentro de otro como referencia**.
- El repo principal guarda un puntero al commit del submódulo.

### ¿Para qué sirve?

- Compartir documentación con historial centralizado.
- Mantener `docs` como repo independiente, pero accesible desde frontend y backend.

### Cómo se usa

```bash
git submodule add https://github.com/Santillan-Reyna-Ariel-Angel/wonderchicken-docs docs
git submodule update --init --recursive
```

### Ventajas

- Historial de `docs` centralizado y limpio.
- Cambios visibles en ambos proyectos (pero registrados en el repo `docs`).
- Evita duplicación.

### Desventajas

- Archivos no aparecen directamente en GitHub dentro del repo principal (solo como enlace).
- Requiere inicializar submódulos al clonar.
- Flujo de commits menos intuitivo (hay que entrar en `docs` para committear).

---

## 📌 Comparación final

| Método             | Archivos visibles en GitHub | Historial             | Conflictos              | Complejidad | Automatización  |
| ------------------ | --------------------------- | --------------------- | ----------------------- | ----------- | --------------- |
| **Subtree**        | Sí                          | Parcial (mezclado)    | Bajo (merge controlado) | Medio       | Sí, vía scripts |
| **robocopy/rsync** | Sí                          | Duplicado (cada repo) | Alto (sobrescrituras)   | Bajo        | Manual/cron     |
| **Submodule**      | No (solo enlace)            | Centralizado (limpio) | Bajo                    | Medio       | Limitada        |

---

## 🚀 Automatización y Unificación

### 1. Scripts originales

Actualmente tienes:

- Backend (`nest`):
  ```json
  "scripts": {
    "start:dev": "nest start --watch"
  }
  ```
- Frontend (`next`):
  ```json
  "scripts": {
    "dev": "next dev"
  }
  ```

### 2. Unificación de comando de arranque

> ⚠️ **Actualizado 2026-10-05 — este esquema se abandonó.** Poner `sync-docs` dentro de `start:dev` frenaba el arranque y generaba un commit de merge en cada pull. Además `git subtree pull` **exige todo el árbol de trabajo limpio** (no solo `docs/`): aborta con `working tree has modifications` apenas hay un archivo modificado. Hoy `start:dev` **no** sincroniza docs en ninguno de los dos proyectos: solo **avisa** si hay novedades (`pnpm docs:check`, script `scripts/docs-subtree.js`, igual en ambos repos); se sincroniza a mano con `pnpm docs:pull` (traer) y `pnpm docs:push` (subir). Ver `docs/backend/sincronizar-swagger-postman.md` §5. El bloque que sigue queda solo como historial.

Para que ambos proyectos usen el mismo comando (`start:dev`), debes redefinir los scripts así:

**Backend (`nest`)**

```json
"scripts": {
  "sync-docs": "git subtree pull --prefix=docs https://github.com/Santillan-Reyna-Ariel-Angel/wonderchicken-docs main --squash",
  "start:dev": "pnpm run sync-docs && nest start --watch"
}
```

**Frontend (`next`)**

```json
"scripts": {
  "sync-docs": "git subtree pull --prefix=docs https://github.com/Santillan-Reyna-Ariel-Angel/wonderchicken-docs main --squash",
  "start:dev": "pnpm run sync-docs && next dev"
}
```

👉 Ahora ambos proyectos arrancan con:

```bash
pnpm run start:dev
```

y el flujo es consistente: primero sincroniza `docs/` y luego arranca el servidor.

---

### 3. Automatización con unificación

Si además quieres que la sincronización ocurra automáticamente sin necesidad de arrancar el proyecto:

- **Windows** → usar **Task Scheduler** para ejecutar `robocopy` o `git subtree pull` cada cierto tiempo.
- **Linux/Mac** → usar **cron** para ejecutar `rsync` o `git subtree pull`.

Ejemplo cron (cada 5 minutos):

```bash
*/5 * * * * cd /ruta/frontend && git subtree pull --prefix=docs https://github.com/Santillan-Reyna-Ariel-Angel/wonderchicken-docs main --squash
```

👉 Esto asegura que la carpeta `docs` esté siempre sincronizada, incluso si no arrancas el proyecto.

---

## ✅ Recomendación final

- Usa **Git Subtree** si quieres que los archivos se vean en GitHub dentro de cada proyecto y evitar duplicación.
- Define los mismos scripts `docs:pull` (traer), `docs:push` (subir) y `docs:check` (avisar) en frontend y backend; **no** los encadenes a `start:dev` (ver la nota de la sección 2).
- No automatices el `git subtree pull` con cron/Task Scheduler ni al arrancar: aborta con el árbol sucio y crea commits de merge. Sincronizá a mano, con el árbol limpio, cuando haga falta.
- Si prefieres simplicidad absoluta y aceptas el riesgo de conflictos, usa **robocopy/rsync**.
- Si quieres historial centralizado y limpio, usa **Submodule**, pero recuerda que los archivos no se verán directamente en GitHub de frontend/backend.

---

## ✅ Flujo correcto con Subtree (paso a paso)

### 1. Editar documentación

- Modifica cualquier archivo dentro de `docs/` en backend o frontend.

### 2. Guardar cambios en el proyecto local

```bash
git add docs
git commit -m "Actualizo documentación"
```

### 3. Enviar cambios al repo central de documentación

> ⚠️ **Actualizado 2026-10-06:** hoy se usa `pnpm docs:push`, no `git subtree push` a mano (era cada vez más lento, ver [la sección final](#-subtree-hoy-vs-submodule-análisis-2026-10-06)).

```bash
git subtree push --prefix=docs https://github.com/Santillan-Reyna-Ariel-Angel/wonderchicken-docs main
```

### 4. Publicar cambios en el repo del proyecto

```bash
git push origin main
```

👉 Esto asegura que:

- El repo central `docs` recibe las actualizaciones.
- Tu proyecto backend/frontend guarda la referencia correcta al commit actualizado de `docs`.

### 5. Traer cambios al otro proyecto

En el otro proyecto (ej. frontend si editaste en backend):

```bash
git subtree pull --prefix=docs https://github.com/Santillan-Reyna-Ariel-Angel/wonderchicken-docs main --squash
```

### 6. Resolver conflictos si aparecen

```bash
git status
git add docs
git commit
```

### 7. Publicar cambios del segundo proyecto

```bash
git push origin main
```

---

## 🔬 Subtree hoy vs Submodule (análisis 2026-10-06)

> Nota para analizar a futuro. No es una decisión tomada: hoy el proyecto sigue con **Subtree**.

### Por qué `git subtree push` se volvió lento

- El número que mostraba (`160/207`) es el **total de commits de todo el repo**, no los de `docs/`. Sube con cada commit, toque `docs/` o no.
- `git subtree push` no recuerda dónde quedó la última vez: en cada ejecución **recorre todo el historial**, arma una historia sintética solo con `docs/` y recién ahí empuja. Costo: O(commits del repo).
- Los `docs:pull --squash` dejan merges en el historial (17 en el back al 2026-10-06) que git también tiene que mapear.
- `--rejoin` lo acorta, pero agrega un merge extra por cada push y se mezcla mal con `--squash`.

### Qué se hizo (commits `86b48f0` y `2e4e69e` del back)

`pnpm docs:push` (`scripts/docs-subtree.js`, igual en back y front) **ya no usa `git subtree push`**:

1. Pregunta al remoto si tiene cambios que no estén en tu `docs/` (`findRemoteNews`). Si los hay, **se niega** y pide `pnpm docs:pull` (así nunca pisa lo del otro proyecto).
2. Arma un commit con el árbol actual de `docs/` encima de la punta del remoto (`git commit-tree`) y lo empuja: siempre fast-forward, tiempo constante (~3 s medidos con 207 commits).
3. El mensaje reutiliza el asunto real de tus commits de docs desde el último sync (uno solo → su asunto; varios → resumen con viñetas). El marcador es una ref **local** (`refs/docs-sync/last`), no se sube y no genera commits.

`docs:pull` no cambió (`git subtree pull --squash`): sigue exigiendo el árbol limpio y deja un merge en el proyecto.

Costo aceptado: en el repo `docs` entra **un commit por sync**, no uno por cada commit de docs. Al 2026-10-06 el primer push real con este esquema todavía no se había probado.

### Subtree vs Submodule para este caso

| | Subtree (hoy) | Submodule |
| --- | --- | --- |
| Merges en el historial de los proyectos | uno por cada `docs:pull` | ninguno: un commit que mueve el puntero a la versión nueva |
| Historial del repo `docs` | un commit por sync (con el asunto real) | commits reales de cada cambio |
| Árbol limpio para actualizar | obligatorio (`git subtree pull`) | no |
| Conflictos entre proyectos | solo si se edita el mismo archivo en ambos sin sincronizar | iguales (se resuelven en el repo `docs`) |
| Archivos de `docs/` en GitHub del proyecto | sí, como carpeta normal | no, solo un enlace al commit |
| Clonar el proyecto | `git clone` normal | `git clone --recurse-submodules` (o `git submodule update --init`) |
| Costo de migrar | ninguno | migrar back y front a la vez |

### Si algún día se migra a submodule: cosas a tener en cuenta

- **Dónde se commitea:** `docs/` pasa a ser un repo propio. Se edita ahí, se hace `git commit` y `git push` **dentro de `docs/`**, y después en el proyecto `git add docs` + commit para mover el puntero. El otro proyecto actualiza con `git submodule update --remote docs` (o `git config submodule.recurse true` para que `git pull` lo haga).
- **HEAD desacoplado:** un submodule se clona sobre un commit, no sobre una rama. Hay que hacer `git switch main` dentro de `docs/` **antes** de commitear, o esos commits quedan huérfanos.
- **Swagger:** según `technical_guide.md` (tabla de perfiles `APP_ENV`), el backend **reescribe `docs/swagger-postman/swagger.json`** en el perfil `development`. Con submodule eso dejaría el submodule "modificado" cada vez que cambie la API (`git status` del proyecto mostraría `modified content`). Habría que mover el swagger fuera de `docs/` o commitear dentro de `docs/` tras cada arranque.
- **`docs:check` en `start:dev`:** habría que reemplazarlo; el aviso actual compara contra `docs/` como carpeta del proyecto.
- **CI / despliegues (Vercel, Docker):** tienen que inicializar submodules, y si el repo `docs` es privado necesitan credenciales para clonarlo.
- **Herramientas y agentes:** todo lo que lea `docs/` (por ejemplo los enlaces relativos `../../docs/...` de OpenSpec) necesita el submodule inicializado; en un checkout sin inicializar la carpeta queda vacía.
- **Pasos de migración (esquema):** dejar `docs/` idéntico al remoto → `git rm -r docs` y commit → `git submodule add https://github.com/Santillan-Reyna-Ariel-Angel/wonderchicken-docs docs` → commit de `.gitmodules` y del puntero → repetir en el otro proyecto → reemplazar los scripts `docs:*`. El historial anterior de `docs/` queda en los proyectos.

### Cuándo conviene revisar esto

- Si los merges de `docs:pull` o el árbol limpio siguen molestando en el desarrollo diario.
- Si se empieza a querer **historial fino** de la documentación (quién cambió qué y cuándo) en el repo `docs`.
- Si `docs/` crece o lo editan más personas: ahí el submodule escala mejor.
- No conviene migrar a mitad de un sprint con trabajo sin commitear: hacerlo en un corte limpio.

---
