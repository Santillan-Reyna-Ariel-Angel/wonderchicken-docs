## 1. Prisma Service Setup

- [ ] 1.1 Create src/prisma/prisma.service.ts copying pattern from seeders/prisma.ts
- [ ] 1.2 Implement $connect/$disconnect lifecycle methods
- [ ] 1.3 Create src/prisma/prisma.module.ts with @Global() decorator
- [ ] 1.4 Export PrismaService from PrismaModule

## 2. Global Exception Filter

- [ ] 2.1 Create src/common/filters/http-exception.filter.ts
- [ ] 2.2 Implement ExceptionFilter interface to catch all exceptions
- [ ] 2.3 Format error responses to match { isSuccess, message, data, error } contract
- [ ] 2.4 Map exception types to appropriate HTTP status codes
- [ ] 2.5 Register filter globally in main.ts

## 3. Auth Decorators

- [ ] 3.1 Create src/common/decorators/public.decorator.ts
- [ ] 3.2 Create src/common/decorators/roles.decorator.ts
- [ ] 3.3 Implement decorators using createParamDecorator or applyMetadata
- [ ] 3.4 Ensure decorators work with Guards for access control

## 4. Auth Guards

- [ ] 4.1 Create src/common/guards/auth.guard.ts implementing CanActivate
- [ ] 4.2 Implement JWT verification using jsonwebtoken library
- [ ] 4.3 Handle missing/invalid/expired tokens with 401 Unauthorized
- [ ] 4.4 Create src/common/guards/roles.guard.ts implementing CanActivate
- [ ] 4.5 Implement role checking based on @Roles() metadata
- [ ] 4.6 Return 403 Forbidden for insufficient privileges

## 5. Auth Module

- [ ] 5.1 Create src/auth/auth.module.ts
- [ ] 5.2 Create src/auth/auth.service.ts
- [ ] 5.3 Implement login method validating credentials with bcryptjs
- [ ] 5.4 Implement logout method to invalidate session (placeholder for Sprint 5)
- [ ] 5.5 Create src/auth/dto/login.dto.ts with validation fields
- [ ] 5.6 Create src/auth/auth.controller.ts
- [ ] 5.7 Implement POST /auth/login endpoint
- [ ] 5.8 Implement POST /auth/logout endpoint
- [ ] 5.9 Register AuthModule with dependencies (PrismaService, etc.)

## 6. Users Module

- [ ] 6.1 Create src/users/users.module.ts
- [ ] 6.2 Create src/users/users.service.ts
- [ ] 6.3 Implement CRUD operations: create, findAll, findOne, update
- [ ] 6.4 Add password hashing with bcryptjs in create/update operations
- [ ] 6.5 Ensure password never returned in responses
- [ ] 6.6 Create src/users/dto/ directory for user-related DTOs
- [ ] 6.7 Create src/users/users.controller.ts
- [ ] 6.8 Implement POST /users endpoint (admin only)
- [ ] 6.9 Implement GET /users endpoint with role filtering (admin only)
- [ ] 6.10 Implement GET /users/:id endpoint (admin only)
- [ ] 6.11 Implement PATCH /users/:id endpoint for role/status updates (admin only)
- [ ] 6.12 Register UsersModule with dependencies

## 7. Application Configuration

- [ ] 7.1 Update src/main.ts
- [ ] 7.2 Set global prefix '/api/v1'
- [ ] 7.3 Add ValidationPipe globally for DTO validation
- [ ] 7.4 Configure CORS for frontend communication
- [ ] 7.5 Register HttpExceptionFilter globally
- [ ] 7.6 Register AuthGuard and RolesGuard as APP_GUARD
- [ ] 7.7 Ensure AuthGuard runs before RolesGuard in APP_GUARD

## 8. Module Registration

- [ ] 8.1 Update src/app.module.ts
- [ ] 8.2 Import and register PrismaModule
- [ ] 8.3 Import and register AuthModule
- [ ] 8.4 Import and register UsersModule
- [ ] 8.3 Remove unused imports and controllers if needed

## 9. Cleanup Scaffolded Files

- [ ] 9.1 Remove src/app.controller.ts
- [ ] 9.2 Remove src/app.service.ts
- [ ] 9.3 Verify no references to removed files remain

## 10. Testing and Validation

- [ ] 10.1 Run pnpm run lint to ensure code quality
- [ ] 10.2 Test Prisma service connection with pnpm prisma generate
- [ ] 10.3 Test seeders still work with pnpm seed
- [ ] 10.4 Verify application starts with pnpm start:dev
- [ ] 10.5 Test auth endpoints return correct responses and status codes
- [ ] 10.6 Test users endpoints are protected and require admin role
- [ ] 10.7 Verify error responses follow standard contract