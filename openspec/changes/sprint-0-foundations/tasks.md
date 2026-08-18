## 1. Prisma Service Setup

- [x] 1.1 Create src/prisma/prisma.service.ts copying pattern from seeders/prisma.ts
- [x] 1.2 Implement $connect/$disconnect lifecycle methods
- [x] 1.3 Create src/prisma/prisma.module.ts with @Global() decorator
- [x] 1.4 Export PrismaService from PrismaModule

## 2. Global Exception Filter

- [x] 2.1 Create src/common/filters/http-exception.filter.ts
- [x] 2.2 Implement ExceptionFilter interface to catch all exceptions
- [x] 2.3 Format error responses to match { isSuccess, message, data, error } contract
- [x] 2.4 Map exception types to appropriate HTTP status codes
- [x] 2.5 Register filter globally in main.ts

## 3. Auth Decorators

- [x] 3.1 Create src/common/decorators/public.decorator.ts
- [x] 3.2 Create src/common/decorators/roles.decorator.ts
- [x] 3.3 Implement decorators using createParamDecorator or applyMetadata
- [x] 3.4 Ensure decorators work with Guards for access control

## 4. Auth Guards

- [x] 4.1 Create src/common/guards/auth.guard.ts implementing CanActivate
- [x] 4.2 Implement JWT verification using jsonwebtoken library
- [x] 4.3 Handle missing/invalid/expired tokens with 401 Unauthorized
- [x] 4.4 Create src/common/guards/roles.guard.ts implementing CanActivate
- [x] 4.5 Implement role checking based on @Roles() metadata
- [x] 4.6 Return 403 Forbidden for insufficient privileges

## 5. Auth Module

- [x] 5.1 Create src/auth/auth.module.ts
- [x] 5.2 Create src/auth/auth.service.ts
- [x] 5.3 Implement login method validating credentials with bcryptjs
- [x] 5.4 Implement logout method to invalidate session (placeholder for Sprint 5)
- [x] 5.5 Create src/auth/dto/login.dto.ts with validation fields
- [x] 5.6 Create src/auth/auth.controller.ts
- [x] 5.7 Implement POST /auth/login endpoint
- [x] 5.8 Implement POST /auth/logout endpoint
- [x] 5.9 Register AuthModule with dependencies (PrismaService, etc.)

## 6. Users Module

- [x] 6.1 Create src/users/users.module.ts
- [x] 6.2 Create src/users/users.service.ts
- [x] 6.3 Implement CRUD operations: create, findAll, findOne, update
- [x] 6.4 Add password hashing with bcryptjs in create/update operations
- [x] 6.5 Ensure password never returned in responses
- [x] 6.6 Create src/users/dto/ directory for user-related DTOs
- [x] 6.7 Create src/users/users.controller.ts
- [x] 6.8 Implement POST /users endpoint (admin only)
- [x] 6.9 Implement GET /users endpoint with role filtering (admin only)
- [x] 6.10 Implement GET /users/:id endpoint (admin only)
- [x] 6.11 Implement PATCH /users/:id endpoint for role/status updates (admin only)
- [x] 6.12 Register UsersModule with dependencies

## 7. Application Configuration

- [x] 7.1 Update src/main.ts
- [x] 7.2 Set global prefix '/api/v1'
- [x] 7.3 Add ValidationPipe globally for DTO validation
- [x] 7.4 Configure CORS for frontend communication
- [x] 7.5 Register HttpExceptionFilter globally
- [x] 7.6 Register AuthGuard and RolesGuard as APP_GUARD
- [x] 7.7 Ensure AuthGuard runs before RolesGuard in APP_GUARD

## 8. Module Registration

- [x] 8.1 Update src/app.module.ts
- [x] 8.2 Import and register PrismaModule
- [x] 8.3 Import and register AuthModule
- [x] 8.4 Import and register UsersModule
- [x] 8.3 Remove unused imports and controllers if needed

## 9. Cleanup Scaffolded Files

- [x] 9.1 Remove src/app.controller.ts
- [x] 9.2 Remove src/app.service.ts
- [x] 9.3 Verify no references to removed files remain

## 10. Testing and Validation

- [x] 10.1 Run pnpm run lint to ensure code quality
- [x] 10.2 Test Prisma service connection with pnpm prisma generate
- [x] 10.3 Test seeders still work with pnpm seed
- [x] 10.4 Verify application starts with pnpm start:dev
- [x] 10.5 Test auth endpoints return correct responses and status codes
- [x] 10.6 Test users endpoints are protected and require admin role
- [x] 10.7 Verify error responses follow standard contract