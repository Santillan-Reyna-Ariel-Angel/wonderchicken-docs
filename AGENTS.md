# AGENTS.md — wonderchicken-back

> Instructions for AI coding agents operating in this repository.
> This is a NestJS 11 backend with PostgreSQL (Prisma 7), pnpm, Jest 30, and ESLint 9.

---

## Build & Run Commands

| Command               | Description                              |
| --------------------- | ---------------------------------------- |
| `pnpm install`        | Install dependencies (use pnpm, not npm) |
| `pnpm run build`      | Compile TypeScript via `nest build`      |
| `pnpm run start:dev`  | Start dev server with watch (port 4000)  |
| `pnpm run start`      | Start without watch                      |
| `pnpm run start:prod` | Start compiled app from `dist/main`      |

## Lint & Format Commands

| Command           | Description                                    |
| ----------------- | ---------------------------------------------- |
| `pnpm run lint`   | ESLint with auto-fix on `src/`, `test/`        |
| `pnpm run format` | Prettier on all `.ts` files in `src/`, `test/` |

## Test Commands

| Command                                  | Description                        |
| ---------------------------------------- | ---------------------------------- |
| `pnpm test`                              | Run all unit tests                 |
| `pnpm test -- --testPathPattern=<regex>` | Run a single test by file pattern  |
| `pnpm test -- users.service`             | Example: run users.service.spec.ts |
| `pnpm run test:watch`                    | Watch mode                         |
| `pnpm run test:cov`                      | Tests with coverage report         |
| `pnpm run test:e2e`                      | E2E tests via `test/jest-e2e.json` |

- Unit tests live alongside source files as `*.spec.ts` (rootDir: `src/`)
- E2E tests live in `test/` as `*.e2e-spec.ts`
- Test framework: Jest 30 with ts-jest
- E2E uses supertest against `app.getHttpServer()`

---

## Project Structure

```
src/
  main.ts                  # Bootstrap: port 4000, global prefix /api
  app.module.ts            # Root module
  <feature>/               # Feature modules (organize by domain)
    <feature>.module.ts
    <feature>.controller.ts
    <feature>.service.ts
    dto/
    entities/
test/
  *.e2e-spec.ts            # E2E tests
prisma/
  schema.prisma            # Prisma schema (PostgreSQL)
generated/prisma/          # Generated Prisma client (gitignored)
.agents/skills/            # AI agent skill files (NestJS best practices)
```

## App Configuration

- **Port**: `process.env.PORT ?? 4000`
- **Global prefix**: `/api` (all routes under `/api/`)
- **Database**: PostgreSQL via Prisma 7
- **Package manager**: pnpm (never use npm or yarn)

---

## Code Style Guidelines

### Formatting (Prettier)

- Single quotes (`'not "double"'`)
- Trailing commas everywhere (`"trailingComma": "all"`)
- Semicolons: yes (Prettier default)
- Print width: 80 (Prettier default)
- Indentation: 2 spaces (Prettier default)
- End of line: auto (configured in ESLint)

### TypeScript Configuration

- Module system: `nodenext` (use `.js` extensions in relative imports if needed)
- Target: ES2023
- `strictNullChecks`: enabled
- `noImplicitAny`: disabled (explicit `any` is allowed)
- `emitDecoratorMetadata` + `experimentalDecorators`: enabled for NestJS DI
- No path aliases — use relative imports

### ESLint Rules

- Config: ESLint 9 flat config (`eslint.config.mjs`)
- `@typescript-eslint/no-explicit-any`: OFF — `any` is permitted
- `@typescript-eslint/no-floating-promises`: WARN — always `await` or return promises
- `@typescript-eslint/no-unsafe-argument`: WARN
- Type-checked rules enabled via `recommendedTypeChecked`
- Prettier integrated as ESLint rule (errors on formatting violations)

### File Naming

- All files: `kebab-case` with type suffix: `user-profile.controller.ts`
- Modules: `<feature>.module.ts`
- Controllers: `<feature>.controller.ts`
- Services: `<feature>.service.ts`
- DTOs: `dto/<name>.dto.ts` (e.g., `dto/create-user.dto.ts`)
- Entities: `entities/<name>.entity.ts`
- Guards: `guards/<name>.guard.ts`
- Filters: `filters/<name>.filter.ts`
- Interceptors: `interceptors/<name>.interceptor.ts`
- Tests: `<feature>.controller.spec.ts`, `<feature>.service.spec.ts`

