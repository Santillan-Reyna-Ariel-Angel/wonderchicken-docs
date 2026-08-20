## 1. Módulo Branches

- [x] 1.1 Crear `src/branches/branches.module.ts` (feature module, exporta `BranchesService`)
- [x] 1.2 Crear `src/branches/branches.controller.ts` con los 4 endpoints protegidos por `@Roles(UserRole.SUPER_ADMIN)`
- [x] 1.3 Crear `src/branches/branches.service.ts` con la lógica de negocio (crear, listar, editar, toggle de estado activo/inactivo)
- [x] 1.4 Crear `src/branches/dto/create-branch.dto.ts` (`name`, `address` requeridos, class-validator)
- [x] 1.5 Crear `src/branches/dto/update-branch.dto.ts` (`name?`, `address?` opcionales, class-validator)
- [x] 1.6 Registrar `BranchesModule` en `src/app.module.ts`

## 2. Tests

- [x] 2.1 Crear `src/branches/branches.service.spec.ts` (unit tests: crear, listar, editar, toggle de estado, 404 en no existente)
- [x] 2.2 Crear `src/branches/branches.controller.spec.ts` (unit tests: roles, validación de DTOs)
- [x] 2.3 Agregar casos E2E en `test/` para los 4 endpoints (201/200/403/404) siguiendo el contrato §5.3

## 3. Documentación

- [x] 3.1 Verificar que `docs/backend/implementation_guide.md` refleja FR-000 en Sprint 0 y en el mapa de cobertura
- [x] 3.2 Verificar que `docs/backend/technical_guide.md` refleja los endpoints de sucursales en §5.1 y la matriz de autorización en §5.2

## 4. Verificación

- [ ] 4.1 Ejecutar `pnpm run lint` y corregir errores
- [ ] 4.2 Ejecutar `pnpm test` y verificar que todos los tests pasan
- [ ] 4.3 Verificar el DoD: el SUPER_ADMIN crea una sucursal y los usuarios asignados a ella solo ven datos de su sucursal (criterios FR-000)