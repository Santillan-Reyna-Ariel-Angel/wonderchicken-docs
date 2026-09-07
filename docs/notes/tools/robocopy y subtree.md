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
git subtree add --prefix=docs https://github.com/usuario/docs main --squash

# Traer cambios
git subtree pull --prefix=docs https://github.com/usuario/docs main --squash

# Enviar cambios
git subtree push --prefix=docs https://github.com/usuario/docs main
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
git submodule add https://github.com/usuario/docs docs
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

Para que ambos proyectos usen el mismo comando (`start:dev`), debes redefinir los scripts así:

**Backend (`nest`)**

```json
"scripts": {
  "sync-docs": "git subtree pull --prefix=docs https://github.com/usuario/docs main --squash",
  "start:dev": "npm run sync-docs && nest start --watch"
}
```

**Frontend (`next`)**

```json
"scripts": {
  "sync-docs": "git subtree pull --prefix=docs https://github.com/usuario/docs main --squash",
  "start:dev": "npm run sync-docs && next dev"
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
*/5 * * * * cd /ruta/frontend && git subtree pull --prefix=docs https://github.com/usuario/docs main --squash
```

👉 Esto asegura que la carpeta `docs` esté siempre sincronizada, incluso si no arrancas el proyecto.

---

## ✅ Recomendación final

- Usa **Git Subtree** si quieres que los archivos se vean en GitHub dentro de cada proyecto y evitar duplicación.
- Define el mismo script `start:dev` en frontend y backend para unificar el flujo.
- Automatiza la sincronización con `package.json` (cuando arrancas) o con cron/Task Scheduler (en segundo plano).
- Si prefieres simplicidad absoluta y aceptas el riesgo de conflictos, usa **robocopy/rsync**.
- Si quieres historial centralizado y limpio, usa **Submodule**, pero recuerda que los archivos no se verán directamente en GitHub de frontend/backend.

---