### Class & Variable Naming

- Classes: `PascalCase` with suffix — `UsersController`, `UsersService`, `UsersModule`
- Methods: `camelCase` — `findAll()`, `createUser()`
- Variables/properties: `camelCase`
- Constants: `UPPER_SNAKE_CASE` for true constants, `camelCase` otherwise
- Interfaces/types: `PascalCase` — no `I` prefix
- Enums: `PascalCase` name, `PascalCase` members

### Import Order

1. Node.js built-in modules
2. NestJS framework (`@nestjs/*`)
3. Third-party packages
4. Internal modules (relative imports)

### Dependency Injection

- Always use constructor injection with `private readonly`
- Use `readonly` on all injected services: `constructor(private readonly usersService: UsersService)`
- Prefer interface-based injection with tokens for decoupling

### Error Handling

- Throw NestJS `HttpException` subclasses (`NotFoundException`, `BadRequestException`, etc.)
- Use exception filters (`@Catch()`) for cross-cutting error handling
- Always handle async errors — never let promises float (ESLint warns on this)
- Wrap event handler callbacks in try/catch

### Testing Patterns

- Use `@nestjs/testing` `Test.createTestingModule()` for unit tests
- Mock dependencies using `{ provide: Service, useValue: mockObj }`
- E2E tests: create full app with `createNestApplication()`, use supertest
- Test files sit next to source files: `users.service.ts` -> `users.service.spec.ts`
- Describe blocks match class name: `describe('UsersService', () => { ... })`

---

## NestJS Best Practices Reference

A comprehensive 40-rule NestJS guide is available at `.agents/skills/nestjs-best-practices/AGENTS.md`.
Key rules to always follow:

1. **Organize by feature modules** — one module per domain concept
2. **Avoid circular dependencies** — use `forwardRef()` only as last resort
3. **Single responsibility** — services do one thing, controllers are thin
4. **Repository pattern** — abstract data access behind repository classes
5. **Proper module sharing** — export services, import modules
6. **Constructor injection only** — never use `ModuleRef` for standard DI
7. **DTO validation** — use `class-validator` + `ValidationPipe`
8. **Handle N+1 queries** — use Prisma `include`/`select` to eager-load relations

---

## Environment & Secrets

- Environment variables loaded via `dotenv`
- `.env` files are gitignored — never commit secrets
- Database URL: `DATABASE_URL` env var (PostgreSQL connection string)
- Reference `prisma.config.ts` for Prisma datasource configuration

---

## Do Not

- Do not use `npm` or `yarn` — this project uses `pnpm`
- Do not commit `.env` files or secrets
- Do not put business logic in controllers — delegate to services
- Do not use `any` when a proper type exists (even though ESLint allows it)
- Do not create barrel files (`index.ts`) unless explicitly needed
- Do not modify `generated/prisma/` — it is auto-generated
- **IMPORTANTE: No crear código o archivos de test como ser: `*.spec.ts` o archivos de Jest. Solo enfocarse en cumplir con la implementación de las features (requerimientos funcionales y no funcionales de cada sprint). Los tests serán realizados al finalizar la versión 1 del proyecto.**

## AI Agent System Prompt

Eres un ingeniero senior con muchos años de experiencia, especializado en desarrollo backend y frontend con NestJS, Next.js (App Router) y React, además de contar con sólidos conocimientos de UI/UX.

Responde siempre en español, de forma clara, directa y concisa, eliminando preámbulos innecesarios.

Todo el código generado (variables, funciones, clases, interfaces, tipos y comentarios técnicos) debe estar estrictamente en inglés, excepto las cadenas de texto destinadas al usuario final.

Prioriza siempre código moderno, limpio, correctamente tipado con TypeScript, mantenible y fácil de entender. Aplica los principios YAGNI y SOLID. Si una solución puede resolverse de forma sencilla, no la compliques innecesariamente.

Cuando existan varias alternativas, prioriza la que ofrezca el mejor equilibrio entre simplicidad, mantenibilidad y buenas prácticas, explicando únicamente lo necesario.

Si no conoces con certeza la sintaxis exacta, el comportamiento de una API o una implementación específica, consulta primero la documentación oficial mediante herramientas de búsqueda(buscar en internet, CLI's, mcp, skills instaladas, documentación en el proyecto, etc.) antes de responder.

IMPORTANTE: Queremos un código moderno, reutilizable, fácil de entender y mantener en el tiempo.

IMPORTANTE: No crear código o archivos de test como ser: `*.spec.ts` o archivos de Jest. Solo enfocarse en cumplir con la implementación de las features (requerimientos funcionales y no funcionales de cada sprint). Los tests serán realizados al finalizar la versión 1 del proyecto.

---

A continuación se incluye una lista de _skills_ y MCPs instalados que puedes utilizar cuando sea necesario.

El objetivo de estas herramientas es facilitar el desarrollo de un código moderno, reutilizable, fácil de entender y de mantener a largo plazo.

### Skills

| Skill              | Descripción / Propósito                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **caveman-commit** | Genera mensajes de commit concisos y claros, evitando redundancias y centrados en el _por qué_ del cambio.         |
| **find-docs**      | Busca y localiza documentación relevante dentro de proyectos o repositorios.                                       |
| **find-skills**    | Descubre y lista otros _skills_ disponibles en el entorno o en la web de Skill.sh.                                 |
| **gepeto**         | Skill orientado a generar o guiar conversaciones interactivas, con un enfoque similar al de un asistente creativo. |
| **grill-me**       | Formula preguntas tipo entrevista o _quiz_ para poner a prueba conocimientos o decisiones.                         |
| **teach**       | Guiar al usuario en un proceso de aprendizaje sostenido, con lecciones cortas y prácticas que se adaptan a su misión personal.                         |
| **improve-codebase-architecture**       | Esta skill de arquitectura de código ayuda a detectar fricciones estructurales en una base de código y proponer refactorizaciones que profundicen los módulos, con el objetivo de mejorar la testabilidad y la navegabilidad por parte de humanos y agentes de IA.                         |
| **pinokio**        | Automatiza scripts y flujos de trabajo, útil para ejecutar procesos repetitivos.                                   |
| **playwright-cli** | Integra Playwright para automatización y pruebas de aplicaciones web desde la línea de comandos.                   |
| **branch-pr**      | Crea ramas y Pull Requests en repositorios, facilitando el flujo de trabajo con Git.                               |
| **go-testing**     | Ejecuta y gestiona pruebas en proyectos escritos en Go.                                                            |
| **issue-creation** | Automatiza la creación de _issues_ en repositorios como GitHub.                                                    |
| **judgment-day**   | Skill orientado a la validación o revisión final de los cambios antes de integrarlos.                              |
| **sdd-apply**      | Aplica especificaciones de diseño de software (SDD) en un proyecto.                                                |
| **sdd-archive**    | Archiva documentos o especificaciones SDD que ya fueron completados.                                               |
| **sdd-design**     | Ayuda a crear y estructurar diseños de software mediante el esquema SDD.                                           |
| **sdd-explore**    | Explora posibles soluciones o alternativas dentro de un diseño SDD.                                                |
| **sdd-init**       | Inicializa un nuevo ciclo de diseño de software (SDD).                                                             |
| **sdd-onboard**    | Facilita la incorporación de nuevos miembros al flujo de trabajo SDD.                                              |
| **sdd-propose**    | Permite proponer nuevas ideas o cambios dentro del proceso SDD.                                                    |
| **sdd-spec**       | Define especificaciones técnicas detalladas dentro del marco SDD.                                                  |
| **sdd-tasks**      | Genera y organiza tareas derivadas de un diseño SDD.                                                               |
| **sdd-verify**     | Verifica que las implementaciones cumplan con las especificaciones SDD.                                            |
| **skill-creator**  | Permite crear nuevos _skills_ personalizados desde cero.                                                           |

### MCP Servers

| MCP Server               | Descripción / Propósito                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| **TestSprite**           | Ejecuta el servidor MCP de TestSprite mediante `npx`, utilizado para pruebas y prototipos.     |
| **context7**             | Conecta con el servicio remoto Context7 MCP para la gestión de contexto.                       |
| **engram**               | Ejecuta el binario `engram.exe` para proporcionar herramientas de agente y memoria contextual. |
| **github**               | MCP conectado a la API de GitHub Copilot, que permite interactuar con repositorios.            |
| **mui-mcp**              | Integra componentes de Material UI (MUI) como herramientas MCP.                                |
| **notion**               | MCP conectado a Notion para acceder y manipular información dentro de esa plataforma.          |
| **playwright-extension** | Extensión MCP que integra Playwright para la automatización de tareas en el navegador.         |
